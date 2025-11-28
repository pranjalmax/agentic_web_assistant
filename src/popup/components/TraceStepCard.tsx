import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Copy, Terminal } from 'lucide-react';
import { ReActStep } from '../../lib/planner';

interface TraceStepCardProps {
    step: ReActStep;
    isLast: boolean;
}

export default function TraceStepCard({ step, isLast }: TraceStepCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const observation = step.observation || '';
    const isSuccess = observation.includes('✅');
    const isError = observation.includes('❌');
    const isDryRun = observation.includes('[DRY RUN]');

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(step, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                relative pl-4 pb-6 border-l-2 
                ${isLast ? 'border-transparent' : 'border-white/10'}
                ${isSuccess ? 'border-l-accent-mint' : ''}
                ${isError ? 'border-l-accent-error' : ''}
                ${isDryRun ? 'border-l-accent-warn' : ''}
            `}
        >
            {/* Step Badge */}
            <div className={`
                absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-base-bg
                ${isSuccess ? 'bg-accent-mint' : ''}
                ${isError ? 'bg-accent-error' : ''}
                ${isDryRun ? 'bg-accent-warn' : ''}
                ${!isSuccess && !isError && !isDryRun ? 'bg-base-muted' : ''}
            `} />

            <div className="glass-card p-3 hover:bg-white/5 transition-colors">
                {/* Header */}
                <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-base-muted uppercase tracking-wider">
                                Step {step.step}
                            </span>
                            {isSuccess && <CheckCircle className="w-3 h-3 text-accent-mint" />}
                            {isError && <XCircle className="w-3 h-3 text-accent-error" />}
                        </div>

                        {/* Thought */}
                        <p className="text-sm text-base-muted italic mb-2">
                            "{step.thought}"
                        </p>

                        {/* Action */}
                        <div className="flex items-center gap-2 font-mono text-xs text-accent-cyan bg-black/30 px-2 py-1 rounded w-fit">
                            <Terminal className="w-3 h-3" />
                            <span>{step.action.tool}</span>
                            <span className="text-base-muted/70">
                                {JSON.stringify(step.action.args).slice(0, 30)}
                                {JSON.stringify(step.action.args).length > 30 ? '...' : ''}
                            </span>
                        </div>
                    </div>

                    <button className="text-base-muted hover:text-white transition-colors ml-2">
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                                {/* Observation */}
                                <div>
                                    <h4 className="text-xs font-semibold text-base-muted mb-1">Observation</h4>
                                    <div className={`
                                        text-xs p-2 rounded bg-black/30 font-mono break-all
                                        ${isSuccess ? 'text-accent-mint/90' : ''}
                                        ${isError ? 'text-accent-error/90' : ''}
                                    `}>
                                        {step.observation}
                                    </div>
                                </div>

                                {/* Full Data */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-xs font-semibold text-base-muted">Full Data</h4>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                                            className="flex items-center gap-1 text-[10px] text-base-muted hover:text-white transition-colors"
                                        >
                                            <Copy className="w-3 h-3" />
                                            {copied ? 'Copied!' : 'Copy JSON'}
                                        </button>
                                    </div>
                                    <pre className="text-[10px] text-base-muted/70 bg-black/50 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(step, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
