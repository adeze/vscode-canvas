<script lang="ts">
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import { Markdown } from 'tiptap-markdown';
  import { onMount, onDestroy } from 'svelte';

  let {
    content = $bindable(''),
    placeholder = 'Start typing...',
    onUpdate = (markdown: string) => {},
    autofocus = true,
    class: className = ''
  }: {
    content?: string;
    placeholder?: string;
    onUpdate?: (markdown: string) => void;
    autofocus?: boolean;
    class?: string;
  } = $props();

  let editorElement: HTMLElement;
  let editor: Editor | null = null;

  onMount(() => {
    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3]
          },
          codeBlock: {
            HTMLAttributes: {
              class: 'code-block'
            }
          }
        }),
        Placeholder.configure({
          placeholder
        }),
        Markdown.configure({
          html: true,
          transformPastedText: true,
          transformCopiedText: true
        })
      ],
      content,
      autofocus: autofocus ? 'end' : false,
      editorProps: {
        attributes: {
          class: `tiptap-editor nodrag nopan ${className}`
        }
      },
      onUpdate: ({ editor }) => {
        const markdown = editor.storage.markdown.getMarkdown();
        content = markdown;
        onUpdate(markdown);
      }
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  // Update editor content when prop changes externally
  $effect(() => {
    if (editor && content !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(content);
    }
  });
</script>

<div bind:this={editorElement} class="tiptap-container"></div>

<style>
  .tiptap-container {
    width: 100%;
    height: 100%;
  }

  :global(.tiptap-editor) {
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    padding: 8px 12px;
    outline: none;
    min-height: 60px;
    font-family: var(--vscode-font-family);
    font-size: 13px;
    line-height: 1.6;
  }

  :global(.tiptap-editor:focus) {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 0 0 1px var(--vscode-focusBorder);
  }

  /* Headings */
  :global(.tiptap-editor h1) {
    font-size: 1.8em;
    font-weight: 600;
    margin: 0.8em 0 0.4em 0;
    line-height: 1.3;
    color: var(--vscode-editor-foreground);
  }

  :global(.tiptap-editor h2) {
    font-size: 1.5em;
    font-weight: 600;
    margin: 0.7em 0 0.3em 0;
    line-height: 1.3;
    color: var(--vscode-editor-foreground);
  }

  :global(.tiptap-editor h3) {
    font-size: 1.2em;
    font-weight: 600;
    margin: 0.6em 0 0.3em 0;
    line-height: 1.3;
    color: var(--vscode-editor-foreground);
  }

  /* Paragraphs */
  :global(.tiptap-editor p) {
    margin: 0.5em 0;
  }

  :global(.tiptap-editor p:first-child) {
    margin-top: 0;
  }

  :global(.tiptap-editor p:last-child) {
    margin-bottom: 0;
  }

  /* Lists */
  :global(.tiptap-editor ul),
  :global(.tiptap-editor ol) {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  :global(.tiptap-editor li) {
    margin: 0.25em 0;
  }

  /* Code */
  :global(.tiptap-editor code) {
    background: var(--vscode-textCodeBlock-background);
    color: var(--vscode-textPreformat-foreground);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: var(--vscode-editor-font-family, 'Monaco', 'Menlo', monospace);
    font-size: 0.9em;
  }

  :global(.tiptap-editor pre) {
    background: var(--vscode-textCodeBlock-background);
    color: var(--vscode-textPreformat-foreground);
    border-radius: 4px;
    padding: 12px;
    margin: 0.8em 0;
    overflow-x: auto;
  }

  :global(.tiptap-editor pre code) {
    background: none;
    padding: 0;
    font-size: inherit;
  }

  /* Blockquotes */
  :global(.tiptap-editor blockquote) {
    border-left: 3px solid var(--vscode-textBlockQuote-border);
    background: var(--vscode-textBlockQuote-background);
    padding: 0.5em 1em;
    margin: 0.8em 0;
    font-style: italic;
  }

  /* Horizontal rule */
  :global(.tiptap-editor hr) {
    border: none;
    border-top: 1px solid var(--vscode-panel-border);
    margin: 1em 0;
  }

  /* Bold and italic */
  :global(.tiptap-editor strong) {
    font-weight: 600;
  }

  :global(.tiptap-editor em) {
    font-style: italic;
  }

  /* Links */
  :global(.tiptap-editor a) {
    color: var(--vscode-textLink-foreground);
    text-decoration: underline;
    cursor: pointer;
  }

  :global(.tiptap-editor a:hover) {
    color: var(--vscode-textLink-activeForeground);
  }

  /* Placeholder */
  :global(.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: var(--vscode-input-placeholderForeground);
    pointer-events: none;
    height: 0;
  }

  /* Selection */
  :global(.tiptap-editor .ProseMirror-selectednode) {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }
</style>
