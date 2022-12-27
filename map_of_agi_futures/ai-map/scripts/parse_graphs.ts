// Node.js script that will parse all *.gv files in ./assets and generate graph.json files.
// .graph.json contains:
// nodes map from nodeId to Node


// import * as fs from 'node:fs';
// import * as path from 'node:path';
// import * as glob from 'glob';

const fs = require('node:fs');
const path = require('node:path');
const glob = require('glob');

// import fs from 'node:fs';
// import path from 'node:path';
// import glob from 'glob';

interface GraphNode {
    nodeId: string; // human readable id
    label: string; // human visible labels
    classes: string[] // CSS classes of the node 
    children: string[]
    // directional edges from this node towards others
    // this -> nodeIdB
    // this -> nodeIdC
    childrenWeights: Map<string, number>
};



const gvJsonPaths = glob.sync("assets/*.gv.json");
for (const gvJsonPath of gvJsonPaths) {

    const parsedGvPath = path.parse(gvJsonPath);
    // console.log({ parsed_gv_path });
    const nodesJsonPath = path.format({
        root: parsedGvPath.root,
        dir: parsedGvPath.dir,
        name: path.parse(parsedGvPath.name).name, // removes the .gv
        ext: "graph.json"
    });


    readGvJsonWriteNodesJson(gvJsonPath, nodesJsonPath);
}


function readGvJsonWriteNodesJson(
    gvJsonPath: string,
    nodesJsonPath: string) {

    const gvJsonRaw = fs.readFileSync(fs.openSync(gvJsonPath, "r"))!.toString();
    console.info("Read", gvJsonPath);

    const gvJson = JSON.parse(gvJsonRaw);
    const nodesMap = gvJsonToNodesMap(gvJson);
    //const nodes_data_for_json = Array.from(nodes_map.entries());
    const replacer =
        (key: any, value: any) => {
            if (value instanceof Map) {
                return Object.fromEntries(value);
            }
            return value;
        };
    const space = 2;
    const nodesJsonRaw = JSON.stringify(nodesMap, replacer, space);


    console.debug({ numNodes: nodesMap.size, nodesJsonStrLength: nodesJsonRaw.length });
    fs.writeFileSync(fs.openSync(nodesJsonPath, "w"),
        nodesJsonRaw);
    console.info("Wrote", nodesJsonPath);

    return;
}

/**
 * Helper function to parse weights from labels in the form "&nbsp;yes; 99"
 * @param labelStr: input string 
 */
function labelStrToWeight(labelStr: string | undefined): number | undefined {
    if (labelStr === undefined) {
        return undefined;
    }
    // parsing suggested by chatgpt
    const matches = labelStr.match(/\d+$/);
    const weight = matches ? parseInt(matches[0]) / 100 : undefined;
    return weight;
}

function gvJsonToNodesMap(gvJson: any): any {

    const nodes = new Map<string, GraphNode>();
    const gvIdToNode = new Map<string, GraphNode>();


    if (gvJson["directed"] != true) {
        console.error("Expected the graph to be directed", { directed: gvJson["directed"] });
    }

    // read the objects
    for (let object of gvJson["objects"]) {

        // if object has nodes or edges then subgraph, skip
        if ("nodes" in object) {
            continue;
        }

        const nodeId = (object["name"] || (new Number(object["_gvid"]).toString()));
        if (nodeId === undefined) {
            const msg = "Failed to obtain an id for the object.";
            console.error(msg, { object });
            throw new Error(msg);
        }
        const node: GraphNode = {
            nodeId: nodeId,
            label: object["label"],
            classes: object["class"]?.split(" ") || [],
            children: [],
            childrenWeights: new Map<string, number>()
        };
        // if(node.classes){ console.log({node})};

        nodes.set(nodeId, node);
        const gv_id = object["_gvid"];
        if (gv_id === undefined) {
            const msg = "Failed to obtain the gv_id for the object.";
            console.error(msg, { object });
            throw new Error(msg);
        }
        gvIdToNode.set(gv_id, node);
    }

    console.info("Collected", nodes.size, "nodes");

    let numEdges = 0;
    for (let edge of gvJson["edges"]) {
        // tail -> head
        const tailGvId = edge["tail"];
        const headGvId = edge["head"];

        if (edge["style"] === "invis") {
            // we use some invisible edges for layout purposes,
            // these can be ignored when constructing the logical graph.
            continue;
        }

        const l2w = labelStrToWeight;
        const edgeWeight = l2w(edge["label"]) || l2w(edge["taillabel"]) || l2w(edge["headlabel"]);

        const tailNode = gvIdToNode.get(tailGvId);
        const headId = gvIdToNode.get(headGvId)?.nodeId;

        if (tailNode === undefined) {
            const msg = "Could not find the node id for node gvId.";
            console.error(msg, { tailGvId: tailGvId });
            throw ReferenceError(msg);
        }

        if (headId === undefined) {
            const msg = "Could not find the node id for head gvId";
            console.error(msg, { headGvId: headGvId });
            throw ReferenceError(msg);
        }
        tailNode.children.push(headId);
        if (edgeWeight !== undefined) {
            tailNode.childrenWeights.set(headId, edgeWeight);
        }

        if (tailNode.children.length >= 2
            && tailNode.childrenWeights.size != tailNode.children.length
            && !tailNode.classes.includes("legend-node")) {
            console.warn("Tail node has >= 2 children, but not childrenWeights size does not match", {
                tail: tailNode,
                head: headId,
                label: edge["label"] || edge["taillabel"] || edge["headlabel"],
                weight: edgeWeight,
            });
        }
        numEdges += 1;
    }
    console.info("Collected", numEdges, "edges");

    return nodes;
}
