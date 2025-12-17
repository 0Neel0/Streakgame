import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';

const GithubCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) {
            toast.error('No code received from GitHub');
            navigate('/login');
            return;
        }

        const handleGithubLogin = async () => {
            try {
                const res = await api.post('/auth/github', { code });
                toast.success('GitHub Login Successful!');
                login(res.data.token, res.data.user);
                navigate('/dashboard');
            } catch (err: any) {
                console.error(err);
                if (err.response?.status === 400 && err.response?.data?.includes('No verified email')) {
                    toast.error('Your GitHub account must have a verified email.');
                } else {
                    toast.error('GitHub Login Failed');
                }
                navigate('/login');
            }
        };

        handleGithubLogin();
    }, [searchParams, navigate, login]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="text-center">
                <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold">Authenticating with GitHub...</h2>
                <p className="text-slate-400 mt-2">Please wait while we log you in.</p>
            </div>
        </div>
    );
};

export default GithubCallback;
