// Simplified Infinite Canvas for VS Code Extension
// Core functionality with AI integrations

export class InfiniteCanvas {
    constructor(canvasId) {
        console.log('🚀 Creating InfiniteCanvas with ID:', canvasId);
        
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with ID '${canvasId}' not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        console.log('📐 Canvas element:', this.canvas);
        console.log('🎯 Canvas context:', this.ctx);
        
        // Initialize canvas state
        this.canvasState = new CanvasState();
        this.inputHandler = new InputHandler(this.canvas, this.canvasState);
        this.renderer = new CanvasRenderer();
        
        // Initialize AI functionality
        this.aiManager = null;
        this.uiManager = new UIManager(this);
        
        // Initialize markdown renderer modules
        this.markdownRenderer = null;
        this.parseMarkdown = null;
        this.renderLoopStarted = false;
        this._markdownErrorLogged = false;
        
        console.log('📊 Canvas state created:', this.canvasState);
        console.log('🖱️ Input handler created:', this.inputHandler);
        
        // Set up canvas and render system first
        this.setupCanvas();
        this.setupRenderOnDemand();
        
        // Initialize AI and markdown renderer then start render loop
        this.initializeComponents().then(() => {
            if (!this.renderLoopStarted) {
                this.startRenderLoop();
                this.renderLoopStarted = true;
                console.log('✅ Infinite Canvas initialized successfully');
            }
        }).catch(error => {
            console.error('Failed to initialize canvas:', error);
            // Start render loop anyway with fallback rendering
            if (!this.renderLoopStarted) {
                this.startRenderLoop();
                this.renderLoopStarted = true;
                console.log('⚠️ Infinite Canvas initialized with fallback rendering');
            }
        });
    }
    
    async initializeComponents() {
        // Load markdown renderer
        await this.initializeMarkdownRenderer();
        
        // Initialize AI functionality
        await this.initializeAI();
        
        // Set up UI controls
        this.uiManager.setupUI();
    }
    
    async initializeAI() {
        try {
            console.log('🤖 Initializing AI functionality...');
            
            // Dynamic import of AI components
            const { AIManager } = await import('./AIManager.js');
            this.aiManager = new AIManager(this.canvasState, this.uiManager);
            
            console.log('✅ AI Manager initialized');
        } catch (error) {
            console.warn('⚠️ Failed to initialize AI functionality:', error);
            this.aiManager = null;
        }
    }
    
    async initializeMarkdownRenderer() {
        try {
            console.log('🔄 Attempting to load markdown renderer modules...');
            
            const rendererModule = await import('./markdownRenderer.js');
            console.log('✅ Markdown renderer module loaded:', rendererModule);
            
            const parserModule = await import('./markdownParser.js');
            console.log('✅ Markdown parser module loaded:', parserModule);
            
            const { MarkdownRenderer } = rendererModule;
            const { parseMarkdown } = parserModule;
            
            if (!MarkdownRenderer || !parseMarkdown) {
                throw new Error('Required classes/functions not found in modules');
            }
            
            this.markdownRenderer = new MarkdownRenderer();
            this.markdownRenderer.setTheme('dark');
            this.parseMarkdown = parseMarkdown;
            this._markdownErrorLogged = false; // Reset error flag since we're now initialized
            
            console.log('✅ Markdown renderer initialized successfully');
        } catch (error) {
            console.warn('Failed to initialize markdown renderer, using fallback:', error);
            // Set fallback functions to prevent null reference errors
            this.markdownRenderer = null;
            this.parseMarkdown = null;
        }
    }
    
    setupCanvas() {
        // Set canvas size to fill container
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Force re-render
        if (this.requestRender) {
            this.requestRender();
        } else {
            this.render();
        }
    }
    
    startRenderLoop() {
        // Start with an initial render
        this.render();
        console.log('🎨 Render loop started with on-demand rendering');
    }
    
    setupRenderOnDemand() {
        // Track if render is needed
        this.needsRender = false;
        this.renderScheduled = false;
        
        // Request render when needed
        this.requestRender = () => {
            if (!this.renderScheduled) {
                this.renderScheduled = true;
                requestAnimationFrame(() => {
                    this.render();
                    this.renderScheduled = false;
                    this.needsRender = false;
                });
            }
        };
        
        // Set up automatic render triggers
        this.canvasState.onStateChange = () => this.requestRender();
        
        // Set up selection change callback for floating button updates
        this.canvasState.onSelectionChange = () => {
            if (this.uiManager) {
                this.uiManager.updateFloatingButton();
            }
        };
        
        // Update InputHandler with render callback
        if (this.inputHandler) {
            this.inputHandler.setRenderCallback(this.requestRender);
        }
    }
    
    render() {
        try {
            this.renderer.render(this.ctx, this.canvas, this.canvasState, this.inputHandler);
        } catch (error) {
            console.error('Render error:', error);
            // Don't request more renders if there's an error
        }
    }
}

// Simplified Canvas State Management
class CanvasState {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.selectedNodes = [];
        this.selectedConnection = null;
        
        // Viewport
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        
        // Node counter for unique IDs
        this.nodeCounter = 0;
        
        // State change callback for VS Code integration
        this.onStateChange = null;
    }
    
    createNode(text = 'New Node', x = 100, y = 100) {
        console.log('🎨 Creating node:', { text, x, y });
        
        const node = {
            id: `node_${++this.nodeCounter}`,
            type: 'text',
            text: text,
            x: x,
            y: y,
            width: 250,  // Default width
            height: 120, // Default height
            maxHeight: 120, // Fixed height for scrolling
            scrollY: 0,  // Vertical scroll offset
            isSelected: false,
            backgroundColor: '#3c3c3c',
            textColor: '#cccccc',
            borderColor: '#414141'
        };
        
        this.nodes.push(node);
        console.log('📊 Total nodes now:', this.nodes.length);
        console.log('📋 All nodes:', this.nodes);
        
        this.notifyStateChange();
        return node;
    }
    
    createFileNode(filePath, x = 100, y = 100) {
        console.log('📄 Creating file node:', { filePath, x, y });
        
        const node = {
            id: `file_${++this.nodeCounter}`,
            type: 'file',
            file: filePath,
            x: x,
            y: y,
            width: 400,
            height: 400,
            maxHeight: 400, // Fixed height for scrolling
            scrollY: 0,     // Vertical scroll offset
            isSelected: false,
            backgroundColor: '#2d2d2d',
            textColor: '#cccccc',
            borderColor: '#4a5568',
            content: null,
            isContentLoaded: false,
            isEditing: false,
            lastModified: null
        };
        
        this.nodes.push(node);
        this.loadFileContent(node);
        console.log('📊 Total nodes now:', this.nodes.length);
        
        this.notifyStateChange();
        return node;
    }
    
    async loadFileContent(fileNode) {
        try {
            console.log('📖 Loading file content for:', fileNode.file);
            
            if (window.vsCodeAPI) {
                window.vsCodeAPI.postMessage({
                    type: 'loadFile',
                    filePath: fileNode.file,
                    nodeId: fileNode.id
                });
            }
        } catch (error) {
            console.error('❌ Error loading file content:', error);
            fileNode.content = `Error loading file: ${fileNode.file}`;
            fileNode.isContentLoaded = true;
        }
    }
    
    updateFileContent(nodeId, content, lastModified = null) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node && node.type === 'file') {
            node.content = content;
            node.isContentLoaded = true;
            node.lastModified = lastModified;
            console.log('📝 File content updated for:', node.file);
        }
    }
    
    async saveFileContent(fileNode, content) {
        try {
            console.log('💾 Saving file content for:', fileNode.file);
            
            if (window.vsCodeAPI) {
                window.vsCodeAPI.postMessage({
                    type: 'saveFile',
                    filePath: fileNode.file,
                    content: content,
                    nodeId: fileNode.id
                });
            }
            
            fileNode.content = content;
        } catch (error) {
            console.error('❌ Error saving file content:', error);
        }
    }
    
    validateFileNodes() {
        // Check all file nodes for broken links
        this.nodes.filter(node => node.type === 'file').forEach(fileNode => {
            if (!fileNode.isContentLoaded && fileNode.content === null) {
                // File might be missing, try to reload
                this.loadFileContent(fileNode);
            }
        });
    }
    
    updateFilePath(nodeId, oldPath, newPath) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node && node.type === 'file') {
            console.log('📝 Updating file path:', { oldPath, newPath });
            node.file = newPath;
            node.isContentLoaded = false;
            node.content = null;
            this.loadFileContent(node);
            this.notifyStateChange();
        }
    }
    
    deleteNode(node) {
        const index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
            
            // Remove connections involving this node
            this.connections = this.connections.filter(conn => 
                conn.from !== node.id && conn.to !== node.id
            );
            
            // Remove from selection
            this.selectedNodes = this.selectedNodes.filter(n => n !== node);
            
            this.notifyStateChange();
        }
    }
    
    createConnection(fromNode, toNode, fromSide = null, toSide = null) {
        const connection = {
            id: `conn_${Date.now()}`,
            from: fromNode.id,
            to: toNode.id,
            fromNode: fromNode,
            toNode: toNode,
            fromSide: fromSide,
            toSide: toSide
        };
        
        this.connections.push(connection);
        console.log('✅ Connection created:', connection.id, 'from', fromNode.id, 'to', toNode.id);
        this.notifyStateChange();
        return connection;
    }
    
    selectConnection(connection) {
        this.clearSelection();
        this.selectedConnection = connection;
        console.log('🔗 Connection selected:', connection.id);
    }
    
    deleteConnection(connection) {
        const index = this.connections.indexOf(connection);
        if (index > -1) {
            this.connections.splice(index, 1);
            this.selectedConnection = null;
            this.notifyStateChange();
            console.log('🗑️ Connection deleted:', connection.id);
        }
    }
    
    selectNode(node) {
        this.clearSelection();
        node.isSelected = true;
        this.selectedNodes = [node];
        this.notifySelectionChange();
    }
    
    clearSelection() {
        this.nodes.forEach(node => node.isSelected = false);
        this.selectedNodes = [];
        this.selectedConnection = null;
        this.notifySelectionChange();
    }
    
    notifySelectionChange() {
        // Notify UI manager about selection changes for floating button updates
        if (this.onSelectionChange) {
            this.onSelectionChange();
        }
    }
    
    getNodeAt(x, y) {
        // Check nodes in reverse order (top to bottom)
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            if (x >= node.x && x <= node.x + node.width &&
                y >= node.y && y <= node.y + node.height) {
                return node;
            }
        }
        return null;
    }
    
    exportCanvasData() {
        // Export in Obsidian-compatible format
        return {
            nodes: this.nodes.map(node => {
                const baseNode = {
                    id: node.id,
                    x: node.x,
                    y: node.y,
                    width: node.width,
                    height: node.height,
                    type: node.type || "text"
                };
                
                if (node.type === 'file') {
                    baseNode.file = node.file;
                } else {
                    baseNode.text = node.text;
                }
                
                return baseNode;
            }),
            edges: this.connections.map(conn => ({
                id: conn.id,
                fromNode: conn.from,
                fromSide: conn.fromSide || "right",
                toNode: conn.to,
                toSide: conn.toSide || "left"
            }))
        };
    }
    
    loadCanvasData(data) {
        try {
            if (!data) return;
            
            // Preserve current viewport position
            const currentOffsetX = this.offsetX;
            const currentOffsetY = this.offsetY;
            const currentScale = this.scale;
            
            // Reset content state (but preserve viewport)
            this.nodes = [];
            this.connections = [];
            this.nodeCounter = 0;
            
            // Restore viewport position
            this.offsetX = currentOffsetX;
            this.offsetY = currentOffsetY;
            this.scale = currentScale;
            
            console.log('📋 Loading Obsidian canvas format');
            
            // Load nodes
            if (data.nodes && Array.isArray(data.nodes)) {
                data.nodes.forEach(nodeData => {
                    const isFileNode = nodeData.type === 'file';
                    
                    const node = {
                        id: nodeData.id,
                        type: nodeData.type || 'text',
                        x: nodeData.x || 100,
                        y: nodeData.y || 100,
                        width: nodeData.width || (isFileNode ? 400 : 250),
                        height: nodeData.height || (isFileNode ? 400 : 120),
                        maxHeight: nodeData.maxHeight || (isFileNode ? 400 : 120),
                        scrollY: nodeData.scrollY || 0,
                        isSelected: false,
                        backgroundColor: isFileNode ? '#2d2d2d' : '#3c3c3c',
                        textColor: '#cccccc',
                        borderColor: isFileNode ? '#4a5568' : '#414141'
                    };
                    
                    if (isFileNode) {
                        node.file = nodeData.file;
                        node.content = null;
                        node.isContentLoaded = false;
                        node.isEditing = false;
                        node.lastModified = null;
                        // Load file content after adding to nodes
                        setTimeout(() => this.loadFileContent(node), 100);
                    } else {
                        node.text = nodeData.text || 'New Node';
                    }
                    
                    this.nodes.push(node);
                    
                    // Update counter to avoid ID conflicts
                    const nodeNum = parseInt(node.id.replace(/^(node_|file_)/, ''));
                    if (!isNaN(nodeNum) && nodeNum > this.nodeCounter) {
                        this.nodeCounter = nodeNum;
                    }
                });
            }
            
            // Load edges
            if (data.edges && Array.isArray(data.edges)) {
                data.edges.forEach(edgeData => {
                    const fromNode = this.nodes.find(n => n.id === edgeData.fromNode);
                    const toNode = this.nodes.find(n => n.id === edgeData.toNode);
                    
                    if (fromNode && toNode) {
                        this.connections.push({
                            id: edgeData.id,
                            from: edgeData.fromNode,
                            to: edgeData.toNode,
                            fromSide: edgeData.fromSide,
                            toSide: edgeData.toSide,
                            fromNode: fromNode,
                            toNode: toNode
                        });
                    }
                });
            }
            
            this.clearSelection();
            console.log('✅ Canvas data loaded successfully');
            console.log('📊 Loaded:', this.nodes.length, 'nodes,', this.connections.length, 'connections');
            
        } catch (error) {
            console.error('❌ Error loading canvas data:', error);
        }
    }
    
    notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange();
        }
    }
    
    // For compatibility with existing save system
    saveToLocalStorage() {
        this.notifyStateChange();
    }
    
    // Force immediate save to VS Code (for text node editing)
    async saveCanvasState() {
        try {
            const canvasData = this.exportCanvasData();
            const content = JSON.stringify(canvasData, null, 2);
            
            if (window.vsCodeAPI) {
                window.vsCodeAPI.postMessage({
                    type: 'save',
                    content: content
                });
                console.log('💾 Canvas state saved immediately to VS Code');
            } else {
                console.warn('⚠️ VS Code API not available, falling back to state change');
                this.notifyStateChange();
            }
        } catch (error) {
            console.error('❌ Failed to save canvas state:', error);
            // Fallback to normal state change
            this.notifyStateChange();
        }
    }
}

// Simplified Input Handler
class InputHandler {
    constructor(canvas, canvasState) {
        this.canvas = canvas;
        this.canvasState = canvasState;
        
        this.isDragging = false;
        this.isNodeDragging = false;
        this.isPanning = false;
        this.draggedNode = null;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.requestRender = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.hasMoved = false;
        
        // Connection functionality
        this.isConnecting = false;
        this.connectionStart = null;
        
        // Scrollbar functionality
        this.isDraggingScrollbar = false;
        this.scrollbarDragNode = null;
        this.scrollbarDragStartY = 0;
        
        // Resize functionality
        this.isResizing = false;
        this.resizeNode = null;
        this.resizeHandle = null;
        this.resizeStartX = 0;
        this.resizeStartY = 0;
        this.resizeStartWidth = 0;
        this.resizeStartHeight = 0;
        this.connectionStartPoint = null;
        this.hoveredNode = null;
        this.hoveredConnectionPoint = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        console.log('🎮 Setting up event listeners on canvas:', this.canvas);
        
        this.canvas.addEventListener('mousedown', (e) => {
            console.log('🖱️ Mouse down:', e);
            this.handleMouseDown(e);
            // Request render for mouse down interactions
            if (this.requestRender) {
                this.requestRender();
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
            // Request render for mouse interactions (hover effects, etc.)
            if (this.requestRender) {
                this.requestRender();
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            console.log('🖱️ Mouse up:', e);
            this.handleMouseUp(e);
            // Request render for mouse up interactions
            if (this.requestRender) {
                this.requestRender();
            }
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            console.log('🎡 Wheel:', e);
            this.handleWheel(e);
            // Request render for wheel interactions
            if (this.requestRender) {
                this.requestRender();
            }
        });
        
        this.canvas.addEventListener('dblclick', (e) => {
            console.log('🖱️ Double click detected!', e);
            this.handleDoubleClick(e);
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            console.log('⌨️ Key down:', e.key);
            this.handleKeyDown(e);
        });
        
        // Drag and drop events
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        this.canvas.addEventListener('drop', (e) => {
            console.log('📁 Drop event detected!', e);
            this.handleDrop(e);
        });
        
        console.log('✅ Event listeners set up successfully');
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to canvas coordinates
        const canvasX = (mouseX - this.canvasState.offsetX) / this.canvasState.scale;
        const canvasY = (mouseY - this.canvasState.offsetY) / this.canvasState.scale;
        
        const clickedNode = this.canvasState.getNodeAt(canvasX, canvasY);
        console.log('🎯 Mouse down on node:', clickedNode ? clickedNode.id : 'background');
        
        // Check if clicking on connection first
        if (!clickedNode) {
            const clickedConnection = this.getConnectionAtPoint(canvasX, canvasY);
            if (clickedConnection) {
                console.log('🔗 Connection clicked:', clickedConnection.id);
                this.canvasState.selectConnection(clickedConnection);
                this.isDragging = false;
                return;
            }
        }
        
        if (clickedNode) {
            // Check if clicking on a connection point first when Shift is held (priority for connections)
            const connectionPoint = this.getConnectionPointAt(clickedNode, canvasX, canvasY);
            
            if (e.shiftKey && connectionPoint) {
                // Start connection - this takes priority over resize when Shift is held
                console.log('🔗 Starting connection from:', clickedNode.id, connectionPoint.side);
                this.isConnecting = true;
                this.connectionStart = clickedNode;
                this.connectionStartPoint = connectionPoint;
                this.canvasState.clearSelection();
                this.isDragging = false;
                return;
            }
            
            // Check if clicking on resize handle (only if not connecting)
            const resizeHandle = clickedNode._resizeHandles?.find(handle =>
                canvasX >= handle.x && canvasX <= handle.x + handle.width &&
                canvasY >= handle.y && canvasY <= handle.y + handle.height
            );
            if (resizeHandle && !e.shiftKey) {
                console.log('🔧 Resize handle clicked:', clickedNode.id, resizeHandle.type);
                this.isResizing = true;
                this.resizeNode = clickedNode;
                this.resizeHandle = resizeHandle;
                this.resizeStartX = canvasX;
                this.resizeStartY = canvasY;
                this.resizeStartWidth = clickedNode.width;
                this.resizeStartHeight = clickedNode.height;
                this.isDragging = false;
                return;
            }
            
            // Check if clicking on scrollbar
            if (clickedNode._scrollbarBounds &&
                this.isPointInRect(canvasX, canvasY, clickedNode._scrollbarBounds)) {
                console.log('📜 Scrollbar clicked:', clickedNode.id);
                this.isDraggingScrollbar = true;
                this.scrollbarDragNode = clickedNode;
                this.scrollbarDragStartY = canvasY - clickedNode._scrollbarBounds.thumbY;
                this.isDragging = false;
                return;
            }
            
            // Check if clicking on edit button for file nodes
            if (clickedNode.type === 'file' && clickedNode._editButtonBounds &&
                this.isPointInRect(canvasX, canvasY, clickedNode._editButtonBounds)) {
                console.log('🔘 Edit button clicked during mouse down:', clickedNode.file);
                this.editFileNodeSimple(clickedNode);
                this.isDragging = false;
                return;
            }
            
            // Normal node interaction
            this.canvasState.selectNode(clickedNode);
            console.log('✅ Node selected:', clickedNode.id, 'Total selected:', this.canvasState.selectedNodes.length);
            this.isNodeDragging = true;
            this.draggedNode = clickedNode;
            this.dragStartX = canvasX - clickedNode.x;
            this.dragStartY = canvasY - clickedNode.y;
        } else {
            // Start panning
            this.canvasState.clearSelection();
            console.log('🧹 Selection cleared');
            this.isPanning = true;
        }
        
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
        this.isDragging = true;
        this.hasMoved = false;
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to canvas coordinates for hover detection
        const canvasX = (mouseX - this.canvasState.offsetX) / this.canvasState.scale;
        const canvasY = (mouseY - this.canvasState.offsetY) / this.canvasState.scale;
        
        // Update hover state
        this.hoveredNode = this.canvasState.getNodeAt(canvasX, canvasY);
        if (this.hoveredNode) {
            this.hoveredConnectionPoint = this.getConnectionPointAt(this.hoveredNode, canvasX, canvasY);
        } else {
            this.hoveredConnectionPoint = null;
        }
        
        // Update cursor based on hover state
        if (this.isResizing) {
            this.canvas.style.cursor = this.resizeHandle.cursor;
        } else if (this.isDraggingScrollbar) {
            this.canvas.style.cursor = 'grabbing';
        } else if (this.isConnecting) {
            this.canvas.style.cursor = 'crosshair';
        } else if (this.hoveredConnectionPoint && e.shiftKey) {
            this.canvas.style.cursor = 'copy';
        } else if (this.hoveredNode) {
            // Check for resize handle hover
            const resizeHandle = this.hoveredNode._resizeHandles?.find(handle => 
                canvasX >= handle.x && canvasX <= handle.x + handle.width &&
                canvasY >= handle.y && canvasY <= handle.y + handle.height
            );
            if (resizeHandle) {
                this.canvas.style.cursor = resizeHandle.cursor;
            } else if (this.hoveredNode._scrollbarBounds && 
                       this.isPointInRect(canvasX, canvasY, this.hoveredNode._scrollbarBounds)) {
                this.canvas.style.cursor = 'grab';
            } else {
                this.canvas.style.cursor = 'grab';
            }
        } else {
            this.canvas.style.cursor = 'default';
        }
        
        if (this.isResizing && this.resizeNode && this.resizeHandle) {
            // Handle node resizing
            const deltaX = canvasX - this.resizeStartX;
            const deltaY = canvasY - this.resizeStartY;
            const node = this.resizeNode;
            const handle = this.resizeHandle;
            
            // Minimum size constraints
            const minWidth = 100;
            const minHeight = 60;
            
            // Calculate new dimensions based on resize handle type
            let newWidth = this.resizeStartWidth;
            let newHeight = this.resizeStartHeight;
            let newX = node.x;
            let newY = node.y;
            
            switch (handle.type) {
                case 'se': // Southeast (bottom-right)
                    newWidth = Math.max(minWidth, this.resizeStartWidth + deltaX);
                    newHeight = Math.max(minHeight, this.resizeStartHeight + deltaY);
                    break;
                case 'sw': // Southwest (bottom-left)
                    newWidth = Math.max(minWidth, this.resizeStartWidth - deltaX);
                    newHeight = Math.max(minHeight, this.resizeStartHeight + deltaY);
                    newX = node.x + (this.resizeStartWidth - newWidth);
                    break;
                case 'ne': // Northeast (top-right)
                    newWidth = Math.max(minWidth, this.resizeStartWidth + deltaX);
                    newHeight = Math.max(minHeight, this.resizeStartHeight - deltaY);
                    newY = node.y + (this.resizeStartHeight - newHeight);
                    break;
                case 'nw': // Northwest (top-left)
                    newWidth = Math.max(minWidth, this.resizeStartWidth - deltaX);
                    newHeight = Math.max(minHeight, this.resizeStartHeight - deltaY);
                    newX = node.x + (this.resizeStartWidth - newWidth);
                    newY = node.y + (this.resizeStartHeight - newHeight);
                    break;
                case 'e': // East (right edge)
                    newWidth = Math.max(minWidth, this.resizeStartWidth + deltaX);
                    break;
                case 'w': // West (left edge)
                    newWidth = Math.max(minWidth, this.resizeStartWidth - deltaX);
                    newX = node.x + (this.resizeStartWidth - newWidth);
                    break;
                case 's': // South (bottom edge)
                    newHeight = Math.max(minHeight, this.resizeStartHeight + deltaY);
                    break;
                case 'n': // North (top edge)
                    newHeight = Math.max(minHeight, this.resizeStartHeight - deltaY);
                    newY = node.y + (this.resizeStartHeight - newHeight);
                    break;
            }
            
            // Apply the new dimensions
            node.x = newX;
            node.y = newY;
            node.width = newWidth;
            node.height = newHeight;
            
            // Update maxHeight for scrolling (keep aspect or use new height)
            if (node.maxHeight) {
                node.maxHeight = newHeight;
            }
            
            console.log('🔧 Resizing node:', node.id, 'to', newWidth + 'x' + newHeight);
        } else if (this.isDraggingScrollbar && this.scrollbarDragNode) {
            // Handle scrollbar dragging
            const node = this.scrollbarDragNode;
            const thumbY = canvasY - this.scrollbarDragStartY;
            const scrollbarBounds = node._scrollbarBounds;
            
            if (scrollbarBounds) {
                const relativeThumbY = thumbY - scrollbarBounds.y;
                const maxThumbY = scrollbarBounds.height - scrollbarBounds.thumbHeight;
                const clampedThumbY = Math.max(0, Math.min(relativeThumbY, maxThumbY));
                
                // Calculate scroll position from thumb position
                const scrollRatio = maxThumbY > 0 ? clampedThumbY / maxThumbY : 0;
                node.scrollY = scrollRatio * node._maxScroll;
                
                console.log('📜 Dragging scrollbar:', node.id, 'scrollY:', node.scrollY);
            }
        } else if (this.isDragging) {
            const deltaX = mouseX - this.lastMouseX;
            const deltaY = mouseY - this.lastMouseY;
            
            // Track if we've actually moved (not just a click)
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                this.hasMoved = true;
            }
            
            if (this.isNodeDragging && this.draggedNode) {
                // Move node
                this.draggedNode.x = canvasX - this.dragStartX;
                this.draggedNode.y = canvasY - this.dragStartY;
                
                this.canvasState.notifyStateChange();
            } else if (this.isPanning) {
                // Pan canvas
                this.canvasState.offsetX += deltaX;
                this.canvasState.offsetY += deltaY;
                
                // Update floating button position after pan
                this.canvasState.notifySelectionChange();
                
                // Request render for panning
                if (this.requestRender) {
                    this.requestRender();
                }
            }
        }
        
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
    }
    
    handleMouseUp(e) {
        console.log('🖱️ Mouse up - was dragging:', this.isDragging, 'was node dragging:', this.isNodeDragging, 'was connecting:', this.isConnecting, 'was scrollbar dragging:', this.isDraggingScrollbar);
        
        // Handle resize completion
        if (this.isResizing) {
            console.log('🔧 Resize ended');
            this.isResizing = false;
            this.resizeNode = null;
            this.resizeHandle = null;
            this.resizeStartX = 0;
            this.resizeStartY = 0;
            this.resizeStartWidth = 0;
            this.resizeStartHeight = 0;
            return;
        }
        
        // Handle scrollbar dragging release
        if (this.isDraggingScrollbar) {
            console.log('📜 Scrollbar drag ended');
            this.isDraggingScrollbar = false;
            this.scrollbarDragNode = null;
            this.scrollbarDragStartY = 0;
            return;
        }
        
        // Handle connection completion
        if (this.isConnecting && this.connectionStart) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const canvasX = (mouseX - this.canvasState.offsetX) / this.canvasState.scale;
            const canvasY = (mouseY - this.canvasState.offsetY) / this.canvasState.scale;
            
            const targetNode = this.canvasState.getNodeAt(canvasX, canvasY);
            
            if (targetNode && targetNode !== this.connectionStart) {
                const targetConnectionPoint = this.getConnectionPointAt(targetNode, canvasX, canvasY);
                
                console.log('🔗 Completing connection to:', targetNode.id, targetConnectionPoint ? targetConnectionPoint.side : 'auto');
                
                this.canvasState.createConnection(
                    this.connectionStart, 
                    targetNode, 
                    this.connectionStartPoint ? this.connectionStartPoint.side : null,
                    targetConnectionPoint ? targetConnectionPoint.side : null
                );
            } else {
                console.log('❌ Connection cancelled - no valid target');
            }
            
            // Reset connection state
            this.isConnecting = false;
            this.connectionStart = null;
            this.connectionStartPoint = null;
            this.canvas.style.cursor = 'default';
        }
        
        // If we weren't really dragging (just a click), ensure selection is maintained
        if (this.draggedNode && !this.hasMoved) {
            console.log('👆 Simple click on node, ensuring selection');
            this.canvasState.selectNode(this.draggedNode);
        }
        
        this.isDragging = false;
        this.isNodeDragging = false;
        this.isPanning = false;
        this.draggedNode = null;
        this.hasMoved = false;
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to canvas coordinates
        const canvasX = (mouseX - this.canvasState.offsetX) / this.canvasState.scale;
        const canvasY = (mouseY - this.canvasState.offsetY) / this.canvasState.scale;
        
        // Check if mouse is over a node with scrollable content
        const hoveredNode = this.canvasState.getNodeAt(canvasX, canvasY);
        
        if (hoveredNode && hoveredNode._maxScroll > 0) {
            // Scroll the node content
            const scrollDelta = e.deltaY * 0.5; // Adjust scroll sensitivity
            hoveredNode.scrollY = Math.max(0, Math.min(hoveredNode.scrollY + scrollDelta, hoveredNode._maxScroll));
            console.log('📜 Scrolling node:', hoveredNode.id, 'scrollY:', hoveredNode.scrollY, 'maxScroll:', hoveredNode._maxScroll);
            
            // Request render for scroll
            if (this.requestRender) {
                this.requestRender();
            }
            return; // Don't zoom when scrolling node content
        }
        
        // Default canvas zoom behavior
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(5, this.canvasState.scale * zoomFactor));
        
        // Zoom towards mouse position
        const scaleDiff = newScale - this.canvasState.scale;
        this.canvasState.offsetX -= (mouseX - this.canvasState.offsetX) * scaleDiff / this.canvasState.scale;
        this.canvasState.offsetY -= (mouseY - this.canvasState.offsetY) * scaleDiff / this.canvasState.scale;
        
        this.canvasState.scale = newScale;
        
        // Update floating button position after zoom
        this.canvasState.notifySelectionChange();
        
        // Request render for zoom
        if (this.requestRender) {
            this.requestRender();
        }
    }
    
    handleDoubleClick(e) {
        console.log('🎯 Double click handler called!');
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        console.log('📍 Mouse position:', { mouseX, mouseY });
        console.log('📦 Canvas rect:', rect);
        
        // Convert to canvas coordinates
        const canvasX = (mouseX - this.canvasState.offsetX) / this.canvasState.scale;
        const canvasY = (mouseY - this.canvasState.offsetY) / this.canvasState.scale;
        
        console.log('🎨 Canvas coordinates:', { canvasX, canvasY });
        console.log('🔍 Canvas state:', { offsetX: this.canvasState.offsetX, offsetY: this.canvasState.offsetY, scale: this.canvasState.scale });
        
        const clickedNode = this.canvasState.getNodeAt(canvasX, canvasY);
        console.log('📝 Clicked node:', clickedNode);
        
        if (clickedNode) {
            if (clickedNode.type === 'file') {
                // Check if clicking on edit button
                if (clickedNode._editButtonBounds && this.isPointInRect(canvasX, canvasY, clickedNode._editButtonBounds)) {
                    console.log('🔘 Edit button clicked for:', clickedNode.file);
                    this.editFileNodeSimple(clickedNode);
                } else {
                    console.log('📝 Double-click to edit file:', clickedNode.file);
                    this.editFileNodeSimple(clickedNode);
                }
            } else {
                console.log('✏️ Editing existing node');
                this.editNodeText(clickedNode);
            }
        } else {
            console.log('➕ Creating new node at:', { x: canvasX - 100, y: canvasY - 50 });
            const newNode = this.canvasState.createNode('New Node', canvasX - 100, canvasY - 50);
            console.log('🎉 New node created:', newNode);
        }
    }
    
    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width && 
               y >= rect.y && y <= rect.y + rect.height;
    }
    
    handleKeyDown(e) {
        console.log('⌨️ Key pressed:', e.key, 'Selected nodes:', this.canvasState.selectedNodes.length, 'Selected connection:', this.canvasState.selectedConnection ? this.canvasState.selectedConnection.id : 'none');
        
        // Support both Delete and Backspace keys for deletion
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // Delete selected connection first if any
            if (this.canvasState.selectedConnection) {
                console.log('🗑️ Deleting connection:', this.canvasState.selectedConnection.id);
                this.canvasState.deleteConnection(this.canvasState.selectedConnection);
                e.preventDefault();
                return;
            }
            
            // Then delete selected nodes
            if (this.canvasState.selectedNodes.length > 0) {
                console.log('🗑️ Deleting nodes:', this.canvasState.selectedNodes.map(n => n.id));
                
                // Create a copy of the array since we'll be modifying the original
                const nodesToDelete = [...this.canvasState.selectedNodes];
                nodesToDelete.forEach(node => {
                    this.canvasState.deleteNode(node);
                });
                
                console.log('✅ Nodes deleted. Remaining nodes:', this.canvasState.nodes.length);
                e.preventDefault();
            }
        }
        
        // Escape to cancel connection
        if (e.key === 'Escape' && this.isConnecting) {
            console.log('❌ Connection cancelled with Escape');
            this.isConnecting = false;
            this.connectionStart = null;
            this.connectionStartPoint = null;
            this.canvas.style.cursor = 'default';
            e.preventDefault();
        }
    }
    
    editNodeText(node) {
        // Create inline text editor positioned relative to the canvas
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Calculate screen position accounting for canvas transform
        const screenX = canvasRect.left + (node.x + this.canvasState.offsetX) * this.canvasState.scale;
        const screenY = canvasRect.top + (node.y + this.canvasState.offsetY) * this.canvasState.scale;
        const screenWidth = node.width * this.canvasState.scale;
        const screenHeight = node.height * this.canvasState.scale;
        
        // Create textarea for multiline editing
        const textarea = document.createElement('textarea');
        textarea.value = node.text || '';
        textarea.style.cssText = `
            position: absolute;
            left: ${screenX}px;
            top: ${screenY}px;
            width: ${screenWidth}px;
            height: ${screenHeight}px;
            z-index: 1000;
            background-color: var(--vscode-input-background, #3c3c3c);
            color: var(--vscode-input-foreground, #cccccc);
            border: 2px solid var(--vscode-focusBorder, #007fd4);
            border-radius: 8px;
            padding: 8px;
            font-size: 14px;
            font-family: var(--vscode-font-family, 'Segoe UI');
            resize: none;
            outline: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        // Set editing state
        node.isEditing = true;
        this.canvasState.notifyStateChange();
        
        const finishEditing = async () => {
            if (document.body.contains(textarea)) {
                node.text = textarea.value || 'New Node';
                node.isEditing = false;
                document.body.removeChild(textarea);
                
                // Force immediate save to VS Code like file nodes do
                await this.canvasState.saveCanvasState();
                console.log('✏️ Node text updated to:', node.text);
            }
        };
        
        const cancelEditing = () => {
            if (document.body.contains(textarea)) {
                node.isEditing = false;
                document.body.removeChild(textarea);
                this.canvasState.notifyStateChange();
            }
        };
        
        textarea.addEventListener('keydown', (e) => {
            // Always stop propagation to prevent canvas-level key handlers
            e.stopPropagation();
            
            if (e.key === 'Enter' && e.ctrlKey) {
                // Ctrl+Enter to save
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                // Escape to cancel
                e.preventDefault();
                cancelEditing();
            } else if (e.key === 'Tab') {
                // Handle tab indentation
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            }
            // Let all other keys (including Backspace/Delete) work normally in textarea
        });
        
        textarea.addEventListener('blur', finishEditing);
        
        // Auto-resize to fit content
        const autoResize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.max(screenHeight, textarea.scrollHeight) + 'px';
        };
        
        textarea.addEventListener('input', autoResize);
        setTimeout(autoResize, 0); // Initial resize
    }
    
    // Removed editFileNode - using simplified inline editor
    editFileNodeOld(fileNode) {
        console.log('📝 Starting file edit mode for:', fileNode.file);
        
        // Set editing state
        fileNode.isEditing = true;
        
        // Create editor container
        const editorContainer = document.createElement('div');
        editorContainer.style.position = 'absolute';
        editorContainer.style.left = (fileNode.x + 5) + 'px';
        editorContainer.style.top = (fileNode.y + 45) + 'px';
        editorContainer.style.width = (fileNode.width - 10) + 'px';
        editorContainer.style.height = (fileNode.height - 50) + 'px';
        editorContainer.style.zIndex = '1000';
        editorContainer.style.backgroundColor = '#2d2d2d';
        editorContainer.style.border = '2px solid #007fd4';
        editorContainer.style.borderRadius = '4px';
        editorContainer.className = 'markdown-editor-container';
        
        // No toolbar needed - keeping it simple
        
        // Add toolbar buttons
        const toolbarButtons = [
            { label: 'B', title: 'Bold', action: () => this.insertMarkdown(textarea, '**', '**') },
            { label: 'I', title: 'Italic', action: () => this.insertMarkdown(textarea, '*', '*') },
            { label: 'C', title: 'Code', action: () => this.insertMarkdown(textarea, '`', '`') },
            { label: 'H1', title: 'Header 1', action: () => this.insertMarkdown(textarea, '# ', '') },
            { label: 'H2', title: 'Header 2', action: () => this.insertMarkdown(textarea, '## ', '') },
            { label: '•', title: 'List', action: () => this.insertMarkdown(textarea, '- ', '') },
            { label: '>', title: 'Quote', action: () => this.insertMarkdown(textarea, '> ', '') },
            { label: '---', title: 'Horizontal Rule', action: () => this.insertMarkdown(textarea, '\n---\n', '') }
        ];
        
        toolbarButtons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.label;
            button.title = btn.title;
            button.style.backgroundColor = '#4a4a4a';
            button.style.color = '#cccccc';
            button.style.border = '1px solid #666';
            button.style.borderRadius = '3px';
            button.style.padding = '4px 8px';
            button.style.cursor = 'pointer';
            button.style.fontSize = '11px';
            button.style.fontWeight = btn.label.startsWith('H') ? 'bold' : 'normal';
            
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#555';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '#4a4a4a';
            });
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                btn.action();
                textarea.focus();
            });
            
            toolbar.appendChild(button);
        });
        
        // Add save/cancel buttons
        const separator = document.createElement('div');
        separator.style.width = '1px';
        separator.style.height = '20px';
        separator.style.backgroundColor = '#666';
        separator.style.margin = '0 8px';
        toolbar.appendChild(separator);
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '💾 Save';
        saveBtn.title = 'Save (Ctrl/Cmd+Enter)';
        saveBtn.style.backgroundColor = '#0e7490';
        saveBtn.style.color = 'white';
        saveBtn.style.border = '1px solid #0891b2';
        saveBtn.style.borderRadius = '3px';
        saveBtn.style.padding = '4px 8px';
        saveBtn.style.cursor = 'pointer';
        saveBtn.style.fontSize = '11px';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '❌ Cancel';
        cancelBtn.title = 'Cancel (Escape)';
        cancelBtn.style.backgroundColor = '#dc2626';
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = '1px solid #ef4444';
        cancelBtn.style.borderRadius = '3px';
        cancelBtn.style.padding = '4px 8px';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.fontSize = '11px';
        cancelBtn.style.marginLeft = '4px';
        
        toolbar.appendChild(saveBtn);
        toolbar.appendChild(cancelBtn);
        
        // Create textarea
        const textarea = document.createElement('textarea');
        textarea.value = fileNode.content || '';
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.boxSizing = 'border-box';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.backgroundColor = '#2d2d2d';
        textarea.style.color = '#cccccc';
        textarea.style.padding = '12px';
        textarea.style.fontSize = '12px';
        textarea.style.fontFamily = 'Consolas, monospace';
        textarea.style.lineHeight = '1.4';
        textarea.placeholder = 'Enter markdown content...\n\nTip: Ctrl+Enter to save, Esc to cancel';
        
        // Assemble simple editor (no toolbar)
        editorContainer.appendChild(textarea);
        document.body.appendChild(editorContainer);
        
        // Focus and select
        textarea.focus();
        if (textarea.value) {
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
        
        const finishEditing = async () => {
            const newContent = textarea.value;
            fileNode.isEditing = false;
            
            // Save content
            await this.canvasState.saveFileContent(fileNode, newContent);
            
            document.body.removeChild(editorContainer);
            console.log('💾 File editing completed for:', fileNode.file);
        };
        
        const cancelEditing = () => {
            fileNode.isEditing = false;
            document.body.removeChild(editorContainer);
            console.log('❌ File editing cancelled for:', fileNode.file);
        };
        
        // Simple keyboard-only controls
        
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelEditing();
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                // Ctrl/Cmd + Enter to save
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Tab') {
                // Handle tab for indentation
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            }
        });
        
        // Close editor when clicking outside
        document.addEventListener('click', function closeEditor(e) {
            if (!editorContainer.contains(e.target)) {
                document.removeEventListener('click', closeEditor);
                finishEditing();
            }
        });
    }
    
    // insertMarkdown function removed - simplified editor doesn't need it
    
    // New simplified editor function
    editFileNodeSimple(fileNode) {
        console.log('📝 Starting simple edit mode for:', fileNode.file);
        
        // Set editing state
        fileNode.isEditing = true;
        
        // Create simple editor container with proper canvas coordinates
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Calculate screen position accounting for canvas transform (content area only)
        const screenX = canvasRect.left + (fileNode.x + 5) * this.canvasState.scale + this.canvasState.offsetX;
        const screenY = canvasRect.top + (fileNode.y + 45) * this.canvasState.scale + this.canvasState.offsetY; // +45 for header
        const screenWidth = (fileNode.width - 10) * this.canvasState.scale;
        const screenHeight = (fileNode.height - 50) * this.canvasState.scale; // -50 for header + padding
        
        const editorContainer = document.createElement('div');
        editorContainer.style.position = 'absolute';
        editorContainer.style.left = screenX + 'px';
        editorContainer.style.top = screenY + 'px';
        editorContainer.style.width = screenWidth + 'px';
        editorContainer.style.height = screenHeight + 'px';
        editorContainer.style.zIndex = '1000';
        editorContainer.style.backgroundColor = '#2d2d2d';
        editorContainer.style.border = '2px solid #007fd4';
        editorContainer.style.borderRadius = '4px';
        editorContainer.className = 'markdown-editor-container';
        
        // Create simple textarea (no toolbar)
        const textarea = document.createElement('textarea');
        textarea.value = fileNode.content || '';
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.backgroundColor = '#1e1e1e';
        textarea.style.color = '#cccccc';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.padding = '12px';
        textarea.style.fontSize = '13px';
        textarea.style.fontFamily = 'Consolas, monospace';
        textarea.style.lineHeight = '1.4';
        textarea.style.resize = 'none';
        textarea.style.boxSizing = 'border-box';
        textarea.placeholder = 'Enter markdown content...\n\nTip: Ctrl+Enter to save, Esc to cancel';
        
        // Add textarea to container
        editorContainer.appendChild(textarea);
        document.body.appendChild(editorContainer);
        
        // Focus and select
        textarea.focus();
        if (textarea.value) {
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
        
        const finishEditing = async () => {
            const newContent = textarea.value;
            fileNode.isEditing = false;
            
            // Save content
            await this.canvasState.saveFileContent(fileNode, newContent);
            
            document.body.removeChild(editorContainer);
            console.log('💾 File editing completed for:', fileNode.file);
        };
        
        const cancelEditing = () => {
            fileNode.isEditing = false;
            document.body.removeChild(editorContainer);
            console.log('❌ File editing cancelled for:', fileNode.file);
        };
        
        // Simple keyboard shortcuts
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelEditing();
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                // Ctrl/Cmd + Enter to save
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Tab') {
                // Handle tab for indentation
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            }
        });
        
        // Close editor when clicking outside
        document.addEventListener('click', function closeEditor(e) {
            if (!editorContainer.contains(e.target)) {
                document.removeEventListener('click', closeEditor);
                finishEditing();
            }
        });
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to canvas coordinates
        const canvasX = (mouseX - this.canvasState.offsetX) / this.canvasState.scale;
        const canvasY = (mouseY - this.canvasState.offsetY) / this.canvasState.scale;
        
        console.log('📍 Drop position:', { canvasX, canvasY });
        
        // Handle VS Code drag and drop (from sidebar/explorer)
        if (e.dataTransfer && e.dataTransfer.getData) {
            // Try to get VS Code file data
            const vsCodeData = e.dataTransfer.getData('text/plain');
            console.log('📋 Drop data:', vsCodeData);
            
            if (vsCodeData) {
                // Check if it's a file path
                if (vsCodeData.endsWith('.md') || vsCodeData.includes('/')) {
                    this.createFileNodeFromPath(vsCodeData, canvasX, canvasY);
                    return;
                }
            }
        }
        
        // Handle file drops from file system
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            console.log('📁 Dropped files:', files);
            
            files.forEach((file, index) => {
                if (file.name.endsWith('.md') || file.type === 'text/markdown') {
                    // For file system drops, we need to prompt for workspace-relative path
                    this.promptForFileImport(file, canvasX + (index * 50), canvasY + (index * 50));
                }
            });
        }
    }
    
    createFileNodeFromPath(filePath, x, y) {
        console.log('📄 Creating file node from path:', filePath);
        
        // Store both the relative path and display name
        let displayName = filePath;
        let relativeFilePath = filePath;
        
        if (filePath.startsWith('/')) {
            // For absolute paths, convert to relative path from common base directories
            const pathParts = filePath.split('/');
            displayName = pathParts[pathParts.length - 1];
            
            // Try to find a relative path from common base directories
            const commonBases = [
                '/Users/lout/Documents/LIFE/input_output/research_input_output',
                '/Users/lout/Documents/LIFE/input_output/output/applications/03_level_active_development/infinite_canvas1/infinite_canvas_v5_vscode'
            ];
            
            for (const basePath of commonBases) {
                if (filePath.startsWith(basePath)) {
                    relativeFilePath = filePath.substring(basePath.length + 1); // +1 to remove leading slash
                    console.log('📍 Converted absolute path to relative:', relativeFilePath);
                    break;
                }
            }
            
            // If no common base found, store the absolute path
            if (relativeFilePath === filePath) {
                relativeFilePath = filePath;
                console.log('📍 Using absolute path as fallback:', relativeFilePath);
            }
        }
        
        const fileNode = this.canvasState.createFileNode(relativeFilePath, x, y);
        // Store the full path for debugging
        fileNode.fullPath = filePath;
        console.log('✅ File node created:', fileNode.id, 'with relative path:', relativeFilePath, 'full path:', filePath);
    }
    
    promptForFileImport(file, x, y) {
        console.log('📥 Prompting for file import:', file.name);
        
        // Create a simple input overlay for the relative path
        const input = document.createElement('input');
        input.type = 'text';
        input.value = file.name;
        input.placeholder = 'Enter workspace-relative path (e.g., docs/myfile.md)';
        input.style.position = 'absolute';
        input.style.left = x + 'px';
        input.style.top = y + 'px';
        input.style.zIndex = '1000';
        input.style.backgroundColor = '#3c3c3c';
        input.style.color = '#cccccc';
        input.style.border = '2px solid #007fd4';
        input.style.padding = '8px';
        input.style.fontSize = '14px';
        input.style.width = '300px';
        
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        const finishImport = async () => {
            const relativePath = input.value.trim();
            if (relativePath) {
                // Read file content and create file in workspace
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const content = e.target.result;
                    
                    // Send file creation request to VS Code
                    if (window.vsCodeAPI) {
                        window.vsCodeAPI.postMessage({
                            type: 'createFile',
                            filePath: relativePath,
                            content: content
                        });
                    }
                    
                    // Create file node
                    this.createFileNodeFromPath(relativePath, x, y);
                };
                reader.readAsText(file);
            }
            document.body.removeChild(input);
        };
        
        const cancelImport = () => {
            document.body.removeChild(input);
        };
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishImport();
            } else if (e.key === 'Escape') {
                cancelImport();
            }
        });
        
        input.addEventListener('blur', finishImport);
    }
    
    // Connection point detection
    getConnectionPoints(node) {
        const { x, y, width, height } = node;
        return [
            { x: x + width / 2, y: y, side: 'top' },           // Top
            { x: x + width, y: y + height / 2, side: 'right' }, // Right
            { x: x + width / 2, y: y + height, side: 'bottom' }, // Bottom
            { x: x, y: y + height / 2, side: 'left' }          // Left
        ];
    }
    
    getConnectionPointAt(node, x, y) {
        const points = this.getConnectionPoints(node);
        const pointRadius = 16; // Detection radius
        
        for (const point of points) {
            const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (distance <= pointRadius) {
                return point;
            }
        }
        return null;
    }
    
    getConnectionAtPoint(x, y, tolerance = 8) {
        for (const connection of this.canvasState.connections) {
            const fromNode = this.canvasState.nodes.find(n => n.id === connection.from);
            const toNode = this.canvasState.nodes.find(n => n.id === connection.to);
            
            if (!fromNode || !toNode) continue;
            
            // Get connection points
            const fromPoints = this.getConnectionPoints(fromNode);
            const toPoints = this.getConnectionPoints(toNode);
            
            // Find best connection points
            let bestFromPoint = fromPoints[0];
            let bestToPoint = toPoints[0];
            
            if (connection.fromSide && connection.toSide) {
                bestFromPoint = fromPoints.find(p => p.side === connection.fromSide) || fromPoints[0];
                bestToPoint = toPoints.find(p => p.side === connection.toSide) || toPoints[0];
            } else {
                // Find closest points
                let shortestDistance = Infinity;
                fromPoints.forEach(fromPoint => {
                    toPoints.forEach(toPoint => {
                        const distance = Math.sqrt(
                            Math.pow(fromPoint.x - toPoint.x, 2) + 
                            Math.pow(fromPoint.y - toPoint.y, 2)
                        );
                        if (distance < shortestDistance) {
                            shortestDistance = distance;
                            bestFromPoint = fromPoint;
                            bestToPoint = toPoint;
                        }
                    });
                });
            }
            
            // Check if point is close to the line
            const distance = this.distanceToLineSegment(x, y, bestFromPoint.x, bestFromPoint.y, bestToPoint.x, bestToPoint.y);
            if (distance <= tolerance) {
                return connection;
            }
        }
        return null;
    }
    
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        
        return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
    }
    
    setRenderCallback(callback) {
        this.requestRender = callback;
        console.log('🎨 Render callback set for InputHandler');
    }
}

// Simplified Canvas Renderer
class CanvasRenderer {
    render(ctx, canvas, canvasState, inputHandler) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save context
        ctx.save();
        
        // Apply transformations
        ctx.translate(canvasState.offsetX, canvasState.offsetY);
        ctx.scale(canvasState.scale, canvasState.scale);
        
        // Draw grid
        this.drawGrid(ctx, canvasState, canvas);
        
        // Draw connections first (behind nodes)
        canvasState.connections.forEach(connection => {
            const isSelected = canvasState.selectedConnection && canvasState.selectedConnection.id === connection.id;
            this.drawConnection(ctx, connection, canvasState.nodes, isSelected);
        });
        
        // Draw nodes
        canvasState.nodes.forEach(node => {
            const showConnectionPoints = node.isSelected || 
                (inputHandler.hoveredNode === node && inputHandler.hoveredConnectionPoint) ||
                inputHandler.isConnecting;
            
            if (node.type === 'file') {
                this.drawFileNode(ctx, node, showConnectionPoints, inputHandler);
            } else {
                this.drawNode(ctx, node, showConnectionPoints, inputHandler);
            }
        });
        
        // Draw connection preview if connecting
        if (inputHandler.isConnecting && inputHandler.connectionStart) {
            this.drawConnectionPreview(
                ctx,
                inputHandler.connectionStart,
                inputHandler.lastMouseX || 0,
                inputHandler.lastMouseY || 0,
                canvasState.offsetX,
                canvasState.offsetY,
                canvasState.scale,
                inputHandler.connectionStartPoint
            );
        }
        
        // Restore context
        ctx.restore();
    }
    
    drawGrid(ctx, canvasState, canvas) {
        const gridSize = 50;
        const startX = -canvasState.offsetX / canvasState.scale;
        const startY = -canvasState.offsetY / canvasState.scale;
        const endX = startX + canvas.width / canvasState.scale;
        const endY = startY + canvas.height / canvasState.scale;
        
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1 / canvasState.scale;
        ctx.beginPath();
        
        // Vertical lines
        for (let x = Math.floor(startX / gridSize) * gridSize; x <= endX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        
        // Horizontal lines
        for (let y = Math.floor(startY / gridSize) * gridSize; y <= endY; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        
        ctx.stroke();
    }
    
    drawNode(ctx, node, showConnectionPoints = false, inputHandler = null) {
        // Skip rendering if node is being edited (text editor overlay is shown)
        if (node.isEditing && node.type !== 'file') {
            return;
        }
        
        // Ensure scrollY is defined
        if (node.scrollY === undefined) {
            node.scrollY = 0;
        }
        
        // Draw background
        ctx.fillStyle = node.backgroundColor;
        ctx.fillRect(node.x, node.y, node.width, node.height);
        
        // Draw border
        ctx.strokeStyle = node.isSelected ? '#007fd4' : node.borderColor;
        ctx.lineWidth = node.isSelected ? 2 : 1;
        ctx.strokeRect(node.x, node.y, node.width, node.height);
        
        // Draw AI model badge if node was created by AI
        if (node.aiModel) {
            this.drawAIModelBadge(ctx, node);
        }
        
        // Set up clipping region for text content
        ctx.save();
        ctx.beginPath();
        ctx.rect(node.x + 2, node.y + 2, node.width - 4, node.height - 4);
        ctx.clip();
        
        // Draw text with scrolling
        ctx.fillStyle = node.textColor;
        ctx.font = '14px Segoe UI, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Wrap text into lines
        const words = node.text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            const width = ctx.measureText(testLine).width;
            if (width < node.width - 20) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        // Calculate total content height
        const lineHeight = 18;
        const padding = 10;
        const totalContentHeight = lines.length * lineHeight + padding * 2;
        
        // Store content dimensions for scrolling
        node._contentHeight = totalContentHeight;
        node._maxScroll = Math.max(0, totalContentHeight - node.height);
        
        // Clamp scroll position
        node.scrollY = Math.max(0, Math.min(node.scrollY, node._maxScroll));
        
        // Draw lines with scroll offset
        const startY = node.y + padding - node.scrollY;
        
        lines.forEach((line, index) => {
            const lineY = startY + index * lineHeight;
            // Only draw lines that are visible in the viewport
            if (lineY + lineHeight >= node.y && lineY <= node.y + node.height) {
                ctx.fillText(
                    line,
                    node.x + 10,
                    lineY
                );
            }
        });
        
        ctx.restore();
        
        // Draw scrollbar if content overflows
        if (node._maxScroll > 0) {
            this.drawScrollbar(ctx, node);
        }
        
        // Draw connection points if requested
        if (showConnectionPoints) {
            this.drawConnectionPoints(ctx, node, inputHandler);
        }
        
        // Draw resize handles if node is selected
        if (node.isSelected) {
            this.drawResizeHandles(ctx, node);
        }
    }
    
    drawAIModelBadge(ctx, node) {
        if (!node.aiModel) return;
        
        // Use the full model name as stored from AI generation
        const modelName = node.aiModel;
        
        // Measure text to size badge
        ctx.save();
        ctx.font = '9px Segoe UI, sans-serif';
        const textWidth = ctx.measureText(`🤖 ${modelName}`).width;
        
        // Badge dimensions
        const badgeWidth = textWidth + 12;
        const badgeHeight = 16;
        const badgeX = node.x + node.width - badgeWidth - 8;
        const badgeY = node.y - badgeHeight - 4;
        
        // Draw badge background with rounded corners effect
        ctx.fillStyle = 'rgba(79, 195, 247, 0.9)'; // Light blue with transparency
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
        
        // Draw badge border
        ctx.strokeStyle = '#29b6f6';
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
        
        // Draw badge text
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🤖 ${modelName}`, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
        
        ctx.restore();
    }

    drawScrollbar(ctx, node) {
        if (!node._maxScroll || node._maxScroll <= 0) return;
        
        const scrollbarWidth = 8;
        const scrollbarX = node.x + node.width - scrollbarWidth - 2;
        const scrollbarY = node.y + 2;
        const scrollbarHeight = node.height - 4;
        
        // Draw scrollbar track
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight);
        
        // Calculate thumb position and size
        const contentRatio = node.height / node._contentHeight;
        const thumbHeight = Math.max(20, scrollbarHeight * contentRatio);
        const scrollRatio = node.scrollY / node._maxScroll;
        const thumbY = scrollbarY + (scrollbarHeight - thumbHeight) * scrollRatio;
        
        // Draw scrollbar thumb
        ctx.fillStyle = node.isSelected ? '#007fd4' : '#666';
        ctx.fillRect(scrollbarX + 1, thumbY, scrollbarWidth - 2, thumbHeight);
        
        // Store scrollbar bounds for interaction
        node._scrollbarBounds = {
            x: scrollbarX,
            y: scrollbarY,
            width: scrollbarWidth,
            height: scrollbarHeight,
            thumbY: thumbY,
            thumbHeight: thumbHeight
        };
    }
    
    drawResizeHandles(ctx, node) {
        const handleSize = 8;
        const handleColor = '#007fd4';
        const handleBorderColor = '#ffffff';
        
        // Define resize handle positions
        const handles = [
            // Corners
            { x: node.x - handleSize/2, y: node.y - handleSize/2, cursor: 'nw-resize', type: 'nw' },
            { x: node.x + node.width - handleSize/2, y: node.y - handleSize/2, cursor: 'ne-resize', type: 'ne' },
            { x: node.x - handleSize/2, y: node.y + node.height - handleSize/2, cursor: 'sw-resize', type: 'sw' },
            { x: node.x + node.width - handleSize/2, y: node.y + node.height - handleSize/2, cursor: 'se-resize', type: 'se' },
            // Edges
            { x: node.x + node.width/2 - handleSize/2, y: node.y - handleSize/2, cursor: 'n-resize', type: 'n' },
            { x: node.x + node.width/2 - handleSize/2, y: node.y + node.height - handleSize/2, cursor: 's-resize', type: 's' },
            { x: node.x - handleSize/2, y: node.y + node.height/2 - handleSize/2, cursor: 'w-resize', type: 'w' },
            { x: node.x + node.width - handleSize/2, y: node.y + node.height/2 - handleSize/2, cursor: 'e-resize', type: 'e' }
        ];
        
        // Store handle bounds for interaction
        node._resizeHandles = handles.map(handle => ({
            ...handle,
            width: handleSize,
            height: handleSize
        }));
        
        // Draw handles
        handles.forEach(handle => {
            // Draw handle background
            ctx.fillStyle = handleColor;
            ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
            
            // Draw handle border
            ctx.strokeStyle = handleBorderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });
    }
    
    drawFileNode(ctx, node, showConnectionPoints = false, inputHandler = null) {
        // Draw file node background
        ctx.fillStyle = node.backgroundColor;
        ctx.fillRect(node.x, node.y, node.width, node.height);
        
        // Draw border with file-specific styling
        ctx.strokeStyle = node.isSelected ? '#007fd4' : node.borderColor;
        ctx.lineWidth = node.isSelected ? 3 : 2;
        ctx.strokeRect(node.x, node.y, node.width, node.height);
        
        // Draw file header with filename
        const headerHeight = 40;
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(node.x, node.y, node.width, headerHeight);
        
        // Draw AI model badge if node was created by AI
        if (node.aiModel) {
            this.drawAIModelBadge(ctx, node);
        }
        
        // File icon and name
        ctx.fillStyle = '#f0f0f0';
        ctx.font = 'bold 14px Segoe UI, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        const fileName = node.file.split('/').pop() || node.file;
        const fileIcon = fileName.endsWith('.md') ? '📄' : '📋';
        
        ctx.fillText(`${fileIcon} ${fileName}`, node.x + 12, node.y + headerHeight / 2);
        
        // Draw edit button
        const editButtonX = node.x + node.width - 60;
        const editButtonY = node.y + 8;
        const editButtonWidth = 50;
        const editButtonHeight = 24;
        
        // Edit button background
        ctx.fillStyle = node.isEditing ? '#0e7490' : '#4a4a4a';
        ctx.fillRect(editButtonX, editButtonY, editButtonWidth, editButtonHeight);
        
        // Edit button border
        ctx.strokeStyle = node.isEditing ? '#0891b2' : '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(editButtonX, editButtonY, editButtonWidth, editButtonHeight);
        
        // Edit button text
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.isEditing ? 'Editing' : 'Edit', editButtonX + editButtonWidth / 2, editButtonY + editButtonHeight / 2 + 2);
        
        // Store edit button bounds for click detection
        node._editButtonBounds = {
            x: editButtonX,
            y: editButtonY,
            width: editButtonWidth,
            height: editButtonHeight
        };
        
        // Draw file path if different from name
        if (node.file !== fileName) {
            ctx.fillStyle = '#999999';
            ctx.font = '11px Segoe UI, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(node.file, node.x + 12, node.y + headerHeight - 8);
        }
        
        // Draw content area with scrolling support
        const contentY = node.y + headerHeight;
        const contentHeight = node.height - headerHeight;
        
        // Ensure scrollY is defined for file nodes
        if (node.scrollY === undefined) {
            node.scrollY = 0;
        }
        
        // Set up clipping region for content area
        ctx.save();
        ctx.beginPath();
        ctx.rect(node.x + 2, contentY + 2, node.width - 4, contentHeight - 4);
        ctx.clip();
        
        if (node.isEditing) {
            // Draw editing indicator
            ctx.fillStyle = '#264653';
            ctx.fillRect(node.x, contentY, node.width, contentHeight);
            
            ctx.fillStyle = '#2a9d8f';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✏️ Editing...', node.x + node.width / 2, contentY + contentHeight / 2);
        } else if (!node.isContentLoaded) {
            // Draw loading indicator
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(node.x, contentY, node.width, contentHeight);
            
            ctx.fillStyle = '#cccccc';
            ctx.font = '14px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Loading...', node.x + node.width / 2, contentY + contentHeight / 2);
        } else if (node.content) {
            // Draw content preview with scrolling
            ctx.fillStyle = '#2d2d2d';
            ctx.fillRect(node.x, contentY, node.width, contentHeight);
            
            // Calculate content dimensions for scrolling
            const padding = 10;
            const contentStartY = contentY + padding - node.scrollY;
            
            // Draw the markdown content with scroll offset
            const actualContentHeight = this.drawMarkdownPreview(
                ctx, 
                node.content, 
                node.x + padding, 
                contentStartY, 
                node.width - padding * 2, 
                contentHeight + node.scrollY // Extend available height for scrolled content
            );
            
            // Store content dimensions for scrolling
            node._contentHeight = actualContentHeight + padding * 2;
            node._maxScroll = Math.max(0, node._contentHeight - contentHeight);
            
            // Clamp scroll position
            node.scrollY = Math.max(0, Math.min(node.scrollY, node._maxScroll));
        } else {
            // Draw error state
            ctx.fillStyle = '#4a1e1e';
            ctx.fillRect(node.x, contentY, node.width, contentHeight);
            
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '14px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠️ File not found', node.x + node.width / 2, contentY + contentHeight / 2);
        }
        
        ctx.restore();
        
        // Draw scrollbar for file content if needed
        if (node._maxScroll > 0) {
            this.drawFileScrollbar(ctx, node, headerHeight);
        }
        
        // Draw connection points if requested
        if (showConnectionPoints) {
            this.drawConnectionPoints(ctx, node, inputHandler);
        }
        
        // Draw resize handles if node is selected
        if (node.isSelected) {
            this.drawResizeHandles(ctx, node);
        }
    }
    
    drawFileScrollbar(ctx, node, headerHeight) {
        if (!node._maxScroll || node._maxScroll <= 0) return;
        
        const scrollbarWidth = 8;
        const contentY = node.y + headerHeight;
        const contentHeight = node.height - headerHeight;
        const scrollbarX = node.x + node.width - scrollbarWidth - 2;
        const scrollbarY = contentY + 2;
        const scrollbarHeight = contentHeight - 4;
        
        // Draw scrollbar track
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight);
        
        // Calculate thumb position and size
        const contentRatio = contentHeight / node._contentHeight;
        const thumbHeight = Math.max(20, scrollbarHeight * contentRatio);
        const scrollRatio = node.scrollY / node._maxScroll;
        const thumbY = scrollbarY + (scrollbarHeight - thumbHeight) * scrollRatio;
        
        // Draw scrollbar thumb
        ctx.fillStyle = node.isSelected ? '#007fd4' : '#666';
        ctx.fillRect(scrollbarX + 1, thumbY, scrollbarWidth - 2, thumbHeight);
        
        // Store scrollbar bounds for interaction (reuse existing logic)
        node._scrollbarBounds = {
            x: scrollbarX,
            y: scrollbarY,
            width: scrollbarWidth,
            height: scrollbarHeight,
            thumbY: thumbY,
            thumbHeight: thumbHeight
        };
    }
    
    drawMarkdownPreview(ctx, content, x, y, maxWidth, maxHeight) {
        try {
            // Use the preloaded markdown renderer if available
            if (this.markdownRenderer && this.parseMarkdown) {
                const tokens = this.parseMarkdown(content);
                return this.markdownRenderer.render(ctx, tokens, x, y, maxWidth, maxHeight);
            } else {
                // Fallback if renderer not yet loaded - do this silently to avoid spam
                return this.renderSimpleMarkdownFallback(ctx, content, x, y, maxWidth, maxHeight);
            }
        } catch (error) {
            // Only log once to avoid console spam
            if (!this._markdownErrorLogged) {
                console.warn('Failed to render markdown, using fallback preview:', error.message);
                this._markdownErrorLogged = true;
            }
            return this.renderSimpleMarkdownFallback(ctx, content, x, y, maxWidth, maxHeight);
        }
    }
    
    renderSimpleMarkdownFallback(ctx, content, x, y, maxWidth, maxHeight) {
        // Fallback to simple rendering
        ctx.fillStyle = '#cccccc';
        ctx.font = '12px Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const lines = content.split('\n');
        const lineHeight = 16;
        const maxLines = Math.floor(maxHeight / lineHeight);
        const visibleLines = lines.slice(0, maxLines);
        
        let currentY = y;
        
        visibleLines.forEach((line) => {
            if (currentY + lineHeight > y + maxHeight) return;
            
            // Simple markdown styling
            let displayLine = line;
            let textColor = '#cccccc';
            let fontSize = '12px';
            let fontWeight = 'normal';
            
            // Headers
            if (line.startsWith('# ')) {
                textColor = '#4fc3f7';
                fontSize = '16px';
                fontWeight = 'bold';
                displayLine = line.substring(2);
            } else if (line.startsWith('## ')) {
                textColor = '#66bb6a';
                fontSize = '14px';
                fontWeight = 'bold';
                displayLine = line.substring(3);
            } else if (line.startsWith('### ')) {
                textColor = '#ffb74d';
                fontSize = '13px';
                fontWeight = 'bold';
                displayLine = line.substring(4);
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                textColor = '#ba68c8';
                displayLine = '• ' + line.substring(2);
            } else if (line.match(/^\d+\. /)) {
                textColor = '#ba68c8';
            }
            
            // Apply styling
            ctx.fillStyle = textColor;
            ctx.font = `${fontWeight} ${fontSize} Consolas, monospace`;
            
            // Wrap long lines instead of truncating
            const wrappedLines = this.wrapTextToLines(ctx, displayLine, maxWidth - 10);
            
            for (let j = 0; j < wrappedLines.length; j++) {
                if (currentY + lineHeight > y + maxHeight) break;
                
                ctx.fillText(wrappedLines[j], x, currentY);
                currentY += lineHeight;
            }
        });
        
        // Show "..." if content is truncated
        if (lines.length > maxLines) {
            ctx.fillStyle = '#999999';
            ctx.font = '12px Consolas, monospace';
            ctx.fillText('...', x, currentY);
        }
        
        return currentY - y;
    }
    
    // Helper function to wrap text into multiple lines
    wrapTextToLines(ctx, text, maxWidth) {
        if (!text || text.trim() === '') return [''];
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            const width = ctx.measureText(testLine).width;
            
            if (width < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }
    
    truncateText(ctx, text, maxWidth) {
        const metrics = ctx.measureText(text);
        if (metrics.width <= maxWidth) {
            return text;
        }
        
        // Binary search for the right length
        let start = 0;
        let end = text.length;
        let result = text;
        
        while (start <= end) {
            const mid = Math.floor((start + end) / 2);
            const testText = text.substring(0, mid) + '...';
            const testWidth = ctx.measureText(testText).width;
            
            if (testWidth <= maxWidth) {
                result = testText;
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }
        
        return result;
    }
    
    drawConnection(ctx, connection, nodes, isSelected = false) {
        const fromNode = nodes.find(n => n.id === connection.from) || connection.fromNode;
        const toNode = nodes.find(n => n.id === connection.to) || connection.toNode;
        
        if (!fromNode || !toNode) return;
        
        // Get connection points
        const fromPoints = this.getConnectionPoints(fromNode);
        const toPoints = this.getConnectionPoints(toNode);
        
        // Find best connection points
        let bestFromPoint = fromPoints[0];
        let bestToPoint = toPoints[0];
        
        if (connection.fromSide && connection.toSide) {
            bestFromPoint = fromPoints.find(p => p.side === connection.fromSide) || fromPoints[0];
            bestToPoint = toPoints.find(p => p.side === connection.toSide) || toPoints[0];
        } else {
            // Find closest points
            let shortestDistance = Infinity;
            fromPoints.forEach(fromPoint => {
                toPoints.forEach(toPoint => {
                    const distance = Math.sqrt(
                        Math.pow(fromPoint.x - toPoint.x, 2) + 
                        Math.pow(fromPoint.y - toPoint.y, 2)
                    );
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        bestFromPoint = fromPoint;
                        bestToPoint = toPoint;
                    }
                });
            });
        }
        
        // Calculate angle for arrow
        const angle = Math.atan2(bestToPoint.y - bestFromPoint.y, bestToPoint.x - bestFromPoint.x);
        const arrowOffset = 16;
        const arrowX = bestToPoint.x - Math.cos(angle) * arrowOffset;
        const arrowY = bestToPoint.y - Math.sin(angle) * arrowOffset;
        
        // Draw line with selection styling
        ctx.strokeStyle = isSelected ? '#2196f3' : '#569cd6';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.setLineDash(isSelected ? [5, 5] : []);
        
        ctx.beginPath();
        ctx.moveTo(bestFromPoint.x, bestFromPoint.y);
        ctx.lineTo(arrowX, arrowY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
        
        // Draw arrowhead
        this.drawArrowhead(ctx, arrowX, arrowY, angle, isSelected);
    }
    
    drawArrowhead(ctx, x, y, angle, isSelected = false) {
        const arrowLength = 18;
        const arrowAngle = Math.PI / 6;
        
        ctx.fillStyle = isSelected ? '#2196f3' : '#569cd6';
        ctx.strokeStyle = isSelected ? '#1565c0' : '#4f46e5';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x - arrowLength * Math.cos(angle - arrowAngle),
            y - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.lineTo(
            x - arrowLength * 0.6 * Math.cos(angle),
            y - arrowLength * 0.6 * Math.sin(angle)
        );
        ctx.lineTo(
            x - arrowLength * Math.cos(angle + arrowAngle),
            y - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    drawConnectionPoints(ctx, node, inputHandler) {
        const points = this.getConnectionPoints(node);
        const pointRadius = 12;
        
        points.forEach(point => {
            // Check if this point is being hovered
            const isHovered = inputHandler && inputHandler.hoveredConnectionPoint && 
                             inputHandler.hoveredConnectionPoint.side === point.side;
            
            const currentRadius = isHovered ? pointRadius + 4 : pointRadius;
            
            // Draw connection point with glow effect
            ctx.shadowColor = 'rgba(34, 197, 94, 0.8)';
            ctx.shadowBlur = isHovered ? 20 : 12;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Outer circle
            ctx.fillStyle = isHovered ? '#10b981' : '#22c55e';
            ctx.beginPath();
            ctx.arc(point.x, point.y, currentRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Inner circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(point.x, point.y, isHovered ? 4 : 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        });
    }
    
    drawConnectionPreview(ctx, connectionStart, lastMouseX, lastMouseY, offsetX, offsetY, scale, connectionPoint = null) {
        if (!connectionStart) return;
        
        const canvasX = (lastMouseX - offsetX) / scale;
        const canvasY = (lastMouseY - offsetY) / scale;
        
        // Use connection point if provided, otherwise use node center
        let fromX, fromY;
        if (connectionPoint) {
            fromX = connectionPoint.x;
            fromY = connectionPoint.y;
        } else {
            fromX = connectionStart.x + connectionStart.width / 2;
            fromY = connectionStart.y + connectionStart.height / 2;
        }
        
        // Draw dashed preview line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(canvasX, canvasY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
    }
    
    getConnectionPoints(node) {
        const { x, y, width, height } = node;
        return [
            { x: x + width / 2, y: y, side: 'top' },
            { x: x + width, y: y + height / 2, side: 'right' },
            { x: x + width / 2, y: y + height, side: 'bottom' },
            { x: x, y: y + height / 2, side: 'left' }
        ];
    }
}

// UI Manager for handling AI controls and notifications
class UIManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.activeModels = {};
        this.notifications = [];
    }
    
    setupUI() {
        this.createFloatingGenerateButton();
        this.createNotificationContainer();
        this.createConfigButton();
        this.createConfigPanel();
        console.log('🎨 UI Manager setup completed');
    }
    
    createFloatingGenerateButton() {
        // Create floating generate button (initially hidden)
        const generateBtn = document.createElement('button');
        generateBtn.id = 'floating-generate-btn';
        generateBtn.innerHTML = '✨ Generate';
        generateBtn.style.cssText = `
            position: absolute;
            padding: 8px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            z-index: 1000;
            display: none;
            transform: translateX(-50%);
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        generateBtn.addEventListener('mouseenter', () => {
            generateBtn.style.transform = 'translateX(-50%) translateY(-2px)';
            generateBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });
        
        generateBtn.addEventListener('mouseleave', () => {
            generateBtn.style.transform = 'translateX(-50%) translateY(0)';
            generateBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        });
        
        generateBtn.addEventListener('click', () => {
            if (this.canvas.aiManager) {
                this.canvas.aiManager.generateAI();
            } else {
                this.showNotification('AI functionality not available', 'error');
            }
        });
        
        document.body.appendChild(generateBtn);
        this.floatingGenerateBtn = generateBtn;
    }
    
    createConfigButton() {
        // Create config button in top-left corner
        const configBtn = document.createElement('button');
        configBtn.id = 'config-button';
        configBtn.innerHTML = '⚙️';
        configBtn.title = 'Configuration';
        configBtn.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 40px;
            height: 40px;
            background: rgba(45, 45, 45, 0.9);
            border: 1px solid #666;
            border-radius: 8px;
            color: #e0e0e0;
            font-size: 16px;
            cursor: pointer;
            z-index: 1001;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
        `;
        
        configBtn.addEventListener('mouseenter', () => {
            configBtn.style.background = 'rgba(60, 60, 60, 0.95)';
            configBtn.style.transform = 'scale(1.05)';
        });
        
        configBtn.addEventListener('mouseleave', () => {
            configBtn.style.background = 'rgba(45, 45, 45, 0.9)';
            configBtn.style.transform = 'scale(1)';
        });
        
        configBtn.addEventListener('click', () => {
            this.toggleConfigPanel();
        });
        
        document.body.appendChild(configBtn);
        this.configButton = configBtn;
    }
    
    createConfigPanel() {
        // Create configuration panel (initially hidden)
        const configPanel = document.createElement('div');
        configPanel.id = 'config-panel';
        configPanel.style.cssText = `
            position: fixed;
            top: 70px;
            left: 20px;
            background: rgba(45, 45, 45, 0.95);
            border: 1px solid #666;
            border-radius: 8px;
            padding: 16px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            min-width: 300px;
            max-width: 400px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: none;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        // Title
        const title = document.createElement('h3');
        title.textContent = '⚙️ AI Configuration';
        title.style.cssText = `
            margin: 0 0 16px 0;
            color: #e0e0e0;
            font-size: 16px;
            font-weight: 600;
            border-bottom: 1px solid #555;
            padding-bottom: 8px;
        `;
        
        // Base URL section
        const baseUrlSection = document.createElement('div');
        baseUrlSection.style.cssText = `margin-bottom: 16px;`;
        
        const baseUrlLabel = document.createElement('label');
        baseUrlLabel.textContent = 'Base URL:';
        baseUrlLabel.style.cssText = `
            display: block;
            color: #d0d0d0;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 4px;
        `;
        
        // Add preset buttons
        const presetsContainer = document.createElement('div');
        presetsContainer.style.cssText = `
            display: flex;
            gap: 4px;
            margin-bottom: 6px;
            flex-wrap: wrap;
        `;
        
        const presets = [
            { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
            { name: 'OpenAI', url: 'https://api.openai.com/v1' },
            { name: 'Local', url: 'http://localhost:1234/v1' }
        ];
        
        const baseUrlInput = document.createElement('input');
        baseUrlInput.type = 'text';
        baseUrlInput.id = 'base-url-input';
        baseUrlInput.value = localStorage.getItem('ai-base-url') || 'https://openrouter.ai/api/v1';
        baseUrlInput.placeholder = 'https://openrouter.ai/api/v1';
        baseUrlInput.style.cssText = `
            width: 100%;
            padding: 8px;
            background: rgba(30, 30, 30, 0.8);
            border: 1px solid #555;
            border-radius: 4px;
            color: #e0e0e0;
            font-size: 12px;
            box-sizing: border-box;
        `;
        
        presets.forEach(preset => {
            const presetBtn = document.createElement('button');
            presetBtn.textContent = preset.name;
            presetBtn.style.cssText = `
                padding: 2px 6px;
                background: rgba(50, 50, 50, 0.8);
                border: 1px solid #666;
                border-radius: 3px;
                color: #ccc;
                font-size: 10px;
                cursor: pointer;
            `;
            
            presetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                baseUrlInput.value = preset.url;
            });
            
            presetsContainer.appendChild(presetBtn);
        });
        
        // API Key section
        const apiKeySection = document.createElement('div');
        apiKeySection.style.cssText = `margin-bottom: 16px;`;
        
        const apiKeyLabel = document.createElement('label');
        apiKeyLabel.textContent = 'API Key:';
        apiKeyLabel.style.cssText = `
            display: block;
            color: #d0d0d0;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 4px;
        `;
        
        const apiKeyInput = document.createElement('input');
        apiKeyInput.type = 'password';
        apiKeyInput.id = 'api-key-input';
        apiKeyInput.value = localStorage.getItem('ai-api-key') || '';
        apiKeyInput.placeholder = 'Enter your API key';
        apiKeyInput.style.cssText = `
            width: 100%;
            padding: 8px;
            background: rgba(30, 30, 30, 0.8);
            border: 1px solid #555;
            border-radius: 4px;
            color: #e0e0e0;
            font-size: 12px;
            box-sizing: border-box;
        `;
        
        // AI Models section
        const modelsSection = document.createElement('div');
        modelsSection.style.cssText = `margin-bottom: 16px;`;
        
        const modelsLabel = document.createElement('label');
        modelsLabel.textContent = 'AI Models:';
        modelsLabel.style.cssText = `
            display: block;
            color: #d0d0d0;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 6px;
        `;
        
        // Models container
        const modelsContainer = document.createElement('div');
        modelsContainer.style.cssText = `
            background: rgba(30, 30, 30, 0.7);
            border: 1px solid #555;
            border-radius: 4px;
            padding: 8px;
            max-height: 120px;
            overflow-y: auto;
        `;
        
        // Add model input section
        const addModelSection = document.createElement('div');
        addModelSection.style.cssText = `
            display: flex;
            gap: 4px;
            margin-bottom: 6px;
            align-items: center;
        `;
        
        const modelInput = document.createElement('input');
        modelInput.type = 'text';
        modelInput.placeholder = 'e.g. openai/gpt-4o';
        modelInput.style.cssText = `
            flex: 1;
            padding: 4px 6px;
            background: rgba(50, 50, 50, 0.8);
            border: 1px solid #666;
            border-radius: 3px;
            color: #d0d0d0;
            font-size: 10px;
        `;
        
        const addButton = document.createElement('button');
        addButton.textContent = '+';
        addButton.style.cssText = `
            padding: 4px 8px;
            background: #667eea;
            border: none;
            border-radius: 3px;
            color: white;
            font-size: 10px;
            cursor: pointer;
            font-weight: bold;
        `;
        
        // Add models list container
        this.modelsListContainer = document.createElement('div');
        this.modelsListContainer.id = 'models-list-container';
        
        addButton.addEventListener('click', () => {
            const modelName = modelInput.value.trim();
            if (modelName) {
                this.addModel(modelName);
                modelInput.value = '';
            }
        });
        
        modelInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addButton.click();
            }
        });
        
        addModelSection.appendChild(modelInput);
        addModelSection.appendChild(addButton);
        modelsContainer.appendChild(addModelSection);
        modelsContainer.appendChild(this.modelsListContainer);
        
        modelsSection.appendChild(modelsLabel);
        modelsSection.appendChild(modelsContainer);
        
        // Initialize models
        this.initializeDefaultModels();
        this.refreshModelsList();
        
        // Controls Help section
        const controlsSection = document.createElement('div');
        controlsSection.style.cssText = `margin-bottom: 16px;`;
        
        const controlsLabel = document.createElement('label');
        controlsLabel.textContent = '🎮 Canvas Controls:';
        controlsLabel.style.cssText = `
            display: block;
            color: #d0d0d0;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 6px;
        `;
        
        // Controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = `
            background: rgba(30, 30, 30, 0.7);
            border: 1px solid #555;
            border-radius: 4px;
            padding: 8px;
            max-height: 180px;
            overflow-y: auto;
        `;
        
        // Create controls list
        const controlsList = [
            { category: 'Mouse Controls', items: [
                { action: 'Double-click empty area', description: 'Create new node' },
                { action: 'Double-click node', description: 'Edit node text' },
                { action: 'Click + drag node', description: 'Move node' },
                { action: 'Click + drag empty area', description: 'Pan canvas' },
                { action: 'Mouse wheel', description: 'Zoom in/out' },
                { action: 'Mouse wheel on node', description: 'Scroll node content' }
            ]},
            { category: 'Connections', items: [
                { action: 'Shift + click green circle', description: 'Start connection' },
                { action: 'Shift + drag to another node', description: 'Create connection' },
                { action: 'Click connection line', description: 'Select connection' }
            ]},
            { category: 'Node Editing', items: [
                { action: 'Click resize handles', description: 'Resize selected node' },
                { action: 'Drag + drop .md files', description: 'Create file nodes' },
                { action: 'Double-click file node', description: 'Edit file content' }
            ]},
            { category: 'Keyboard Shortcuts', items: [
                { action: 'Delete/Backspace', description: 'Delete selected nodes/connections' },
                { action: 'Escape', description: 'Cancel connection mode' },
                { action: 'Ctrl/Cmd + Enter', description: 'Save text (in edit mode)' },
                { action: 'Tab', description: 'Indent text (in edit mode)' }
            ]}
        ];
        
        controlsList.forEach(category => {
            // Category header
            const categoryHeader = document.createElement('div');
            categoryHeader.textContent = category.category;
            categoryHeader.style.cssText = `
                color: #4fc3f7;
                font-size: 11px;
                font-weight: 600;
                margin: 6px 0 4px 0;
                border-bottom: 1px solid #444;
                padding-bottom: 2px;
            `;
            if (category !== controlsList[0]) {
                categoryHeader.style.marginTop = '10px';
            }
            controlsContainer.appendChild(categoryHeader);
            
            // Category items
            category.items.forEach(item => {
                const controlItem = document.createElement('div');
                controlItem.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin: 2px 0;
                    padding: 2px 4px;
                    border-radius: 2px;
                    gap: 8px;
                `;
                
                const actionSpan = document.createElement('span');
                actionSpan.textContent = item.action;
                actionSpan.style.cssText = `
                    color: #ffb74d;
                    font-size: 10px;
                    font-weight: 500;
                    white-space: nowrap;
                    min-width: 120px;
                `;
                
                const descriptionSpan = document.createElement('span');
                descriptionSpan.textContent = item.description;
                descriptionSpan.style.cssText = `
                    color: #ccc;
                    font-size: 10px;
                    flex: 1;
                    text-align: right;
                `;
                
                controlItem.appendChild(actionSpan);
                controlItem.appendChild(descriptionSpan);
                controlsContainer.appendChild(controlItem);
            });
        });
        
        controlsSection.appendChild(controlsLabel);
        controlsSection.appendChild(controlsContainer);
        
        // Buttons section
        const buttonsSection = document.createElement('div');
        buttonsSection.style.cssText = `
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        `;
        
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.cssText = `
            padding: 6px 12px;
            background: #667eea;
            border: none;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
        `;
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 6px 12px;
            background: #666;
            border: none;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
        `;
        
        // Event handlers
        saveButton.addEventListener('click', () => {
            const baseUrl = baseUrlInput.value.trim();
            const apiKey = apiKeyInput.value.trim();
            
            if (baseUrl) {
                localStorage.setItem('ai-base-url', baseUrl);
            }
            if (apiKey) {
                localStorage.setItem('ai-api-key', apiKey);
            }
            
            this.showNotification('Configuration saved successfully!', 'success');
            this.toggleConfigPanel();
        });
        
        cancelButton.addEventListener('click', () => {
            // Reset to saved values
            baseUrlInput.value = localStorage.getItem('ai-base-url') || 'https://openrouter.ai/api/v1';
            apiKeyInput.value = localStorage.getItem('ai-api-key') || '';
            this.toggleConfigPanel();
        });
        
        // Assemble the panel
        baseUrlSection.appendChild(baseUrlLabel);
        baseUrlSection.appendChild(presetsContainer);
        baseUrlSection.appendChild(baseUrlInput);
        apiKeySection.appendChild(apiKeyLabel);
        apiKeySection.appendChild(apiKeyInput);
        buttonsSection.appendChild(cancelButton);
        buttonsSection.appendChild(saveButton);
        
        configPanel.appendChild(title);
        configPanel.appendChild(baseUrlSection);
        configPanel.appendChild(apiKeySection);
        configPanel.appendChild(modelsSection);
        configPanel.appendChild(controlsSection);
        configPanel.appendChild(buttonsSection);
        
        document.body.appendChild(configPanel);
        this.configPanel = configPanel;
    }
    
    toggleConfigPanel() {
        if (this.configPanel.style.display === 'none') {
            this.configPanel.style.display = 'block';
            this.configButton.style.background = 'rgba(60, 60, 60, 0.95)';
        } else {
            this.configPanel.style.display = 'none';
            this.configButton.style.background = 'rgba(45, 45, 45, 0.9)';
        }
    }
    
    // Removed old createModelSelectionPanel - models now managed in unified config panel
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notifications-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    updateModelSelection(model, isActive) {
        if (this.canvas.aiManager) {
            const activeModels = this.canvas.aiManager.activeModels;
            activeModels[model] = isActive;
            this.canvas.aiManager.setActiveModels(activeModels);
            console.log(`🔧 Model ${model} ${isActive ? 'enabled' : 'disabled'}`);
        }
    }
    
    // Model management helper methods
    getStoredModels() {
        const stored = localStorage.getItem('aiModels');
        return stored ? JSON.parse(stored) : null;
    }
    
    initializeDefaultModels() {
        const existing = this.getStoredModels();
        if (!existing) {
            // Use the same default models as AIManager - single source of truth
            const defaultModels = [
                'google/gemini-2.5-flash',
                'qwen/qwen3-235b-a22b-thinking-2507',
                'openai/gpt-4o',
                'anthropic/claude-3.5-sonnet'
            ];
            localStorage.setItem('aiModels', JSON.stringify(defaultModels));
        }
    }
    
    addModel(modelName) {
        const models = this.getStoredModels() || [];
        if (!models.includes(modelName)) {
            models.push(modelName);
            localStorage.setItem('aiModels', JSON.stringify(models));
            this.refreshModelsList();
            console.log(`✅ Added model: ${modelName}`);
        } else {
            console.log(`⚠️ Model already exists: ${modelName}`);
        }
    }
    
    removeModel(modelName) {
        const models = this.getStoredModels() || [];
        const index = models.indexOf(modelName);
        if (index > -1) {
            models.splice(index, 1);
            localStorage.setItem('aiModels', JSON.stringify(models));
            this.refreshModelsList();
            console.log(`🗑️ Removed model: ${modelName}`);
        }
    }
    
    refreshModelsList() {
        if (!this.modelsListContainer) return;
        
        // Clear existing models
        this.modelsListContainer.innerHTML = '';
        
        const models = this.getStoredModels() || [];
        models.forEach(model => {
            const modelDiv = document.createElement('div');
            modelDiv.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 4px;
                padding: 2px;
                background: rgba(40, 40, 40, 0.5);
                border-radius: 3px;
            `;
            
            const leftSection = document.createElement('div');
            leftSection.style.cssText = `
                display: flex;
                align-items: center;
                flex: 1;
            `;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `model-${model}`;
            checkbox.checked = true; // Default to checked
            checkbox.style.cssText = `
                margin-right: 6px;
                accent-color: #667eea;
            `;
            
            const label = document.createElement('label');
            label.htmlFor = `model-${model}`;
            label.textContent = model.split('/')[1] || model; // Show model name after slash
            label.style.cssText = `
                color: #d0d0d0;
                font-size: 10px;
                cursor: pointer;
                user-select: none;
                flex: 1;
            `;
            
            checkbox.addEventListener('change', () => {
                this.updateModelSelection(model, checkbox.checked);
            });
            
            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.style.cssText = `
                background: #ff4444;
                border: none;
                border-radius: 2px;
                color: white;
                width: 16px;
                height: 16px;
                font-size: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 4px;
            `;
            
            removeBtn.addEventListener('click', () => {
                this.removeModel(model);
            });
            
            leftSection.appendChild(checkbox);
            leftSection.appendChild(label);
            modelDiv.appendChild(leftSection);
            modelDiv.appendChild(removeBtn);
            this.modelsListContainer.appendChild(modelDiv);
        });
    }
    
    updateFloatingButton() {
        if (!this.floatingGenerateBtn) return;
        
        const selectedNodes = this.canvas.canvasState.selectedNodes;
        
        if (selectedNodes.length === 1) {
            // Show button above the selected node
            const node = selectedNodes[0];
            const canvasRect = this.canvas.canvas.getBoundingClientRect();
            
            // Calculate position in screen coordinates - fix coordinate calculation
            const screenX = canvasRect.left + (node.x + node.width / 2) * this.canvas.canvasState.scale + this.canvas.canvasState.offsetX;
            const screenY = canvasRect.top + (node.y - 40) * this.canvas.canvasState.scale + this.canvas.canvasState.offsetY;
            
            // Ensure button stays within viewport bounds
            const buttonWidth = 120; // approximate button width
            const clampedX = Math.max(buttonWidth / 2, Math.min(window.innerWidth - buttonWidth / 2, screenX));
            const clampedY = Math.max(50, screenY); // Keep 50px from top
            
            this.floatingGenerateBtn.style.left = `${clampedX}px`;
            this.floatingGenerateBtn.style.top = `${clampedY}px`;
            this.floatingGenerateBtn.style.display = 'block';
            
            // Add generating state visual feedback
            if (node.isGeneratingAI) {
                this.floatingGenerateBtn.innerHTML = '⏳ Generating...';
                this.floatingGenerateBtn.style.opacity = '0.7';
                this.floatingGenerateBtn.style.cursor = 'not-allowed';
            } else {
                this.floatingGenerateBtn.innerHTML = '✨ Generate';
                this.floatingGenerateBtn.style.opacity = '1';
                this.floatingGenerateBtn.style.cursor = 'pointer';
            }
        } else {
            // Hide button when no single node is selected
            this.floatingGenerateBtn.style.display = 'none';
        }
    }
    
    hideFloatingButton() {
        if (this.floatingGenerateBtn) {
            this.floatingGenerateBtn.style.display = 'none';
        }
    }
    
    updateGenerateIdeasTooltip() {
        // This method exists in the original AIManager for compatibility
        // Update the floating button state
        this.updateFloatingButton();
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 10px;
            max-width: 300px;
            font-size: 13px;
            line-height: 1.4;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            cursor: pointer;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation keyframes
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(-100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(-100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.textContent = message;
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        const container = document.getElementById('notifications-container');
        if (container) {
            container.appendChild(notification);
            
            // Auto-remove after duration
            if (duration > 0) {
                setTimeout(() => {
                    this.removeNotification(notification);
                }, duration);
            }
        }
        
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
    
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
    
    getNotificationColor(type) {
        switch (type) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'info':
            default: return '#3b82f6';
        }
    }
}