const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
// NOTE: Make sure GEMINI_API_KEY is set in .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const RiskService = {
    /**
     * Calculate the probability of a user breaking their streak using Gemini AI.
     * @param {Object} user - The user object
     * @returns {Object} { score: number (0-100), level: string, factors: string[] }
     */
    calculateStreakRisk: async (user) => {
        // 1. Fast check: If logged in today, 0 risk.
        const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
        const today = new Date().setHours(0, 0, 0, 0);

        if (lastLogin && new Date(lastLogin).setHours(0, 0, 0, 0) === today) {
            return {
                score: 0,
                level: 'Safe',
                factors: ['Already checked in today'],
                message: "You're safe for now, champion."
            };
        }

        try {
            const now = new Date();
            const currentHour = now.getHours();
            const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

            // 2. Prepare Prompt
            const prompt = `
                Analyze the "Streak Risk" for this user.
                Context:
                - Current Time: ${currentHour}:00 (${dayName})
                - User's Streak: ${user.overallStreak} days
                - User XP: ${user.xp}
                
                Rules:
                - Risk should be higher if it's late at night.
                - Risk should be higher on weekends.
                - Risk should be lower if they have a very high streak (committed user).
                - Risk should be slightly higher if streak is < 3 days.

                Return ONLY a JSON object (no markdown) with:
                {
                    "score": number (0-99),
                    "level": "Low" | "Medium" | "High" | "Critical",
                    "factors": ["short reason 1", "short reason 2"],
                    "message": "A short, witty, slightly roasting motivational sentence urging them to check in."
                }
            `;

            // 3. Call AI
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean markdown if present (Gemini sometimes adds json markers)
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);

            return data;

        } catch (error) {
            console.error("Gemini API Error, falling back to heuristic:", error);
            // Fallback to simple heuristic if API fails or no key
            return {
                score: 50,
                level: "Medium",
                factors: ["AI Offline", "Time check"],
                message: "Our AI is sleeping, but you shouldn't be! Check in now."
            };
        }
    }
};

module.exports = RiskService;
