<script lang="ts">
  import {
    SvelteFlow,
    Controls,
    Background,
    MiniMap,
    ConnectionLineType,
    Panel,
    type OnConnectStartParams,
    type Node,
    type Connection
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  import TextNode from './nodes/TextNode.svelte';
  import FileNode from './nodes/FileNode.svelte';
  import { nodes, edges, createTextNode, deleteNodes } from './stores/canvas.ts';

  // Register custom node types
  const nodeTypes = {
    text: TextNode,
    file: FileNode
  };

  // Handle pane click to create new node
  function handlePaneClick(event: CustomEvent<{ event: MouseEvent }>) {
    const { event: mouseEvent } = event.detail;

    // Only create node on double-click
    if (mouseEvent.detail === 2) {
      const canvasElement = (mouseEvent.target as HTMLElement).closest('.svelte-flow');
      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;

        // Create node at click position (SvelteFlow will transform to canvas coords)
        createTextNode(x - 125, y - 30); // Center the 250px node
      }
    }
  }

  // Handle node deletion
  function handleKeyDown(event: KeyboardEvent) {
    if ((event.key === 'Delete' || event.key === 'Backspace') && document.activeElement?.tagName !== 'TEXTAREA') {
      const selected = $nodes.filter(node => node.selected).map(n => n.id);
      if (selected.length > 0) {
        deleteNodes(selected);
      }
    }
  }

  // Handle connection creation
  function handleConnect(event: CustomEvent<Connection>) {
    const connection = event.detail;

    edges.update(eds => [
      ...eds,
      {
        id: `edge-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle
      }
    ]);
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="canvas-container">
  <SvelteFlow
    {nodes}
    {edges}
    {nodeTypes}
    connectionLineType={ConnectionLineType.SmoothStep}
    fitView
    onpaneclick={handlePaneClick}
    onconnect={handleConnect}
  >
    <Background variant="dots" gap={16} />
    <Controls showInteractive={false} />
    <MiniMap />

    <Panel position="top-left">
      <div class="info-panel">
        <h3>Infinite Canvas + Tiptap</h3>
        <p><strong>Create:</strong> Double-click canvas</p>
        <p><strong>Edit:</strong> Double-click node</p>
        <p><strong>Markdown:</strong> **bold**, *italic*, # heading</p>
        <p><strong>Connect:</strong> Drag from circle</p>
        <p><strong>Delete:</strong> Select + Delete key</p>
      </div>
    </Panel>
  </SvelteFlow>
</div>

<style>
  .canvas-container {
    width: 100%;
    height: 100%;
  }

  :global(.svelte-flow) {
    background: var(--vscode-editor-background);
  }

  :global(.svelte-flow__edge-path) {
    stroke: var(--vscode-panelInput-border);
    stroke-width: 2;
  }

  :global(.svelte-flow__edge.selected .svelte-flow__edge-path) {
    stroke: var(--vscode-focusBorder);
  }

  :global(.svelte-flow__handle) {
    width: 12px;
    height: 12px;
    background: var(--vscode-button-background);
    border: 2px solid var(--vscode-button-foreground);
  }

  :global(.svelte-flow__handle:hover) {
    background: var(--vscode-button-hoverBackground);
  }

  :global(.svelte-flow__controls) {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
  }

  :global(.svelte-flow__controls button) {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  :global(.svelte-flow__controls button:hover) {
    background: var(--vscode-button-hoverBackground);
  }

  :global(.svelte-flow__minimap) {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
  }

  :global(.svelte-flow__minimap-node) {
    fill: var(--vscode-editor-foreground);
    opacity: 0.3;
  }

  .info-panel {
    background: var(--vscode-notifications-background);
    border: 1px solid var(--vscode-notifications-border);
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    max-width: 300px;
  }

  .info-panel h3 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .info-panel p {
    margin: 4px 0;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
  }
</style>
