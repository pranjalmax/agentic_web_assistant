// Content Script - Runs on web pages
// Provides DOM manipulation tools and selector picker

// Inlined message types to avoid external imports  
const MESSAGE_TYPES = {
    EXECUTE_TOOL: 'EXECUTE_TOOL',
    TOGGLE_PICKER: 'TOGGLE_PICKER',
    PICKER_RESULT: 'PICKER_RESULT',
    VALIDATE_SELECTOR: 'VALIDATE_SELECTOR',
} as const;

type ToolResult = { success: boolean; data?: any; error?: string };
type MessageResponse = { success: boolean; data?: any; error?: string };

console.log('🌐 Agentic Web Assistant - Content Script Loaded');

// ============================================================================
// DOM MANIPULATION TOOLS
// ============================================================================

/**
 * Navigate to a URL
 */
async function navigateTool(url: string): Promise<ToolResult> {
    try {
        window.location.href = url;
        await new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve(true);
            } else {
                window.addEventListener('load', () => resolve(true), { once: true });
            }
        });
        return { success: true, data: { url, readyState: document.readyState } };
    } catch (error: any) {
        return { success: false, error: `Navigation failed: ${error.message}` };
    }
}

/**
 * Click an element by selector
 */
async function clickTool(selector: string, nth?: number): Promise<ToolResult> {
    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
            return { success: false, error: `Element not found: ${selector}` };
        }
        const index = nth !== undefined ? nth : 0;
        const element = elements[index] as HTMLElement;
        if (!element) {
            return { success: false, error: `Element at index ${index} not found (found ${elements.length} total)` };
        }
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(resolve => setTimeout(resolve, 300));
        element.click();
        const tagName = element.tagName.toLowerCase();
        const textContent = element.textContent?.trim().slice(0, 50) || '';
        return { success: true, data: { selector, index, tagName, text: textContent } };
    } catch (error: any) {
        return { success: false, error: `Click failed: ${error.message}` };
    }
}

/**
 * Type text into an input element
 */
async function typeTool(selector: string, text: string, clear?: boolean): Promise<ToolResult> {
    try {
        const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
        if (!element) {
            return { success: false, error: `Element not found: ${selector}` };
        }
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(resolve => setTimeout(resolve, 200));
        element.focus();
        if (clear) element.value = '';
        element.value = clear ? text : element.value + text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true, data: { selector, text, finalValue: element.value } };
    } catch (error: any) {
        return { success: false, error: `Type failed: ${error.message}` };
    }
}



/**
 * Extract all tables from the page
 */
async function extractTablesTool(): Promise<ToolResult> {
    try {
        const tables = document.querySelectorAll('table');

        if (tables.length === 0) {
            return {
                success: true,
                data: {
                    found: 0,
                    tables: []
                }
            };
        }

        const extractedTables = Array.from(tables).map((table, index) => {
            // Extract headers
            const headers: string[] = [];
            const headerRows = table.querySelectorAll('thead tr, tr:first-child');

            if (headerRows.length > 0) {
                const headerCells = headerRows[0].querySelectorAll('th, td');
                headerCells.forEach(cell => {
                    headers.push(cell.textContent?.trim() || '');
                });
            }

            // Extract rows
            const rows: string[][] = [];
            const bodyRows = table.querySelectorAll('tbody tr, tr');

            bodyRows.forEach((row, rowIndex) => {
                // Skip header row if no thead
                if (rowIndex === 0 && !table.querySelector('thead') && headers.length > 0) {
                    return;
                }

                const cells = row.querySelectorAll('td, th');
                if (cells.length > 0) {
                    const rowData: string[] = [];
                    cells.forEach(cell => {
                        rowData.push(cell.textContent?.trim() || '');
                    });
                    rows.push(rowData);
                }
            });

            return {
                index: index + 1,
                headers: headers.length > 0 ? headers : null,
                rows: rows,
                rowCount: rows.length,
                columnCount: headers.length || (rows[0]?.length || 0)
            };
        });

        return {
            success: true,
            data: {
                found: tables.length,
                tables: extractedTables
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Find and categorize all links on the page
 */
async function findAllLinksTool(): Promise<ToolResult> {
    try {
        const links = document.querySelectorAll('a[href]');

        if (links.length === 0) {
            return {
                success: true,
                data: {
                    total: 0,
                    internal: 0,
                    external: 0,
                    links: [],
                    byDomain: {}
                }
            };
        }

        const currentDomain = window.location.hostname;
        const linkData: any[] = [];
        const byDomain: Record<string, number> = {};
        let internalCount = 0;
        let externalCount = 0;

        links.forEach((link: any) => {
            const href = link.href;
            const text = link.textContent?.trim() || '';

            try {
                const url = new URL(href);
                const domain = url.hostname;
                const isInternal = domain === currentDomain || domain === '';

                if (isInternal) {
                    internalCount++;
                } else {
                    externalCount++;
                    byDomain[domain] = (byDomain[domain] || 0) + 1;
                }

                linkData.push({
                    text: text.substring(0, 100), // Limit text length
                    href: href,
                    domain: domain || currentDomain,
                    isInternal: isInternal
                });
            } catch (e) {
                // Skip invalid URLs
            }
        });

        return {
            success: true,
            data: {
                total: linkData.length,
                internal: internalCount,
                external: externalCount,
                links: linkData,
                byDomain: byDomain
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Extract all prices/monetary values from the page
 */
async function extractPricesTool(): Promise<ToolResult> {
    try {
        const priceRegex = /(\$|€|£|¥)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(USD|EUR|GBP)/gi;

        const bodyText = document.body.innerText;
        const prices: any[] = [];
        const seenPrices = new Set<string>();

        const matches = bodyText.matchAll(priceRegex);

        for (const match of matches) {
            const fullMatch = match[0];
            let currency = '$';
            let numericPart = '';

            if (match[1]) {
                currency = match[1];
                numericPart = match[2];
            } else if (match[4]) {
                currency = match[4];
                numericPart = match[3];
            }

            if (fullMatch.includes('€')) currency = '€';
            else if (fullMatch.includes('£')) currency = '£';
            else if (fullMatch.includes('¥')) currency = '¥';

            const numericValue = parseFloat(numericPart.replace(/,/g, ''));
            if (numericValue <= 0) continue;

            const priceKey = `${currency}${numericValue}`;
            if (seenPrices.has(priceKey)) continue;
            seenPrices.add(priceKey);

            prices.push({
                text: fullMatch.trim(),
                currency: currency,
                amount: numericValue,
                formatted: `${currency}${numericValue.toFixed(2)}`
            });
        }

        prices.sort((a, b) => b.amount - a.amount);

        return {
            success: true,
            data: {
                found: prices.length,
                prices: prices.slice(0, 100)
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Find contact information (emails and phone numbers) on the page
 */
async function findContactInfoTool(): Promise<ToolResult> {
    try {
        const bodyText = document.body.innerText;

        // Email regex
        const emailRegex = /\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi;

        // Phone regex (various formats)
        const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

        const emails = new Set<string>();
        const phones = new Set<string>();

        // Extract emails
        const emailMatches = bodyText.matchAll(emailRegex);
        for (const match of emailMatches) {
            const email = match[0].toLowerCase();
            // Filter out common false positives
            if (!email.endsWith('.png') && !email.endsWith('.jpg') && !email.endsWith('.gif')) {
                emails.add(email);
            }
        }

        // Extract phone numbers
        const phoneMatches = bodyText.matchAll(phoneRegex);
        for (const match of phoneMatches) {
            const phone = match[0];
            // Only add if it looks like a real phone (has enough digits)
            if (phone.replace(/\D/g, '').length >= 10) {
                phones.add(phone);
            }
        }

        return {
            success: true,
            data: {
                emails: Array.from(emails),
                phones: Array.from(phones),
                emailCount: emails.size,
                phoneCount: phones.size,
                total: emails.size + phones.size
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Extract page text for AI summarization
 */
async function summarizePageTool(): Promise<ToolResult> {
    try {
        // Get page title and URL
        const title = document.title;
        const url = window.location.href;

        // Clone and clean the body
        const clone = document.body.cloneNode(true) as HTMLElement;

        // Remove scripts, styles, and navigation elements
        const selectorsToRemove = ['script', 'style', 'nav', 'header', 'footer', 'iframe', 'noscript'];
        selectorsToRemove.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Get clean text
        let pageText = clone.innerText || clone.textContent || '';

        // Clean up whitespace
        pageText = pageText
            .replace(/\s+/g, ' ')  // Multiple spaces to single space
            .replace(/\n\s*\n/g, '\n')  // Multiple newlines to single
            .trim();

        // Limit to ~3000 characters for API efficiency
        if (pageText.length > 3000) {
            pageText = pageText.substring(0, 3000) + '...';
        }

        return {
            success: true,
            data: {
                title,
                url,
                text: pageText
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Extract data from elements
 */
async function extractTool(selector: string, attr?: 'text' | 'href' | 'value'): Promise<ToolResult> {
    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
            return { success: false, error: `No elements found: ${selector}` };
        }
        const attribute = attr || 'text';
        const results: string[] = [];
        elements.forEach((element) => {
            let value = '';
            switch (attribute) {
                case 'text': value = element.textContent?.trim() || ''; break;
                case 'href': value = (element as HTMLAnchorElement).href || ''; break;
                case 'value': value = (element as HTMLInputElement).value || ''; break;
            }
            if (value) results.push(value);
        });
        return { success: true, data: results };
    } catch (error: any) {
        return { success: false, error: `Extract failed: ${error.message}` };
    }
}

/**
 * Wait for an element to appear
 */
async function waitForTool(selector: string, timeoutMs: number = 10000): Promise<ToolResult> {
    try {
        const startTime = Date.now();
        if (document.querySelector(selector)) {
            return { success: true, data: { selector, waitTime: 0 } };
        }
        const element = await new Promise<Element | null>((resolve) => {
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeoutMs);
        });
        const waitTime = Date.now() - startTime;
        if (element) {
            return { success: true, data: { selector, waitTime } };
        } else {
            return { success: false, error: `Element not found within ${timeoutMs}ms: ${selector}` };
        }
    } catch (error: any) {
        return { success: false, error: `WaitFor failed: ${error.message}` };
    }
}

/**
 * Scroll to element or position
 */
async function scrollToTool(target: string | number): Promise<ToolResult> {
    try {
        if (typeof target === 'number') {
            window.scrollTo({ top: target, behavior: 'smooth' });
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true, data: { scrollY: window.scrollY } };
        } else {
            const element = document.querySelector(target);
            if (!element) {
                return { success: false, error: `Element not found: ${target}` };
            }
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true, data: { selector: target, scrollY: window.scrollY } };
        }
    } catch (error: any) {
        return { success: false, error: `ScrollTo failed: ${error.message}` };
    }
}

/**
 * Validate a selector by highlighting all matches
 */
async function validateSelectorTool(selector: string): Promise<ToolResult> {
    try {
        // Remove existing validation highlights
        document.querySelectorAll('.agentic-validation-highlight').forEach(el => el.remove());

        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
            return { success: true, data: { count: 0, selector } };
        }

        // Scroll first match into view
        elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight all matches
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const highlight = document.createElement('div');
            highlight.className = 'agentic-validation-highlight';
            highlight.style.cssText = `
                position: fixed; top: ${rect.top}px; left: ${rect.left}px;
                width: ${rect.width}px; height: ${rect.height}px;
                border: 2px solid #10B981; background: rgba(16, 185, 129, 0.2);
                pointer-events: none; z-index: 999999;
                box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
                transition: all 0.2s ease;
            `;
            document.body.appendChild(highlight);
        });

        // Auto-remove after 3 seconds
        setTimeout(() => {
            document.querySelectorAll('.agentic-validation-highlight').forEach(el => {
                (el as HTMLElement).style.opacity = '0';
                setTimeout(() => el.remove(), 300);
            });
        }, 3000);

        return { success: true, data: { count: elements.length, selector } };
    } catch (error: any) {
        return { success: false, error: `Validation failed: ${error.message}` };
    }
}

// ============================================================================
// SELECTOR PICKER
// ============================================================================

let pickerActive = false;
let pickerOverlay: HTMLDivElement | null = null;
let currentHighlight: HTMLDivElement | null = null;
let selectedElement: Element | null = null;

/**
 * Generate a robust CSS selector for an element
 */
function generateSelector(element: Element): string {
    // 1. ID (if unique)
    if (element.id) {
        const idSelector = `#${element.id}`;
        if (document.querySelectorAll(idSelector).length === 1) return idSelector;
    }

    // 2. Data Attributes (often used for testing)
    const dataAttrs = ['data-testid', 'data-test', 'data-cy', 'data-qa'];
    for (const attr of dataAttrs) {
        if (element.hasAttribute(attr)) {
            const selector = `[${attr}="${element.getAttribute(attr)}"]`;
            if (document.querySelectorAll(selector).length === 1) return selector;
        }
    }

    // 3. Class Name (if unique and meaningful)
    if (element.className && typeof element.className === 'string') {
        const classes = element.className.trim().split(/\s+/).filter(c =>
            c && !c.match(/^(active|hover|focus|selected|open|show|hide)/) // Filter state classes
        );

        if (classes.length > 0) {
            // Try single class
            for (const cls of classes) {
                const selector = `.${cls}`;
                if (document.querySelectorAll(selector).length === 1) return selector;
            }

            // Try combined classes
            const classSelector = `.${classes.join('.')}`;
            if (document.querySelectorAll(classSelector).length === 1) return classSelector;

            // Try tag + class
            const tagClassSelector = `${element.tagName.toLowerCase()}${classSelector}`;
            if (document.querySelectorAll(tagClassSelector).length === 1) return tagClassSelector;
        }
    }

    // 4. Attributes (name, role, type, aria-label)
    const attrs = ['name', 'role', 'type', 'aria-label', 'placeholder'];
    for (const attr of attrs) {
        if (element.hasAttribute(attr)) {
            const selector = `${element.tagName.toLowerCase()}[${attr}="${element.getAttribute(attr)}"]`;
            if (document.querySelectorAll(selector).length === 1) return selector;
        }
    }

    // 5. Hierarchy / Path (Fallback)
    const parent = element.parentElement;
    if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element);
        const parentSelector = generateSelector(parent);
        return `${parentSelector} > :nth-child(${index + 1})`;
    }

    return element.tagName.toLowerCase();
}

/**
 * Create a visual highlight box with label
 */
function createHighlight(element: Element): HTMLDivElement {
    const rect = element.getBoundingClientRect();
    const selector = generateSelector(element);

    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed; top: ${rect.top}px; left: ${rect.left}px;
        width: ${rect.width}px; height: ${rect.height}px;
        border: 2px solid #22D3EE; background: rgba(34, 211, 238, 0.1);
        pointer-events: none; z-index: 999999;
        box-shadow: 0 0 20px rgba(34, 211, 238, 0.5); transition: all 0.1s ease;
    `;

    // Add label tag
    const label = document.createElement('div');
    label.textContent = selector;
    label.style.cssText = `
        position: absolute; bottom: 100%; left: 0;
        background: #0F172A; color: #22D3EE;
        padding: 4px 8px; font-family: monospace; font-size: 12px;
        border: 1px solid #22D3EE; border-bottom: none;
        border-radius: 4px 4px 0 0; white-space: nowrap;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
    `;
    container.appendChild(label);

    document.body.appendChild(container);
    return container;
}

function togglePicker(enabled: boolean): MessageResponse {
    const chromeApi = (globalThis as any).chrome;

    if (enabled && !pickerActive) {
        pickerActive = true;
        pickerOverlay = document.createElement('div');
        pickerOverlay.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      padding: 12px 24px; background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px); border: 1px solid rgba(34, 211, 238, 0.3);
      border-radius: 8px; color: #E2E8F0; font-family: Inter, sans-serif;
      font-size: 14px; z-index: 999998; box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
    `;
        pickerOverlay.textContent = '🎯 Hover over elements, click to select, ESC to cancel';
        document.body.appendChild(pickerOverlay);

        const handleMouseMove = (e: MouseEvent) => {
            const element = document.elementFromPoint(e.clientX, e.clientY);
            if (element && element !== pickerOverlay && element !== currentHighlight && !element.classList.contains('agentic-validation-highlight')) {
                if (currentHighlight) currentHighlight.remove();
                currentHighlight = createHighlight(element);
                selectedElement = element;
            }
        };

        const handleClick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectedElement) {
                const selector = generateSelector(selectedElement);
                chromeApi.runtime.sendMessage({
                    type: MESSAGE_TYPES.PICKER_RESULT,
                    payload: { selector },
                });
                cleanup();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                chromeApi.runtime.sendMessage({
                    type: MESSAGE_TYPES.PICKER_RESULT,
                    payload: { selector: null },
                });
                cleanup();
            }
        };

        const cleanup = () => {
            pickerActive = false;
            if (pickerOverlay) pickerOverlay.remove();
            if (currentHighlight) currentHighlight.remove();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('keydown', handleKeyDown);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('keydown', handleKeyDown);

        return { success: true, data: { enabled: true } };
    } else if (!enabled && pickerActive) {
        pickerActive = false;
        if (pickerOverlay) pickerOverlay.remove();
        if (currentHighlight) currentHighlight.remove();
        return { success: true, data: { enabled: false } };
    }
    return { success: true };
}

// ============================================================================
// MESSAGE LISTENER
// ============================================================================

(globalThis as any).chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (response: any) => void) => {
    console.log('📨 Content script received message:', message);

    if (message.type === MESSAGE_TYPES.EXECUTE_TOOL) {
        const { tool, args } = message.payload;
        const toolPromise = (async () => {
            switch (tool) {
                case 'navigate': return await navigateTool(args.url);
                case 'click': return await clickTool(args.selector, args.nth);
                case 'type': return await typeTool(args.selector, args.text, args.clear);
                case 'extract': return await extractTool(args.selector, args.attr);
                case 'extractTables': return await extractTablesTool();
                case 'findAllLinks': return await findAllLinksTool();
                case 'extractPrices': return await extractPricesTool();
                case 'findContactInfo': return await findContactInfoTool();
                case 'summarizePage': return await summarizePageTool();
                case 'waitFor': return await waitForTool(args.selector, args.timeoutMs);
                case 'scrollTo': return await scrollToTool(args.target);

                default: return { success: false, error: `Unknown tool: ${tool}` };
            }
        })();
        toolPromise
            .then((result) => sendResponse({ success: true, data: result }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === MESSAGE_TYPES.VALIDATE_SELECTOR) {
        validateSelectorTool(message.payload.selector)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === MESSAGE_TYPES.TOGGLE_PICKER) {
        const result = togglePicker(message.payload.enabled);
        sendResponse(result);
        return false;
    }

    return false;
});

console.log('✅ Content script tools ready');

export { };
