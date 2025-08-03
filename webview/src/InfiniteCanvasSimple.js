// Simplified Infinite Canvas for VS Code Extension
// Core functionality without complex AI integrations

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
        
        console.log('📊 Canvas state created:', this.canvasState);
        console.log('🖱️ Input handler created:', this.inputHandler);
        
        // Set up canvas
        this.setupCanvas();
        this.startRenderLoop();
        
        console.log('✅ Infinite Canvas initialized successfully');
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
        this.render();
    }
    
    startRenderLoop() {
        const render = () => {
            this.render();
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }
    
    render() {
        this.renderer.render(this.ctx, this.canvas, this.canvasState, this.inputHandler);
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
            text: text,
            x: x,
            y: y,
            width: 200,
            height: 100,
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
    
    createConnection(fromNode, toNode) {
        const connection = {
            id: `conn_${Date.now()}`,
            from: fromNode.id,
            to: toNode.id,
            fromNode: fromNode,
            toNode: toNode
        };
        
        this.connections.push(connection);
        this.notifyStateChange();
        return connection;
    }
    
    selectNode(node) {
        this.clearSelection();
        node.isSelected = true;
        this.selectedNodes = [node];
    }
    
    clearSelection() {
        this.nodes.forEach(node => node.isSelected = false);
        this.selectedNodes = [];
        this.selectedConnection = null;
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
        return {
            version: "1.0",
            canvas: {
                viewport: {
                    x: this.offsetX,
                    y: this.offsetY,
                    zoom: this.scale
                },
                elements: this.nodes.map(node => ({
                    id: node.id,
                    type: 'text-node',
                    position: { x: node.x, y: node.y },
                    size: { width: node.width, height: node.height },
                    content: node.text,
                    style: {
                        backgroundColor: node.backgroundColor,
                        textColor: node.textColor,
                        borderColor: node.borderColor
                    }
                })),
                connections: this.connections.map(conn => ({
                    id: conn.id,
                    from: conn.from,
                    to: conn.to
                }))
            }
        };
    }
    
    loadCanvasData(data) {
        try {
            if (!data || !data.canvas) return;
            
            // Load viewport
            if (data.canvas.viewport) {
                this.offsetX = data.canvas.viewport.x || 0;
                this.offsetY = data.canvas.viewport.y || 0;
                this.scale = data.canvas.viewport.zoom || 1;
            }
            
            // Load nodes
            this.nodes = [];
            this.nodeCounter = 0;
            
            if (data.canvas.elements) {
                data.canvas.elements.forEach(element => {
                    const node = {
                        id: element.id || `node_${++this.nodeCounter}`,
                        text: element.content || 'New Node',
                        x: element.position?.x || 100,
                        y: element.position?.y || 100,
                        width: element.size?.width || 200,
                        height: element.size?.height || 100,
                        isSelected: false,
                        backgroundColor: element.style?.backgroundColor || '#3c3c3c',
                        textColor: element.style?.textColor || '#cccccc',
                        borderColor: element.style?.borderColor || '#414141'
                    };
                    this.nodes.push(node);
                    
                    // Update counter to avoid ID conflicts
                    const nodeNum = parseInt(node.id.replace('node_', ''));
                    if (!isNaN(nodeNum) && nodeNum > this.nodeCounter) {
                        this.nodeCounter = nodeNum;
                    }
                });
            }
            
            // Load connections
            this.connections = [];
            if (data.canvas.connections) {
                data.canvas.connections.forEach(connData => {
                    const fromNode = this.nodes.find(n => n.id === connData.from);
                    const toNode = this.nodes.find(n => n.id === connData.to);
                    
                    if (fromNode && toNode) {
                        this.connections.push({
                            id: connData.id,
                            from: connData.from,
                            to: connData.to,
                            fromNode: fromNode,
                            toNode: toNode
                        });
                    }
                });
            }
            
            this.clearSelection();
            console.log('✅ Canvas data loaded successfully');
            
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
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.hasMoved = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        console.log('🎮 Setting up event listeners on canvas:', this.canvas);
        
        this.canvas.addEventListener('mousedown', (e) => {
            console.log('🖱️ Mouse down:', e);
            this.handleMouseDown(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        this.canvas.addEventListener('mouseup', (e) => {
            console.log('🖱️ Mouse up:', e);
            this.handleMouseUp(e);
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            console.log('🎡 Wheel:', e);
            this.handleWheel(e);
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
        
        if (clickedNode) {
            // Node interaction
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
        
        if (this.isDragging) {
            const deltaX = mouseX - this.lastMouseX;
            const deltaY = mouseY - this.lastMouseY;
            
            // Track if we've actually moved (not just a click)
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                this.hasMoved = true;
            }
            
            if (this.isNodeDragging && this.draggedNode) {
                // Move node
                const canvasX = (mouseX - this.canvasState.offsetX) / this.canvasState.scale;
                const canvasY = (mouseY - this.canvasState.offsetY) / this.canvasState.scale;
                
                this.draggedNode.x = canvasX - this.dragStartX;
                this.draggedNode.y = canvasY - this.dragStartY;
                
                this.canvasState.notifyStateChange();
            } else if (this.isPanning) {
                // Pan canvas
                this.canvasState.offsetX += deltaX;
                this.canvasState.offsetY += deltaY;
            }
        }
        
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
    }
    
    handleMouseUp(e) {
        console.log('🖱️ Mouse up - was dragging:', this.isDragging, 'was node dragging:', this.isNodeDragging);
        
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
        
        // Zoom factor
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(5, this.canvasState.scale * zoomFactor));
        
        // Zoom towards mouse position
        const scaleDiff = newScale - this.canvasState.scale;
        this.canvasState.offsetX -= (mouseX - this.canvasState.offsetX) * scaleDiff / this.canvasState.scale;
        this.canvasState.offsetY -= (mouseY - this.canvasState.offsetY) * scaleDiff / this.canvasState.scale;
        
        this.canvasState.scale = newScale;
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
            console.log('✏️ Editing existing node');
            this.editNodeText(clickedNode);
        } else {
            console.log('➕ Creating new node at:', { x: canvasX - 100, y: canvasY - 50 });
            const newNode = this.canvasState.createNode('New Node', canvasX - 100, canvasY - 50);
            console.log('🎉 New node created:', newNode);
        }
    }
    
    handleKeyDown(e) {
        console.log('⌨️ Key pressed:', e.key, 'Selected nodes:', this.canvasState.selectedNodes.length);
        
        // Support both Delete and Backspace keys for node deletion
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.canvasState.selectedNodes.length > 0) {
            console.log('🗑️ Deleting nodes:', this.canvasState.selectedNodes.map(n => n.id));
            
            // Create a copy of the array since we'll be modifying the original
            const nodesToDelete = [...this.canvasState.selectedNodes];
            nodesToDelete.forEach(node => {
                this.canvasState.deleteNode(node);
            });
            
            console.log('✅ Nodes deleted. Remaining nodes:', this.canvasState.nodes.length);
            e.preventDefault(); // Prevent default browser behavior
        }
    }
    
    editNodeText(node) {
        // Use a simple input overlay instead of prompt()
        const input = document.createElement('input');
        input.type = 'text';
        input.value = node.text;
        input.style.position = 'absolute';
        input.style.left = node.x + 'px';
        input.style.top = node.y + 'px';
        input.style.width = node.width + 'px';
        input.style.zIndex = '1000';
        input.style.backgroundColor = '#3c3c3c';
        input.style.color = '#cccccc';
        input.style.border = '2px solid #007fd4';
        input.style.padding = '5px';
        input.style.fontSize = '14px';
        
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        const finishEditing = () => {
            node.text = input.value || 'New Node';
            document.body.removeChild(input);
            this.canvasState.notifyStateChange();
            console.log('✏️ Node text updated to:', node.text);
        };
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            } else if (e.key === 'Escape') {
                document.body.removeChild(input);
            }
        });
        
        input.addEventListener('blur', finishEditing);
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
        
        // Draw connections
        canvasState.connections.forEach(connection => {
            this.drawConnection(ctx, connection);
        });
        
        // Draw nodes
        canvasState.nodes.forEach(node => {
            this.drawNode(ctx, node);
        });
        
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
    
    drawNode(ctx, node) {
        // Draw background
        ctx.fillStyle = node.backgroundColor;
        ctx.fillRect(node.x, node.y, node.width, node.height);
        
        // Draw border
        ctx.strokeStyle = node.isSelected ? '#007fd4' : node.borderColor;
        ctx.lineWidth = node.isSelected ? 2 : 1;
        ctx.strokeRect(node.x, node.y, node.width, node.height);
        
        // Draw text
        ctx.fillStyle = node.textColor;
        ctx.font = '14px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap text
        const words = node.text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < node.width - 20) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        // Draw lines
        const lineHeight = 18;
        const startY = node.y + node.height / 2 - (lines.length - 1) * lineHeight / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(
                line,
                node.x + node.width / 2,
                startY + index * lineHeight
            );
        });
    }
    
    drawConnection(ctx, connection) {
        const fromNode = connection.fromNode;
        const toNode = connection.toNode;
        
        if (!fromNode || !toNode) return;
        
        const startX = fromNode.x + fromNode.width / 2;
        const startY = fromNode.y + fromNode.height / 2;
        const endX = toNode.x + toNode.width / 2;
        const endY = toNode.y + toNode.height / 2;
        
        ctx.strokeStyle = '#569cd6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw arrow
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowSize = 10;
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#569cd6';
        ctx.fill();
    }
}