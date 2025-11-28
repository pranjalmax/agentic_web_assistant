import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, Clock, Settings } from 'lucide-react';
import RunTab from './components/RunTab';
import ActionsTab from './components/ActionsTab';
import TracesTab from './components/TracesTab';
import ParticleBackground from './components/ParticleBackground';

type TabType = 'run' | 'actions' | 'traces';

function App() {
    const [activeTab, setActiveTab] = useState<TabType>('run');

    const tabs = [
        { id: 'run' as TabType, label: 'Run', icon: Play },
        { id: 'actions' as TabType, label: 'Actions', icon: Sparkles },
        { id: 'traces' as TabType, label: 'Traces', icon: Clock },
    ];

    return (
        <div className="relative w-full h-full bg-base-bg overflow-hidden">
            {/* Particle Background */}
            <ParticleBackground />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <header className="px-6 py-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{
                                    rotate: [0, 10, -10, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                }}
                            >
                                <Sparkles className="w-6 h-6 text-accent-violet" />
                            </motion.div>
                            <h1 className="text-xl font-semibold gradient-text animate-gradient bg-[length:200%_auto]">
                                Lumina-Agentic Web Assistant
                            </h1>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => chrome.runtime.openOptionsPage()}
                            className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
                        >
                            <Settings className="w-4 h-4 text-base-muted" />
                        </motion.button>
                    </div>
                </header>

                {/* Tab Navigation */}
                <nav className="px-6 pt-4">
                    <div className="flex gap-2 glass rounded-card p-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <motion.button
                                    key={tab.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                    transition-all duration-200 relative
                    ${isActive
                                            ? 'text-base-text'
                                            : 'text-base-muted hover:text-base-text'
                                        }
                  `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-gradient-to-r from-accent-violet/20 to-accent-cyan/20 rounded-lg"
                                            style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }}
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <Icon className="w-4 h-4 relative z-10" />
                                    <span className="text-sm font-medium relative z-10">{tab.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </nav>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full py-4"
                        >
                            {activeTab === 'run' && <RunTab />}
                            {activeTab === 'actions' && <ActionsTab />}
                            {activeTab === 'traces' && <TracesTab />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default App;
