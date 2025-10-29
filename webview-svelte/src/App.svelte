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
    type Connection,
    type XYPosition
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  import TextNode from './nodes/TextNode.svelte';
  import FileNode from './nodes/FileNode.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import { nodes, edges, createTextNode, deleteNodes } from './stores/canvas.ts';

  // Register custom node types
  const nodeTypes = {
    text: TextNode,
    file: FileNode
  };

  // Track selected nodes count
  let selectedCount = $derived($nodes.filter(node => node.selected).length);

  // Store reference to SvelteFlow instance
  let svelteFlowInstance: any;

  // Create text node at canvas center or specified position
  function handleAddTextNode(x?: number, y?: number) {
    if (x !== undefined && y !== undefined) {
      createTextNode(x - 125, y - 30); // Center the 250px node
    } else {
      // Create at canvas center
      createTextNode(200, 200);
    }
  }

  // Create file node at specified position (called from drag-and-drop)
  function createFileNode(x: number, y: number, filePath: string) {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'file',
      position: { x: x - 125, y: y - 30 }, // Center the node
      data: {
        label: filePath.split('/').pop() || filePath,
        file: filePath,
        width: 250,
        height: 150
      }
    };

    nodes.update(n => [...n, newNode]);
    console.log('📄 Created file node:', newNode.id, filePath);

    return newNode;
  }

  // Handle file node creation from toolbar
  function handleAddFileNode() {
    // For now, create a placeholder file node at center
    // In a real implementation, this would open a file picker
    const filePath = 'example.md';
    createFileNode(200, 200, filePath);
  }

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
        handleAddTextNode(x, y);
      }
    }
  }

  // Handle drag over (required to enable drop)
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  // Handle file drop
  function handleDrop(event: DragEvent) {
    event.preventDefault();

    // Get drop position relative to canvas
    const canvasElement = (event.target as HTMLElement).closest('.svelte-flow');
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    console.log('🎯 Drop event detected at:', x, y);

    // Check for VSCode file drop
    const vscodeData = event.dataTransfer?.getData('application/vnd.code.tree');
    if (vscodeData) {
      try {
        const items = JSON.parse(vscodeData);
        console.log('🎯 Dropped VSCode items:', items);

        // Handle single or multiple files
        const files = Array.isArray(items) ? items : [items];
        files.forEach((item, index) => {
          const filePath = item.path || item.uri || item;
          // Extract relative path if it's an absolute path
          const relativePath = typeof filePath === 'string'
            ? filePath.split('/').pop() || filePath
            : 'unknown.md';

          // Offset multiple files
          createFileNode(
            x + (index * 20),
            y + (index * 20),
            relativePath
          );
        });
        return;
      } catch (error) {
        console.warn('Failed to parse VSCode drop data:', error);
      }
    }

    // Fallback: handle regular file drop
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      console.log('🎯 Dropped files:', Array.from(files).map(f => f.name));

      Array.from(files).forEach((file, index) => {
        // Offset multiple files
        createFileNode(
          x + (index * 20),
          y + (index * 20),
          file.name
        );
      });
    }
  }

  // Handle node deletion
  function handleDeleteSelected() {
    const selected = $nodes.filter(node => node.selected).map(n => n.id);
    if (selected.length > 0) {
      deleteNodes(selected);
    }
  }

  // Handle keyboard shortcuts
  function handleKeyDown(event: KeyboardEvent) {
    if ((event.key === 'Delete' || event.key === 'Backspace') && document.activeElement?.tagName !== 'TEXTAREA') {
      handleDeleteSelected();
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

<div class="canvas-container" ondragover={handleDragOver} ondrop={handleDrop} role="application">
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

    <Panel position="top-center">
      <Toolbar
        onAddTextNode={() => handleAddTextNode()}
        onAddFileNode={handleAddFileNode}
        onDeleteSelected={handleDeleteSelected}
        {selectedCount}
      />
    </Panel>

    <Panel position="top-left">
      <div class="info-panel">
        <h3>Infinite Canvas</h3>
        <p><strong>Create:</strong> Double-click canvas or use toolbar</p>
        <p><strong>Drop Files:</strong> Drag from file explorer</p>
        <p><strong>Edit:</strong> Double-click node</p>
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
