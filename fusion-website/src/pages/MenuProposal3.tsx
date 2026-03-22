import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MenuProposal3 = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Prevent scrolling when drawer is open
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isDrawerOpen]);

    const navLinks = [
        { name: 'Il Club', path: '/club', desc: 'La nostra storia e i nostri valori' },
        { name: 'Le Squadre', path: '/teams', desc: 'I roster della stagione attuale' },
        { name: 'Foresteria', path: '/foresteria', desc: 'Vivere e crescere a Venezia' },
        { name: 'News & Media', path: '/news', desc: 'Tutte le ultime dal campo' },
        { name: 'Outseason', path: '/outseason', desc: 'Camp estivi e attività fuori stagione' },
        { name: 'Il Network', path: '/network', desc: 'Le società affiliate al progetto' },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans">
            {/* Top Bar */}
            <nav className="fixed top-0 w-full z-40 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 py-4">
                <Link to="/" className="flex items-center gap-3">
                    <img src="/assets/logo-colorato.png" alt="Logo" className="w-12 h-12 object-contain" />
                </Link>

                <div className="flex items-center gap-6">
                    <Link to="/results" className="hidden sm:block text-xs uppercase tracking-widest font-bold bg-brand-500 text-white px-4 py-2 hover:bg-white hover:text-black transition-colors">
                        Match Center
                    </Link>
                    <Link to="/shop" className="hidden sm:block text-xs uppercase tracking-widest font-bold border border-white/20 px-4 py-2 hover:border-brand-500 hover:text-brand-500 transition-colors">
                        Store
                    </Link>
                    <button 
                        onClick={() => setIsDrawerOpen(true)}
                        className="flex items-center justify-center p-2 text-white hover:text-brand-500 transition-colors"
                    >
                        <Menu size={32} />
                    </button>
                </div>
            </nav>

            {/* Side Drawer Overlay */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                            onClick={() => setIsDrawerOpen(false)}
                        />

                        {/* Drawer Panel */}
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[500px] z-50 bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col overflow-y-auto"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                                <span className="font-heading text-xl uppercase tracking-widest text-brand-500">Menu Principale</span>
                                <button 
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-2 bg-zinc-800 hover:bg-brand-500 hover:text-white rounded-full transition-colors text-zinc-400"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 px-6 py-8 flex flex-col gap-8">
                                <ul className="flex flex-col gap-2">
                                    {navLinks.map((link) => (
                                        <li key={link.name}>
                                            <Link 
                                                to={link.path}
                                                onClick={() => setIsDrawerOpen(false)}
                                                className="group flex flex-col p-4 rounded-xl hover:bg-zinc-800 transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-heading text-3xl uppercase text-zinc-200 group-hover:text-brand-500 transition-colors">
                                                        {link.name}
                                                    </span>
                                                    <ArrowRight size={20} className="text-zinc-600 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                                                </div>
                                                <span className="text-sm text-zinc-500">{link.desc}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Drawer Footer (Contact Info / Utilities) */}
                            <div className="bg-zinc-950 p-8 border-t border-brand-500">
                                <h4 className="text-xs uppercase tracking-widest text-brand-500 font-bold mb-6">Contatti</h4>
                                <div className="flex flex-col gap-4 text-sm text-zinc-400">
                                    <div className="flex items-center gap-3"><MapPin size={16} className="text-brand-500"/> Sede Centrale, Venezia</div>
                                    <div className="flex items-center gap-3"><Mail size={16} className="text-brand-500"/> info@fusionteam.it</div>
                                    <div className="flex items-center gap-3"><Phone size={16} className="text-brand-500"/> +39 345 6789012</div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center">
                                    <a href="/ERP" className="text-xs font-bold uppercase tracking-widest text-white hover:text-brand-500 transition-colors">Accesso Gestionale ↗</a>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Dummy Content */}
            <div className="h-screen flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-brand-500/10 blur-[100px] rounded-full z-0 pointer-events-none"></div>
                
                <div className="relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6">Proposal 3</h1>
                    <div className="mx-auto w-24 h-2 bg-brand-500 mb-6 clip-diagonal"></div>
                    <p className="text-xl md:text-3xl font-heading text-zinc-500 tracking-widest uppercase">
                        Side Drawer
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MenuProposal3;
