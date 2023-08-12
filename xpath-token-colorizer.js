

//TODO: need to convert to browser runtime for native xpath processing

const COLOR_NAMES = ["chartreuse", "blueviolet", "darkorange", "gold", "hotpink", "lime",
 "yellow", "steelblue", "mediumpurple", "darksalmon", "slategrey", 
 "seagreen", "wheat", "violet", "turquoise", "sienna", "sandybrown", 
 "royalblue", "saddlebrown", "royalblue", "peachpuff", "slateblue",
 "skyblue", "mintcream", "mistyrose", "navajowhite", "palegoldenrod",
 "orchid", "lawngreen", "lavender", "indianred", "aqua", "greenyellow"];

const colorMap = new Map();
const xpathMap = new Map();

// import HTML file and convert it into DOM elements
// import json file and JSONify it
// parseXPaths(json);

// colorize();



// parse xpaths
export function parseXPaths(json) {
    Object.values(json).map(
        (jsonValue) => {
            const xpath = jsonValue.xpaths;
            const nodes = jsonValue.nodes;
            const preds = jsonValue.preds;
            populateColorMap(preds);

            let xpathMapValue = xpathMap.get(xpath);
            if (xpathMapValue !== undefined) {
                xpathMapValue.nodeArray.push([nodes, preds]);
            } else {
            const text = jsonValue.text;
            // need to handle duplicate nodes - use an Array and not map
            // need to process the text sequentially
            const nodeArray = [[nodes, preds]];
            // Xpath object - contains the text and array of node -> preds
            xpathMap.set(xpath, {
                text: text,
                nodeArray: nodeArray
            })
            }
        })
}

// iterate through Xpath object list and colorize - inject color tags around the text that corresponds to each node according to pred
export function colorize() {
    xpathMap.forEach(
        (value, key) => {
            //TODO: account for different paths
            const sliceIndex = "/html/body/".length;
            //add p tag to all xpaths because the web app renders the html file in a p tag
            //don't need this if running directly on the html you want to highlight
            const removedHtmlAndBodyTags  = key.slice(0, sliceIndex) + "p/" + key.slice(sliceIndex);
            // 7 corresponds to ORDERED_NODE_SNAPSHOT_TYPE
            const xpathResult = document.evaluate(removedHtmlAndBodyTags, document, null, 7, null)
            for (let i = 0; i < xpathResult.snapshotLength; i++) {
                let nodeSnapshot = xpathResult.snapshotItem(i);
                let nodeTextNodes = [];
                nodeSnapshot.childNodes.forEach((childNode) => {
                    if (childNode.nodeType === Node.TEXT_NODE) {
                        nodeTextNodes.push(childNode);
                    }
                })
                //This is dependent on the assumption that every text in the document
                //has a token and prediction assigned to it, otherwise this won't work.
                for (let currentNode of nodeTextNodes) {
                    const nodeArray = value.nodeArray;
                    // iterate through the array of node -> preds
                    nodeArray.forEach(([node, pred]) => {
                        const nodeText = currentNode.nodeValue;
                        let matchedIndex = nodeText.indexOf(node);
                        //indexOf returns -1 if not present
                        if (matchedIndex > -1) {
                            let splitIndex = matchedIndex + node.length;
                            //create new element to contain colored text
                            var span = document.createElement("span");
                            span.appendChild(document.createTextNode(node));
                            span.style.backgroundColor = colorMap.get(pred);
                            // split the text node at the index of the matched string
                            let newNode = currentNode.splitText(splitIndex);
                            // delete the old node that contained the uncolored text
                            newNode.parentNode.removeChild(newNode.previousSibling);
                            // insert the new colorized text before the rest of the text node's text value
                            newNode.parentElement.insertBefore(span, newNode);
                            currentNode = newNode;
                        }
                    })
                }
                                        
            }
        }
    )
}

// create mapping of pred -> color
function populateColorMap(preds) {
    const colorMapValue = colorMap.get(preds);
    if (colorMapValue === undefined) {
        colorMap.set(preds, COLOR_NAMES.pop());
    }
}

