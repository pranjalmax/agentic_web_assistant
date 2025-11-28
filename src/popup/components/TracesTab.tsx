import { useState, useEffect } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { MessageType, sendMessage } from '../../lib/messages';
import { ReActStep } from '../../lib/planner';
import TraceStepCard from './TraceStepCard';

export default function TracesTab() {
    const [trace, setTrace] = useState<ReActStep[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrace = async () => {
        try {
            const response = await sendMessage({ type: MessageType.GET_TRACE });
            if (response.success && response.data) {
                setTrace(response.data.trace || []);
            } else {
                // If fails (e.g. background not ready), just show empty
                console.warn('Failed to fetch trace:', response.error);
            }
        } catch (err) {
            console.error('Error fetching trace:', err);
        } finally {
            setLoading(false);
        }
    };

    // Poll for updates
    useEffect(() => {
        fetchTrace();
        const interval = setInterval(fetchTrace, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleExportJSON = () => {
        const json = JSON.stringify(trace, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-trace-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopyMarkdown = () => {
        const md = `# Agent Execution Trace
Generated: ${new Date().toLocaleString()}

${trace.map(step => `
## Step ${step.step}: ${step.thought}
**Action**: \`${step.action.tool}\`
\`\`\`json
${JSON.stringify(step.action.args, null, 2)}
\`\`\`
**Observation**:
> ${step.observation}
`).join('\n')}
`;
        navigator.clipboard.writeText(md);
        // Could add toast notification here
    };

    if (loading && trace.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-base-muted">
                <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                <p>Loading traces...</p>
            </div>
        );
    }

    if (trace.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-base-muted text-center px-6">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Traces Yet</h3>
                <p className="text-sm">Run an agent task to see the execution steps here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-between sticky top-0 bg-base-bg/80 backdrop-blur-md z-10 py-2 -mx-2 px-2 border-b border-white/5">
                <div className="text-sm font-medium text-base-muted">
                    {trace.length} Steps
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopyMarkdown}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-base-muted hover:text-white"
                        title="Copy as Markdown"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleExportJSON}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-base-muted hover:text-white"
                        title="Export JSON"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Trace List */}
            <div className="space-y-0 pl-2">
                {trace.map((step, index) => (
                    <TraceStepCard
                        key={step.step}
                        step={step}
                        isLast={index === trace.length - 1}
                    />
                ))}
            </div>
        </div>
    );
}
