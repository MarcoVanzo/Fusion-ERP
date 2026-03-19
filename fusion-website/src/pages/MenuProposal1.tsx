import { useState, useEffect } from 'react';
import { Menu, X, Instagram, Facebook, Youtube } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MenuProposal1 = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const navLinks = [
        { name: 'IL CLUB', path: '/club' },
        { name: 'SQUADRE', path: '/teams' },
        { name: 'FORESTERIA', path: '/foresteria' },
        { name: 'NEWS', path: '/news' },
        { name: 'OUTSEASON', path: '/outseason' },
        { name: 'NETWORK', path: '/network' },
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand-500 selection:text-white">
            {/* Top Bar (Always visible) */}
            <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-6 mix-blend-difference">
                <Link to="/" className="flex items-center gap-4 group">
                    <img
                        src="/demo/assets/logo-colorato.png"
                        alt="Fusion Team Volley"
                        className="h-12 w-auto grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                    <span className="font-heading text-xl tracking-tighter uppercase text-white leading-none">
                        FUSION TEAM VOLLEY
                    </span>
                </Link>

                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 text-white hover:text-brand-500 transition-colors uppercase font-heading tracking-widest text-sm"
                >
                    <span className="hidden sm:block">{isOpen ? 'CHIUDI' : 'MENU'}</span>
                    {isOpen ? <X size={32} /> : <Menu size={32} />}
                </button>
            </nav>

            {/* Fullscreen Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: '-100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '-100%', transition: { delay: 0.2, duration: 0.5 } }}
                        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                        className="fixed inset-0 z-40 bg-zinc-950 flex flex-col md:flex-row"
                    >
                        {/* Left Side: Navigation Links */}
                        <div className="w-full md:w-3/5 h-full flex flex-col justify-center px-8 md:pl-24 pt-24 md:pt-0">
                            <ul className="flex flex-col gap-2 md:gap-4">
                                {navLinks.map((link, i) => (
                                    <motion.li 
                                        key={link.name}
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ delay: 0.1 + (i * 0.05), duration: 0.4 }}
                                        className="overflow-hidden"
                                    >
                                        <Link 
                                            to={link.path}
                                            onClick={() => setIsOpen(false)}
                                            className="font-heading text-5xl md:text-7xl lg:text-8xl xl:text-9xl uppercase leading-none text-zinc-400 hover:text-white hover:pl-8 transition-all duration-300 inline-block group"
                                        >
                                            {link.name}
                                            <span className="absolute text-brand-500 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:-translate-x-full group-hover:-ml-4 transition-all duration-300">
                                                ★
                                            </span>
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>

                            {/* Social Links & Utilities */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-16 flex items-center gap-8 border-t border-zinc-800 pt-8"
                            >
                                <a href="#" className="text-zinc-500 hover:text-brand-500"><Instagram /></a>
                                <a href="#" className="text-zinc-500 hover:text-brand-500"><Facebook /></a>
                                <a href="#" className="text-zinc-500 hover:text-brand-500"><Youtube /></a>
                                <a href="/ERP" className="text-brand-500 ml-auto font-heading uppercase tracking-widest text-sm hover:text-white transition-colors">ACCEDI ERP ↗</a>
                            </motion.div>
                        </div>

                        {/* Right Side: Featured Content (Image + Action Modules) */}
                        <div className="hidden md:flex w-2/5 h-full bg-zinc-900 border-l border-zinc-800 flex-col pt-32 pb-16 px-12">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex-1 rounded-2xl overflow-hidden mb-8 relative group"
                            >
                                <div className="absolute inset-0 bg-brand-500/20 group-hover:bg-transparent transition-all z-10" />
                                <img src="/demo/assets/hero-1.jpg" alt="Featured" className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700" />
                                <div className="absolute bottom-6 left-6 z-20">
                                    <div className="text-xs font-bold text-white bg-brand-500 px-3 py-1 uppercase tracking-widest mb-2 inline-block">Novità</div>
                                    <h3 className="text-3xl font-heading text-white uppercase">Nuove divise<br/>2026/27</h3>
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex gap-4"
                            >
                                <Link to="/results" onClick={() => setIsOpen(false)} className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-brand-500 p-6 flex flex-col items-center justify-center text-center group transition-colors">
                                    <span className="text-red-500 font-bold text-xs animate-pulse mb-2 tracking-widest">● LIVE</span>
                                    <span className="font-heading uppercase text-xl group-hover:text-brand-500 transition-colors">Match Center</span>
                                </Link>
                                <Link to="/shop" onClick={() => setIsOpen(false)} className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-brand-500 p-6 flex flex-col items-center justify-center text-center group transition-colors">
                                    <span className="text-zinc-500 font-bold text-xs mb-2 tracking-widest uppercase">Acquista</span>
                                    <span className="font-heading uppercase text-xl group-hover:text-brand-500 transition-colors">Store Ufficiale</span>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dummy Content for visually previewing the top bar */}
            <div className="h-screen flex items-center justify-center bg-[url('/demo/assets/squadra-u14.jpeg')] bg-cover bg-center">
                <div className="absolute inset-0 bg-black/60"></div>
                <h1 className="relative z-10 text-white font-heading text-5xl md:text-8xl opacity-30 uppercase tracking-widest text-center">
                    Proposal 1<br/><span className="text-brand-500">Menu</span>
                </h1>
            </div>
        </div>
    );
};

export default MenuProposal1;
