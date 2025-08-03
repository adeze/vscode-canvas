# Infinite Canvas VS Code Extension

Transform the infinite canvas web application into a VS Code extension that can open and edit `.canvas` files.

## Project Overview

**Goal**: Adapt the existing infinite canvas web app to work as a VS Code extension, allowing users to open and edit canvas files directly within VS Code.

**Status**: 🎯 Design Phase - Architecture Complete

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

### Phase 1: Basic Extension (Week 1)
- [ ] Create VS Code extension project
- [ ] Copy web app to webview folder
- [ ] Register `.canvas` file association in package.json
- [ ] Create basic extension.ts with webview
- [ ] Test opening .canvas files

**Deliverables**:
- Working VS Code extension that opens `.canvas` files
- Web app loads in VS Code webview

### Phase 2: File Integration (Week 2)
- [ ] Add save/load messaging between extension and webview
- [ ] Integrate with VS Code file system API
- [ ] Handle file changes and auto-save
- [ ] Test with existing .canvas files from web app

**Deliverables**:
- Complete file I/O functionality
- Seamless save/load experience

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