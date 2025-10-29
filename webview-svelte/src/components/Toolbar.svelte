<script lang="ts">
  let {
    onAddTextNode,
    onAddFileNode,
    onDeleteSelected,
    selectedCount = 0
  }: {
    onAddTextNode: () => void;
    onAddFileNode: () => void;
    onDeleteSelected: () => void;
    selectedCount?: number;
  } = $props();
</script>

<div class="toolbar">
  <div class="toolbar-section">
    <button
      class="toolbar-btn"
      onclick={onAddTextNode}
      title="Add Text Node (Double-click canvas)"
    >
      <span class="icon">📝</span>
      <span class="label">Text</span>
    </button>

    <button
      class="toolbar-btn"
      onclick={onAddFileNode}
      title="Add File Node (or drag & drop file)"
    >
      <span class="icon">📄</span>
      <span class="label">File</span>
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <div class="toolbar-section">
    <button
      class="toolbar-btn"
      onclick={onDeleteSelected}
      disabled={selectedCount === 0}
      title="Delete Selected (Delete key)"
    >
      <span class="icon">🗑️</span>
      <span class="label">Delete</span>
      {#if selectedCount > 0}
        <span class="badge">{selectedCount}</span>
      {/if}
    </button>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .toolbar-section {
    display: flex;
    gap: 4px;
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--vscode-panel-border);
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--vscode-font-family);
    font-size: 12px;
    transition: all 0.2s;
    position: relative;
  }

  .toolbar-btn:hover:not(:disabled) {
    background: var(--vscode-button-hoverBackground);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .toolbar-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .toolbar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon {
    font-size: 14px;
    line-height: 1;
  }

  .label {
    font-weight: 500;
  }

  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--vscode-errorForeground);
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 600;
    min-width: 16px;
    text-align: center;
  }
</style>
