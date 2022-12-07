// Node.js script that will parse all *.gv files in ./assets and generate graph.json files.
// .graph.json contains:
// nodes map from node_id to Node


// import * as fs from 'node:fs';
// import * as path from 'node:path';
// import * as glob from 'glob';

const fs = require('node:fs');
const path = require('node:path');
const glob = require('glob');

interface GraphNode {
    node_id: string; // human readable id
    label: string; // human visible labels
    classes: string[] // CSS classes of the node 
    children: string[]
    // directional_edges from this node towards others
    // this -> node_id_b
    // this -> node_id_c
    children_weights: Map<string, number>
};



const gv_json_paths = glob.sync("assets/*.gv.json");
for (const gv_json_path of gv_json_paths) {

    const parsed_gv_path = path.parse(gv_json_path);
    // console.log({ parsed_gv_path });
    const nodes_json_path = path.format({
        root: parsed_gv_path.root,
        dir: parsed_gv_path.dir,
        name: path.parse(parsed_gv_path.name).name, // removes the .gv
        ext: "graph.json"
    });


    read_gv_json_write_nodes_json(gv_json_path, nodes_json_path);
}


function read_gv_json_write_nodes_json(
    gv_json_path: string,
    nodes_json_path: string) {

    const gv_json_raw = fs.readFileSync(fs.openSync(gv_json_path, "r"))!.toString();
    console.info("Read", gv_json_path);

    const gv_json = JSON.parse(gv_json_raw);
    const nodes_map = gv_json_to_nodes_map(gv_json);
    //const nodes_data_for_json = Array.from(nodes_map.entries());
    const replacer =
        (key: any, value: any) => {
            if (value instanceof Map) {
                return Object.fromEntries(value);
            }
            return value;
        };
    const space = 2;
    const nodes_json_raw = JSON.stringify(nodes_map, replacer, space);


    console.debug({ num_nodes: nodes_map.size, nodes_json_str_length: nodes_json_raw.length });
    fs.writeFileSync(fs.openSync(nodes_json_path, "w"),
        nodes_json_raw);
    console.info("Wrote", nodes_json_path);

    return;
}

/**
 * Helper function to parse weights from labels in the form "&nbsp;yes; 99"
 * @param label_str: input string 
 */
function label_str_to_weight(label_str: string | undefined): number | undefined {
    if (label_str === undefined) {
        return undefined;
    }
    // parsing suggested by chatgpt
    const matches = label_str.match(/\d+$/);
    const weight = matches ? parseInt(matches[0]) / 100 : undefined;
    return weight;
}

function gv_json_to_nodes_map(gv_json: any): any {

    const nodes = new Map<string, GraphNode>();
    const gv_id_to_node = new Map<string, GraphNode>();


    if (gv_json["directed"] != true) {
        console.error("Expected the graph to be directed", { directed: gv_json["directed"] });
    }

    // read the objects
    for (let object of gv_json["objects"]) {

        // if object has nodes or edges then subgraph, skip
        if ("nodes" in object) {
            continue;
        }

        const node_id = (object["name"] || (new Number(object["_gvid"]).toString()));
        if (node_id === undefined) {
            const msg = "Failed to obtain an id for the object.";
            console.error(msg, { object });
            throw new Error(msg);
        }
        const node: GraphNode = {
            node_id: node_id,
            label: object["label"],
            classes: object["class"]?.split(" ") || [],
            children: [],
            children_weights: new Map<string, number>()
        };
        // if(node.classes){ console.log({node})};

        nodes.set(node_id, node);
        const gv_id = object["_gvid"];
        if (gv_id === undefined) {
            const msg = "Failed to obtain the gv_id for the object.";
            console.error(msg, { object });
            throw new Error(msg);
        }
        gv_id_to_node.set(gv_id, node);
    }

    console.info("Collected", nodes.size, "nodes");

    let num_edges = 0;
    for (let edge of gv_json["edges"]) {
        // tail -> head
        const tail_gv_id = edge["tail"];
        const head_gv_id = edge["head"];

        if (edge["style"] === "invis") {
            // we use some invisible edges for layout purposes,
            // these can be ignored when constructing the logical graph.
            continue;
        }

        const l2w = label_str_to_weight;
        const edge_weight = l2w(edge["label"]) || l2w(edge["taillabel"]) || l2w(edge["headlabel"]);

        const tail_node = gv_id_to_node.get(tail_gv_id);
        const head_id = gv_id_to_node.get(head_gv_id)?.node_id;

        if (tail_node === undefined) {
            const msg = "Could not find the node id for node gv_id.";
            console.error(msg, { tail_gv_id });
            throw ReferenceError(msg);
        }

        if (head_id === undefined) {
            const msg = "Could not find the node id for head gv_id.";
            console.error(msg, { head_gv_id });
            throw ReferenceError(msg);
        }
        tail_node.children.push(head_id);
        if (edge_weight !== undefined) {
            tail_node.children_weights.set(head_id, edge_weight);
        }

        if (tail_node.children.length >= 2
            && tail_node.children_weights.size != tail_node.children.length
            && !tail_node.classes.includes("legend-node")) {
            console.warn("Tail node has >= 2 children, but not children_weights size does not match", {
                tail: tail_node,
                head: head_id,
                label: edge["label"] || edge["taillabel"] || edge["headlabel"],
                weight: edge_weight,
            });
        }
        num_edges += 1;
    }
    console.info("Collected", num_edges, "edges");

    return nodes;
}
