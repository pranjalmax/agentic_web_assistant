// Message Protocol for Extension Communication
// Typed messages for popup ↔ background ↔ content script

export enum MessageType {
    // Tool execution
    EXECUTE_TOOL = 'EXECUTE_TOOL',
    TOOL_RESULT = 'TOOL_RESULT',

    // Agent control
    START_AGENT = 'START_AGENT',
    STOP_AGENT = 'STOP_AGENT',
    AGENT_STATUS = 'AGENT_STATUS',

    // Trace management
    GET_TRACE = 'GET_TRACE',
    SAVE_TRACE = 'SAVE_TRACE',
    CLEAR_TRACES = 'CLEAR_TRACES',

    // Selector picker
    TOGGLE_PICKER = 'TOGGLE_PICKER',
    PICKER_RESULT = 'PICKER_RESULT',
    VALIDATE_SELECTOR = 'VALIDATE_SELECTOR',





    // AI Summarization
    SUMMARIZE_PAGE = 'SUMMARIZE_PAGE',

    // AI Data Scraper
    AI_DATA_SCRAPE = 'AI_DATA_SCRAPE',



    // Chat with Page
    CHAT_WITH_PAGE = 'CHAT_WITH_PAGE',
}

// Tool definitions
export type ToolName = 'navigate' | 'click' | 'type' | 'extract' | 'waitFor' | 'scrollTo';

export interface ToolArgs {
    navigate: { url: string };
    click: { selector: string; nth?: number };
    type: { selector: string; text: string; clear?: boolean };
    extract: { selector: string; attr?: 'text' | 'href' | 'value' };
    waitFor: { selector: string; timeoutMs?: number };
    scrollTo: { target: string | number };

}

export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
}

// Response wrapper
export interface MessageResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

// Utility to send messages with timeout
export async function sendMessage<T = any>(
    message: any,
    options?: { tabId?: number; timeout?: number }
): Promise<MessageResponse<T>> {
    const timeout = options?.timeout || 30000;
    const chromeApi = (globalThis as any).chrome;

    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
            resolve({
                success: false,
                error: 'Message timeout',
            });
        }, timeout);

        const sendFn = options?.tabId
            ? (msg: any, cb: any) => chromeApi.tabs.sendMessage(options.tabId!, msg, cb)
            : (msg: any, cb: any) => chromeApi.runtime.sendMessage(msg, cb);

        sendFn(message, (response: MessageResponse<T>) => {
            clearTimeout(timeoutId);

            if (chromeApi.runtime.lastError) {
                resolve({
                    success: false,
                    error: chromeApi.runtime.lastError.message,
                });
            } else {
                resolve(response || { success: true });
            }
        });
    });
}

// Get active tab ID
export async function getActiveTabId(): Promise<number | null> {
    try {
        const chromeApi = (globalThis as any).chrome;
        const [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
        return tab?.id || null;
    } catch (error) {
        console.error('Failed to get active tab:', error);
        return null;
    }
}
