import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await api.post('/auth/google', { googleAccessToken: tokenResponse.access_token });
                toast.success('Google Login Successful!');
                login(res.data.token, res.data.user);
                navigate('/dashboard');
            } catch (err) {
                toast.error('Google Login Failed');
                console.error(err);
            }
        },
        onError: () => toast.error('Google Login Failed'),
    });

    const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z]+(?:\.[a-z]+)+$/;
    // We enforce password format even on login as a partial security measure, 
    // though typically login might be more lenient. Given the request, we apply specific regex.
    const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).+$/;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!EMAIL_REGEX.test(email)) {
            toast.error('Invalid email format.');
            return;
        }

        if (!PASSWORD_REGEX.test(password)) {
            toast.error('Invalid password format.');
            return;
        }

        try {
            const res = await api.post('/auth/login', { email, password });
            toast.success('Welcome back!');
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            const msg = err.response?.data;
            // Handle if backend sends string or object
            const errorMsg = msg?.message || (typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Login failed');
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10 p-8 glass-panel rounded-2xl"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-600/50"
                    >
                        <Flame size={32} className="text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-orange-200">
                        Welcome Back
                    </h2>
                    <p className="text-slate-400 mt-2">Keep your streak alive!</p>
                </div>



                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field !pl-14"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field !pl-14"
                                required
                            />
                        </div>
                    </div>

                    {/* <div>
                        <DatePickerWrapper
                            selected={date}
                            onChange={(d) => setDate(d)}
                            label="Login Date (Optional)"
                            placeholderText="Select Date"
                        />
                    </div> */}

                    <button type="submit" className="btn-primary flex items-center justify-center gap-2 group bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                        Login
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-900 text-slate-400">Or continue with</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-4">
                        <button
                            type="button"
                            onClick={() => googleLogin()}
                            className="flex items-center justify-center gap-3 w-full bg-white text-slate-900 font-semibold py-3 px-6 rounded-xl hover:bg-slate-100 transition-colors shadow-lg shadow-white/10"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
                                const redirectUri = `${window.location.origin}/auth/github/callback`;
                                window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
                            }}
                            className="flex items-center justify-center gap-3 w-full bg-[#24292e] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#2b3137] transition-colors shadow-lg shadow-black/20"
                        >
                            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                            </svg>
                            Continue with GitHub
                        </button>
                    </div>
                </form>

                <p className="text-center mt-6 text-slate-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-orange-400 hover:text-orange-300 font-medium hover:underline transition-all">
                        Register
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
