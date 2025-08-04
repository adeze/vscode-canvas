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
        errorMessage += 'Authentication failed. Please check your API key configuration.';
    } else if (errorString.includes('API key')) {
        errorMessage += 'API key issue. Please verify your API key in the extension settings.';
    } else if (errorString.includes('quota') || errorString.includes('insufficient_quota')) {
        errorMessage += 'API quota exceeded. Please check your account limits.';
    } else if (errorString.includes('network') || errorString.includes('fetch')) {
        errorMessage += 'Network error. Please try again.';
    } else if (errorString.includes('unauthorized')) {
        errorMessage += 'Unauthorized access. Please check your API key configuration.';
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

// OpenRouter API key - using environment variable
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
        console.warn('❌ API key not available');
        throw new Error('Please configure your API key in the extension settings to use AI features.');
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
        throw apiError;
    }
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