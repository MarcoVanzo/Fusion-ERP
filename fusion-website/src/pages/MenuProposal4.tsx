import { useState, useEffect } from 'react';
import { Menu, X, Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MenuProposal4 = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const leftLinks = [
        { name: 'IL CLUB', path: '/club' },
        { name: 'SQUADRE', path: '/teams' },
        { name: 'FORESTERIA', path: '/foresteria' },
    ];

    const rightLinks = [
        { name: 'NEWS', path: '/news' },
        { name: 'MATCH CENTER', path: '/results' },
        { name: 'STORE', path: '/shop' },
    ];

    return (
        <div className="min-h-[150vh] bg-zinc-950 text-white font-sans selection:bg-brand-500 selection:text-white">
            {/* Desktop Split Header */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-zinc-950/90 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
                    
                    {/* Left Links */}
                    <div className="hidden lg:flex flex-1 items-center justify-end gap-8 pr-12">
                        {leftLinks.map(link => (
                            <Link key={link.name} to={link.path} className="text-sm font-semibold tracking-widest text-zinc-300 hover:text-brand-500 transition-colors uppercase">
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Center Logo */}
                    <Link to="/" className="flex-shrink-0 relative group z-50">
                        <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <img src="/assets/logo-colorato.png" alt="Logo" className="w-16 h-16 object-contain drop-shadow-2xl relative z-10" />
                    </Link>

                    {/* Right Links */}
                    <div className="hidden lg:flex flex-1 items-center justify-start gap-8 pl-12">
                        {rightLinks.map(link => (
                            <Link key={link.name} to={link.path} className="text-sm font-semibold tracking-widest text-zinc-300 hover:text-brand-500 transition-colors uppercase">
                                {link.name}
                            </Link>
                        ))}
                        
                        {/* Utility Icons */}
                        <div className="flex items-center gap-4 ml-8 border-l border-zinc-700 pl-8">
                            <button className="text-zinc-300 hover:text-brand-500 transition-colors"><Search size={18} /></button>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="lg:hidden flex flex-1 justify-end">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-white hover:text-brand-500 transition-colors"
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 top-[80px] z-40 bg-zinc-950/95 backdrop-blur-xl lg:hidden flex flex-col p-8 border-t border-white/5"
                    >
                        <div className="flex flex-col gap-6 text-center">
                            {[...leftLinks, ...rightLinks].map(link => (
                                <Link 
                                    key={link.name} 
                                    to={link.path} 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-2xl font-heading uppercase tracking-widest text-white hover:text-brand-500 transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dummy Content */}
            <div className="h-screen flex items-center justify-center bg-[url('/assets/hero-1.jpg')] bg-cover bg-center grayscale">
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative z-10 text-center">
                    <h1 className="text-5xl md:text-8xl font-heading uppercase text-white tracking-widest mb-4">
                        Proposal 4
                    </h1>
                    <p className="text-brand-500 text-xl md:text-2xl uppercase tracking-[0.5em] font-bold">Split Header Menu</p>
                </div>
            </div>
            <div className="h-screen bg-black flex items-center justify-center">
                <p className="text-zinc-500 uppercase tracking-widest">Contenuto discesa mock</p>
            </div>
        </div>
    );
};

export default MenuProposal4;
