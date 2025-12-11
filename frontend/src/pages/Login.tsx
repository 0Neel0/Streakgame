import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Mail, ArrowRight, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import DatePickerWrapper from '../components/DatePickerWrapper';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());

    const navigate = useNavigate();
    const { login } = useAuth();

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
            const res = await api.post('/auth/login', { email, password, date });
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
