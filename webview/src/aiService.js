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

export async function generateAIIdeasGroq(selectedNodeText, connectedNodes = [], model = 'anthropic/claude-3.5-sonnet') {
    console.log('🎯 Using OpenRouter');
    console.log('🤖 Model:', model);

    // Check if API key is available
    if (!OPENROUTER_API_KEY) {
        console.warn('❌ OpenRouter API key not available, using mock response');
        return generateMockResponse(selectedNodeText, model);
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
    messages.push({ role: "user", content: selectedNodeText });

    console.log('💬 Message history:', messages.map(m => m.content));

    try {
        // Use fetch API since we're in a browser environment
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://vscode-infinite-canvas.com',
                'X-Title': 'VS Code Infinite Canvas'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 150
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
        return generateMockResponse(selectedNodeText, model);
    }
}

// Fallback function for when OpenRouter API is not available
function generateMockResponse(selectedNodeText, model) {
    const modelName = model.toLowerCase();
    const input = selectedNodeText.toLowerCase();

    // Generate contextual mock responses
    let responses = [];

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