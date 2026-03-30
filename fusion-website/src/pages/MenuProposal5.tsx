import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, User } from 'lucide-react';

const MenuProposal5 = () => {
    const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);

    const menuItems = [
        {
            name: 'IL CLUB',
            id: 'club',
            path: '/club',
            hasMegaMenu: true,
            megaMenuContent: (
                <div className="grid grid-cols-4 gap-8">
                    <div className="col-span-1 border-r border-zinc-800 pr-8">
                        <h4 className="text-xs uppercase font-bold text-zinc-500 tracking-widest mb-4">Esplora</h4>
                        <ul className="flex flex-col gap-3">
                            <li><Link to="/club" className="text-white hover:text-brand-500 font-medium text-lg transition-colors">La Storia</Link></li>
                            <li><Link to="/club" className="text-white hover:text-brand-500 font-medium text-lg transition-colors">Organigramma</Link></li>
                            <li><Link to="/club" className="text-white hover:text-brand-500 font-medium text-lg transition-colors">Palmares</Link></li>
                            <li><Link to="/network" className="text-white hover:text-brand-500 font-medium text-lg transition-colors">Società Affiliate</Link></li>
                        </ul>
                    </div>
                    <div className="col-span-3 grid grid-cols-2 gap-6">
                         <div className="group relative overflow-hidden rounded-xl h-48 bg-zinc-900 border border-zinc-800 hover:border-brand-500 transition-colors pt-6 px-6">
                            <h5 className="font-heading text-xl uppercase mb-2">Progetto Giovani</h5>
                            <p className="text-sm text-zinc-400 mb-4">Scopri la nostra academy per i talenti del futuro.</p>
                            <span className="text-brand-500 text-sm font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">Scopri <ArrowRight size={16}/></span>
                         </div>
                         <div className="group relative overflow-hidden rounded-xl h-48">
                            <img src="/assets/squadra-u14.jpeg" alt="Foresteria" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-6">
                                <h5 className="font-heading text-xl uppercase text-white">Foresteria Venezia</h5>
                            </div>
                         </div>
                    </div>
                </div>
            )
        },
        {
            name: 'SQUADRE',
            id: 'teams',
            path: '/teams',
            hasMegaMenu: true,
            megaMenuContent: (
                <div className="grid grid-cols-4 gap-6">
                    <div className="col-span-1">
                        <Link to="/teams/serie-c-maschile" className="block p-4 border border-zinc-800 hover:border-brand-500 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 transition-all group">
                            <h5 className="font-heading uppercase text-xl mb-1 text-white group-hover:text-brand-500">Serie C Maschile</h5>
                            <span className="text-xs text-zinc-500 tracking-widest uppercase">Prima Squadra</span>
                        </Link>
                    </div>
                    <div className="col-span-1">
                        <Link to="/teams/under-18" className="block p-4 border border-zinc-800 hover:border-brand-500 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 transition-all group">
                            <h5 className="font-heading uppercase text-xl mb-1 text-white group-hover:text-brand-500">Under 18</h5>
                            <span className="text-xs text-zinc-500 tracking-widest uppercase">Giovanili Maschile</span>
                        </Link>
                    </div>
                    <div className="col-span-1">
                        <Link to="/teams/under-16" className="block p-4 border border-zinc-800 hover:border-brand-500 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 transition-all group">
                            <h5 className="font-heading uppercase text-xl mb-1 text-white group-hover:text-brand-500">Under 16</h5>
                            <span className="text-xs text-zinc-500 tracking-widest uppercase">Giovanili Maschile</span>
                        </Link>
                    </div>
                    <div className="col-span-1 flex items-center justify-center p-4 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl">
                        <Link to="/teams" className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest flex items-center gap-2">
                            Tutte le squadre <ArrowRight size={16}/>
                        </Link>
                    </div>
                </div>
            )
        },
        { name: 'MATCH CENTER', id: 'match', path: '/results', hasMegaMenu: false },
        { name: 'NEWS', id: 'news', path: '/news', hasMegaMenu: false },
        { name: 'STORE', id: 'store', path: '/shop', hasMegaMenu: false },
    ];

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-500 selection:text-white">
            {/* Top Bar with Mega Menu trigger */}
            <div className="relative z-50">
                <nav className="bg-zinc-950 border-b border-zinc-900 relative z-50">
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/assets/logo-colorato.png" alt="Logo" className="w-12 h-12 object-contain" />
                            <div className="flex flex-col">
                                <span className="font-heading text-lg uppercase tracking-widest leading-none mt-1">Fusion Team</span>
                                <span className="text-[9px] text-brand-500 tracking-[0.2em] font-bold uppercase -mt-0.5">Volley Club</span>
                            </div>
                        </Link>

                        {/* Desktop Main Links */}
                        <div className="hidden lg:flex items-stretch h-full">
                            {menuItems.map(item => (
                                <div 
                                    key={item.id}
                                    className="flex items-stretch"
                                    onMouseEnter={() => item.hasMegaMenu && setActiveMegaMenu(item.id)}
                                >
                                    <Link 
                                        to={item.path} 
                                        className={`px-6 flex items-center gap-2 text-sm font-bold tracking-widest uppercase transition-colors border-b-2 mt-0.5 ${activeMegaMenu === item.id ? 'border-brand-500 text-brand-500' : 'border-transparent text-zinc-300 hover:text-white'}`}
                                    >
                                        {item.name}
                                        {item.hasMegaMenu && <ChevronDown size={14} className={`transition-transform duration-300 ${activeMegaMenu === item.id ? 'rotate-180' : ''}`} />}
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* ERP Access */}
                        <div className="hidden lg:flex items-center">
                            <Link to="/ERP" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-zinc-900 hover:bg-brand-500 text-white px-5 py-2.5 rounded-full transition-colors border border-zinc-800 hover:border-brand-500">
                                <User size={14} /> Area ERP
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Mega Menu Dropdown */}
                <div 
                    className="absolute top-20 left-0 w-full"
                    onMouseLeave={() => setActiveMegaMenu(null)}
                >
                    <AnimatePresence>
                        {activeMegaMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="bg-zinc-950/95 backdrop-blur-2xl border-b border-zinc-800 shadow-2xl overflow-hidden"
                            >
                                <div className="max-w-7xl mx-auto px-6 py-10">
                                    {menuItems.find(i => i.id === activeMegaMenu)?.megaMenuContent}
                                </div>
                                <div className="h-1 w-full bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Dummy Content */}
            <div className="relative h-[calc(100vh-80px)] overflow-hidden bg-black">
                <div className="absolute inset-0 bg-[url('/assets/squadra-u16.jpeg')] bg-cover bg-center grayscale opacity-80"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 relative z-10">
                    <div className="bg-brand-500 text-white shadow-[0_0_20px_rgba(232,67,130,0.4)] px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
                        Passa col mouse su "IL CLUB" e "SQUADRE"
                    </div>
                    <h1 className="text-5xl md:text-8xl font-heading text-white uppercase sm:tracking-widest drop-shadow-2xl">
                        Proposal 5
                    </h1>
                    <p className="text-2xl mt-4 font-light text-zinc-300 max-w-xl mx-auto">
                        Dynamic Mega Menu
                    </p>
                </div>
                
                {/* Backdrop overlay for mega menu */}
                <AnimatePresence>
                    {activeMegaMenu && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 pointer-events-none"
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MenuProposal5;
