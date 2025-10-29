<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { updateNodeData } from '../stores/canvas.ts';
  import TiptapEditor from '../components/TiptapEditor.svelte';

  let { id, data, selected }: NodeProps = $props();

  let editing = $state(false);
  let textContent = $state(data.text || '');

  function handleDoubleClick() {
    editing = true;
    textContent = data.text || '';
  }

  function handleUpdate(markdown: string) {
    textContent = markdown;
    updateNodeData(id, { text: markdown, label: markdown });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      editing = false;
    }
    // Don't close on Enter - let Tiptap handle it for line breaks
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.text-node')) {
      editing = false;
    }
  }

  // Simple markdown-to-HTML converter for display mode
  function markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n/g, '<br/>');

    return html;
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div
  class="text-node"
  class:selected
  class:editing
  ondblclick={handleDoubleClick}
  onkeydown={handleKeyDown}
  style="width: {data.width || 250}px; min-height: {data.height || 60}px;"
  role="button"
  tabindex="0"
>
  <Handle type="target" position={Position.Top} />

  {#if editing}
    <div class="editor-wrapper">
      <TiptapEditor
        bind:content={textContent}
        onUpdate={handleUpdate}
        placeholder="Type / for commands, **bold**, *italic*, # heading..."
        autofocus={true}
      />
    </div>
  {:else}
    <div class="content">
      {@html markdownToHtml(data.text) || '<span class="placeholder">Double-click to edit</span>'}
    </div>
  {/if}

  <Handle type="source" position={Position.Bottom} />
</div>

<style>
  .text-node {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
    cursor: pointer;
    position: relative;
  }

  .text-node:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .text-node.selected {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 0 0 2px var(--vscode-focusBorder);
  }

  .text-node.editing {
    cursor: default;
    padding: 8px;
  }

  .editor-wrapper {
    min-height: 60px;
  }

  .content {
    color: var(--vscode-foreground);
    font-size: 13px;
    line-height: 1.6;
    word-wrap: break-word;
    white-space: normal;
    overflow-wrap: break-word;
  }

  .content :global(h1) {
    font-size: 1.8em;
    font-weight: 600;
    margin: 0.3em 0;
    line-height: 1.3;
  }

  .content :global(h2) {
    font-size: 1.5em;
    font-weight: 600;
    margin: 0.3em 0;
    line-height: 1.3;
  }

  .content :global(h3) {
    font-size: 1.2em;
    font-weight: 600;
    margin: 0.3em 0;
    line-height: 1.3;
  }

  .content :global(code) {
    background: var(--vscode-textCodeBlock-background);
    color: var(--vscode-textPreformat-foreground);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 0.9em;
  }

  .content :global(strong) {
    font-weight: 600;
  }

  .content :global(em) {
    font-style: italic;
  }

  .placeholder {
    color: var(--vscode-input-placeholderForeground);
    font-style: italic;
  }
</style>
