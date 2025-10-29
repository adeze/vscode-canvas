// Canvas state management using Svelte stores

import { writable } from 'svelte/store';
import type { Node, Edge } from '@xyflow/svelte';
import { obsidianToSvelteFlow, svelteFlowToObsidian, type ObsidianCanvas } from '../utils/obsidian.ts';

// VSCode API (injected by extension)
declare const acquireVsCodeApi: any;
let vscode: any;

try {
  vscode = acquireVsCodeApi();
} catch (e) {
  console.warn('VSCode API not available, running in standalone mode');
  vscode = {
    postMessage: (msg: any) => console.log('Mock postMessage:', msg),
    setState: (state: any) => console.log('Mock setState:', state),
    getState: () => null
  };
}

// Create writable stores
export const nodes = writable<Node[]>([]);
export const edges = writable<Edge[]>([]);
export const selectedNodes = writable<string[]>([]);

// Debounced save function
let saveTimeout: number | undefined;
let currentNodes: Node[] = [];
let currentEdges: Edge[] = [];
let isLoading = false; // Flag to prevent save during initial load

// Subscribe to changes
nodes.subscribe(n => {
  currentNodes = n;
  if (!isLoading) {
    scheduleSave();
  }
});

edges.subscribe(e => {
  currentEdges = e;
  if (!isLoading) {
    scheduleSave();
  }
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
export function saveToExtension() {
  const obsidianData = svelteFlowToObsidian(currentNodes, currentEdges);
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
export function loadFromObsidian(content: string) {
  try {
    isLoading = true; // Prevent auto-save during load

    const obsidianData: ObsidianCanvas = JSON.parse(content);
    const { nodes: loadedNodes, edges: loadedEdges } = obsidianToSvelteFlow(obsidianData);

    nodes.set(loadedNodes);
    edges.set(loadedEdges);

    console.log('📂 Loaded canvas:', loadedNodes.length, 'nodes,', loadedEdges.length, 'edges');

    // Re-enable auto-save after a brief delay
    setTimeout(() => {
      isLoading = false;
    }, 100);
  } catch (error) {
    console.error('Failed to load canvas:', error);
    isLoading = false;
  }
}

/**
 * Create a new text node at position
 */
export function createTextNode(x: number, y: number) {
  const newNode: Node = {
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

  nodes.update(n => [...n, newNode]);
  console.log('➕ Created node:', newNode.id);

  return newNode;
}

/**
 * Delete nodes and their connected edges
 */
export function deleteNodes(nodeIds: string[]) {
  nodes.update(n => n.filter(node => !nodeIds.includes(node.id)));
  edges.update(e => e.filter(edge =>
    !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
  ));

  console.log('🗑️ Deleted nodes:', nodeIds);
}

/**
 * Update node data
 */
export function updateNodeData(nodeId: string, data: Partial<any>) {
  nodes.update(n =>
    n.map(node =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node
    )
  );
}

/**
 * Load file content from workspace
 */
export async function loadFileContent(nodeId: string, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Set up one-time listener for file content response
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === 'fileContentLoaded' && message.nodeId === nodeId) {
        window.removeEventListener('message', handleMessage);
        resolve(message.content);
      } else if (message.type === 'fileContentError' && message.nodeId === nodeId) {
        window.removeEventListener('message', handleMessage);
        reject(new Error(message.error));
      }
    };

    window.addEventListener('message', handleMessage);

    // Request file content from extension
    vscode.postMessage({
      type: 'loadFile',
      filePath,
      nodeId
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      reject(new Error('File load timeout'));
    }, 10000);
  });
}

/**
 * Save file content to workspace
 */
export async function saveFileContent(nodeId: string, filePath: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Set up one-time listener for save confirmation
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === 'fileContentSaved' && message.nodeId === nodeId) {
        window.removeEventListener('message', handleMessage);
        resolve();
      } else if (message.type === 'fileContentError' && message.nodeId === nodeId) {
        window.removeEventListener('message', handleMessage);
        reject(new Error(message.error));
      }
    };

    window.addEventListener('message', handleMessage);

    // Request file save to extension
    vscode.postMessage({
      type: 'saveFile',
      filePath,
      content,
      nodeId
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      reject(new Error('File save timeout'));
    }, 10000);
  });
}

// Listen for messages from extension
window.addEventListener('message', (event) => {
  const message = event.data;
  console.log('📨 Webview received message:', message.type, message);

  switch (message.type) {
    case 'loadContent':
      console.log('📂 Loading content...');
      loadFromObsidian(message.content);
      break;
    case 'groqApiKey':
      // Store API key for AI features (to be implemented)
      console.log('🔑 Received API key');
      break;
    // File content messages are handled by the promise handlers above
    case 'fileContentLoaded':
    case 'fileContentError':
    case 'fileContentSaved':
      // Handled by loadFileContent/saveFileContent promise listeners
      break;
  }
});

// Notify extension that webview is ready
console.log('🚀 Webview ready, sending ready message...');
vscode.postMessage({ type: 'ready' });
