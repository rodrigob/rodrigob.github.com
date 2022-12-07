import { LitElement, html, css, PropertyValueMap } from 'lit';
import { property } from 'lit/decorators.js';

const logo = new URL('../../assets/open-wc-logo.svg', import.meta.url).href;

import {style} from './ai-map.css';


enum GraphStyle {

    GraphViz = "graphviz",
    Handwritten = "handwritten",
    Typewriter = "typewriter"
}

export class AiMap extends LitElement {
  @property({ type: String }) title = 'My app';

  @property({type: String}) graph_version = "2022_11_29_1826";
  @property({type: String}) graph_style: GraphStyle = GraphStyle.GraphViz;
  @property({type: Boolean}) show_sliders = true;

  static styles = [
    style,
    css``];


  get svg_url() {
    // The SVG file assumes some conventions, see readme.
    return `./assets/{this.graph_version}.map_of_agi_futures.svg`;
  } 

  protected firstUpdated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    
    if("graph_version" in changedProperties)
    {

    // <<< load the SVG file, and call initializeSvg to inject the required elements.
    }

    return;
  }


  protected addNodeLinks() {
    /*
    Select all <text> in (any) <g> with class node add href related to g id.

    <a href="#faq-{the_node_id}">
    */
  }

  /**
   * Add sliders in DOM, used to input probability estimates.
   * (can be hidden in css)
   */
  protected addInputSlider() {

    /*
    Select <g> with class node but not node-end. 
    Add mwc-slider element 
    */

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

  protected initalizeSvg() {
    this.addNodeLinks();
    this.addInputSlider();
    this.addOutputSlider();
  }
  
  render() {
    return html`
      <main>
        <div class="logo"><img alt="open-wc logo" src=${logo} /></div>
        <h1>${this.title}</h1>

        <p>Edit <code>src/AiMap.ts</code> and save to reload.</p>
        <a
          class="app-link"
          href="https://open-wc.org/guides/developing-components/code-examples"
          target="_blank"
          rel="noopener noreferrer"
        >
          Code examples
        </a>
      </main>

      <p class="app-footer">
        🚽 Made with love by
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/open-wc"
          >open-wc</a
        >.
      </p>
    `;
  }
}

customElements.define('ai-map', AiMap);
