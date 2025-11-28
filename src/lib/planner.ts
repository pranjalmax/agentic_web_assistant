// Template-based ReAct Planner
// Generates action sequences for common web automation tasks

export interface ReActStep {
    step: number;
    thought: string;
    action: {
        tool: string;
        args: any;
    };
    observation?: string;
}







/**
 * Try to construct a URL from a website name mentioned in the goal
 */
function constructUrlFromGoal(goal: string): string | undefined {
    const lowerGoal = goal.toLowerCase();

    // Common website patterns
    const patterns = [
        { match: /rotten tomatoes/i, url: 'https://www.rottentomatoes.com' },
        { match: /imdb/i, url: 'https://www.imdb.com' },
        { match: /github/i, url: 'https://github.com' },
        { match: /stack overflow/i, url: 'https://stackoverflow.com' },
        { match: /reddit/i, url: 'https://www.reddit.com' },
        { match: /twitter/i, url: 'https://twitter.com' },
        { match: /youtube/i, url: 'https://www.youtube.com' },
        { match: /amazon/i, url: 'https://www.amazon.com' },
        { match: /wikipedia/i, url: 'https://en.wikipedia.org' },
        { match: /linkedin/i, url: 'https://www.linkedin.com' },
    ];

    for (const pattern of patterns) {
        if (pattern.match.test(lowerGoal)) {
            return pattern.url;
        }
    }

    // Try to extract domain-like text (e.g., "example.com" or "google.com")
    const domainMatch = lowerGoal.match(/\b([a-z0-9-]+\.(com|org|net|io|co|dev))\b/);
    if (domainMatch) {
        return `https://${domainMatch[0]}`;
    }

    return undefined;
}

export function goalToSteps(goal: string): ReActStep[] {
    const lowerGoal = goal.toLowerCase();

    if (lowerGoal.includes('fill') && lowerGoal.includes('form')) {
        let url = goal.match(/https?:\/\/[^\s]+/)?.[0];
        if (!url) {
            url = constructUrlFromGoal(goal);
        }

        if (!url) {
            return [
                { step: 1, thought: 'Error: No URL found in goal. Please provide a URL like "Fill form at https://example.com"', action: { tool: 'waitFor', args: { selector: 'body', timeoutMs: 100 } } },
            ];
        }

        return [
            { step: 1, thought: `Navigate to ${url}`, action: { tool: 'navigate', args: { url } } },
            { step: 2, thought: 'Wait for form fields', action: { tool: 'waitFor', args: { selector: 'form, input', timeoutMs: 5000 } } },
        ];
    }

    if (lowerGoal.includes('click')) {
        const selectorMatch = goal.match(/['"]([^'"]+)['"]/);
        return [
            { step: 1, thought: `Click the element: ${selectorMatch ? selectorMatch[1] : 'button'}`, action: { tool: 'click', args: { selector: selectorMatch ? selectorMatch[1] : 'button' } } },
        ];
    }

    if (lowerGoal.includes('extract') || lowerGoal.includes('scrape')) {
        let url = goal.match(/https?:\/\/[^\s]+/)?.[0];
        if (!url) {
            url = constructUrlFromGoal(goal);
        }

        if (!url) {
            return [
                { step: 1, thought: 'Error: No URL or website found. Please include a URL like "Extract from https://example.com" or mention a website like "Extract from Google"', action: { tool: 'waitFor', args: { selector: 'body', timeoutMs: 100 } } },
            ];
        }

        return [
            { step: 1, thought: `Navigate to ${url}`, action: { tool: 'navigate', args: { url } } },
            { step: 2, thought: 'Wait for content to load', action: { tool: 'waitFor', args: { selector: 'body', timeoutMs: 5000 } } },
            { step: 3, thought: 'Extract content from the page', action: { tool: 'extract', args: { selector: 'h1, h2, h3, p', attr: 'text' } } },
        ];
    }

    return [
        { step: 1, thought: 'I need more information to complete this goal', action: { tool: 'waitFor', args: { selector: 'body', timeoutMs: 1000 } } },
    ];
}
