import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';
const API_URL = `${ERP_BASE}/api/router.php`;

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const [hubLogo, setHubLogo] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsScrolled(currentScrollY > 20);
            
            if (currentScrollY > lastScrollY.current && currentScrollY > 100 && !isMobileMenuOpen) {
                // Scrolling giù: nascondo navbar
                setIsVisible(false);
            } else {
                // Scrolling su: mostro navbar
                setIsVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        const fetchHubLogo = async () => {
            try {
                const res = await fetch(`${API_URL}?module=network&action=getPublicHubConfig`);
                const data = await res.json();
                if (data.success && data.data.logo_path) {
                    const path = data.data.logo_path;
                    setHubLogo(path.startsWith('http') ? path : `${ERP_BASE}/${path}`);
                }
            } catch (err) {
                console.error("Failed to fetch Hub logo", err);
            }
        };
        fetchHubLogo();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isMobileMenuOpen]);

    type NavLink = {
        name: string;
        path: string;
        badge?: string;
        isHighlight?: boolean;
    };

    const splitLeftLinks: NavLink[] = [
        { name: 'IL CLUB', path: '/club' },
        { name: 'SQUADRE', path: '/teams' },
        { name: 'FORESTERIA', path: '/foresteria' },
        { name: 'NETWORK', path: '/network' },
        { name: 'SPONSOR', path: '/sponsors' },
    ];

    const splitRightLinks: NavLink[] = [
        { name: 'NEWS', path: '/news' },
        { name: 'MATCH CENTER', path: '/results', badge: 'LIVE' },
        { name: 'OUTSEASON', path: '/outseason' },
        { name: 'STORE', path: '/shop' },
        { name: 'ENTRA NELLA NOSTRA FAMIGLIA', path: '/candidatura-scouting', isHighlight: true },
    ];

    const allLinks = [...splitLeftLinks, ...splitRightLinks];

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-zinc-950/95 backdrop-blur-md border-b-2 border-brand-500 shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-2' : 'bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent py-6'}`}>
            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 h-12 relative flex items-center justify-between">
                
                {/* Left Section: Hub Logo + Left Links */}
                <div className="hidden lg:flex flex-1 items-center justify-between pr-10">
                    {/* Hub Logo - desktop far left, enlarged to match Fusion logo */}
                    {hubLogo && (
                        <a 
                            href="https://www.fusionteamvolley.it/network" 
                            className="block relative group z-50 pointer-events-auto"
                            title="Savino del bene volley HUB"
                        >
                            <div className="absolute inset-0 bg-brand-500/30 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative w-[56px] h-[56px] md:w-[72px] md:h-[72px] bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-md p-[2px] rounded-full border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_25px_rgba(217,70,239,0.4)] group-hover:-translate-y-1 transition-all duration-300">
                                <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-1 shadow-inner">
                                    <img src={hubLogo} alt="HUB" className="w-full h-full object-contain filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                                </div>
                            </div>
                        </a>
                    )}

                    <div className="flex items-center gap-6">
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
                </div>

                {/* Center Logo */}
                <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 flex lg:flex-none justify-center">
                    <Link to="/" className="flex-shrink-0 relative group z-50 flex items-center justify-center -mt-2">
                        <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <img src="/assets/logo-colorato.png" alt="Logo" className={`w-[56px] h-[56px] md:w-[72px] md:h-[72px] object-contain drop-shadow-2xl relative z-10 transition-transform duration-300 ${isScrolled ? 'scale-90 group-hover:scale-100' : 'scale-100 group-hover:scale-105'}`} />
                    </Link>
                </div>

                {/* Right Links Section */}
                <div className="hidden lg:flex flex-1 items-center justify-start pl-10">
                    <div className="flex items-center gap-6">
                        {splitRightLinks.map(link => {
                            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                            // Sostituisco "ENTRA NELLA NOSTRA FAMIGLIA" con "CANDIDATI"
                            const linkName = link.name === 'ENTRA NELLA NOSTRA FAMIGLIA' ? 'CANDIDATI' : link.name;
                            return (
                                <Link 
                                    key={link.name} 
                                    to={link.path} 
                                    className={
                                        link.isHighlight 
                                        ? "relative group flex items-center justify-center px-4 py-2 transition-all duration-300 transform hover:scale-105" 
                                        : `text-sm font-semibold tracking-widest transition-colors uppercase relative group flex items-center ${isActive ? 'text-brand-500' : 'text-zinc-300 hover:text-white'}`
                                    }
                                >
                                    {link.isHighlight ? (
                                        <span 
                                            className="relative z-10 text-[28px] md:text-[32px] text-brand-500 hover:text-brand-400 drop-shadow-[0_0_12px_rgba(217,70,239,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(217,70,239,0.6)] transition-all duration-300 rotate-[25deg]" 
                                            style={{ fontFamily: "'Rubik Dirt', system-ui", lineHeight: 1 }}
                                        >
                                            {linkName}
                                        </span>
                                    ) : (
                                        <>
                                            {linkName}
                                            {link.badge && (
                                                <span className="absolute -top-3 -right-6 text-[8px] bg-red-600/90 text-white px-1.5 py-0.5 rounded animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.6)]">{link.badge}</span>
                                            )}
                                            <span className={`absolute -bottom-2 left-0 h-[2px] bg-brand-500 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                        </>
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 lg:static lg:translate-y-0 lg:hidden flex items-center justify-end z-50">
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-white hover:text-brand-500 transition-colors p-2 rounded-full bg-black/20 md:bg-transparent backdrop-blur-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
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
                                            className={
                                                link.isHighlight 
                                                ? `font-heading text-2xl uppercase tracking-widest border-b border-zinc-800/50 py-5 px-4 min-h-[56px] flex items-center justify-between transition-all bg-brand-900/30 text-brand-300 border-l-4 border-l-brand-500` 
                                                : `font-heading text-2xl uppercase tracking-widest border-b border-zinc-800/50 py-5 px-4 min-h-[56px] flex items-center justify-between transition-all ${isActive ? 'text-brand-500 bg-brand-500/10 border-l-4 border-l-brand-500' : 'text-zinc-300 hover:text-white hover:bg-white/5'}`
                                            }
                                        >
                                            <span className={link.isHighlight ? "drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" : ""}>{link.name}</span>
                                            {link.badge && (
                                                <span className="bg-red-600/90 shadow-[0_0_12px_rgba(220,38,38,0.8)] text-white font-sans text-xs font-bold px-3 py-1.5 rounded animate-pulse tracking-normal">
                                                    {link.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                        
                        {/* Mobile Hub Logo */}
                        {hubLogo && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: allLinks.length * 0.05 + 0.2 }}
                                className="mt-8 flex justify-center w-full"
                            >
                                <a 
                                    href="https://www.fusionteamvolley.it/network" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-4 border border-zinc-800 w-full max-w-[280px]"
                                >
                                    <div className="w-12 h-12 bg-white rounded-xl p-2 shrink-0 shadow-inner">
                                        <img src={hubLogo} alt="HUB" className="w-full h-full object-contain mix-blend-multiply filter grayscale" />
                                    </div>
                                    <span className="font-heading text-white tracking-widest text-lg ml-2">NETWORK <span className="text-brand-500">HUB</span></span>
                                </a>
                            </motion.div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
