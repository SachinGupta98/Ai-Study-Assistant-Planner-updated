
import React, { useState, FormEvent } from 'react';
import { login, signUp } from '../services/authService';
import Spinner from './Spinner';

interface AuthProps {
  onAuthSuccess: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const authFunction = isLogin ? login : signUp;
      const result = await authFunction(username, password);
      onAuthSuccess(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-white text-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
            >
                {isLoading ? <Spinner /> : (isLogin ? 'Login' : 'Sign Up')}
            </button>
            </form>
            <p className="text-sm text-center text-slate-400">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={() => {setIsLogin(!isLogin); setError(null);}} className="font-semibold text-cyan-400 hover:text-cyan-300 ml-2">
                    {isLogin ? 'Sign Up' : 'Login'}
                </button>
            </p>
        </div>
    </div>
  );
};

export default Auth;
