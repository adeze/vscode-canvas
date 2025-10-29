"use strict";
// Canvas state management using Svelte stores
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectedNodes = exports.edges = exports.nodes = void 0;
exports.saveToExtension = saveToExtension;
exports.loadFromObsidian = loadFromObsidian;
exports.createTextNode = createTextNode;
exports.deleteNodes = deleteNodes;
exports.updateNodeData = updateNodeData;
const store_1 = require("svelte/store");
const obsidian_1 = require("../utils/obsidian");
let vscode;
try {
    vscode = acquireVsCodeApi();
}
catch (e) {
    console.warn('VSCode API not available, running in standalone mode');
    vscode = {
        postMessage: (msg) => console.log('Mock postMessage:', msg),
        setState: (state) => console.log('Mock setState:', state),
        getState: () => null
    };
}
// Create writable stores
exports.nodes = (0, store_1.writable)([]);
exports.edges = (0, store_1.writable)([]);
exports.selectedNodes = (0, store_1.writable)([]);
// Debounced save function
let saveTimeout;
let currentNodes = [];
let currentEdges = [];
// Subscribe to changes
exports.nodes.subscribe(n => {
    currentNodes = n;
    scheduleSave();
});
exports.edges.subscribe(e => {
    currentEdges = e;
    scheduleSave();
});
function scheduleSave() {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    saveTimeout = window.setTimeout(() => {
        saveToExtension();
    }, 500);
}
/**
 * Save current canvas state to VSCode
 */
function saveToExtension() {
    const obsidianData = (0, obsidian_1.svelteFlowToObsidian)(currentNodes, currentEdges);
    const content = JSON.stringify(obsidianData, null, 2);
    vscode.postMessage({
        type: 'save',
        content
    });
    console.log('💾 Saved canvas to extension');
}
/**
 * Load canvas from Obsidian format
 */
function loadFromObsidian(content) {
    try {
        const obsidianData = JSON.parse(content);
        const { nodes: loadedNodes, edges: loadedEdges } = (0, obsidian_1.obsidianToSvelteFlow)(obsidianData);
        exports.nodes.set(loadedNodes);
        exports.edges.set(loadedEdges);
        console.log('📂 Loaded canvas:', loadedNodes.length, 'nodes,', loadedEdges.length, 'edges');
    }
    catch (error) {
        console.error('Failed to load canvas:', error);
    }
}
/**
 * Create a new text node at position
 */
function createTextNode(x, y) {
    const newNode = {
        id: `node-${Date.now()}`,
        type: 'text',
        position: { x, y },
        data: {
            label: 'New note',
            text: 'New note',
            width: 250,
            height: 60
        }
    };
    exports.nodes.update(n => [...n, newNode]);
    console.log('➕ Created node:', newNode.id);
    return newNode;
}
/**
 * Delete nodes and their connected edges
 */
function deleteNodes(nodeIds) {
    exports.nodes.update(n => n.filter(node => !nodeIds.includes(node.id)));
    exports.edges.update(e => e.filter(edge => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)));
    console.log('🗑️ Deleted nodes:', nodeIds);
}
/**
 * Update node data
 */
function updateNodeData(nodeId, data) {
    exports.nodes.update(n => n.map(node => node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node));
}
// Listen for messages from extension
window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
        case 'loadContent':
            loadFromObsidian(message.content);
            break;
        case 'groqApiKey':
            // Store API key for AI features (to be implemented)
            console.log('🔑 Received API key');
            break;
    }
});
// Notify extension that webview is ready
vscode.postMessage({ type: 'ready' });
//# sourceMappingURL=canvas.js.map