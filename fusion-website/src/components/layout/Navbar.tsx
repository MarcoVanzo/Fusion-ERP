import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

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
        { name: 'IL CLUB', path: '/' },
        { name: 'NEWS', path: '/news' },
        { name: 'SQUADRE', path: '/teams' },
        { name: 'STORE', path: '/shop' },
        { name: 'MATCH CENTER', path: '/results' },
        { name: 'OUTSEASON', path: '/outseason' },
    ];

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled
                ? 'bg-zinc-950 border-b-2 border-brand-500 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
                : 'bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent'
                }`}
        >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-24">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-brand-500 flex items-center justify-center text-zinc-950 font-heading font-bold text-2xl clip-diagonal group-hover:scale-105 transition-transform">
                            F
                        </div>
                        <span className="font-heading text-2xl tracking-tighter uppercase text-white leading-none">
                            FUSION<br /><span className="text-zinc-500 text-lg group-hover:text-brand-500 transition-colors">TEAM</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-10">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`font-subheading text-lg tracking-widest uppercase transition-colors relative 
                                        ${isActive ? 'text-brand-500' : 'text-zinc-400 hover:text-white'}
                                    `}
                                >
                                    {link.name}
                                    {isActive && (
                                        <span className="absolute -bottom-2 relative left-1/2 -translate-x-1/2 w-8 h-[2px] bg-brand-500"></span>
                                    )}
                                </Link>
                            );
                        })}

                        <a
                            href="/ERP"
                            className="px-6 py-3 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-white hover:text-zinc-950 hover:border-white font-subheading text-sm font-bold tracking-widest uppercase transition-all duration-300 clip-diagonal ml-4"
                        >
                            LOGIN ERP
                        </a>
                    </div>

                    {/* Mobile menu button */}
                    <div className="lg:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-white hover:text-brand-500 transition-colors p-2"
                        >
                            {mobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            <div
                className={`lg:hidden absolute top-full left-0 w-full bg-zinc-950 border-b-4 border-brand-500 transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-[500px]' : 'max-h-0'
                    }`}
            >
                <div className="flex flex-col px-6 py-8 gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className="font-heading text-2xl text-zinc-300 hover:text-brand-500 transition-colors uppercase tracking-widest border-b border-zinc-800 pb-4"
                        >
                            {link.name}
                        </Link>
                    ))}
                    <a
                        href="/ERP"
                        className="text-brand-500 font-heading text-xl uppercase tracking-widest mt-4"
                    >
                        ACCEDI ERP
                    </a>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
