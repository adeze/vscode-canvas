// AIManager.js - Handles all AI-related functionality for VS Code extension
import { getProviderName, getErrorMessage, generateAIIdeasGroq } from './aiService.js';

export class AIManager {
    constructor(canvasState, uiManager) {
        this.canvasState = canvasState;
        this.uiManager = uiManager;
        
        // AI configuration - using OpenRouter
        this.demoMode = false; // Using OpenRouter instead of demo mode
        this.openRouterModels = 'anthropic/claude-3.5-sonnet,openai/gpt-4o,meta-llama/llama-3.1-8b-instruct';
        this.aiModels = this.openRouterModels;
        this.activeModels = JSON.parse(localStorage.getItem('ai_active_models') || '{}');
        
        // Ensure OpenRouter models are active by default
        this.openRouterModels.split(',').map(m => m.trim()).forEach(model => {
            if (!(model in this.activeModels)) {
                this.activeModels[model] = true;
            }
        });
        
        console.log('🤖 AIManager initialized for VS Code with OpenRouter models:', this.activeModels);
    }
    
    // AI text generation - simplified for VS Code
    async generateAI() {
        if (this.canvasState.selectedNodes.length === 0) {
            if (this.uiManager && this.uiManager.showNotification) {
                this.uiManager.showNotification('Please select a node first to generate connected ideas', 'warning');
            } else {
                console.warn('Please select a node first to generate connected ideas');
            }
            return;
        }

        if (this.canvasState.selectedNodes.length > 1) {
            if (this.uiManager && this.uiManager.showNotification) {
                this.uiManager.showNotification('Please select only one node to generate ideas. AI generation works with single nodes.', 'warning');
            } else {
                console.warn('Please select only one node to generate ideas');
            }
            return;
        }

        const sourceNode = this.canvasState.selectedNodes[0];

        if (sourceNode.isGeneratingAI) {
            if (this.uiManager && this.uiManager.showNotification) {
                this.uiManager.showNotification('AI generation already in progress for this node...', 'info');
            } else {
                console.info('AI generation already in progress for this node...');
            }
            return;
        }

        try {
            sourceNode.isGeneratingAI = true;
            console.log('🎯 Generating ideas for:', sourceNode.text);

            const ancestorNodes = this.getAncestorNodes(sourceNode);
            const allModels = this.aiModels.split(',').map(m => m.trim()).filter(m => m.length > 0);
            const models = allModels.filter(model => this.activeModels[model] !== false);

            if (models.length === 0) {
                if (this.uiManager && this.uiManager.showNotification) {
                    this.uiManager.showNotification('No active models selected. Please configure your AI models first.', 'warning');
                } else {
                    console.warn('No active models selected');
                }
                return;
            }

            console.log(`Starting AI generation with ${models.length} model(s)...`);

            let completedModels = 0;
            let totalNodes = 0;
            const createdNodes = [];

            const onModelComplete = async (modelResult) => {
                completedModels++;

                const sourceStillExists = this.canvasState.nodes.find(n => n.id === sourceNode.id);
                if (!sourceStillExists) {
                    console.warn('⚠️ Source node was deleted during generation, skipping node creation');
                    return;
                }

                if (modelResult.success && modelResult.ideas && modelResult.ideas.length > 0) {
                    modelResult.ideas.forEach((idea) => {
                        const childSpacing = 500;
                        const verticalOffset = 150;
                        const globalIndex = totalNodes;

                        const x = sourceNode.x + (sourceNode.width / 2) - 200 + (globalIndex * childSpacing);
                        const y = sourceNode.y + sourceNode.height + verticalOffset;

                        const newNode = this.canvasState.createNode(idea, x, y);
                        // Add model attribution
                        newNode.aiModel = modelResult.model;
                        createdNodes.push(newNode);

                        this.canvasState.createConnection(sourceNode, newNode);
                        totalNodes++;
                    });

                    this.canvasState.saveToLocalStorage();

                    const modelName = modelResult.model.split('/').pop() || modelResult.model;
                    console.log(`✅ ${modelName} generated ${modelResult.ideas.length} idea(s)`);
                } else if (!modelResult.success) {
                    const modelName = modelResult.model.split('/').pop() || modelResult.model;
                    console.error(`❌ ${modelName} failed: ${modelResult.errorMessage}`);
                }
            };

            const modelResults = await this.generateAIIdeasMultipleModelsOpenRouter(
                sourceNode.text,
                ancestorNodes,
                models,
                onModelComplete
            );

            const successfulModels = modelResults.filter(r => r.success).length;
            const failedModels = modelResults.filter(r => !r.success).length;

            let summaryMessage;
            if (totalNodes > 0) {
                summaryMessage = `🎉 Generation complete! Created ${totalNodes} idea(s) from ${successfulModels} model(s)`;
                if (failedModels > 0) {
                    summaryMessage += ` (${failedModels} model(s) failed)`;
                }
            } else {
                summaryMessage = `❌ No ideas generated. All ${models.length} model(s) failed.`;
            }

            console.log(summaryMessage);
            if (this.uiManager && this.uiManager.showNotification) {
                this.uiManager.showNotification(summaryMessage, totalNodes > 0 ? 'success' : 'error', 4000);
            }

        } catch (error) {
            console.error('Error calling AI API:', error);
            const errorMessage = getErrorMessage(error);
            if (this.uiManager && this.uiManager.showNotification) {
                this.uiManager.showNotification(errorMessage, 'error');
            } else {
                console.error(errorMessage);
            }
        } finally {
            sourceNode.isGeneratingAI = false;
            // Update floating button state after AI generation completes
            if (this.uiManager && this.uiManager.updateFloatingButton) {
                this.uiManager.updateFloatingButton();
            }
        }
    }
    
    // Helper method to get ancestor nodes (simplified)
    getAncestorNodes(node) {
        const ancestors = [];
        const visited = new Set();
        
        const findAncestors = (currentNode) => {
            if (visited.has(currentNode.id)) return;
            visited.add(currentNode.id);
            
            // Find connections where this node is the target
            const incomingConnections = this.canvasState.connections.filter(conn => conn.to === currentNode.id);
            
            incomingConnections.forEach(conn => {
                const parentNode = this.canvasState.nodes.find(n => n.id === conn.from);
                if (parentNode && !visited.has(parentNode.id)) {
                    ancestors.push(parentNode);
                    findAncestors(parentNode);
                }
            });
        };
        
        findAncestors(node);
        return ancestors;
    }
    
    // OpenRouter-based AI generation for multiple models
    async generateAIIdeasMultipleModelsOpenRouter(selectedNodeText, connectedNodes = [], models = [], onModelComplete = null) {
        if (!models || models.length === 0) {
            throw new Error('No models specified');
        }

        const trimmedModels = models.map(m => m.trim()).filter(m => m.length > 0);

        if (trimmedModels.length === 0) {
            throw new Error('No valid models specified');
        }

        console.log(`🚀 Starting parallel OpenRouter generation with ${trimmedModels.length} models:`, trimmedModels);

        // Create promises for all models to run in parallel
        const modelPromises = trimmedModels.map(async (model) => {
            try {
                console.log(`🤖 Starting OpenRouter generation with model: ${model}`);
                const ideas = await generateAIIdeasGroq(selectedNodeText, connectedNodes, model);

                const result = {
                    model: model,
                    ideas: ideas,
                    success: true,
                    timestamp: Date.now()
                };

                // Call the callback immediately when this model completes
                if (onModelComplete && typeof onModelComplete === 'function') {
                    try {
                        await onModelComplete(result);
                    } catch (callbackError) {
                        console.error(`❌ Error in onModelComplete callback for ${model}:`, callbackError);
                    }
                }

                console.log(`✅ Completed OpenRouter generation with model: ${model}`);
                return result;
            } catch (error) {
                console.error(`❌ Error with OpenRouter model ${model}:`, error.message);

                const result = {
                    model: model,
                    ideas: [`OpenRouter error with ${model}: ${error.message}`],
                    success: false,
                    error: true,
                    errorMessage: error.message,
                    timestamp: Date.now()
                };

                // Call the callback even for errors
                if (onModelComplete && typeof onModelComplete === 'function') {
                    try {
                        await onModelComplete(result);
                    } catch (callbackError) {
                        console.error(`❌ Error in onModelComplete callback for ${model}:`, callbackError);
                    }
                }

                return result;
            }
        });

        // Wait for all models to complete (or fail)
        const results = await Promise.allSettled(modelPromises);

        // Extract the actual results from Promise.allSettled
        const finalResults = results.map(result => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                // This should rarely happen since we handle errors inside the promise
                console.error('❌ Unexpected promise rejection:', result.reason);
                return {
                    model: 'unknown',
                    ideas: [`Unexpected error: ${result.reason?.message || 'Unknown error'}`],
                    success: false,
                    error: true,
                    errorMessage: result.reason?.message || 'Unknown error',
                    timestamp: Date.now()
                };
            }
        });

        const successCount = finalResults.filter(r => r.success).length;
        const errorCount = finalResults.filter(r => !r.success).length;

        console.log(`🏁 Parallel OpenRouter generation completed: ${successCount} successful, ${errorCount} failed`);

        return finalResults;
    }
    
    // Configuration management (simplified for VS Code)
    getActiveModels() {
        return Object.keys(this.activeModels).filter(model => this.activeModels[model] !== false);
    }
    
    setActiveModels(activeModels) {
        this.activeModels = activeModels;
        localStorage.setItem('ai_active_models', JSON.stringify(activeModels));
        console.log('✅ AI model configuration updated:', activeModels);
    }
    
    getProviderName() {
        return 'OpenRouter';
    }
}