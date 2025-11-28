/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                base: {
                    bg: '#0B0F19',
                    card: '#0F172A',
                    text: '#E2E8F0',
                    muted: '#94A3B8',
                },
                accent: {
                    violet: '#8B5CF6',
                    cyan: '#22D3EE',
                    mint: '#34D399',
                    warn: '#F59E0B',
                    error: '#F43F5E',
                },
            },
            borderRadius: {
                'card': '1.25rem',
                'chip': '9999px',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'gradient': 'gradient 8s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glow: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.5' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            boxShadow: {
                'glow-violet': '0 0 20px rgba(139, 92, 246, 0.5)',
                'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.5)',
                'glow-mint': '0 0 20px rgba(52, 211, 153, 0.5)',
            },
        },
    },
    plugins: [],
}
