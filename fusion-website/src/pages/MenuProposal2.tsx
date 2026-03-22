import { useState, useEffect } from 'react';
import { Menu, X, Instagram, Facebook, Youtube } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MenuProposal2 = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const mainLinks = [
        { name: 'IL CLUB', path: '/club' },
        { name: 'SQUADRE', path: '/teams' },
        { name: 'NEWS', path: '/news' },
        { name: 'MATCH CENTER', path: '/results', badge: 'LIVE' },
        { name: 'STORE', path: '/shop' },
    ];

    const secondaryLinks = [
        { name: 'FORESTERIA', path: '/foresteria' },
        { name: 'OUTSEASON', path: '/outseason' },
        { name: 'NETWORK', path: '/network' },
        { name: 'ACCEDI ERP', path: '/ERP' },
    ];

    return (
        <div className="min-h-[150vh] bg-black text-white selection:bg-brand-500 selection:text-white font-sans">
            {/* The Floating Pill */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[1200px]">
                <motion.div 
                    layout
                    initial={{ borderRadius: 60 }}
                    animate={{ 
                        borderRadius: isExpanded ? 32 : 60,
                        backgroundColor: isExpanded ? 'rgba(18, 18, 18, 0.95)' : 'rgba(18, 18, 18, 0.7)',
                        borderColor: isExpanded ? 'rgba(232, 67, 130, 0.3)' : 'rgba(255, 255, 255, 0.1)'
                    }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="backdrop-blur-xl border overflow-hidden shadow-2xl relative"
                >
                    {/* Top Row: Main Nav */}
                    <div className="flex items-center justify-between px-6 py-4">
                        {/* Logo Area */}
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/assets/logo-colorato.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,20,147,0.5)]" />
                            <span className="hidden lg:block font-heading text-xl uppercase tracking-tighter">
                                FUSION <span className="text-brand-500">VOLLEY</span>
                            </span>
                        </Link>

                        {/* Desktop Main Links */}
                        <div className="hidden md:flex items-center gap-8">
                            {mainLinks.map(link => (
                                <Link key={link.name} to={link.path} className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors relative tracking-widest uppercase">
                                    {link.name}
                                    {link.badge && (
                                        <span className="absolute -top-3 -right-6 text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-full animate-pulse">{link.badge}</span>
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* Expand/Collapse Button */}
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="bg-white/10 hover:bg-brand-500 hover:text-white transition-colors text-zinc-300 rounded-full p-2.5 flex items-center justify-center border border-white/5"
                            aria-label="Toggle Menu"
                        >
                            <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {isExpanded ? <X size={20} /> : <Menu size={20} />}
                            </motion.div>
                        </button>
                    </div>

                    {/* Expandable Area */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="border-t border-white/5"
                            >
                                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Mobile Only: Main Links (Visible when expanded on mobile) */}
                                    <div className="md:hidden flex flex-col gap-4">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Principale</h3>
                                        {mainLinks.map(link => (
                                            <Link key={link.name} to={link.path} className="text-lg font-medium hover:text-brand-500 transition-colors">{link.name}</Link>
                                        ))}
                                    </div>

                                    {/* Secondary Pages */}
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Esplora</h3>
                                        {secondaryLinks.map(link => (
                                            <Link key={link.name} to={link.path} className={`text-lg font-medium hover:text-brand-500 transition-colors ${link.name === 'ACCEDI ERP' ? 'text-brand-500 mt-2 text-sm uppercase' : ''}`}>
                                                {link.name}
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Follow Us */}
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Social</h3>
                                        <div className="flex flex-col gap-3">
                                            <a href="#" className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors group">
                                                <div className="p-2 bg-white/5 group-hover:bg-brand-500 transition-colors rounded-lg"><Instagram size={18} /></div>
                                                Instagram
                                            </a>
                                            <a href="#" className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors group">
                                                <div className="p-2 bg-white/5 group-hover:bg-brand-500 transition-colors rounded-lg"><Facebook size={18} /></div>
                                                Facebook
                                            </a>
                                            <a href="#" className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors group">
                                                <div className="p-2 bg-white/5 group-hover:bg-brand-500 transition-colors rounded-lg"><Youtube size={18} /></div>
                                                YouTube
                                            </a>
                                        </div>
                                    </div>

                                    {/* Highlight Card */}
                                    <div className="hidden md:block rounded-2xl overflow-hidden relative group">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                                        <img src="/assets/squadra-u16.jpeg" alt="Highlight" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute bottom-4 left-4 z-20">
                                            <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-1">In Evidenza</p>
                                            <p className="font-heading text-xl uppercase">Finale Regionale</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Dummy Content */}
            <div className="h-screen flex items-center justify-center bg-[url('/assets/hero-2.jpg')] bg-cover bg-center grayscale brightness-50">
                <h1 className="relative z-10 text-white font-sans font-light text-5xl md:text-8xl tracking-tight text-center">
                    Proposal 2 Menu<br/><span className="text-brand-500 italic block mt-4">Floating Pill</span>
                </h1>
                <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-500 uppercase tracking-widest text-xs animate-bounce">
                    Scorri per test
                </p>
            </div>
            <div className="h-screen bg-black flex items-center justify-center">
                <p className="text-zinc-500 uppercase tracking-widest">Continua a scorrere</p>
            </div>
        </div>
    );
};

export default MenuProposal2;
