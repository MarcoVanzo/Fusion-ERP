import { useState, useEffect } from 'react';
import { Menu, X, Instagram, Facebook, Youtube } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'IL CLUB', path: '/club' },
        { name: 'FORESTERIA', path: '/foresteria' },
        { name: 'NEWS', path: '/news' },
        { name: 'SQUADRE', path: '/teams' },
        { name: 'STORE', path: '/shop' },
        { name: 'MATCH CENTER', path: '/results', badge: 'LIVE' },
        { name: 'OUTSEASON', path: '/outseason' },
        { name: 'NETWORK', path: '/network' },
    ];

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled
                ? 'bg-zinc-950 border-b-2 border-brand-500 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
                : 'bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent'
                }`}
        >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 lg:h-24">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-4 group">
                        <img
                            src="/demo/assets/logo-colorato.png"
                            alt="Fusion Team Volley"
                            className="h-16 w-auto group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.3)]"
                        />
                        <span className="font-heading text-2xl tracking-tighter uppercase text-white leading-none drop-shadow-[0_0_8px_rgba(255,20,147,0.5)]">
                            FUSION TEAM<br /><span className="text-brand-500 text-lg group-hover:text-white transition-colors drop-shadow-[0_0_12px_rgba(255,20,147,0.8)]">VOLLEY</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-12">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`font-subheading text-lg tracking-widest uppercase transition-colors relative flex items-center group
                                        ${isActive ? 'text-brand-500' : 'text-zinc-400 hover:text-white'}
                                    `}
                                >
                                    {link.name}
                                    {link.badge && (
                                        <span className="absolute -top-3 -right-8 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                                            ● {link.badge}
                                        </span>
                                    )}
                                    <span className={`absolute -bottom-2 left-0 h-[2px] bg-brand-500 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>
                            );
                        })}

                        <div className="flex gap-5 ml-4 border-l border-zinc-800 pl-6 items-center">
                            <a href="https://instagram.com/fusionteamvolley" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-500 transition-colors" aria-label="Instagram">
                                <Instagram size={20} />
                            </a>
                            <a href="https://facebook.com/FusionTeamVolley" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-500 transition-colors" aria-label="Facebook">
                                <Facebook size={20} />
                            </a>
                            <a href="https://youtube.com/@fusionteamvolley9176" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-500 transition-colors" aria-label="YouTube">
                                <Youtube size={24} />
                            </a>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="lg:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-white hover:text-brand-500 transition-colors p-2"
                            aria-expanded={mobileMenuOpen}
                            aria-label="Apri menu di navigazione"
                        >
                            {mobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="lg:hidden absolute top-full left-0 w-full bg-zinc-950 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
                    >
                        {/* Gradient bottom edge instead of solid border */}
                        <div className="absolute bottom-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-brand-500 to-transparent"></div>
                        
                        <div className="flex flex-col px-6 py-8 gap-6">
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.05 + 0.1 }}
                                >
                                    <Link
                                        to={link.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="font-heading text-2xl text-zinc-300 hover:text-brand-500 transition-colors uppercase tracking-widest border-b border-zinc-800/50 pb-4 relative flex items-center justify-between"
                                    >
                                        <span>{link.name}</span>
                                        {link.badge && (
                                            <span className="bg-red-600 text-white font-sans text-xs font-bold px-2 py-1 rounded animate-pulse tracking-normal">
                                                {link.badge}
                                            </span>
                                        )}
                                    </Link>
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: navLinks.length * 0.05 + 0.1 }}
                            >
                                <a
                                    href="/ERP"
                                    className="text-brand-500 font-heading text-xl uppercase tracking-widest mt-4 inline-block hover:scale-105 transition-transform origin-left"
                                >
                                    ACCEDI ERP
                                </a>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
