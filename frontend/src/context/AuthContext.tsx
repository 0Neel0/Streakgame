import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

interface User {

    _id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    overallStreak: number;
    seasonStreaks: any[];
    lastLoginDate?: string;
    xp?: number;
    profilePicture?: string;
    description?: string;
    hasClaimedRoyalPass?: boolean;
    unclaimedRewards?: { xp: number; reason: string; date?: string }[];
}

interface AuthContextType {
    user: User | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            const token = localStorage.getItem('auth-token');
            if (token) {
                try {
                    // Ideally verify token with backend or just generic load
                    // For now, if we have a token, we might need an endpoint to "get me"
                    // Adding a simple /auth/me route or just trusting stored user (risky)
                    // Let's implement a quick refresh logic if possible, or just wait for login
                    // The user object is intricate, let's assume we can fetch it.
                    // Actually, let's just rely on login for now or decode token if needed.
                    // Better: Store user in localStorage or fetch on load.
                    const storedUser = localStorage.getItem('user-data');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (err) {
                    console.error("Auth Error", err);
                    localStorage.removeItem('auth-token');
                }
            }
            setLoading(false);
        };
        checkLogin();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('auth-token', token);
        localStorage.setItem('user-data', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user-data');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me'); // We need to ensure this route exists or use a user fetch route
            localStorage.setItem('user-data', JSON.stringify(res.data));
            setUser(res.data);
        } catch (err) {
            console.error("Failed to refresh user", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
