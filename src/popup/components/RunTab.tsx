import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Zap, MousePointer, CheckCircle, XCircle } from 'lucide-react';

const RunTab = () => {
    const [goal, setGoal] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [dryRun, setDryRun] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(0);
    const [currentGoal, setCurrentGoal] = useState('');
    const [lastResult, setLastResult] = useState<{ success: boolean; data: any } | null>(null);

    // Poll agent status
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await (globalThis as any).chrome.runtime.sendMessage({
                    type: 'AGENT_STATUS',
                });
                if (response && response.success && response.data) {
                    const wasRunning = isRunning;
                    const nowRunning = response.data.running;

                    setIsRunning(nowRunning);
                    setCurrentStep(response.data.currentStep || 0);
                    setTotalSteps(response.data.totalSteps || 0);
                    setCurrentGoal(response.data.goal || '');

                    // If just finished, fetch the trace to show results
                    if (wasRunning && !nowRunning) {
                        const traceResponse = await (globalThis as any).chrome.runtime.sendMessage({
                            type: 'GET_TRACE',
                        });
                        if (traceResponse.success && traceResponse.data?.trace) {
                            const trace = traceResponse.data.trace;
                            if (trace.length > 0) {
                                const lastStep = trace[trace.length - 1];
                                const isSuccess = lastStep.observation?.includes('✅');

                                // Try to extract the actual data from observation
                                let displayData = lastStep.observation || '';
                                if (isSuccess && lastStep.observation) {
                                    // Extract JSON from "✅ Success: {...}" format
                                    const jsonMatch = lastStep.observation.match(/Success: (.+)$/);
                                    if (jsonMatch) {
                                        try {
                                            const parsedData = JSON.parse(jsonMatch[1]);
                                            displayData = JSON.stringify(parsedData, null, 2);
                                        } catch {
                                            // If parsing fails, show as-is
                                            displayData = jsonMatch[1];
                                        }
                                    }
                                }

                                setLastResult({
                                    success: isSuccess,
                                    data: displayData
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                // Silently ignore connection errors
            }
        }, 500);

        return () => clearInterval(interval);
    }, [isRunning]);

    const handleStart = async () => {
        if (!goal.trim() && !dryRun) {
            alert('Please enter a goal');
            return;
        }

        setLastResult(null); // Clear previous results

        try {
            const response = await (globalThis as any).chrome.runtime.sendMessage({
                type: 'START_AGENT',
                payload: {
                    goal: goal.trim() || 'Test goal',
                    dryRun,
                    maxSteps: 20,
                },
            });

            if (!response.success) {
                alert(`Failed to start agent: ${response.error}`);
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleStop = async () => {
        try {
            await (globalThis as any).chrome.runtime.sendMessage({
                type: 'STOP_AGENT',
            });
        } catch (error: any) {
            console.error('Failed to stop agent:', error);
        }
    };

    const handlePickerToggle = async () => {
        try {
            await (globalThis as any).chrome.runtime.sendMessage({
                type: 'TOGGLE_PICKER',
                payload: { enabled: true },
            });
        } catch (error: any) {
            console.error('Failed to toggle picker:', error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Goal Input */}
            <motion.div
                className="glass-card p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    🎯 Goal or Task
                </label>
                <textarea
                    className="input-field w-full h-24 resize-none"
                    placeholder="e.g., Click 'Login' button, Fill contact form at https://example.com, Extract all headings..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    disabled={isRunning}
                />

                {/* Dry Run Toggle */}
                <label className="flex items-center gap-2 mt-3 text-sm text-gray-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={dryRun}
                        onChange={(e) => setDryRun(e.target.checked)}
                        disabled={isRunning}
                        className="rounded"
                    />
                    <Zap className="w-4 h-4" />
                    Dry Run (simulate without executing)
                </label>
            </motion.div>

            {/* Status Display */}
            {isRunning && (
                <motion.div
                    className="glass-card p-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-cyan-400">
                            Running...
                        </span>
                        <span className="text-xs text-gray-400">
                            Step {currentStep}/{totalSteps}
                        </span>
                    </div>
                    <div className="text-xs text-gray-300 mb-2">
                        {currentGoal}
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </motion.div>
            )}

            {/* Results Display */}
            <AnimatePresence>
                {!isRunning && lastResult && (
                    <motion.div
                        className="glass-card p-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="flex items-start gap-3">
                            {lastResult.success ? (
                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-200 mb-1">
                                    {lastResult.success ? 'Task Completed' : 'Task Failed'}
                                </h3>
                                <div className="text-xs text-gray-300 bg-black/20 p-3 rounded-lg font-mono overflow-auto max-h-40">
                                    {lastResult.data}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    💡 Check the <strong>Traces</strong> tab for full execution details
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Buttons */}
            <motion.div
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                {!isRunning ? (
                    <button onClick={handleStart} className="btn-primary">
                        <Play className="w-4 h-4" />
                        Start Agent
                    </button>
                ) : (
                    <button onClick={handleStop} className="btn-danger">
                        <Square className="w-4 h-4" />
                        Stop
                    </button>
                )}

                <button onClick={handlePickerToggle} className="btn-secondary">
                    <MousePointer className="w-4 h-4" />
                    Pick Element
                </button>
            </motion.div>

            {/* Quick Examples */}
            <motion.div
                className="glass-card p-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="text-xs text-gray-400 mb-2">Quick examples:</div>
                <div className="space-y-1">
                    {[
                        'Extract h1, h2, h3 from wikipedia',
                        'Extract from rotten tomatoes',
                        'Scrape github trending',
                    ].map((example, i) => (
                        <button
                            key={i}
                            onClick={() => setGoal(example)}
                            disabled={isRunning}
                            className="text-xs text-left text-cyan-400 hover:text-cyan-300 block w-full truncate"
                        >
                            • {example}
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default RunTab;
