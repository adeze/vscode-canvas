"use strict";
// Converter between Obsidian Canvas format and SvelteFlow format
Object.defineProperty(exports, "__esModule", { value: true });
exports.obsidianToSvelteFlow = obsidianToSvelteFlow;
exports.svelteFlowToObsidian = svelteFlowToObsidian;
/**
 * Convert Obsidian Canvas format to SvelteFlow format
 */
function obsidianToSvelteFlow(obsidian) {
    const nodes = obsidian.nodes.map((node) => ({
        id: node.id,
        type: node.type === 'file' ? 'file' : 'text',
        position: { x: node.x, y: node.y },
        data: {
            label: node.text || node.file || '',
            text: node.text || '',
            file: node.file,
            width: node.width,
            height: node.height,
            color: node.color
        },
        style: node.width && node.height ? `width: ${node.width}px; height: ${node.height}px` : undefined
    }));
    const edges = obsidian.edges.map((edge) => ({
        id: edge.id,
        source: edge.fromNode,
        target: edge.toNode,
        data: {
            fromSide: edge.fromSide,
            toSide: edge.toSide,
            color: edge.color,
            label: edge.label
        }
    }));
    return { nodes, edges };
}
/**
 * Convert SvelteFlow format to Obsidian Canvas format
 */
function svelteFlowToObsidian(nodes, edges) {
    const obsidianNodes = nodes.map((node) => ({
        id: node.id,
        x: node.position.x,
        y: node.position.y,
        width: node.data?.width || 250,
        height: node.data?.height || 60,
        type: node.type === 'file' ? 'file' : 'text',
        text: node.type === 'file' ? undefined : (node.data?.text || node.data?.label || ''),
        file: node.type === 'file' ? node.data?.file : undefined,
        color: node.data?.color
    }));
    const obsidianEdges = edges.map((edge) => ({
        id: edge.id,
        fromNode: edge.source,
        fromSide: edge.data?.fromSide || 'right',
        toNode: edge.target,
        toSide: edge.data?.toSide || 'left',
        color: edge.data?.color,
        label: edge.data?.label
    }));
    return {
        nodes: obsidianNodes,
        edges: obsidianEdges
    };
}
//# sourceMappingURL=obsidian.js.map