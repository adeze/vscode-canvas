# Infinite Canvas

Visual canvas editor for VS Code - create and edit `.canvas` files with infinite space, AI-powered content generation, and markdown support.

![Infinite Canvas Extension](https://img.shields.io/badge/VS%20Code-Extension-blue)
![Version](https://img.shields.io/badge/version-0.1.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 🎨 Visual Canvas Editor
- **Infinite workspace**: Create and organize content on an unlimited canvas
- **Intuitive interactions**: Double-click to create, drag to move, mouse wheel to zoom
- **Node-based editing**: Create text nodes and connect them with visual relationships
- **File integration**: Drag & drop workspace files to create reference nodes

### 🤖 AI-Powered Content Generation
- **Generate Ideas**: Click the "✨ Generate Ideas" button to generate connected content
- **Multiple AI Models**: Choose from Llama 3.3, QWQ, and Gemma2 models
- **Smart Context**: Uses connected nodes as conversation history for relevant suggestions
- **Free to use**: Works with free Groq API or falls back to mock responses

### 📝 Markdown Support
- **Edit markdown files**: Double-click `.md` file nodes to edit content directly
- **Rich preview**: Beautiful markdown rendering with syntax highlighting
- **Real-time sync**: Changes save automatically to your workspace files
- **Seamless workflow**: Edit markdown without leaving your canvas

### 🔗 Obsidian Compatibility
- **Native format**: Uses the same `.canvas` format as Obsidian
- **Bidirectional**: Files work seamlessly between VS Code and Obsidian
- **Import/Export**: Open existing Obsidian canvas files directly

## Quick Start

1. **Install** the extension from the VS Code marketplace
2. **Create** a new `.canvas` file in your workspace
3. **Double-click** the file to open it with Infinite Canvas
4. **Double-click** on empty space to create your first text node
5. **Start creating** your visual workspace!

## Usage Guide

### Creating Content
- **New text node**: Double-click on empty canvas space
- **Edit text**: Double-click on any text node to edit inline
- **Create connections**: Hold Shift and drag between nodes
- **Add files**: Drag files from VS Code explorer to canvas

### Navigation
- **Pan**: Drag the background to move around
- **Zoom**: Use mouse wheel to zoom in/out
- **Select**: Click nodes to select them
- **Delete**: Press Delete key to remove selected nodes

### AI Features
1. **Select a node** you want to expand on
2. **Click "✨ Generate Ideas"** in the AI panel
3. **Choose AI models** using the checkboxes
4. **Watch** as connected ideas appear automatically

### Settings
- **Groq API Key**: Add your free API key in VS Code settings for AI features
  - Go to Settings → Extensions → Infinite Canvas
  - Add your API key from [console.groq.com](https://console.groq.com)
  - Leave empty to use mock responses

## File Format

Infinite Canvas uses the standard Obsidian canvas format:

```json
{
  "nodes": [
    {
      "id": "unique-id",
      "x": 100,
      "y": 100,
      "width": 250,
      "height": 60,
      "type": "text",
      "text": "Your content here"
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "fromNode": "node-1",
      "fromSide": "bottom",
      "toNode": "node-2",
      "toSide": "top"
    }
  ]
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Double-click` | Create/edit nodes |
| `Drag` | Move nodes or pan canvas |
| `Mouse wheel` | Zoom in/out |
| `Delete` | Remove selected nodes |
| `Shift + drag` | Create connections |
| `Ctrl+Enter` | Save when editing |
| `Esc` | Cancel editing |

## Requirements

- VS Code 1.74.0 or higher
- Optional: Free Groq API key for AI features ([Get one here](https://console.groq.com))

## Extension Settings

This extension contributes the following settings:

* `infinite-canvas.groqApiKey`: Your Groq API key for AI-powered idea generation (optional)

## Known Issues

- AI features require internet connection
- Large canvases may impact performance on older machines

## Release Notes

### 0.1.0

Initial release of Infinite Canvas extension:

- ✨ Visual canvas editor for `.canvas` files
- 🤖 AI-powered content generation
- 📝 Markdown file editing support
- 🔗 Full Obsidian canvas compatibility
- ⚡ Smooth navigation and interactions

## Contributing

Found a bug or have a feature request? Please visit our [GitHub repository](https://github.com/infinite-canvas/infinite-canvas-vscode).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Enjoy creating with Infinite Canvas!** 🎨✨