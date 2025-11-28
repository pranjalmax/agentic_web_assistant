import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Settings, Database, Save, Key, ExternalLink, Trash2, User } from 'lucide-react';
import ParticleBackground from '../popup/components/ParticleBackground';

import { MessageType, sendMessage } from '../lib/messages';

type SectionType = 'general' | 'profile' | 'storage';

function App() {
    const [activeSection, setActiveSection] = useState<SectionType>('general');
    const [apiKey, setApiKey] = useState('');
    const [maxSteps, setMaxSteps] = useState(20);
    const [stepTimeout, setStepTimeout] = useState(10000);
    const [saved, setSaved] = useState(false);
    const [cleared, setCleared] = useState(false);

    // User Profile
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: ''
    });

    useEffect(() => {
        // Load settings and profile
        chrome.storage.local.get(['GEMINI_API_KEY', 'agentSettings', 'userProfile'], (result) => {
            if (result.GEMINI_API_KEY) setApiKey(result.GEMINI_API_KEY);
            if (result.agentSettings) {
                setMaxSteps(result.agentSettings.maxSteps || 20);
                setStepTimeout(result.agentSettings.stepTimeout || 10000);
            }
            if (result.userProfile) {
                setProfile(result.userProfile);
            }
        });
    }, []);

    const handleSave = () => {
        chrome.storage.local.set({
            GEMINI_API_KEY: apiKey,
            agentSettings: {
                maxSteps,
                stepTimeout
            }
        }, () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    const handleSaveProfile = () => {
        chrome.storage.local.set({ userProfile: profile }, () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    const handleClearProfile = () => {
        const emptyProfile = {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            country: ''
        };
        setProfile(emptyProfile);
        chrome.storage.local.set({ userProfile: emptyProfile }, () => {
            setCleared(true);
            setTimeout(() => setCleared(false), 2000);
        });
    };

    const handleClearTraces = async () => {
        try {
            await sendMessage({ type: MessageType.CLEAR_TRACES });
            setCleared(true);
            setTimeout(() => setCleared(false), 2000);
        } catch (error) {
            console.error('Failed to clear traces:', error);
        }
    };

    const sections = [
        { id: 'general' as SectionType, label: 'General', icon: Settings },
        { id: 'profile' as SectionType, label: 'Profile', icon: User },
        { id: 'storage' as SectionType, label: 'Storage', icon: Database },
    ];

    return (
        <div className="relative min-h-screen bg-base-bg text-base-text font-sans">
            <ParticleBackground />

            <div className="relative z-10 max-w-5xl mx-auto px-8 py-12">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-8 h-8 text-accent-violet" />
                        <h1 className="text-3xl font-semibold gradient-text animate-gradient bg-[length:200%_auto]">
                            Lumina-Agentic Web Assistant
                        </h1>
                    </div>
                    <p className="text-base-muted text-sm">
                        Configure your AI-powered web automation assistant
                    </p>
                </header>

                <div className="flex gap-6">
                    {/* Sidebar */}
                    <aside className="w-48 space-y-2">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;

                            return (
                                <motion.button
                                    key={section.id}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 text-left
                    ${isActive
                                            ? 'glass bg-gradient-to-r from-accent-violet/20 to-accent-cyan/20 text-base-text shadow-glow-violet'
                                            : 'text-base-muted hover:text-base-text hover:bg-white/5'
                                        }
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{section.label}</span>
                                </motion.button>
                            );
                        })}
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="glass rounded-card p-6 space-y-6"
                        >
                            {activeSection === 'general' && (
                                <>
                                    <h2 className="text-xl font-semibold text-base-text">General Settings</h2>

                                    <div className="space-y-6">
                                        {/* API Key Section */}
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <label className="flex items-center gap-2 text-sm font-medium text-base-text mb-1">
                                                        <Key className="w-4 h-4 text-accent-cyan" />
                                                        Gemini API Key
                                                    </label>
                                                    <p className="text-xs text-base-muted">
                                                        Required for the AI agent to function.
                                                    </p>
                                                </div>
                                                <a
                                                    href="https://aistudio.google.com/app/apikey"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs text-accent-cyan hover:underline"
                                                >
                                                    Get free key <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                            <input
                                                type="password"
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder="AIzaSy..."
                                                className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-cyan transition-colors font-mono text-sm"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-base-text mb-2">
                                                    Max Steps per Run
                                                </label>
                                                <input
                                                    type="number"
                                                    value={maxSteps}
                                                    onChange={(e) => setMaxSteps(Number(e.target.value))}
                                                    className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-violet transition-colors"
                                                />
                                                <p className="text-xs text-base-muted mt-1">
                                                    Limit steps to prevent infinite loops
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-base-text mb-2">
                                                    Step Timeout (ms)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={stepTimeout}
                                                    onChange={(e) => setStepTimeout(Number(e.target.value))}
                                                    className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-violet transition-colors"
                                                />
                                                <p className="text-xs text-base-muted mt-1">
                                                    Max wait time per action
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSave}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-accent-violet to-accent-cyan rounded-lg text-white font-medium shadow-glow-violet"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Settings
                                        </motion.button>
                                        {saved && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-sm text-accent-mint flex items-center gap-1"
                                            >
                                                Saved successfully!
                                            </motion.span>
                                        )}
                                    </div>
                                </>
                            )}

                            {activeSection === 'profile' && (
                                <>
                                    <h2 className="text-xl font-semibold text-base-text">User Profile</h2>
                                    <p className="text-sm text-base-muted mb-6">
                                        Save your personal information for quick form auto-fill.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-base-text mb-2">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profile.firstName}
                                                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                                    placeholder="John"
                                                    className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-cyan transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-base-text mb-2">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profile.lastName}
                                                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                                    placeholder="Doe"
                                                    className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-cyan transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-base-text mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={profile.email}
                                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                    placeholder="john@example.com"
                                                    className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-cyan transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-base-text mb-2">
                                                    Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={profile.phone}
                                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                    placeholder="+1 (555) 123-4567"
                                                    className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-cyan transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-base-text mb-2">
                                                Address
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.address}
                                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                                placeholder="123 Main Street"
                                                className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-cyan transition-colors"
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-base-text mb-2">
                                                    City
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profile.city}
                                                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                                    placeholder="New York"
                                                    className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-cyan transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-base-text mb-2">
                                                    State
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profile.state}
                                                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                                                    placeholder="NY"
                                                    className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-cyan transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-base-text mb-2">
                                                    ZIP Code
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profile.zip}
                                                    onChange={(e) => setProfile({ ...profile, zip: e.target.value })}
                                                    placeholder="10001"
                                                    className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-cyan transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-base-text mb-2">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.country}
                                                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                                placeholder="United States"
                                                className="w-full px-4 py-2 bg-base-bg border border-white/10 rounded-lg text-base-text focus:outline-none focus:border-accent-cyan transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-6">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSaveProfile}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-accent-violet to-accent-cyan rounded-lg text-white font-medium shadow-glow-violet"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Profile
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleClearProfile}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base-muted font-medium hover:bg-white/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Clear Profile
                                        </motion.button>
                                        {saved && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-sm text-accent-mint flex items-center gap-1"
                                            >
                                                ✓ Saved
                                            </motion.span>
                                        )}
                                        {cleared && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-sm text-accent-mint flex items-center gap-1"
                                            >
                                                ✓ Cleared
                                            </motion.span>
                                        )}
                                    </div>
                                </>
                            )}



                            {activeSection === 'storage' && (
                                <>
                                    <h2 className="text-xl font-semibold text-base-text">Storage & Privacy</h2>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-accent-violet/10 border border-accent-violet/20 rounded-lg">
                                            <p className="text-sm text-base-text mb-2">
                                                🔒 All data is stored locally in your browser
                                            </p>
                                            <p className="text-xs text-base-muted">
                                                No data is sent to external servers. Traces and recipes are stored using IndexedDB.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleClearTraces}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-accent-error rounded-lg text-white font-medium shadow-lg shadow-red-500/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Clear All Traces
                                            </motion.button>
                                            {cleared && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="text-sm text-accent-error flex items-center gap-1"
                                                >
                                                    Traces cleared!
                                                </motion.span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default App;
