
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        alert("Registration successful! Please check your email to confirm your account.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black md:bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/c31c3123-3df7-4359-8b8c-475bd2d9925d/15feb590-3d73-45e9-9e4a-2eb334c83921/TR-en-20231225-popsignuptwoweeks-perspective_alpha_website_large.jpg')] bg-cover bg-center flex items-center justify-center relative">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 md:bg-black/50 z-0"></div>

      {/* Header Logo */}
      <div className="absolute top-6 left-6 md:left-12 z-20">
         <div className="text-[#E50914] font-black text-4xl tracking-tighter cursor-pointer shadow-black drop-shadow-lg">
            ANIRIAS
         </div>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 bg-black/80 backdrop-blur-sm p-8 md:p-16 rounded-lg w-full max-w-[450px] min-h-[600px] flex flex-col shadow-2xl border border-white/10">
        <h1 className="text-3xl font-bold text-white mb-8">
            {isLogin ? 'Sign In' : 'Sign Up'}
        </h1>

        {error && (
            <div className="bg-[#E50914]/20 border border-[#E50914] text-white p-3 rounded text-sm mb-4 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
                <input 
                    type="email" 
                    required
                    placeholder="Email or phone number" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#333] text-white px-5 py-4 rounded text-base focus:bg-[#454545] focus:outline-none focus:border-b-2 focus:border-[#E50914] transition-colors peer placeholder-transparent"
                    id="emailInput"
                />
                <label 
                    htmlFor="emailInput"
                    className={`absolute left-5 text-gray-400 text-base transition-all duration-200 pointer-events-none
                        ${email ? 'top-2 text-xs' : 'top-4'}
                        peer-focus:top-2 peer-focus:text-xs peer-focus:text-gray-300
                    `}
                >
                    Email
                </label>
            </div>

            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#333] text-white px-5 py-4 rounded text-base focus:bg-[#454545] focus:outline-none focus:border-b-2 focus:border-[#E50914] transition-colors peer placeholder-transparent"
                    id="passInput"
                />
                 <label 
                    htmlFor="passInput"
                    className={`absolute left-5 text-gray-400 text-base transition-all duration-200 pointer-events-none
                        ${password ? 'top-2 text-xs' : 'top-4'}
                        peer-focus:top-2 peer-focus:text-xs peer-focus:text-gray-300
                    `}
                >
                    Password
                </label>
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="bg-[#E50914] text-white font-bold py-3.5 rounded mt-6 hover:bg-[#c11119] transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading && <Loader2 size={20} className="animate-spin" />}
                {isLogin ? 'Sign In' : 'Sign Up'}
            </button>

            <div className="flex justify-between items-center text-[#b3b3b3] text-sm mt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" className="accent-[#b3b3b3]" defaultChecked /> Remember me
                </label>
                <a href="#" className="hover:underline">Need help?</a>
            </div>
        </form>

        <div className="mt-auto">
            <div className="text-[#737373] text-base mt-16">
                {isLogin ? 'New to Anirias?' : 'Already have an account?'}{' '}
                <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-white hover:underline font-medium ml-1"
                >
                    {isLogin ? 'Sign up now.' : 'Sign in.'}
                </button>
            </div>
            <div className="text-[#737373] text-xs mt-4">
                This page is protected by Google reCAPTCHA to ensure you're not a bot. <a href="#" className="text-[#0071eb] hover:underline">Learn more.</a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
