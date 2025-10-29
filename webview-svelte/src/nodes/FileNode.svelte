<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import TiptapEditor from '../components/TiptapEditor.svelte';
  import { loadFileContent, saveFileContent } from '../stores/canvas.ts';

  let { id, data, selected }: NodeProps = $props();

  let editing = $state(false);
  let loading = $state(false);
  let error = $state('');
  let fileContent = $state('');
  let fileName = $state(data.file || '');

  // Load file content when node is created or file changes
  $effect(() => {
    if (data.file && !editing) {
      loadFile();
    }
  });

  async function loadFile() {
    if (!data.file) return;

    loading = true;
    error = '';

    try {
      const content = await loadFileContent(id, data.file);
      if (content) {
        fileContent = content;
      }
    } catch (err) {
      error = `Failed to load: ${data.file}`;
      console.error('File load error:', err);
    } finally {
      loading = false;
    }
  }

  function handleDoubleClick() {
    if (data.file) {
      editing = true;
    }
  }

  async function handleUpdate(markdown: string) {
    fileContent = markdown;

    // Auto-save to file
    if (data.file) {
      try {
        await saveFileContent(id, data.file, markdown);
      } catch (err) {
        console.error('File save error:', err);
        error = 'Failed to save file';
      }
    }
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.file-node')) {
      editing = false;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      editing = false;
    }
  }

  // Simple markdown-to-HTML converter for display mode
  function markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');

    return html;
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div
  class="file-node"
  class:selected
  class:editing
  class:loading
  ondblclick={handleDoubleClick}
  onkeydown={handleKeyDown}
  style="width: {data.width || 300}px; min-height: {data.height || 80}px;"
  role="button"
  tabindex="0"
>
  <Handle type="target" position={Position.Top} />

  <div class="file-header">
    <span class="file-icon">📄</span>
    <span class="file-name" title={data.file}>{data.file || 'No file'}</span>
  </div>

  {#if loading}
    <div class="file-content loading-state">
      <span class="loading-spinner">⏳</span>
      Loading...
    </div>
  {:else if error}
    <div class="file-content error-state">
      <span class="error-icon">⚠️</span>
      {error}
    </div>
  {:else if editing}
    <div class="editor-wrapper">
      <TiptapEditor
        bind:content={fileContent}
        onUpdate={handleUpdate}
        placeholder="Edit file content..."
        autofocus={true}
      />
    </div>
  {:else}
    <div class="file-content">
      {#if fileContent}
        {@html markdownToHtml(fileContent)}
      {:else}
        <span class="placeholder">Double-click to edit</span>
      {/if}
    </div>
  {/if}

  <Handle type="source" position={Position.Bottom} />
</div>

<style>
  .file-node {
    background: var(--vscode-editor-background);
    border: 2px solid var(--vscode-panelInput-border);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .file-node:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: var(--vscode-input-border);
  }

  .file-node.selected {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 0 0 2px var(--vscode-focusBorder);
  }

  .file-node.editing {
    cursor: default;
  }

  .file-node.loading {
    opacity: 0.7;
  }

  .file-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--vscode-sideBar-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    font-size: 12px;
  }

  .file-icon {
    font-size: 14px;
  }

  .file-name {
    flex: 1;
    font-weight: 500;
    color: var(--vscode-foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-content {
    padding: 12px;
    color: var(--vscode-foreground);
    font-size: 13px;
    line-height: 1.6;
    max-height: 300px;
    overflow-y: auto;
  }

  .editor-wrapper {
    padding: 8px;
    min-height: 100px;
  }

  .loading-state,
  .error-state {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    min-height: 80px;
    font-style: italic;
  }

  .error-state {
    color: var(--vscode-errorForeground);
  }

  .loading-spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .placeholder {
    color: var(--vscode-input-placeholderForeground);
    font-style: italic;
  }

  .file-content :global(h1) {
    font-size: 1.5em;
    font-weight: 600;
    margin: 0.3em 0;
    line-height: 1.3;
  }

  .file-content :global(h2) {
    font-size: 1.3em;
    font-weight: 600;
    margin: 0.3em 0;
    line-height: 1.3;
  }

  .file-content :global(h3) {
    font-size: 1.1em;
    font-weight: 600;
    margin: 0.3em 0;
    line-height: 1.3;
  }

  .file-content :global(code) {
    background: var(--vscode-textCodeBlock-background);
    color: var(--vscode-textPreformat-foreground);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 0.9em;
  }

  .file-content :global(strong) {
    font-weight: 600;
  }

  .file-content :global(em) {
    font-style: italic;
  }

  /* Scrollbar */
  .file-content::-webkit-scrollbar {
    width: 8px;
  }

  .file-content::-webkit-scrollbar-track {
    background: var(--vscode-scrollbarSlider-background);
  }

  .file-content::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 4px;
  }

  .file-content::-webkit-scrollbar-thumb:hover {
    background: var(--vscode-scrollbarSlider-hoverBackground);
  }
</style>
