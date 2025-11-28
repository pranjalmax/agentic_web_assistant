import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Table, Link, DollarSign, Mail, Database, X, MessageSquare } from 'lucide-react';
import { MessageType } from '../../lib/messages';

interface Action {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    handler: () => void;
}

const ActionsTab: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [summary, setSummary] = useState<string>('');
    const [showScraperInput, setShowScraperInput] = useState(false);
    const [scrapeQuery, setScrapeQuery] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    const closeAllPanels = () => {
        setShowChat(false);
        setShowScraperInput(false);
        setResult(null);
        setSummary('');
        setExtractedData(null);
    };

    const toggleChat = () => {
        if (showChat) {
            setShowChat(false);
        } else {
            closeAllPanels();
            setShowChat(true);
        }
    };

    const toggleScraper = () => {
        if (showScraperInput) {
            setShowScraperInput(false);
        } else {
            closeAllPanels();
            setShowScraperInput(true);
        }
    };

    const handleChat = async () => {
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatLoading(true);

        try {
            const response = await (globalThis as any).chrome.runtime.sendMessage({
                type: MessageType.CHAT_WITH_PAGE,
                payload: { question: userMsg }
            });

            if (response.success && response.data.answer) {
                setChatMessages(prev => [...prev, { role: 'assistant', text: response.data.answer }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', text: `❌ ${response.error || 'Failed to get answer'}` }]);
            }
        } catch (error: any) {
            setChatMessages(prev => [...prev, { role: 'assistant', text: `❌ Error: ${error.message}` }]);
        } finally {
            setChatLoading(false);
        }
    };



    const handleSummarize = async () => {
        closeAllPanels();
        setLoading(true);

        try {
            // Send message to background script to handle API call
            const response = await (globalThis as any).chrome.runtime.sendMessage({
                type: MessageType.SUMMARIZE_PAGE,
                payload: {}
            });

            if (response.success && response.data.summary) {
                setSummary(response.data.summary);
                setResult({
                    success: true,
                    message: `✅ AI Summary Generated`,
                });
            } else {
                setResult({
                    success: false,
                    message: `❌ ${response.error || 'Failed to generate summary'}`,
                });
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: `❌ Error: ${error.message}`,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExtractTables = async () => {
        closeAllPanels();
        setLoading(true);

        try {
            const response = await (globalThis as any).chrome.runtime.sendMessage({
                type: MessageType.EXECUTE_TOOL,
                payload: { tool: 'extractTables', args: {} }
            });

            if (response.success && response.data.success) {
                const data = response.data.data;
                const found = data.found || 0;

                if (found === 0) {
                    setResult({
                        success: false,
                        message: '❌ No tables found on this page',
                    });
                    setExtractedData(null);
                } else {
                    const totalRows = data.tables.reduce((sum: number, t: any) => sum + t.rowCount, 0);
                    setExtractedData(data.tables);

                    setResult({
                        success: true,
                        message: `✅ Extracted ${found} table${found !== 1 ? 's' : ''}!`,
                        details: `Found ${totalRows} total rows across ${found} table${found !== 1 ? 's' : ''}.`
                    });
                }
            } else {
                setResult({
                    success: false,
                    message: `❌ ${response.error || response.data?.error || 'Failed to extract tables'}`,
                });
                setExtractedData(null);
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: `❌ Error: ${error.message}`,
            });
            setExtractedData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyData = async () => {
        if (!extractedData) return;

        try {
            const jsonData = JSON.stringify(extractedData, null, 2);
            await navigator.clipboard.writeText(jsonData);
            setResult({
                success: true,
                message: '✅ Copied data to clipboard!',
                details: 'Data copied as JSON'
            });
        } catch (error: any) {
            setResult({
                success: false,
                message: `❌ Failed to copy: ${error.message}`,
            });
        }
    };

    const handleFindLinks = async () => {
        closeAllPanels();
        setLoading(true);

        try {
            const response = await (globalThis as any).chrome.runtime.sendMessage({
                type: MessageType.EXECUTE_TOOL,
                payload: { tool: 'findAllLinks', args: {} }
            });

            if (response.success && response.data.success) {
                const data = response.data.data;
                const total = data.total || 0;

                if (total === 0) {
                    setResult({
                        success: false,
                        message: '❌ No links found on this page',
                    });
                    setExtractedData(null);
                } else {
                    setExtractedData(data);

                    setResult({
                        success: true,
                        message: `✅ Found ${total} link${total !== 1 ? 's' : ''}!`,
                        details: `${data.internal} internal, ${data.external} external from ${Object.keys(data.byDomain).length} domains`
                    });
                }
            } else {
                setResult({
                    success: false,
                    message: `❌ ${response.error || response.data?.error || 'Failed to find links'}`,
                });
                setExtractedData(null);
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: `❌ Error: ${error.message}`,
            });
            setExtractedData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleExtractPrices = async () => {
        closeAllPanels();
        setLoading(true);

        try {
            const response = await (globalThis as any).chrome.runtime.sendMessage({
                type: MessageType.EXECUTE_TOOL,
                payload: { tool: 'extractPrices', args: {} }
            });

            if (response.success && response.data.success) {
                const data = response.data.data;
                const found = data.found || 0;

                if (found === 0) {
                    setResult({
                        success: false,
                        message: '❌ No prices found on this page',
                    });
                    setExtractedData(null);
                } else {
                    setExtractedData(data.prices);

                    const highest = data.prices[0];
                    const lowest = data.prices[data.prices.length - 1];

                    setResult({
                        success: true,
                        message: `✅ Found ${found} price${found !== 1 ? 's' : ''}!`,
                        details: `Range: ${lowest.formatted} - ${highest.formatted}`
                    });
                }
            } else {
                setResult({
                    success: false,
                    message: `❌ ${response.error || response.data?.error || 'Failed to extract prices'}`,
                });
                setExtractedData(null);
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: `❌ Error: ${error.message}`,
            });
            setExtractedData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleFindContacts = async () => {
        closeAllPanels();
        setLoading(true);

        try {
            const response = await (globalThis as any).chrome.runtime.sendMessage({
                type: MessageType.EXECUTE_TOOL,
                payload: { tool: 'findContactInfo', args: {} }
            });

            if (response.success && response.data.success) {
                const data = response.data.data;
                const total = data.total || 0;

                if (total === 0) {
                    setResult({
                        success: false,
                        message: '❌ No contact info found on this page',
                    });
                    setExtractedData(null);
                } else {
                    setExtractedData(data);

                    setResult({
                        success: true,
                        message: `✅ Found ${total} contact${total !== 1 ? 's' : ''}!`,
                        details: `${data.emailCount} email${data.emailCount !== 1 ? 's' : ''}, ${data.phoneCount} phone${data.phoneCount !== 1 ? 's' : ''}`
                    });
                }
            } else {
                setResult({
                    success: false,
                    message: `❌ ${response.error || response.data?.error || 'Failed to find contact info'}`,
                });
                setExtractedData(null);
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: `❌ Error: ${error.message}`,
            });
            setExtractedData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleScrape = async () => {
        if (!scrapeQuery.trim()) return;

        setLoading(true);
        setResult(null);
        setExtractedData(null);
        setSummary('');

        try {
            const response = await (globalThis as any).chrome.runtime.sendMessage({
                type: MessageType.AI_DATA_SCRAPE,
                payload: { query: scrapeQuery }
            });

            if (response.success && response.data.result) {
                const data = response.data.result;
                setExtractedData(data);
                setResult({
                    success: true,
                    message: `✅ Scraped ${data.length} items!`,
                    details: `Found structured data for "${scrapeQuery}"`
                });
                setShowScraperInput(false); // Close input on success
            } else {
                setResult({
                    success: false,
                    message: `❌ ${response.error || 'Failed to scrape data'}`,
                });
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: `❌ Error: ${error.message}`,
            });
        } finally {
            setLoading(false);
        }
    };

    const actions: Action[] = [
        {
            id: 'ai-scrape',
            icon: <Database className="w-6 h-6" />,
            title: 'AI Data Scraper',
            description: 'Extract structured data (e.g. "job titles")',
            handler: toggleScraper
        },
        {
            id: 'chat',
            icon: <MessageSquare className="w-6 h-6" />,
            title: 'Chat with Page',
            description: 'Ask questions about the page content',
            handler: toggleChat
        },

        {
            id: 'summarize',
            icon: <FileText className="w-6 h-6" />,
            title: 'AI Summary',
            description: 'Get an AI-generated summary using Gemini',
            handler: handleSummarize
        },
        {
            id: 'tables',
            icon: <Table className="w-6 h-6" />,
            title: 'Extract Tables',
            description: 'Find and extract all data tables',
            handler: handleExtractTables
        },
        {
            id: 'links',
            icon: <Link className="w-6 h-6" />,
            title: 'Find All Links',
            description: 'Categorize and list all links on this page',
            handler: handleFindLinks
        },
        {
            id: 'prices',
            icon: <DollarSign className="w-6 h-6" />,
            title: 'Extract Prices',
            description: 'Find all prices and monetary values',
            handler: handleExtractPrices
        },
        {
            id: 'contacts',
            icon: <Mail className="w-6 h-6" />,
            title: 'Find Contact Info',
            description: 'Extract emails and phone numbers',
            handler: handleFindContacts
        },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <motion.div
                className="glass-card p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <h2 className="text-lg font-semibold text-gray-200">Smart Actions</h2>
                </div>
                <p className="text-xs text-gray-400">
                    One-click automations that work on any webpage
                </p>
            </motion.div>

            {/* Scraper Input */}
            {showScraperInput && (
                <motion.div
                    className="glass-card p-4 border-cyan-500/50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-cyan-400">What to extract?</label>
                        <button onClick={() => setShowScraperInput(false)} className="text-gray-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={scrapeQuery}
                            onChange={(e) => setScrapeQuery(e.target.value)}
                            placeholder="e.g. job titles, prices, emails..."
                            className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                        />
                        <button
                            onClick={handleScrape}
                            disabled={loading || !scrapeQuery.trim()}
                            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                        >
                            {loading ? '...' : 'Go'}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Chat Interface */}
            {showChat && (
                <motion.div
                    className="glass-card p-4 border-cyan-500/50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                        <h3 className="text-sm font-medium text-cyan-400">Chat with Page</h3>
                        <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="h-48 overflow-y-auto mb-3 space-y-2 pr-1 custom-scrollbar">
                        {chatMessages.length === 0 && (
                            <p className="text-xs text-gray-500 text-center mt-4">Ask anything about this page...</p>
                        )}
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${msg.role === 'user'
                                    ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                                    : 'bg-white/10 text-gray-200 border border-white/5'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 rounded-lg px-3 py-2">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                        />
                        <button
                            onClick={handleChat}
                            disabled={chatLoading || !chatInput.trim()}
                            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Result Display */}
            {result && (
                <motion.div
                    className={`glass-card p-3 ${result.success ? 'border-green-500/30' : 'border-yellow-500/30'}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <p className="text-sm text-gray-200">{result.message}</p>
                    {result.details && (
                        <p className="text-xs text-gray-400 mt-1 whitespace-pre-line">{result.details}</p>
                    )}
                    {summary && (
                        <div className="mt-3 p-3 bg-black/30 rounded border border-cyan-500/30">
                            <p className="text-xs text-gray-300 whitespace-pre-wrap">{summary}</p>
                        </div>
                    )}
                    {extractedData && Array.isArray(extractedData) && extractedData.length > 0 && (
                        <div className="mt-3 overflow-x-auto max-h-60 rounded border border-white/10">
                            <table className="w-full text-xs text-left text-gray-300">
                                <thead className="bg-white/10 text-cyan-400 sticky top-0">
                                    <tr>
                                        {Object.keys(extractedData[0]).map((key) => (
                                            <th key={key} className="px-2 py-1.5 font-medium border-b border-white/10">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {extractedData.slice(0, 10).map((item: any, i: number) => (
                                        <tr key={i} className="hover:bg-white/5">
                                            {Object.values(item).map((val: any, j: number) => (
                                                <td key={j} className="px-2 py-1.5 truncate max-w-[150px]">
                                                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {extractedData.length > 10 && (
                                <div className="px-2 py-1 text-xs text-gray-500 text-center bg-black/20">
                                    And {extractedData.length - 10} more items...
                                </div>
                            )}
                        </div>
                    )}
                    {extractedData && (
                        <button
                            onClick={handleCopyData}
                            className="mt-2 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded text-xs text-cyan-300 transition-all w-full"
                        >
                            📋 Copy All Data ({Array.isArray(extractedData) ? extractedData.length : 'JSON'})
                        </button>
                    )}
                </motion.div>
            )}

            {/* Action Cards */}
            <div className="space-y-2">
                {actions.map((action, index) => (
                    <motion.div
                        key={action.id}
                        className="glass-card p-4 hover:bg-white/5 transition-all cursor-pointer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={action.handler}
                    >
                        <div className="flex items-start gap-3">
                            <div className="text-cyan-400 flex-shrink-0">
                                {action.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-200 mb-1">
                                    {action.title}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {action.description}
                                </p>
                            </div>
                            {loading && result === null ? (
                                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <div className="text-gray-500 text-xl">→</div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ActionsTab;
