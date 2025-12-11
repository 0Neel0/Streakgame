
export interface SeasonTheme {
    name: string;
    description: string;
    styles: {
        cardBg: string;       // Background gradient for cards
        border: string;       // Border color
        textAccent: string;   // Color for accents like icons/titles
        badgeBg: string;      // Background for badges (Active/Inactive)
        badgeText: string;    // Text color for badges
        shadow: string;       // Shadow color
        icon: string;         // Icon color class
        buttonGradient: string; // Gradient for primary buttons in this theme
        blobColor: string;    // For the background blur effects
    };
}

const themes: SeasonTheme[] = [
    {
        name: 'Sunset',
        description: 'Warm orange and red tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-orange-900/40',
            border: 'border-orange-500/30',
            textAccent: 'text-orange-400',
            badgeBg: 'bg-orange-500/20',
            badgeText: 'text-orange-400',
            shadow: 'shadow-orange-500/10',
            icon: 'text-orange-500',
            buttonGradient: 'from-orange-500 to-red-600',
            blobColor: 'bg-orange-600/20'
        }
    },
    {
        name: 'Ocean',
        description: 'Deep blue and cyan tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-cyan-900/40',
            border: 'border-cyan-500/30',
            textAccent: 'text-cyan-400',
            badgeBg: 'bg-cyan-500/20',
            badgeText: 'text-cyan-400',
            shadow: 'shadow-cyan-500/10',
            icon: 'text-cyan-500',
            buttonGradient: 'from-cyan-500 to-blue-600',
            blobColor: 'bg-cyan-600/20'
        }
    },
    {
        name: 'Berry',
        description: 'Vibrant pink and purple tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-pink-900/40',
            border: 'border-pink-500/30',
            textAccent: 'text-pink-400',
            badgeBg: 'bg-pink-500/20',
            badgeText: 'text-pink-400',
            shadow: 'shadow-pink-500/10',
            icon: 'text-pink-500',
            buttonGradient: 'from-pink-500 to-purple-600',
            blobColor: 'bg-pink-600/20'
        }
    },
    {
        name: 'Forest',
        description: 'Lush green and emerald tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-emerald-900/40',
            border: 'border-emerald-500/30',
            textAccent: 'text-emerald-400',
            badgeBg: 'bg-emerald-500/20',
            badgeText: 'text-emerald-400',
            shadow: 'shadow-emerald-500/10',
            icon: 'text-emerald-500',
            buttonGradient: 'from-emerald-500 to-green-600',
            blobColor: 'bg-emerald-600/20'
        }
    },
    {
        name: 'Royal',
        description: 'Majestic violet and indigo tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-violet-900/40',
            border: 'border-violet-500/30',
            textAccent: 'text-violet-400',
            badgeBg: 'bg-violet-500/20',
            badgeText: 'text-violet-400',
            shadow: 'shadow-violet-500/10',
            icon: 'text-violet-500',
            buttonGradient: 'from-violet-500 to-indigo-600',
            blobColor: 'bg-violet-600/20'
        }
    },
    {
        name: 'Golden',
        description: 'Luxurious gold and amber tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-yellow-900/40',
            border: 'border-yellow-500/30',
            textAccent: 'text-yellow-400',
            badgeBg: 'bg-yellow-500/20',
            badgeText: 'text-yellow-400',
            shadow: 'shadow-yellow-500/10',
            icon: 'text-yellow-500',
            buttonGradient: 'from-yellow-500 to-amber-600',
            blobColor: 'bg-yellow-600/20'
        }
    },
    {
        name: 'Lavender',
        description: 'Soft purple and indigo tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-indigo-900/40',
            border: 'border-indigo-400/30',
            textAccent: 'text-indigo-300',
            badgeBg: 'bg-indigo-500/20',
            badgeText: 'text-indigo-300',
            shadow: 'shadow-indigo-500/10',
            icon: 'text-indigo-400',
            buttonGradient: 'from-indigo-400 to-purple-500',
            blobColor: 'bg-indigo-500/20'
        }
    },
    {
        name: 'Mint',
        description: 'Cool mint and teal tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-teal-900/40',
            border: 'border-teal-400/30',
            textAccent: 'text-teal-300',
            badgeBg: 'bg-teal-500/20',
            badgeText: 'text-teal-300',
            shadow: 'shadow-teal-500/10',
            icon: 'text-teal-400',
            buttonGradient: 'from-teal-400 to-emerald-500',
            blobColor: 'bg-teal-500/20'
        }
    },
    {
        name: 'Midnight',
        description: 'Deep slat and blue tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-900/90 to-blue-950/50',
            border: 'border-slate-600/30',
            textAccent: 'text-slate-300',
            badgeBg: 'bg-slate-700/50',
            badgeText: 'text-slate-200',
            shadow: 'shadow-black/20',
            icon: 'text-slate-400',
            buttonGradient: 'from-slate-700 to-slate-900',
            blobColor: 'bg-slate-600/10'
        }
    },
    {
        name: 'Crimson',
        description: 'Intense red and rose tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-rose-900/40',
            border: 'border-rose-500/30',
            textAccent: 'text-rose-400',
            badgeBg: 'bg-rose-500/20',
            badgeText: 'text-rose-400',
            shadow: 'shadow-rose-500/10',
            icon: 'text-rose-500',
            buttonGradient: 'from-rose-500 to-red-600',
            blobColor: 'bg-rose-600/20'
        }
    },
    {
        name: 'Sky',
        description: 'Bright blue and sky tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-sky-900/40',
            border: 'border-sky-500/30',
            textAccent: 'text-sky-400',
            badgeBg: 'bg-sky-500/20',
            badgeText: 'text-sky-400',
            shadow: 'shadow-sky-500/10',
            icon: 'text-sky-500',
            buttonGradient: 'from-sky-500 to-blue-500',
            blobColor: 'bg-sky-600/20'
        }
    },
    {
        name: 'Coral',
        description: 'Vivid coral and orange tones',
        styles: {
            cardBg: 'bg-gradient-to-br from-slate-800/80 to-orange-800/40',
            border: 'border-orange-400/30',
            textAccent: 'text-orange-300',
            badgeBg: 'bg-orange-500/20',
            badgeText: 'text-orange-300',
            shadow: 'shadow-orange-500/10',
            icon: 'text-orange-400',
            buttonGradient: 'from-orange-400 to-red-500',
            blobColor: 'bg-orange-500/20'
        }
    }
];

export const getSeasonTheme = (id: string): SeasonTheme => {
    if (!id) return themes[0];

    // Simple hash function to generate a consistent index from the ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Ensure positive index
    const index = Math.abs(hash) % themes.length;
    return themes[index];
};
