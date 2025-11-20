
import React, { useState } from 'react';
import { X, Check, Crown, CreditCard, Lock, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import { SubscriptionPlan } from '../types';

interface PremiumModalProps {
    onClose: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose }) => {
    const { account, upgradeSubscription } = useAppStore();
    const [step, setStep] = useState<'plans' | 'payment' | 'success'>('plans');
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const plans = {
        Free: { price: 0 },
        Standard: { price: 9.99 },
        Ultimate: { price: 14.99 },
    };

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        if (plan === account.plan) return;
        if (plan === 'Free') { // Direct downgrade
            upgradeSubscription('Free');
            onClose();
        } else {
            setSelectedPlan(plan);
            setStep('payment');
        }
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlan) return;
        
        setIsProcessing(true);
        setTimeout(() => {
            upgradeSubscription(selectedPlan);
            setIsProcessing(false);
            setStep('success');
        }, 2000); // Simulate API call
    };

    if (step === 'success') {
        return (
             <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-[#141414] w-full max-w-md text-center rounded-2xl p-12 border border-gray-800 animate-in fade-in zoom-in-95">
                    <Check size={64} className="mx-auto text-green-500 bg-green-500/10 p-3 rounded-full mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome to {selectedPlan}!</h2>
                    <p className="text-gray-400 mb-8">Your premium benefits are now active. Enjoy the full Anirias experience.</p>
                    <button onClick={onClose} className="w-full bg-[#E50914] text-white font-bold py-3 rounded-lg hover:bg-red-700 transition">Start Watching</button>
                </div>
            </div>
        );
    }
    
    if (step === 'payment' && selectedPlan) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-[#1f1f1f] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl animate-in fade-in">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Complete Your Upgrade</h3>
                        <button onClick={() => setStep('plans')} className="text-gray-400 hover:text-white text-sm hover:underline">Back to Plans</button>
                    </div>
                    <form onSubmit={handlePaymentSubmit} className="p-8">
                        <div className="bg-[#2a2a2a] p-4 rounded-lg border border-gray-600 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-white">{selectedPlan} Plan</span>
                                <span className="font-bold text-2xl text-white">${plans[selectedPlan].price}/mo</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Billed monthly. Cancel anytime.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Card Number" required className="w-full bg-[#141414] border border-gray-600 rounded-lg p-3 pl-12 text-white focus:border-[#E50914] focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="MM / YY" required className="w-full bg-[#141414] border border-gray-600 rounded-lg p-3 text-white focus:border-[#E50914] focus:outline-none" />
                                <div className="relative">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="CVC" required className="w-full bg-[#141414] border border-gray-600 rounded-lg p-3 pl-12 text-white focus:border-[#E50914] focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-6 text-center">By confirming your payment, you agree to our Terms of Service.</p>
                        
                        <button 
                            type="submit" 
                            disabled={isProcessing}
                            className="w-full mt-2 bg-[#E50914] hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : `Pay $${plans[selectedPlan].price}`}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#141414] w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-gray-800 animate-in slide-in-from-bottom-10 duration-500">
                {/* Header */}
                <div className="p-8 text-center border-b border-gray-800 relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                    >
                        <X size={32} />
                    </button>
                    <div className="flex justify-center mb-4">
                         <Crown size={48} className="text-[#E50914]" />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">Anirias <span className="text-[#E50914]">Premium</span></h2>
                    <p className="text-gray-400 max-w-lg mx-auto">Unlock the full potential of anime. Zero ads, maximum quality, simulcast speed.</p>
                </div>

                {/* Pricing Table */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-800">
                    
                    {/* Free */}
                    <div className="p-8 hover:bg-white/5 transition flex flex-col h-full">
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-gray-300 mb-2">Free</h3>
                            <div className="text-4xl font-bold text-white">$0 <span className="text-sm font-normal text-gray-500">/ mo</span></div>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-400">
                            <li className="flex items-center gap-3"><Check size={16} className="text-[#E50914]" /> 480p Quality</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-[#E50914]" /> Limited Catalog</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-[#E50914]" /> Ad Supported</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-[#E50914]" /> 1 Week Delay on New Eps</li>
                        </ul>
                        <button 
                            onClick={() => handleSelectPlan('Free')}
                            disabled={account.plan === 'Free'}
                            className={`w-full py-3 rounded-lg font-bold transition ${account.plan === 'Free' ? 'bg-gray-800 text-gray-500 cursor-default' : 'border border-gray-600 hover:border-white text-white'}`}
                        >
                            {account.plan === 'Free' ? 'Current Plan' : 'Downgrade'}
                        </button>
                    </div>

                    {/* Standard */}
                    <div className="p-8 hover:bg-white/5 transition flex flex-col h-full relative overflow-hidden">
                        {account.plan === 'Standard' && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>}
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-blue-400 mb-2">Standard</h3>
                            <div className="text-4xl font-bold text-white">$9.99 <span className="text-sm font-normal text-gray-500">/ mo</span></div>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-300">
                            <li className="flex items-center gap-3"><Check size={16} className="text-blue-400" /> 1080p Full HD</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-blue-400" /> Full Catalog Access</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-blue-400" /> No Ads</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-blue-400" /> Simulcast (1hr delay)</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-blue-400" /> 2 Screens</li>
                        </ul>
                        <button 
                             onClick={() => handleSelectPlan('Standard')}
                             disabled={account.plan === 'Standard'}
                             className={`w-full py-3 rounded-lg font-bold transition ${account.plan === 'Standard' ? 'bg-blue-600/50 text-white cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                        >
                            {account.plan === 'Standard' ? 'Current Plan' : 'Select Standard'}
                        </button>
                    </div>

                    {/* Ultimate */}
                    <div className="p-8 bg-[#1a1a1a] flex flex-col h-full relative overflow-hidden transform md:scale-105 shadow-2xl z-10 border border-[#E50914]/30 rounded-b-2xl md:rounded-b-none">
                        <div className="absolute top-0 right-0 bg-[#E50914] text-white text-xs font-bold px-3 py-1">BEST VALUE</div>
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-[#E50914] mb-2">Ultimate</h3>
                            <div className="text-4xl font-bold text-white">$14.99 <span className="text-sm font-normal text-gray-500">/ mo</span></div>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-200">
                            <li className="flex items-center gap-3"><Check size={16} className="text-[#E50914]" /> 4K Ultra HD + HDR</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-[#E50914]" /> Instant Simulcast</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-[#E50914]" /> Offline Downloads</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-[#E50914]" /> 4 Screens</li>
                            <li className="flex items-center gap-3"><Check size={16} className="text-[#E50914]" /> Exclusive Merch Offers</li>
                        </ul>
                        <button 
                             onClick={() => handleSelectPlan('Ultimate')}
                             disabled={account.plan === 'Ultimate'}
                             className={`w-full py-3 rounded-lg font-bold transition ${account.plan === 'Ultimate' ? 'bg-[#E50914]/50 text-white cursor-default' : 'bg-[#E50914] hover:bg-red-700 text-white shadow-[0_0_20px_rgba(229,9,20,0.4)]'}`}
                        >
                            {account.plan === 'Ultimate' ? 'Current Plan' : 'Get Ultimate'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumModal;