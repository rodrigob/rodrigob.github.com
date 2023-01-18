import { LitElement, html, css, PropertyValueMap, nothing } from 'lit';
import { property, state, queryAsync, query, customElement } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { styleMap } from 'lit/directives/style-map.js';

import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@material/mwc-circular-progress/mwc-circular-progress.js';
import '@material/mwc-button/mwc-button.js';
import '@material/mwc-icon/mwc-icon.js';
import '@polymer/paper-slider/paper-slider.js';
import { PaperSliderElement } from '@polymer/paper-slider/paper-slider.js';
import '@material/mwc-slider/slider.js';
import '@material/mwc-select/mwc-select.js';

import { base64ToBytes, bytesToBase64 } from "byte-base64"; // somehow this is part of the standard libraries
import { gzip, gunzipSync } from 'fflate'; // or pako https://github.com/nodeca/pako

// import style from 'ai-map.css'; // did not manage to make work, failed to get https://github.com/petecarapetyan/lit-css-ts-MVP
import { style } from './ai-map-css';

enum GraphStyle {

  GraphViz = "graphviz",
  Handwritten = "handwritten",
  Typewriter = "typewriter"
}

type NodeId = string;

interface GraphNode {
  nodeId: NodeId; // human readable id
  label: string; // human visible labels
  classes: string[] // CSS classes of the node 
  children: NodeId[],
  // directional_edges from this node towards others
  childrenWeights: Map<NodeId, number>
};

type Graph = Map<NodeId, GraphNode>;
type Weights = Map<string, number>; // key: "parentId,childId", value: float in [0, 1] range

interface GraphData {
  startNode: GraphNode,
  graph: Graph,
  endNodeIds: NodeId[]
  defaultWeights: Weights
};

/**
 * Build the graph that will be used to propagate probabilities. 
 * It has mostly a tree structure, and no loops.
 * @param graph raw graph from the graphviz.
 */
function getDecisionGraphData(graph: Graph): GraphData {

  const startCandidates = Array.from(graph.values()).filter((n: GraphNode) => n.classes.includes("start-node"));
  if (startCandidates.length === 0) {
    throw new Error("Could not find a start-node in the provided graph");
  }
  if (startCandidates.length > 1) {
    console.error({ start_candidates: startCandidates });
    throw new Error("Found more than one start-node in the provided graph");
  }

  const startNode = startCandidates[0];
  const prunedGraph = new Map<NodeId, GraphNode>();
  const endNodeIds = [];

  const activeLeaves = new Map<NodeId, GraphNode>();
  activeLeaves.set(startNode.nodeId, startNode);

  const maxIterations = 1_000;
  let numIterations = 0;

  while (activeLeaves.size > 0 && numIterations < maxIterations) {
    numIterations += 1;
    for (let leaf of activeLeaves.values()) {
      prunedGraph.set(leaf.nodeId, leaf);
      activeLeaves.delete(leaf.nodeId);
      if (leaf.children.length === 0) {
        endNodeIds.push(leaf.nodeId);
        // console.log(`Reached end node ${leaf.nodeId}`, { leaf });
        continue;
      }

      for (let leaf_child_id of leaf.children) {
        const leaf_child = graph.get(leaf_child_id);
        if (leaf_child === undefined) {
          console.error({ leaf_child_id, leaf, leaf_child });
          throw new Error(`Could not find child node id ${leaf_child_id}`);
        }
        if (!prunedGraph.has(leaf_child_id)) {
          activeLeaves.set(leaf_child_id, leaf_child);
        }
        else { // we avoid infinite loops if loop in graph.
          continue;
        }

      }
    }
  }

  if (numIterations > maxIterations) {
    throw new Error("get_decision_graph num_iterations reached max_iterations. " +
      `${numIterations} > ${maxIterations}`);
  }

  console.info(`get_decision_graph input graph size: ${graph.size}, ` +
    `pruned graph size: ${prunedGraph.size}`);

  const weights = getGraphWeights(graph);
  return {
    startNode: startNode, graph: prunedGraph, endNodeIds: endNodeIds, defaultWeights: weights
  }
}

/**
 * Helper function to declare the titles of FAQ section. 
 * @param graph prunned graph
 */
function printGraphFaqSections(graph: Graph) {

  const nodesFaqHtml = [];
  for (let node of graph.values()) {
    const label = node.label.replace("\\n", " ");
    const nodeFaqHtml = [`<h4 id="faq:${node.nodeId}">${label}`,
      '<a href="#" onclick="window.history.back()"><iron-icon icon="icons:arrow-upward"></iron-icon></a>',
      '</h4>',
    `<p>About ${label}</p>`].join("\n");
    nodesFaqHtml.push(nodeFaqHtml);
  }

  console.log(nodesFaqHtml.join("\n\n"));
}


let setGraphWeightsInUrlLastTime = Date.now();
let setGraphWeightsInUrlTimeoutId: number | undefined = undefined;


/** Extracts weights from graph, encodes, and stores in the url. 
 * Throttled to avoid calling "heavy" gzip too often.
 * @throttle is in milliseconds
 * 
*/
function setGraphWeightsInUrl(graph: Map<NodeId, GraphNode>, throttle = 150) {

  const now = Date.now();
  setGraphWeightsInUrlLastTime = now;
  clearTimeout(setGraphWeightsInUrlTimeoutId);
  if (throttle <= 0) {
    setGraphWeightsInUrlImpl(graph, now);
  }
  else {
    setTimeout(() => { setGraphWeightsInUrlImpl(graph, now); }, throttle);
  }
}

function getGraphWeights(graph: Map<NodeId, GraphNode>): Weights {
  const weights = new Map<string, number>();

  for (const [parentNodeId, node] of graph.entries()) {
    for (const [childNodeId, weight] of node.childrenWeights.entries()) {
      const key = `${parentNodeId},${childNodeId}`;
      weights.set(key, weight);
    }
  }

  return weights;
}

function setGraphWeightsInUrlImpl(graph: Map<NodeId, GraphNode>, now: number) {

  if (now !== setGraphWeightsInUrlLastTime) {
    // setGraphWeightsInUrl was called before the timeout, 
    // we will wait until next timout expires.
    return;
  }

  console.info("setGraphWeightsInUrlImpl", { graph, now });
  const weights = getGraphWeights(graph);
  setWeightsInUrl(weights);
}


/** Encodes all the weights of the graph in the url.
 */
function setWeightsInUrl(weights: Weights) {
  // https://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
  // recommends 2048 characters max in URL bar (certainly 32k max).
  // our typical graph takes  ~900 characters, thus we are fine in length.

  const replacer =
    (key: any, value: any) => {
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      else if (typeof value === "number") {
        return value.toFixed(4);
      }
      else {
        return value;
      }
    };
  const weightsJson = JSON.stringify(weights, replacer);
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(weightsJson);
  // console.info("setWeightsInUrl debug", { weights, weightsJson, data });

  gzip(data, (err, compressedData) => {

    if (err !== null) {
      console.error("Failed to compress weights data.", { err });
      return;
    }
    const cd64 = bytesToBase64(compressedData);
    const ucd64 = encodeURIComponent(cd64);

    // read via  JSON.parse(base64ToBtyes(decodeURIComponent(b64))));

    const url = new URL(window.location.href);
    url.searchParams.set("weights", ucd64);
    // window.location.assign(url); // this reloads the page, not good
    // window.history.pushState({}, "", url); // adds to the navigation history
    window.history.replaceState({}, "", url); // changes without increasing the navigation history
    console.info("Updated URL &weights= component.", {
      graphWeights: weights,
      weightsJson: weightsJson,
      data: data,
      compressedData: compressedData,
      compressedWeightsLength: ucd64.length,
      compressedWeights: ucd64,
      localtionHref: window.location.href,
      url: url,
      // decoded: decodeWeightsFromUrlSync(ucd64)
    });
  });

}

/**  Base64 URI component encoded gziped stringified JSON */
export function decodeWeightsFromUrlSync(ucd64: string): Weights | undefined {

  const cd64 = decodeURIComponent(ucd64);
  const compressedData = base64ToBytes(cd64);
  const uint8Data = gunzipSync(compressedData);
  const jsonData = new TextDecoder().decode(uint8Data);

  // json is expected to be of the kind "parentNodeId,childNodeId" -> number after toFixed 
  const reviver = (key: any, value: any) => {
    // no-key value is top value indexed object, key values are the weights-as-strings
    return key ? Number(value) : new Map(Object.entries(value));
  };
  const weights = JSON.parse(jsonData, reviver);
  console.debug("decodeWeightsFromUrlSync", {
    compressedData,
    uint8Data,
    jsonData, weights
  });
  return weights;
}

@customElement("ai-map")
export class AiMap extends LitElement {
  @property({ type: String }) title = 'My app';

  @property({ type: String })
  graphVersion = "2022_12_04_1436";
  // graphVersion = "2022_12_27_0016"; // FIXME: THIS IS THE LATEST
  @property({ type: String }) graphStyle: GraphStyle = GraphStyle.GraphViz;
  @property({ type: Boolean }) showSliders = true;

  protected loadingGraphVersion: string = "";
  @state()
  protected loadedGraphVersion: string = ""; // updated when graphData and graphRawSvg are up-to-date.
  protected graphData: GraphData | undefined = undefined;
  protected graphRawSvg: string = "";
  protected initialWeights: Weights | undefined = undefined;
  protected isFirstGraphFetch: boolean = false;

  @query("#graph_svg") graphSvg!: SVGElement;

  static styles = [
    style,
    css``];

  // protected createRenderRoot() { // made no difference, erase.
  //   return this; // disable shadowRoot, CSS will leak
  // }

  get assetsPath(): string {
    // back two levels since /out-tsc/src/code.js
    return "../../assets";
  }
  get graphJsonUrl(): string | undefined {
    if (!!this.graphVersion) {

      // The SVG file assumes some conventions, see readme.
      return new URL(`${this.assetsPath}/${this.graphVersion}.map_of_agi_futures.graph.json`, import.meta.url).href;
    }
    else {
      return undefined;
    }
  }
  get svgUrl(): string | undefined {
    if (!!this.graphVersion) {
      // The SVG file assumes some conventions, see readme.
      return new URL(`${this.assetsPath}/${this.graphVersion}.map_of_agi_futures.${this.graphStyle}.svg`, import.meta.url).href;
    }
    else {
      return undefined;
    }
  }

  constructor() {
    super();

    const params = new URL(window.location.href).searchParams;
    const weightsParam = params.get("weights");
    if (weightsParam !== null) {
      this.initialWeights = decodeWeightsFromUrlSync(weightsParam);
    }
  }

  /**
   * Asynchronous loading of new graph.
   * If json data download is successfull, will also update the svg shown.
   */
  protected fetchNewGraph() {

    if (!this.graphJsonUrl) {
      console.warn(`Called fetchNewGraph but graphJsonUrl is ${this.graphJsonUrl}`);
      return;
    }

    if (!this.svgUrl) {
      console.warn(`Called fetchNewGraph but svgUrl is ${this.svgUrl}`);
      return;
    }

    console.log(`Trying to fetch ${this.graphJsonUrl}`,
      { loadedGraphVersion: this.loadedGraphVersion, graphVersion: this.graphVersion }
    );

    if (this.loadedGraphVersion === this.graphVersion) {
      console.info('Same graph version as already loaded. Skipping fetch.',
        { loadedGraphVersion: this.loadedGraphVersion, graphVersion: this.graphVersion })
    }

    this.isFirstGraphFetch = this.graphData === undefined;
    this.loadedGraphVersion = ""; // invalidate current data
    this.graphData = undefined;
    this.graphRawSvg = "";

    const jsonPromise = fetch(this.graphJsonUrl
    ).then((data: Response) => data.json()).then(
      (jsonData) => {
        if (!!jsonData) {
          // convert plain javascript object into a Map object.
          const jsonDataMap = new Map<NodeId, GraphNode>(Object.entries(jsonData));
          for (const node of jsonDataMap.values()) {
            node.childrenWeights = new Map<NodeId, number>(Object.entries(node.childrenWeights));
          }
          this.graphData = getDecisionGraphData(jsonDataMap);
          if (this.initialWeights === undefined) {
            setGraphWeightsInUrl(this.graphData.graph);
          }
        }
        else {
          throw new Error("Received empty jsonData");
        }
      }
    ).catch((reason) => {
      console.error("Failed to load decision graph data",
        { graphVersion: this.graphVersion, errorReason: reason });
    });

    const svgPromise = fetch(this.svgUrl
    ).then((data: Response) => data.text()
    ).then((textData) => {
      if (!!textData) {

        if (!textData.includes('id="graph_svg"')) {
          console.error("Could not find id=graph_svg in fetched svg.",
            { rawSvg: textData });
          throw new Error("Received SVG does not have id=graph_svg");
        }

        this.graphRawSvg = textData;

      }
      else {
        throw new Error("Received empty svg text");
      }
    }
    ).catch((reason) => {
      console.error("Failed to load decision graph svg",
        { graphVersion: this.graphVersion, errorReason: reason });
    });

    Promise.all([jsonPromise, svgPromise]).then((results) => {
      // printGraphFaqSections(this.graphData!.graph);

      this.loadedGraphVersion = this.graphVersion; // validate that things went well
    }
    ).catch((reason) => {
      console.error("Failed to fetch decision graph data and svg",
        { graphVersion: this.graphVersion, errorReason: reason });
      this.loadedGraphVersion = ""; // invalidate current data
      this.graphData = undefined;
      this.graphRawSvg = "";

    });

  }

  protected willUpdate(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    // properties set here will _not_ trigger a new update.

    console.log("willUpdate", { changedProperties });

    if (changedProperties.has("graphVersion")) {
      this.fetchNewGraph();
    }


    return;
  }


  protected addNodeLinks() {
    /*
    Select all <text> in (any) <g> with class node add href related to g id.
  
    <a href="#faq-{the_node_id}">
    */
  }

  protected addInputSlider(node: SVGGElement) {

    const bbox = node.getBBox();

    const nodeId = node.id;
    const graphNode = this.graphData?.graph?.get(nodeId);

    if (graphNode?.children.length !== 2) {
      // sliders only apply to yes-no-like nodes.
      return;
    }

    // FIXME: the graph needs to have a notion of "yes" child and "no" child, aka edge labels
    const yesChildId = graphNode?.children?.at(0) || "yes_child";
    const weightValue = (graphNode?.childrenWeights?.get(yesChildId) || 0.5) * 100;

    // paper-slider height=32px; knob height=20px
    const sliderHeight = 32 + 4; // +4 since using slider-height 6px instead of 2px.

    // Height delta is needed so that the ticker from the slider is visible
    const heightDelta = 50; // pixels 
    const bboxBottom = bbox.y + bbox.height;

    const svgNS = "http://www.w3.org/2000/svg";
    const xhtmlNS = "http://www.w3.org/1999/xhtml";


    const foreign = document.createElementNS(svgNS, "foreignObject");
    foreign.setAttribute("x", bbox.x.toFixed(2));
    foreign.setAttribute("width", bbox.width.toFixed(2));
    foreign.setAttribute("y", (bboxBottom - heightDelta).toFixed(2));
    foreign.setAttribute("height", (bbox.height + heightDelta + sliderHeight).toFixed(2));


    //const slider = document.createElement("mwc-slider");
    const slider = document.createElementNS(xhtmlNS, "paper-slider") as PaperSliderElement; // createElement also works
    slider.toggleAttribute("discrete", true);
    // slider.toggleAttribute("editable", true);
    slider.toggleAttribute("pin", true); // show number when sliding
    // slider.setAttribute("withTickMarks", "");
    slider.setAttribute("step", "1");
    slider.setAttribute("min", "0");
    slider.setAttribute("max", "100");
    slider.setAttribute("value", weightValue.toFixed(0));
    slider.style.visibility = this.showSliders ? "visible" : "hidden";
    slider.style.marginTop = `${(heightDelta - (sliderHeight / 2)).toFixed(2)}px`;
    slider.style.marginLeft = "0px";
    slider.style.marginRight = "0px";
    slider.style.marginBottom = "0px";
    slider.style.padding = "0px";
    slider.style.width = "100%";
    // slider.style.height = "0";
    // slider.style.width = "112%"; // to cover the margin
    slider.classList.add("node-slider");
    slider.id = `slider-${node.id}`;


    const childEdges = new Map<string, SVGElement>();
    for (const childName of graphNode?.children) {
      const edgeIdSelector = `g#${nodeId}-\\>${childName}.edge`;
      const edgeGroup = this.graphSvg.querySelector(edgeIdSelector);
      // console.debug('Child edge', { node, edgeIdSelector, edgeGroup });
      if (edgeGroup !== null) {
        childEdges.set(childName, edgeGroup as SVGGElement);
      }
    }
    // console.debug('Found children edges', { node, childEdges });

    // since SVG rendering depends on the order of appearance in document,
    // and since we will alter with, best if this lives _under_ the box.
    // we move it here
    for (const childEdgeNode of childEdges.values()) {
      node.parentNode?.insertBefore(childEdgeNode, node);
    }


    const onValueChanged = (event: any) => {
      // we already checked children.length == 2
      const yesId = graphNode!.children[0], noId = graphNode!.children[1];
      const yesEdge = childEdges.get(yesId);
      const noEdge = childEdges.get(noId);
      const minWidth = 2, maxWidth = 10, widthDelta = maxWidth - minWidth;
      // const v = (typeof slider.value === "number" ? slider.value : 50) / 100,
      // const v = (slider.value ?? 50) / 100,
      const zeroOpacity = 0.1;
      const v = (slider.immediateValue ?? 50) / 100,
        yesWidth = minWidth + v * widthDelta,
        yesOpacity = v ? 1.0 : zeroOpacity,
        noWidth = minWidth + (1 - v) * widthDelta,
        noOpacity = (1 - v) ? 1.0 : zeroOpacity;

      console.log("New value for yes-no slider", {
        node, slider,
        oldValue: (slider as any).oldValue,
        immediateValue: slider.immediateValue,
        value: slider.value, v
      });

      // update edges width
      yesEdge?.querySelectorAll("path, polygon").forEach(e => {
        const svgElementStyle = (e as SVGElement).style;
        svgElementStyle.setProperty("stroke-width", `${yesWidth.toFixed(2)}px`);
        svgElementStyle.setProperty("opacity", `${yesOpacity.toFixed(2)}`);
      });

      noEdge?.querySelectorAll("path, polygon").forEach(e => {
        const svgElementStyle = (e as SVGElement).style;
        svgElementStyle.setProperty("stroke-width", `${noWidth.toFixed(2)}px`);
        svgElementStyle.setProperty("opacity", `${noOpacity.toFixed(2)}`);
      });

      // update the edge labels
      const yesLabelId = `tspan#${graphNode.nodeId}\\-\\>${yesId}-label-value`;
      const yesLabel = this.renderRoot.querySelector(yesLabelId);
      if (yesLabel !== null) {
        yesLabel.textContent = (v * 100).toFixed(0);
      }
      else {
        console.debug("onValueChanged could not find yesLabel", { yesLabelId, yesLabel });
      }
      const noLabelId = `tspan#${graphNode.nodeId}\\-\\>${noId}-label-value`;
      const noLabel = this.renderRoot.querySelector(noLabelId);
      if (noLabel !== null) {
        noLabel.textContent = ((1 - v) * 100).toFixed(0);
      }
      else {
        console.debug("onValueChanged could not find noLabel", { noLabelId, noLabel });
      }

      // update graph weights
      graphNode!.childrenWeights.set(yesId, v);
      graphNode!.childrenWeights.set(noId, 1 - v);
      if (this.graphData !== undefined) {
        setGraphWeightsInUrl(this.graphData.graph);
      }


    };

    slider.addEventListener("value-changed", onValueChanged); // at end of change
    slider.addEventListener("immediate-value-change", onValueChanged); // during change 
    slider.addEventListener("immediate-value-changed", onValueChanged); // during change 
    // slider.addEventListener("focused-changed", onValueChanged); // work around event under-triggering bug

    foreign.append(slider);

    // add css class for easier manipulation
    node.querySelector("g:has(> a > text)")?.classList.add("link-group");

    const textElements = Array.from(node.querySelectorAll("g > a > text"));
    const newTextElements = textElements.map(e => e.cloneNode(true));
    textElements.forEach(e => e.classList.add("transparent-text"));

    // SVG order fixes the rendering order,
    // we want first polygon box, then the slider, then the <a>text</a>.
    const polygon = node.querySelector("a polygon, a ellipse");
    if (polygon !== null) {
      node.prepend(polygon, ...newTextElements, foreign);
    }
    else {
      node.prepend(...newTextElements, foreign);
    }
    // console.log("Added slider to <g> node", { node });

    return;
  }
  /**
   * Add sliders in DOM, used to input probability estimates.
   * (can be hidden in css)
   */
  protected addInputSliders() {

    // if (!this.showSliders) {
    //   return;
    // }

    // this.graphSvg.setAttribute(
    //   "xmlns:xhtml",
    //   "http://www.w3.org/1999/xhtml",
    // );

    /*
    Select <g> with class node but not node-end. 
    Add mwc-slider element 
    */

    const nodes = this.graphSvg.querySelectorAll("g.node:not(.legend-node)");
    nodes.forEach((node: Element) =>
      this.addInputSlider(node as SVGGElement)
    );
  }

  /**
   * Add sliders in DOM, used to show probability estimates.
   */
  protected addOutputSlider() {

    /*
    Select <g> with class not node-end. 
    Add mwc-slider element with output configuration.
    */

  }

  /**
   * Each graph node should link to the correspoding FAQ section.
   */
  protected fixSvgNodeLinks() {
    const svg = this.graphSvg;
    const anchors = svg.querySelectorAll("a");
    anchors.forEach(
      (anchorElement: HTMLAnchorElement) => {
        // xlink:href="#some_node" => href="#faq:some_node"
        const href = anchorElement.getAttribute("xlink:href")?.substring(1);
        if (href) {
          anchorElement.setAttribute("href", `#faq:${href}`);
        }
        // xlink:* is deprecated SVG
        anchorElement.removeAttribute("xlink:href");
        anchorElement.removeAttribute("xlink:title");
      }
    );
    svg.removeAttribute("xmlns:xlink"); // not used anymore
  }

  protected fixSvgHoverText() {

    const nodeTitles = this.graphSvg.querySelectorAll("g.node > title");
    nodeTitles.forEach((titleElement) => {
      // console.log({ titleElement });
      (titleElement as HTMLTitleElement).textContent = "Click for more information";
    });
  }

  protected fixSvgEdgeText() {
    // injects <tspan> elements inside the edge text
    // makes it easier to have the numbers change interactivelly.

    // follows the structure of the graphviz SVG,

    this.renderRoot.querySelectorAll("g.edge text").forEach(
      (textElement: Element) => {
        const id = textElement!.parentElement!.parentElement!.parentElement!.id;
        const idSplit = id.split("->");
        if (idSplit.length !== 2) {
          console.error("fixSvgEdgeText unexpected edge g.id",
            { textElement, id, idSplit });
          return;
        }
        const parentId = idSplit[0], childId = idSplit[1];

        const textSplit = textElement.textContent!.split(";");
        if (textSplit.length !== 2) {
          console.error("fixSvgEdgeText unexpected edge textContent",
            { textElement, id, idSplit });
          return;
        }

        textElement.textContent = textSplit[0] + "; ";

        const svgNS = "http://www.w3.org/2000/svg";
        const tspan = document.createElementNS(svgNS, "tspan");
        tspan.id = `${id}-label-value`;
        tspan.textContent = textSplit[1];

        textElement.append(tspan);
      }
    );

    // temp1.parentElement.querySelector(`g#can_we_agree_no_ai\\-\\>ai_this_century.edge text`).textContent

    // temp2.querySelectorAll("g.edge text")
    // temp3.parentElement.parentElement.parentElement.id.split("->")

  }

  protected initializeSvg() {
    if (!this.loadedGraphVersion) {
      // nothing to do if no graph loaded
      return;
    }

    console.log("Initializing loaded SVG", { svgUrl: this.svgUrl });

    // inkscape exports SVG 1.1, but foreignobject is from version 2.
    const gSvg = this.graphSvg;
    gSvg.removeAttribute("version");
    // gSvg.removeAttribute("xmlns");

    this.fixSvgNodeLinks();
    this.fixSvgHoverText(); // FIXME: fix for edges too
    this.fixSvgEdgeText();
    this.addInputSliders();
    this.addOutputSlider();

    if (this.initialWeights !== undefined && this.isFirstGraphFetch) {
      console.info("Setting initial weights");
      this.setGraphWeights(this.initialWeights);
    }

  }

  protected onShowSlidersClick(e: Event) {
    this.showSliders = !this.showSliders;

    // poor's man CSS style
    this.graphSvg.querySelectorAll(".node-slider").forEach(
      (nodeSlider: Element) => {
        const slider = nodeSlider as PaperSliderElement; // as HTMLElement
        // changing visibility does not affect the HTML layout (unlike 'display')
        // slider.style.visibility = this.showSliders ? "visible" : "hidden";
        slider.disabled = !this.showSliders;
      }
    );
  }

  protected onResetWeightsClick(e: Event) {
    if (this.graphData !== undefined) {
      this.setGraphWeights(this.graphData.defaultWeights);
    }
  }

  /**
   * Update the application state with new graph weights.
   * Will update the internal graph and the UI.
   * 
   * @param weights keys should be in "parentNodeId,childNodeId" format,
   *                values should be floating number in [0, 1] range.
   */
  protected setGraphWeights(weights: Weights) {

    const graphData = this.graphData!;

    // for each parentNodeId,childNodeId
    for (const [key, weight] of weights.entries()) {
      // should update the graph data and the slider.value (to impact UI)

      const splitKey = key.split(",");
      if (splitKey.length != 2) {
        console.error("setGraphWeights wrong key format, " +
          "weight keys should be in the 'parentNodeId,childNodId' format.",
          { key, weight, weights });
        return;
      }

      if (weight < 0 || weight > 1) {
        console.error("setGraphWeights wrong weight value, " +
          "weights should be in range [0, 1]",
          { key, weight, weights });
        return;
      }

      const parentNodeId = splitKey[0], childNodeId = splitKey[1];
      const parentNode = graphData.graph.get(parentNodeId);
      const childIndex = (parentNode?.children.length) ? parentNode.children.indexOf(childNodeId) : -1;
      const sliderElement = this.renderRoot.querySelector(`#slider-${parentNodeId}`);
      // setting the slider 
      // will trigger onValueChanged event, 
      // which updates the graphData, the weigths URL, and the UI
      // Sliders focus on the "yes" child,
      // we skip the "no" children, assuming that in weights yes + no == 1


      if (parentNode !== undefined
        && sliderElement !== undefined
        && parentNode.children.length == 2
        && childIndex == 0
      ) {
        // yes edge
        // .childrenWeights key should match the .children entries
        const slider = sliderElement as PaperSliderElement;
        slider.value = weight * 100;
      }
      else if (parentNode === undefined || childIndex < 0) {
        console.error("setGraphWeights could not find the edge parent and child nodes.",
          { key, weight, parentNodeId, childNodeId, parentNode, childIndex, weights });
        return;
      }
      else {
        // no edge, or non yes/no edge
        // for no edges, this is redundant with setting slider.value 
        // (due to onValueChanged setting both yes and no graph edges)
        // but should not harm either, keeps code simple.
        parentNode.childrenWeights.set(childNodeId, weight);
      }
    } // end of "for each weight"

    setGraphWeightsInUrl(graphData.graph);
    return;
  }

  render() {

    const svgElement = this.svgUrl ? html`
      ${unsafeSVG(this.graphRawSvg)}
      ` : html`
      <p>Loading graph data...</p>
      <mwc-circular-progress indeterminate></mwc-circular-progress>
`;


    const editWeightsButtons = html`
    <mwc-button outlined raise=${this.showSliders} label=${this.showSliders ? "Fix weights" : "Edit weights"} icon="commit"
      @click=${(e: MouseEvent)=> this.onShowSlidersClick(e)}>
    </mwc-button>
    
    <mwc-button outlined label="Reset weights" icon="refresh" @click=${(e: MouseEvent)=> this.onResetWeightsClick(e)}>
    </mwc-button>
    
    <!-- <mwc-slider discrete="" step="1" min="0" max="100" class="node-slider" id="slider-test" style="visibility: visible;">
                                                                                    </mwc-slider> -->
    `;

    return html`
   
    
    <div>
      <p>Graph: ${this.loadedGraphVersion} ${this.graphStyle} ${editWeightsButtons}</p>
      ${svgElement}
    </div>
    
    `;

  }

  protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {

    console.log("updated", { changedProperties });
    if (changedProperties.has("loadedGraphVersion")) {
      this.initializeSvg();
    }

  }
}
