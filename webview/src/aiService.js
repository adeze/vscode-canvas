// AI Service Module for VS Code Extension
// Using OpenRouter for AI model access

export function getProviderName(baseURL) {
    return 'OpenRouter';
}

export function getErrorMessage(error) {
    let errorMessage = 'Failed to generate AI ideas. ';

    // Check for specific error patterns
    const errorString = error.message || JSON.stringify(error) || '';

    if (errorString.includes('No auth credentials found') || errorString.includes('401')) {
        errorMessage += 'Authentication failed. Using demo mode fallback.';
    } else if (errorString.includes('API key')) {
        errorMessage += 'API key issue. Using demo mode fallback.';
    } else if (errorString.includes('quota') || errorString.includes('insufficient_quota')) {
        errorMessage += 'API quota exceeded. Using demo mode fallback.';
    } else if (errorString.includes('network') || errorString.includes('fetch')) {
        errorMessage += 'Network error. Please try again.';
    } else if (errorString.includes('unauthorized')) {
        errorMessage += 'Unauthorized access. Using demo mode fallback.';
    } else if (errorString.includes('429') || errorString.includes('rate limit')) {
        errorMessage += 'Rate limit exceeded. Please wait and try again.';
    } else if (errorString.includes('model') && errorString.includes('not found')) {
        errorMessage += 'The requested model is not available. Using fallback model.';
    } else {
        errorMessage += errorString || 'Unknown error occurred.';
    }

    return errorMessage;
}

// ============================================================================
// OPENROUTER API FUNCTIONS
// ============================================================================

// OpenRouter API key - using environment variable or fallback to mock
let OPENROUTER_API_KEY = null;

// Try to get API key from various sources
if (typeof window !== 'undefined' && window.vsCodeAPI) {
    // Try to get from VS Code environment
    try {
        window.vsCodeAPI.postMessage({
            type: 'getOpenRouterApiKey'
        });
    } catch (e) {
        console.log('Could not request OpenRouter API key from VS Code');
    }
}

// Handle message from VS Code extension with API key
if (typeof window !== 'undefined') {
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'openRouterApiKey') {
            OPENROUTER_API_KEY = message.apiKey;
            console.log('🔑 Received OpenRouter API key from VS Code extension');
        }
    });
}

export async function generateAIIdeasGroq(selectedNodeText, connectedNodes = [], model = 'anthropic/claude-3.5-sonnet', fileContent = null) {
    console.log('🎯 Using configurable AI service');
    console.log('🤖 Model:', model);

    // Get configurable settings from localStorage
    const baseUrl = localStorage.getItem('ai-base-url') || 'https://openrouter.ai/api/v1';
    const apiKey = localStorage.getItem('ai-api-key') || OPENROUTER_API_KEY;
    
    console.log('🌐 Base URL:', baseUrl);

    // Check if API key is available
    if (!apiKey) {
        console.warn('❌ API key not available, using mock response');
        return generateMockResponse(selectedNodeText, model, fileContent);
    }

    // Construct messages array with connected nodes as conversation history
    let messages = [];

    if (connectedNodes && connectedNodes.length > 0) {
        // Add connected nodes as previous messages in the conversation
        connectedNodes.forEach(node => {
            messages.push({ role: "user", content: node.text });
        });
        console.log('📎 Using', connectedNodes.length, 'connected nodes as conversation history');
    }

    // Add the current selected node as the latest message
    // If we have file content, include it directly
    let content = selectedNodeText;
    if (fileContent) {
        content = `${selectedNodeText}\n\nFile content:\n${fileContent}`;
        console.log('📄 Including file content with node text');
    }

    messages.push({ role: "user", content: content });

    console.log('💬 Message history:', messages.map(m => m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '')));

    try {
        // Use fetch API with configurable base URL
        const apiUrl = `${baseUrl}/chat/completions`;
        console.log('📡 Making request to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://vscode-infinite-canvas.com',
                'X-Title': 'VS Code Infinite Canvas'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: fileContent ? 200 : 150 // Allow more tokens for markdown analysis
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.choices[0].message.content;
        console.log('✅ OpenRouter response:', responseText);

        // Return the AI response as a single idea (one node)
        const trimmedResponse = responseText.trim();

        if (!trimmedResponse) {
            throw new Error('OpenRouter generated empty response');
        }

        return [trimmedResponse]; // Always return as array with single item

    } catch (apiError) {
        console.error('❌ OpenRouter API Error:', apiError.message);

        // Fallback to mock response if API fails
        console.log('🔄 Falling back to mock response...');
        return generateMockResponse(selectedNodeText, model, fileContent);
    }
}

// Fallback function for when OpenRouter API is not available
function generateMockResponse(selectedNodeText, model, fileContent = null) {
    const modelName = model.toLowerCase();
    const input = selectedNodeText.toLowerCase();

    // Generate contextual mock responses
    let responses = [];

    // If we have file content, generate markdown-specific responses
    if (fileContent) {
        const contentLength = fileContent.length;
        const wordCount = fileContent.split(/\s+/).length;
        const hasHeadings = fileContent.includes('#');
        const hasCodeBlocks = fileContent.includes('```');
        const hasLinks = fileContent.includes('[') && fileContent.includes('](');

        if (modelName.includes('claude')) {
            responses = [
                `After analyzing your markdown file (${wordCount} words), I suggest exploring the interconnections between the main concepts presented.`,
                `This markdown document contains rich content. Consider creating visual diagrams to represent the key relationships.`,
                `The structure of your markdown suggests potential for breaking down complex topics into actionable sub-components.`
            ];
        } else if (modelName.includes('gpt')) {
            responses = [
                `Your markdown file presents ${hasHeadings ? 'well-structured' : 'detailed'} content. Consider adding ${hasCodeBlocks ? 'more examples' : 'code examples'} to illustrate key points.`,
                `Based on the markdown analysis, this could benefit from ${hasLinks ? 'additional cross-references' : 'relevant external links'}.`,
                `The documentation shows potential for expansion into related topics and practical applications.`
            ];
        } else {
            responses = [
                `Analyzing your markdown content reveals opportunities for deeper exploration of the main themes.`,
                `This document could serve as a foundation for developing more specialized content or tutorials.`,
                `Consider how the concepts in this markdown could be applied to real-world scenarios.`
            ];
        }

        // Add markdown-specific suggestions
        if (hasHeadings) {
            responses.push('Each heading section could be expanded into its own detailed exploration.');
        }
        if (hasCodeBlocks) {
            responses.push('The code examples provide excellent starting points for hands-on experimentation.');
        }
        if (contentLength > 1000) {
            responses.push('This comprehensive document could be broken down into a series of focused topics.');
        }
    } else {
        // Regular node responses (non-markdown)
        if (modelName.includes('claude')) {
            responses = [
                `Building on "${selectedNodeText.substring(0, 30)}...", here's an expanded perspective from Claude.`,
                `Your idea about "${selectedNodeText.substring(0, 25)}..." could be developed further with thoughtful analysis.`,
                `Considering "${selectedNodeText.substring(0, 20)}...", what about exploring related concepts with careful reasoning?`
            ];
        } else if (modelName.includes('gpt')) {
            responses = [
                `From GPT's perspective: "${selectedNodeText.substring(0, 30)}..." presents interesting opportunities.`,
                `Analyzing "${selectedNodeText.substring(0, 25)}..." from different viewpoints reveals new insights.`,
                `Your concept "${selectedNodeText.substring(0, 20)}..." could benefit from systematic exploration.`
            ];
        } else if (modelName.includes('llama')) {
            responses = [
                `Thoughtfully considering "${selectedNodeText.substring(0, 30)}...", here are some insights from Llama.`,
                `Reflecting on "${selectedNodeText.substring(0, 25)}...", this could lead to interesting developments.`,
                `Your idea "${selectedNodeText.substring(0, 20)}..." has potential for creative expansion.`
            ];
        }

        // Add topic-specific responses
        if (input.includes('business') || input.includes('startup')) {
            responses.push('Consider market validation and competitive analysis for this business concept.');
        } else if (input.includes('technology') || input.includes('software')) {
            responses.push('Technical implementation and scalability are key factors to consider.');
        } else if (input.includes('creative') || input.includes('art')) {
            responses.push('Explore different artistic mediums and creative approaches for this idea.');
        } else if (input.includes('code') || input.includes('programming')) {
            responses.push('Consider design patterns, testing strategies, and code maintainability.');
        } else if (input.includes('data') || input.includes('analysis')) {
            responses.push('Data quality, visualization techniques, and statistical significance should be evaluated.');
        } else {
            responses.push('This concept has potential for further development and exploration.');
        }
    }

    const responseText = responses[Math.floor(Math.random() * responses.length)];
    console.log('✅ Mock response generated:', responseText);
    return [responseText];
}

// Set OpenRouter API key (called from VS Code extension)
export function setOpenRouterApiKey(apiKey) {
    OPENROUTER_API_KEY = apiKey;
    console.log('🔑 OpenRouter API key updated');
}

// Expose the function globally for UI access
if (typeof window !== 'undefined') {
    window.setOpenRouterApiKey = setOpenRouterApiKey;
}