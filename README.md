# Infinite Canvas VS Code Extension

Transform the infinite canvas web application into a VS Code extension that can open and edit `.canvas` files. **Fully compatible with Obsidian canvas format.**

## Project Overview

**Goal**: Adapt the existing infinite canvas web app to work as a VS Code extension, allowing users to open and edit canvas files directly within VS Code.

**Status**: ✅ Phase 1 Complete - Basic Extension Implemented

## Quick Start

### Development Setup
```bash
# Install dependencies
npm install

# Compile TypeScript  
npm run compile

# Start development
# 1. Open this project in VS Code
# 2. Launch Extension Development Host:
#    - Mac: Cmd+Shift+P → "Debug: Start Debugging"
#    - Or: Run menu → Start Debugging
#    - Or: Fn+F5 (if you have function keys)
# 3. In new window, create a .canvas file
# 4. Double-click to open with Infinite Canvas
```

### Basic Usage
- **Double-click empty space**: Create new node
- **Double-click node**: Edit text
- **Drag nodes**: Move around canvas
- **Mouse wheel**: Zoom in/out
- **Drag background**: Pan canvas
- **Delete key**: Remove selected nodes

📖 See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guide.

## Obsidian Compatibility

This extension is **fully compatible** with Obsidian canvas files:

### ✅ Format Support
- **Native Obsidian Format**: Uses the same format as Obsidian canvas
- **Bidirectional**: Canvas files work seamlessly between VS Code and Obsidian
- **Clean Structure**: Simple nodes and edges arrays

### 📋 File Format
Uses the standard Obsidian canvas structure:
```json
{
  "nodes": [
    {"id": "...", "x": -199, "y": -275, "width": 250, "height": 60, "type": "text", "text": "..."}
  ],
  "edges": [
    {"id": "...", "fromNode": "...", "fromSide": "bottom", "toNode": "...", "toSide": "top"}
  ]
}
```

### 🎯 Focused Format
- Uses Obsidian canvas format exclusively
- Clean, simple JSON structure

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────┐
│            VS Code Extension                    │
│  ┌─────────────────┐  ┌─────────────────────┐   │
│  │  extension.ts   │  │   package.json      │   │
│  │  - Activate     │  │   - File types      │   │
│  │  - Commands     │  │   - Contributes     │   │
│  └─────────────────┘  └─────────────────────┘   │
│                               │                 │
│  ┌─────────────────────────────────────────────┐ │
│  │        Webview Panel                       │ │
│  │  - Load existing web app                   │ │
│  │  - Handle .canvas file I/O                │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                        │
                 Embed Web App
                        │
┌─────────────────────────────────────────────────┐
│           Existing Web App                      │
│  ┌──────────────┐  ┌──────────────┐           │
│  │ main.js      │  │ src/         │           │
│  │ index.html   │  │ - Components │           │
│  │ style.css    │  │ - AI Service │           │
│  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────┘
```

### Core Components

#### VS Code Extension
- **extension.ts**: Main entry point, registers custom editor for `.canvas` files
- **package.json**: Extension manifest, file associations, activation events
- **Webview Panel**: Loads existing web app with file I/O integration

#### Existing Web App (Embedded)
- **main.js**: Entry point, initializes canvas
- **index.html**: Base HTML structure  
- **style.css**: UI styling
- **src/**: Canvas components, AI services, rendering engine

### Data Flow

```
User Opens .canvas File → VS Code → Webview → Load Web App → Canvas
                 ↑                                ↓
VS Code File System ← Save/Load Canvas State ← Web App
```

## Planned Directory Structure

```
infinite-canvas-vscode/
├── src/
│   └── extension.ts              # Main extension file
├── webview/                      # Copy of existing web app
│   ├── main.js                   # Web app entry point
│   ├── index.html                # Base HTML
│   ├── style.css                 # Styling
│   ├── src/                      # Canvas components
│   │   ├── InfiniteCanvasSimple.js
│   │   ├── CanvasState.js
│   │   ├── canvasRenderer.js
│   │   ├── InputHandler.js
│   │   ├── UIManager.js
│   │   ├── AIManager.js
│   │   ├── aiService.js
│   │   ├── markdownParser.js
│   │   └── markdownRenderer.js
│   └── public/
│       └── icons/                # UI icons
├── package.json                  # Extension manifest
└── webpack.config.js            # Build configuration
```

## Key Architectural Decisions

### Simple Web App Embedding
- **Minimal Extension**: Just file association and webview hosting
- **Existing Web App**: Copy web app directly into webview folder
- **Benefits**: Maximum code reuse, minimal adaptation required

### Custom Editor Registration
- Register `.canvas` file type in `package.json`
- Open files in webview panel containing web app
- Handle save/load through webview messaging

### Implementation Strategy
1. **Copy Web App**: Move existing web app to `webview/` folder
2. **Basic Extension**: Minimal extension.ts for file association
3. **File I/O**: Simple message passing for save/load operations

## File Format Design

### .canvas File Structure
```json
{
  "version": "1.0",
  "canvas": {
    "viewport": { "x": 0, "y": 0, "zoom": 1 },
    "elements": [
      {
        "id": "element-1",
        "type": "text-node",
        "position": { "x": 100, "y": 100 },
        "content": "Sample text content",
        "metadata": { "created": "timestamp" }
      }
    ]
  }
}
```

### State Management
- **Local State**: Canvas viewport, UI state (webview)
- **Persistent State**: Canvas elements and data (extension host)
- **Shared State**: Selection, active tools (synchronized)

## VS Code Integration Points

### APIs Used
- `window.createWebviewPanel()` - Canvas editor container
- `commands.registerCommand()` - Extension commands
- `window.registerCustomEditorProvider()` - Custom file editor
- `workspace.fs` - File system operations

### VS Code Integration
- **File Explorer Integration**: Canvas files appear in file explorer
- **Quick Open**: Canvas files searchable via `Ctrl+P`
- **File Association**: Automatic opening with canvas editor

## Migration Roadmap

### Phase 1: Basic Extension (Week 1) ✅ COMPLETE
- [x] Create VS Code extension project
- [x] Copy web app to webview folder (simplified version)
- [x] Register `.canvas` file association in package.json
- [x] Create basic extension.ts with webview
- [x] Implement core canvas functionality

**Deliverables**:
- ✅ Working VS Code extension that opens `.canvas` files
- ✅ Basic infinite canvas with create/edit/delete nodes
- ✅ File save/load integration

### Phase 2: Enhancement (Week 2) - IN PROGRESS
- [x] Add save/load messaging between extension and webview
- [x] Integrate with VS Code file system API  
- [x] Handle file changes and auto-save
- [ ] Add AI integration from original web app
- [ ] Improve UI with toolbar and better controls
- [ ] Add connection creation workflow

**Deliverables**:
- Enhanced canvas editor with full feature set
- AI-powered content generation

### Phase 3: Polish & Publishing (Week 3)
- [ ] Add extension icon and marketplace assets
- [ ] Create extension documentation
- [ ] Test AI features work in VS Code environment
- [ ] Package and publish to marketplace

**Deliverables**:
- Published VS Code extension
- Complete documentation

## Performance Considerations

### Optimization Strategies
- **Web App Performance**: Existing optimizations carry over
- **File I/O**: Debounced save operations to prevent excessive writes
- **Memory Management**: Webview lifecycle handled by VS Code

## Current Web App Reference

The existing web application provides the foundation with these components:
- **Canvas Rendering**: Core visualization engine
- **AI Integration**: Replicate proxy and AI services
- **State Management**: Canvas state and persistence
- **UI Controls**: User interface and interaction handling

See `docs/web_code_reference.txt` for complete web app implementation details.

## Development Setup

### Prerequisites
- Node.js 16+
- VS Code Extension Development Host
- TypeScript 4.5+

### Initial Setup Commands
```bash
# Install VS Code extension generator
npm install -g yo generator-code

# Generate extension skeleton
yo code

# Install dependencies
npm install

# Start development
npm run watch
```

## Change Log

### 2025-08-03
- ✅ Completed architecture design
- ✅ Defined system components and data flow
- ✅ Planned directory structure
- ✅ Created migration roadmap
- 📝 Documented in README.md

### Next Steps
- [ ] Initialize VS Code extension project
- [ ] Begin Phase 1 implementation
- [ ] Setup development environment
- [ ] Create initial extension manifest

---

**Project Repository**: infinite_canvas_v5_vscode  
**Original Web App**: infinite_canvas_v5  
**Target Platform**: VS Code Extension  
**Expected Timeline**: 6 weeks for full implementation