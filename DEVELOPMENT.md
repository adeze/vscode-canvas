# Development Guide - Infinite Canvas VS Code Extension

## Quick Start

### Prerequisites
- Node.js 16+ 
- VS Code
- TypeScript 4.5+

### Setup
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Or watch for changes
npm run watch
```

### Running the Extension

#### Method 1: Command Palette (Recommended for Mac)
1. Open this project in VS Code
2. Open Command Palette (`Cmd+Shift+P`)
3. Type "Debug: Start Debugging" and select it
4. VS Code will launch Extension Development Host
5. In the new VS Code window, create a `.canvas` file
6. Double-click the file to open with Infinite Canvas

#### Method 2: Debug Menu
1. Open this project in VS Code
2. Go to **Run > Start Debugging** (or `Cmd+Shift+D` then click play button)
3. Select "Run Extension" if prompted
4. Extension Development Host will launch

#### Method 3: Keyboard Shortcut (Mac)
- Press `Fn+F5` if your Mac has function keys
- Or press `Cmd+Shift+D` to open Debug view, then click the play button

## File Structure

```
├── src/
│   └── extension.ts              # Main extension code
├── webview/                      # Canvas web app
│   ├── main.js                   # Entry point
│   ├── style.css                 # VS Code themed styles
│   └── src/
│       └── InfiniteCanvasSimple.js  # Core canvas implementation
├── package.json                  # Extension manifest
└── tsconfig.json                 # TypeScript config
```

## Extension Features

### Current Implementation
- ✅ Custom editor for `.canvas` files
- ✅ Basic infinite canvas with pan/zoom
- ✅ Create nodes (double-click empty space)
- ✅ Edit nodes (double-click node)
- ✅ Delete nodes (select + Delete key)
- ✅ Drag nodes
- ✅ File save/load integration
- ✅ VS Code theme integration

### Canvas Controls
- **Double-click empty space**: Create new node
- **Double-click node**: Edit text
- **Drag node**: Move node
- **Mouse wheel**: Zoom in/out
- **Click + drag background**: Pan canvas
- **Delete key**: Delete selected nodes

## Development Workflow

### Making Changes
1. Edit code in `src/` or `webview/`
2. Run `npm run compile` (or use watch mode with `npm run watch`)
3. Reload extension host window:
   - **Mac**: `Cmd+R` in the Extension Development Host window
   - **Windows/Linux**: `Ctrl+R`
   - **Alternative**: `Cmd+Shift+P` → "Developer: Reload Window"
4. Test changes

### Adding Features
Most canvas features should be added to:
- `webview/src/InfiniteCanvasSimple.js` - Core canvas logic
- `webview/main.js` - VS Code integration
- `src/extension.ts` - Extension host logic

### VS Code Integration
The extension uses webview messaging:
- Extension → Webview: `loadContent` message
- Webview → Extension: `save` message with canvas data

## Architecture

### Extension Host (Node.js)
- Registers custom editor for `.canvas` files
- Handles file I/O operations
- Creates webview panels

### Webview (Browser)
- Loads simplified canvas web app
- Handles user interactions
- Sends save requests to extension

### Data Flow
```
.canvas file ↔ Extension Host ↔ Webview ↔ Canvas App
```

## Testing

### Manual Testing
1. Create test `.canvas` files
2. Test basic operations (create, edit, delete, save)
3. Test with existing canvas files from web app
4. Verify VS Code integration (save, auto-save, file changes)

### File Format
Canvas files are JSON with this structure:
```json
{
  "version": "1.0",
  "canvas": {
    "viewport": { "x": 0, "y": 0, "zoom": 1 },
    "elements": [
      {
        "id": "node_1",
        "type": "text-node",
        "position": { "x": 100, "y": 100 },
        "content": "Sample text"
      }
    ],
    "connections": []
  }
}
```

## Next Steps

### Phase 2 Enhancements
- [ ] Add AI integration (from original web app)
- [ ] Improve UI with toolbar/controls
- [ ] Add connection creation UI
- [ ] Better error handling
- [ ] Extension settings/preferences

### Phase 3 Publishing
- [ ] Extension icon and branding
- [ ] Marketplace description
- [ ] Documentation and demos
- [ ] Package for VS Code marketplace

## Troubleshooting

### Common Issues
- **Extension not loading**: Check TypeScript compilation errors (`npm run compile`)
- **Canvas not rendering**: Check browser console in webview (right-click → "Open Developer Tools")
- **Canvas interaction not working**: See debugging steps below
- **File not saving**: Check extension host console output
- **Changes not reflecting**: Reload extension development host (`Cmd+R` on Mac)
- **F5 not working on Mac**: Use `Cmd+Shift+P` → "Debug: Start Debugging" instead

### Canvas Interaction Debugging
If double-clicking doesn't create nodes:

1. **Open Developer Tools**:
   - Right-click on the canvas → "Open Developer Tools"
   - Check Console tab for errors or debug messages

2. **Look for these debug messages**:
   ```
   🎨 Initializing VS Code Canvas App
   📍 Canvas element found: <canvas>
   🎯 Canvas object created: InfiniteCanvas
   ✅ Canvas app initialized successfully
   🎮 Setting up event listeners on canvas: <canvas>
   ```

3. **Test double-click**:
   - Double-click on empty canvas area
   - Should see: `🖱️ Double click detected!`
   - Should see: `➕ Creating new node at: {x: ..., y: ...}`
   - Should see: `🎉 New node created: {node object}`

4. **Check canvas size**:
   - Canvas should have proper dimensions
   - If canvas is 0x0, check CSS and container setup

### Debugging
- **Extension Host**: Use VS Code debugger
  - Mac: `Cmd+Shift+P` → "Debug: Start Debugging"
  - Or: Run menu → Start Debugging
- **Webview**: Right-click canvas → "Open Developer Tools"
- **Console logs**: Check both extension and webview consoles
- **Reload**: `Cmd+R` in Extension Development Host window

### Mac-Specific Notes
- Use `Cmd` instead of `Ctrl` for all shortcuts
- Function keys may need `Fn` prefix (e.g., `Fn+F5`)
- Debug menu is in **Run > Start Debugging**
- Command Palette is the most reliable method (`Cmd+Shift+P`)