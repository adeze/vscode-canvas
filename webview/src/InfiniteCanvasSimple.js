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
        
        // Connection functionality
        this.isConnecting = false;
        this.connectionStart = null;
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
            // Check if clicking on a connection point (hold Shift to connect)
            const connectionPoint = this.getConnectionPointAt(clickedNode, canvasX, canvasY);
            
            if (e.shiftKey && connectionPoint) {
                // Start connection
                console.log('🔗 Starting connection from:', clickedNode.id, connectionPoint.side);
                this.isConnecting = true;
                this.connectionStart = clickedNode;
                this.connectionStartPoint = connectionPoint;
                this.canvasState.clearSelection();
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
        if (this.isConnecting) {
            this.canvas.style.cursor = 'crosshair';
        } else if (this.hoveredConnectionPoint && e.shiftKey) {
            this.canvas.style.cursor = 'copy';
        } else if (this.hoveredNode) {
            this.canvas.style.cursor = 'grab';
        } else {
            this.canvas.style.cursor = 'default';
        }
        
        if (this.isDragging) {
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
            }
        }
        
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
    }
    
    handleMouseUp(e) {
        console.log('🖱️ Mouse up - was dragging:', this.isDragging, 'was node dragging:', this.isNodeDragging, 'was connecting:', this.isConnecting);
        
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
            this.drawNode(ctx, node, showConnectionPoints, inputHandler);
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
        
        // Draw connection points if requested
        if (showConnectionPoints) {
            this.drawConnectionPoints(ctx, node, inputHandler);
        }
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