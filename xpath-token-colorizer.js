const colorMap = new Map();
const xpathMap = new Map();

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
                let nodeArray = value.nodeArray;
                //This is dependent on the assumption that every text in the document
                //has a token and prediction assigned to it, otherwise this won't work.
                for (let currentNode of nodeTextNodes) {
                    let matchedIndex = 0;
                    let textNode = currentNode;
                    let nodeString = "";
                    while (matchedIndex > -1 && nodeArray.length > 0) {
                        let [node, pred] = nodeArray.shift();
                        // ignore unknown characters that could not be parsed
                        while (node.indexOf('�') != -1 && nodeArray.length >= 1) {
                            [node, pred] = nodeArray.shift();
                        }
                        nodeString += node;
                        const nodeText = textNode.nodeValue;
                        matchedIndex = nodeText.indexOf(node.trim());
                        //indexOf returns -1 if not present
                        if (matchedIndex == -1) {
                            // log if node text still had text in it that was unmatched
                            if (nodeText.trim().length != 0) {
                                console.log('no match: /"' + node + '/" in this text: ' + nodeText + nodeText.trim().length)
                            }
                            break;
                        }
                        let splitIndex = matchedIndex + node.trim().length;
                        //create new element to contain colored text
                        var span = document.createElement("span");
                        span.appendChild(document.createTextNode(node));
                        span.style.backgroundColor = colorMap.get(pred);
                        // split the text node at the index of the matched string
                        let newNode = textNode.splitText(splitIndex);
                        // delete the old node that contained the uncolored text
                        newNode.parentNode.removeChild(newNode.previousSibling);
                        // insert the new colorized text before the rest of the text node's text value
                        newNode.parentElement.insertBefore(span, newNode);
                        textNode = newNode;
                    }
                }
            }
        }
    )
}

const colorMapper = {
    t: "DarkOrange",
    tn: "DarkSalmon",
    n: "Gold",
    st: "LightCoral",
    sn: "IndianRed",
    sst: "Plum",
    ssn: "Salmon",
    ssst: "CadetBlue",
    sssn: "LightSteelBlue",
    sssst: "PaleGreen",
    ssssn: "MediumAquaMarine",
    o: "Gainsboro"
  };

// create mapping of pred -> color
function populateColorMap(preds) {
    let predsSplit;
    if (preds != "o"){
        predsSplit = preds.split("_")[1];
    }
    else {
        predsSplit = preds;
    }
    const colorMapValue = colorMapper[predsSplit];
    colorMap.set(preds, colorMapValue);
}
