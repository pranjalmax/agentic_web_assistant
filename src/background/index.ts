// Background Service Worker (MV3)
// Handles coordination between popup and content scripts

import { MessageType, MessageResponse, sendMessage, getActiveTabId } from '../lib/messages';
import { goalToSteps, ReActStep } from '../lib/planner';

console.log('🤖 Lumina-Agentic Web Assistant - Background Service Worker Loaded');

// ============================================================================
// AGENT STATE
// ============================================================================

interface AgentState {
    running: boolean;
    currentStep: number;
    totalSteps: number;
    goal: string;
    dryRun: boolean;
    trace: ReActStep[];

}

let agentState: AgentState = {
    running: false,
    currentStep: 0,
    totalSteps: 0,
    goal: '',
    dryRun: false,
    trace: [],
};

let stopRequested = false;

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

/**
 * Wait for content script to be ready (it's auto-injected via manifest.json)
 */
async function ensureContentScriptInjected(_tabId: number): Promise<boolean> {
    try {
        // Content script is auto-injected by manifest.json
        // Just wait a moment for it to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    } catch (error: any) {
        console.error('Content script check failed:', error);
        return false;
    }
}

/**
 * Execute a tool on the active tab
 */
async function executeTool(tool: string, args: any, timeout: number = 30000): Promise<MessageResponse> {
    try {
        const tabId = await getActiveTabId();

        if (!tabId) {
            return {
                success: false,
                error: 'No active tab found',
            };
        }

        // Special handling for navigate - use chrome.tabs.update instead of content script
        if (tool === 'navigate') {
            try {
                const chromeApi = (globalThis as any).chrome;
                const { url } = args;

                // Navigate the tab using Chrome API
                await chromeApi.tabs.update(tabId, { url });

                // Wait for navigation to complete
                await new Promise((resolve) => {
                    const listener = (tid: number, info: any) => {
                        if (tid === tabId && info.status === 'complete') {
                            chromeApi.tabs.onUpdated.removeListener(listener);
                            resolve(true);
                        }
                    };
                    chromeApi.tabs.onUpdated.addListener(listener);

                    // Timeout after 30 seconds
                    setTimeout(() => {
                        chromeApi.tabs.onUpdated.removeListener(listener);
                        resolve(true);
                    }, timeout);
                });

                return {
                    success: true,
                    data: { url, navigated: true },
                };
            } catch (error: any) {
                return {
                    success: false,
                    error: `Navigation failed: ${error.message}`,
                };
            }
        }

        // For other tools, ensure content script is injected
        const injected = await ensureContentScriptInjected(tabId);
        if (!injected) {
            return {
                success: false,
                error: 'Failed to inject content script',
            };
        }

        const message = {
            type: MessageType.EXECUTE_TOOL,
            payload: { tool, args, timeout },
        } as any;

        // Retry logic with exponential backoff
        const maxRetries = 3;
        const baseDelay = 500; // ms

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await sendMessage(message, { tabId, timeout });
                return response;
            } catch (error: any) {
                console.log(`Attempt ${attempt + 1} failed: ${error.message}`);

                // If this isn't the last attempt, wait before retrying
                if (attempt < maxRetries - 1) {
                    const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // All retries failed
        return {
            success: false,
            error: `Tool execution failed after ${maxRetries} attempts. The content script may not be loaded on this page. Try refreshing the page and waiting a few seconds before using auto-fill.`,
        };
    } catch (error: any) {
        return {
            success: false,
            error: `Tool execution failed: ${error.message}`,
        };
    }
}

/**
 * Execute the ReAct loop
 */
async function executeReActLoop(steps: ReActStep[], maxSteps: number = 20, dryRun: boolean = false): Promise<void> {
    agentState.totalSteps = Math.min(steps.length, maxSteps);
    agentState.currentStep = 0;
    agentState.trace = [];
    stopRequested = false;

    console.log(`🚀 Starting ReAct loop with ${steps.length} steps (max: ${maxSteps}, dryRun: ${dryRun})`);

    for (let i = 0; i < steps.length && i < maxSteps; i++) {
        // Check for stop request
        if (stopRequested) {
            console.log('🛑 Stop requested, halting execution');
            agentState.running = false;
            break;
        }

        const step = steps[i];
        agentState.currentStep = i + 1;

        console.log(`📍 Step ${step.step}: ${step.thought}`);
        console.log(`🔧 Action: ${step.action.tool}`, step.action.args);

        // Add to trace with thought and action
        const traceStep: ReActStep = {
            step: step.step,
            thought: step.thought,
            action: step.action,
            observation: '',
        };

        if (dryRun) {
            // Dry run mode - simulate without executing
            traceStep.observation = `[DRY RUN] Would execute ${step.action.tool} with args: ${JSON.stringify(step.action.args)}`;
            console.log(`🏃 ${traceStep.observation}`);
        } else {
            // Execute the tool
            const result = await executeTool(step.action.tool, step.action.args);

            if (result.success) {
                const data = result.data?.data || result.data;
                traceStep.observation = `✅ Success: ${JSON.stringify(data)}`;
                console.log(`✅ ${traceStep.observation}`);
            } else {
                traceStep.observation = `❌ Error: ${result.error}`;
                console.error(`❌ ${traceStep.observation}`);

                // Continue on error but log it
            }
        }

        agentState.trace.push(traceStep);

        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('🏁 ReAct loop completed');
    agentState.running = false;
}

/**
 * Start the agent
 */
async function startAgent(payload: {
    goal?: string;
    maxSteps?: number;
    dryRun?: boolean;
}): Promise<MessageResponse> {
    if (agentState.running) {
        return {
            success: false,
            error: 'Agent is already running',
        };
    }

    let steps: ReActStep[] = [];

    // Use recipe or goal-based planning
    if (payload.goal) {
        steps = goalToSteps(payload.goal);
        agentState.goal = payload.goal;
    } else {
        return {
            success: false,
            error: 'No goal provided',
        };
    }

    agentState.running = true;
    agentState.dryRun = payload.dryRun || false;
    agentState.currentStep = 0;
    agentState.totalSteps = 0;
    agentState.trace = [];

    console.log('🚀 Agent started:', agentState);

    // Execute in background (don't await)
    executeReActLoop(steps, payload.maxSteps || 20, agentState.dryRun).catch((error) => {
        console.error('❌ ReAct loop error:', error);
        agentState.running = false;
    });

    return {
        success: true,
        data: { state: agentState },
    };
}

/**
 * Stop the agent
 */
async function stopAgent(): Promise<MessageResponse> {
    if (!agentState.running) {
        return {
            success: false,
            error: 'Agent is not running',
        };
    }

    stopRequested = true;
    console.log('🛑 Agent stop requested');

    // Wait a bit for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 100));

    agentState.running = false;

    return {
        success: true,
        data: { state: agentState },
    };
}

/**
 * Get agent status
 */
async function getAgentStatus(): Promise<MessageResponse> {
    return {
        success: true,
        data: {
            running: agentState.running,
            currentStep: agentState.currentStep,
            totalSteps: agentState.totalSteps,
            goal: agentState.goal,
            dryRun: agentState.dryRun,
        },
    };
}

/**
 * Toggle selector picker on active tab
 */
async function togglePicker(enabled: boolean): Promise<MessageResponse> {
    try {
        const tabId = await getActiveTabId();

        if (!tabId) {
            return {
                success: false,
                error: 'No active tab found',
            };
        }

        const message = {
            type: MessageType.TOGGLE_PICKER,
            payload: { enabled },
        } as any;

        const response = await sendMessage(message, { tabId, timeout: 5000 });
        return response;
    } catch (error: any) {
        return {
            success: false,
            error: `Picker toggle failed: ${error.message}`,
        };
    }
}

/**
 * Get current trace
 */
async function getTrace(): Promise<MessageResponse> {
    return {
        success: true,
        data: { trace: agentState.trace },
    };
}

/**
 * Save trace to storage
 */
async function saveTrace(trace: any): Promise<MessageResponse> {
    try {
        // TODO: Implement persistent storage in Step 5
        console.log('💾 Save trace:', trace);

        return {
            success: true,
            data: { saved: true },
        };
    } catch (error: any) {
        return {
            success: false,
            error: `Save trace failed: ${error.message}`,
        };
    }
}

/**
 * Clear all traces
 */
async function clearTraces(): Promise<MessageResponse> {
    agentState.trace = [];
    return {
        success: true,
        data: { cleared: true },
    };
}

// ============================================================================
// MESSAGE LISTENER
// ============================================================================

(globalThis as any).chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (response: MessageResponse) => void) => {
    console.log('📨 Background received message:', message);

    // Handle different message types
    (async () => {
        try {
            let response: MessageResponse;

            switch (message.type) {
                case MessageType.EXECUTE_TOOL:
                    response = await executeTool(message.payload.tool, message.payload.args, message.payload.timeout);
                    break;

                case MessageType.START_AGENT:
                    response = await startAgent(message.payload);
                    break;

                case MessageType.STOP_AGENT:
                    response = await stopAgent();
                    break;

                case MessageType.AGENT_STATUS:
                    response = await getAgentStatus();
                    break;

                case MessageType.TOGGLE_PICKER:
                    response = await togglePicker(message.payload.enabled);
                    break;

                case MessageType.VALIDATE_SELECTOR:
                    response = await executeTool('validateSelector', { selector: message.payload.selector });
                    break;



                case MessageType.GET_TRACE:
                    response = await getTrace();
                    break;

                case MessageType.SAVE_TRACE:
                    response = await saveTrace(message.payload);
                    break;

                case MessageType.CLEAR_TRACES:
                    response = await clearTraces();
                    break;

                case MessageType.SUMMARIZE_PAGE:
                    try {
                        // 1. Get API Key
                        const storage = await new Promise<any>((resolve) => {
                            chrome.storage.local.get(['GEMINI_API_KEY'], resolve);
                        });
                        const apiKey = storage.GEMINI_API_KEY;

                        if (!apiKey) {
                            response = { success: false, error: 'No Gemini API key found. Please add it in Options.' };
                            break;
                        }

                        // 2. Get Page Text
                        const textResult = await executeTool('summarizePage', {});
                        if (!textResult.success || !textResult.data?.data) {
                            response = { success: false, error: 'Failed to extract page text' };
                            break;
                        }
                        const pageData = textResult.data.data;

                        // 3. Call Gemini API
                        const apiResponse = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{
                                        parts: [{
                                            text: `Summarize the following webpage in 3-4 concise sentences:\n\nTitle: ${pageData.title}\n\nContent:\n${pageData.text}`
                                        }]
                                    }]
                                })
                            }
                        );

                        if (!apiResponse.ok) {
                            const errorText = await apiResponse.text();
                            throw new Error(`Gemini API error (${apiResponse.status}): ${errorText}`);
                        }

                        const geminiData = await apiResponse.json();
                        const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

                        if (!summary) {
                            throw new Error('No summary returned from Gemini API');
                        }

                        response = {
                            success: true,
                            data: { summary }
                        };
                    } catch (error: any) {
                        response = { success: false, error: error.message };
                    }
                    break;

                case MessageType.AI_DATA_SCRAPE:
                    try {
                        // 1. Get API Key
                        const storage = await new Promise<any>((resolve) => {
                            chrome.storage.local.get(['GEMINI_API_KEY'], resolve);
                        });
                        const apiKey = storage.GEMINI_API_KEY;

                        if (!apiKey) {
                            response = { success: false, error: 'No Gemini API key found. Please add it in Options.' };
                            break;
                        }

                        // 2. Get Page Text
                        const textResult = await executeTool('summarizePage', {});
                        if (!textResult.success || !textResult.data?.data) {
                            response = { success: false, error: 'Failed to extract page text' };
                            break;
                        }
                        const pageData = textResult.data.data;
                        const userQuery = message.payload.query;

                        // 3. Call Gemini API
                        const apiResponse = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{
                                        parts: [{
                                            text: `You are a data extraction assistant. Extract a list of "${userQuery}" from the following text.
                                            
                                            Return ONLY a valid JSON array of objects. Each object should have relevant keys based on the data found.
                                            Do not include markdown formatting (like \`\`\`json). Just the raw JSON array.
                                            
                                            Text:
                                            ${pageData.text}`
                                        }]
                                    }]
                                })
                            }
                        );

                        if (!apiResponse.ok) {
                            const errorText = await apiResponse.text();
                            throw new Error(`Gemini API error (${apiResponse.status}): ${errorText}`);
                        }

                        const geminiData = await apiResponse.json();
                        let extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

                        if (!extractedText) {
                            throw new Error('No data returned from Gemini API');
                        }

                        // Clean up markdown if present
                        extractedText = extractedText.replace(/```json/g, '').replace(/```/g, '').trim();

                        let parsedData;
                        try {
                            parsedData = JSON.parse(extractedText);
                        } catch (e) {
                            throw new Error('Failed to parse AI response as JSON');
                        }

                        response = {
                            success: true,
                            data: { result: parsedData }
                        };
                    } catch (error: any) {
                        response = { success: false, error: error.message };
                    }
                    break;



                case MessageType.CHAT_WITH_PAGE:
                    try {
                        // 1. Get API Key
                        const storage = await new Promise<any>((resolve) => {
                            chrome.storage.local.get(['GEMINI_API_KEY'], resolve);
                        });
                        const apiKey = storage.GEMINI_API_KEY;

                        if (!apiKey) {
                            response = { success: false, error: 'No Gemini API key found.' };
                            break;
                        }

                        // 2. Get Page Text (Context)
                        const textResult = await executeTool('summarizePage', {});
                        if (!textResult.success || !textResult.data?.data) {
                            response = { success: false, error: 'Failed to get page context' };
                            break;
                        }
                        const pageData = textResult.data.data;
                        const userQuestion = message.payload.question;

                        // 3. Call Gemini API
                        const apiResponse = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{
                                        parts: [{
                                            text: `You are a helpful assistant answering questions about the current webpage.
                                            
                                            Page Title: ${pageData.title}
                                            
                                            Page Content:
                                            ${pageData.text.substring(0, 10000)}
                                            
                                            User Question: ${userQuestion}
                                            
                                            Answer concisely and accurately based ONLY on the page content provided above. If the answer is not in the text, say "I couldn't find that information on this page."`
                                        }]
                                    }]
                                })
                            }
                        );

                        if (!apiResponse.ok) {
                            const errorText = await apiResponse.text();
                            throw new Error(`Gemini API error (${apiResponse.status}): ${errorText}`);
                        }

                        const geminiData = await apiResponse.json();
                        const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

                        if (!answer) {
                            throw new Error('No answer returned from Gemini API');
                        }

                        response = {
                            success: true,
                            data: { answer }
                        };

                    } catch (error: any) {
                        response = { success: false, error: error.message };
                    }
                    break;

                default:
                    response = {
                        success: false,
                        error: `Unknown message type: ${message.type}`,
                    };
            }

            sendResponse(response);
        } catch (error: any) {
            sendResponse({
                success: false,
                error: error.message,
            });
        }
    })();

    return true; // async response
});

// ============================================================================
// EXTENSION LIFECYCLE
// ============================================================================

(globalThis as any).chrome.runtime.onInstalled.addListener((details: any) => {
    console.log('📦 Extension installed/updated:', details.reason);

    if (details.reason === 'install') {
        console.log('🎉 Welcome to Lumina-Agentic Web Assistant!');
    }
});

console.log('✅ Background service worker ready');

export { };
