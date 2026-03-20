import { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    type NavLink = {
        name: string;
        path: string;
        badge?: string;
    };

    const splitLeftLinks: NavLink[] = [
        { name: 'IL CLUB', path: '/club' },
        { name: 'SQUADRE', path: '/teams' },
        { name: 'FORESTERIA', path: '/foresteria' },
        { name: 'NETWORK', path: '/network' },
    ];

    const splitRightLinks: NavLink[] = [
        { name: 'NEWS', path: '/news' },
        { name: 'MATCH CENTER', path: '/results', badge: 'LIVE' },
        { name: 'OUTSEASON', path: '/outseason' },
        { name: 'STORE', path: '/shop' },
    ];

    const allLinks = [...splitLeftLinks, ...splitRightLinks];

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-zinc-950/95 backdrop-blur-md border-b-2 border-brand-500 shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-4' : 'bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent py-8'}`}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
                
                {/* Left Links */}
                <div className="hidden lg:flex flex-1 items-center justify-end gap-6 pr-10">
                    {splitLeftLinks.map(link => {
                        const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                        return (
                            <Link 
                                key={link.name} 
                                to={link.path} 
                                className={`text-sm font-semibold tracking-widest transition-colors uppercase relative group flex items-center ${isActive ? 'text-brand-500' : 'text-zinc-300 hover:text-white'}`}
                            >
                                {link.name}
                                <span className={`absolute -bottom-2 left-0 h-[2px] bg-brand-500 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                            </Link>
                        )
                    })}
                </div>

                {/* Center Logo */}
                <Link to="/" className="flex-shrink-0 relative group z-50 flex items-center justify-center -mt-2">
                    <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img src="/demo/assets/logo-colorato.png" alt="Logo" className="w-[72px] h-[72px] object-contain drop-shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-300" />
                </Link>

                {/* Right Links */}
                <div className="hidden lg:flex flex-1 items-center justify-start gap-6 pl-10">
                    {splitRightLinks.map(link => {
                        const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                        return (
                            <Link 
                                key={link.name} 
                                to={link.path} 
                                className={`text-sm font-semibold tracking-widest transition-colors uppercase relative group flex items-center ${isActive ? 'text-brand-500' : 'text-zinc-300 hover:text-white'}`}
                            >
                                {link.name}
                                {link.badge && (
                                    <span className="absolute -top-3 -right-6 text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse">{link.badge}</span>
                                )}
                                <span className={`absolute -bottom-2 left-0 h-[2px] bg-brand-500 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                            </Link>
                        )
                    })}
                    
                    {/* Utility Icons */}
                    <div className="flex items-center gap-4 ml-4 border-l border-zinc-700 pl-6">
                        <Link to="/ERP" className="flex items-center gap-2 text-zinc-300 hover:text-brand-500 transition-colors text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-2 rounded-full border border-white/10 hover:border-brand-500 relative group">
                           <User size={14} /> ERP
                           <div className="absolute inset-0 bg-brand-500/10 rounded-full scale-0 group-hover:scale-100 transition-transform"></div>
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="lg:hidden flex flex-[0.5] justify-end">
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-white hover:text-brand-500 transition-colors p-2"
                        aria-label="Toggle Menu"
                    >
                        {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: '100vh' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 top-[80px] sm:top-[96px] z-40 bg-zinc-950 lg:hidden flex flex-col p-6 shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-y-auto pb-32"
                    >
                        <div className="absolute bottom-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-brand-500 to-transparent"></div>
                        
                        <div className="flex flex-col gap-0 w-full">
                            {allLinks.map((link, index) => {
                                const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                                return (
                                    <motion.div
                                        key={link.name}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.05 + 0.1 }}
                                    >
                                        <Link 
                                            to={link.path} 
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`font-heading text-2xl uppercase tracking-widest border-b border-zinc-800/50 py-4 flex items-center justify-between transition-colors ${isActive ? 'text-brand-500' : 'text-zinc-300 hover:text-white'}`}
                                        >
                                            {link.name}
                                            {link.badge && (
                                                <span className="bg-red-600 text-white font-sans text-xs font-bold px-2 py-1 rounded animate-pulse tracking-normal">
                                                    {link.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: allLinks.length * 0.05 + 0.1 }}
                            className="mt-8 flex justify-start pt-4"
                        >
                            <Link to="/ERP" onClick={() => setIsMobileMenuOpen(false)} className="text-brand-500 font-heading text-xl uppercase tracking-widest hover:scale-105 transition-transform origin-left block">
                                ACCEDI ERP
                            </Link>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
