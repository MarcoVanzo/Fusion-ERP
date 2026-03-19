import { useState, useEffect } from 'react';
import { ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const recentMatches = [
    { id: 1, home: 'FUSION VOLLEY', away: 'TEAM B', sets_home: 3, sets_away: 1, date: '12 Nov', championship_label: 'U18 REGIONALE' },
    { id: 2, home: 'TEAM C', away: 'FUSION VOLLEY', sets_home: 0, sets_away: 3, date: '10 Nov', championship_label: 'SERIE C' },
];

const news = [
    { id: 1, title: 'Grande vittoria contro la capolista in U18', category_name: 'Giovanili', published_at: '2026-11-12' },
    { id: 2, title: 'Iscrizioni aperte per la stagione 2027', category_name: 'Club', published_at: '2026-11-10' },
];

const Proposal2 = () => {
    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] font-sans text-white selection:bg-brand-500 selection:text-white">
            <Helmet>
                <title>Proposal 2: Sleek Minimalist - Fusion Team Volley</title>
            </Helmet>

            {/* Navbar Placeholder for Context */}
            <div className="w-full flex justify-end p-8 border-b border-white/5">
                <div className="flex gap-8 text-xs tracking-widest uppercase text-zinc-500 font-medium">
                    <span className="hover:text-white cursor-pointer transition-colors">Club</span>
                    <span className="text-white">Teams</span>
                    <span className="hover:text-white cursor-pointer transition-colors">News</span>
                </div>
            </div>

            {/* Hero Section */}
            <section className="px-8 md:px-24 py-32 flex flex-col md:flex-row gap-16 items-center">
                <div className="flex-1">
                    <p className="text-brand-500 text-sm tracking-[0.4em] uppercase font-semibold mb-8">
                        Il volley come non l'hai mai visto
                    </p>
                    <h1 className="text-7xl md:text-8xl font-light tracking-tight text-zinc-100 mb-8 leading-[1.1]">
                        Fusion Team Volley
                    </h1>
                    <p className="text-zinc-400 text-lg sm:text-2xl font-light leading-relaxed max-w-xl mb-12">
                        800 atlete unite da un unico grande sogno, riconosciute come il 7° Settore Giovanile in Italia.
                    </p>

                    <div className="flex gap-6">
                        <Link to="#" className="px-8 py-4 bg-white text-black text-sm tracking-widest uppercase font-medium hover:bg-zinc-200 transition-colors rounded-full flex items-center gap-3">
                            Scopri Roster <ChevronRight size={16} />
                        </Link>
                        <Link to="#" className="px-8 py-4 bg-transparent border border-white/20 text-white text-sm tracking-widest uppercase font-medium hover:border-brand-500 hover:text-brand-500 transition-colors rounded-full">
                            Store Ufficiale
                        </Link>
                    </div>
                </div>

                <div className="flex-1 relative aspect-[4/5] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[url('/demo/assets/hero-2.jpg')] bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-700 blur-[2px] transform scale-105"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent"></div>
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl"></div>
                </div>
            </section>

            {/* Grid Content Section */}
            <section className="px-8 md:px-24 py-24 bg-[#050505] border-t border-white/5">
                <div className="flex justify-between items-end mb-16">
                    <h2 className="text-4xl text-white font-light tracking-tight">
                        Latest Results
                    </h2>
                    <Link to="#" className="text-brand-500 text-xs tracking-widest uppercase hover:text-white transition-colors">
                        View All Results
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
                    {recentMatches.map((match, i) => (
                        <div key={match.id} className="bg-[#050505] p-10 flex flex-col hover:bg-[#0A0A0A] transition-colors group">
                            <span className="text-zinc-600 text-xs tracking-[0.2em] uppercase mb-8">{match.championship_label}</span>
                            <div className="flex justify-between items-center mb-8">
                                <span className={`text-lg font-medium ${match.home.includes('FUSION') ? 'text-white' : 'text-zinc-500'}`}>{match.home}</span>
                                <span className="text-2xl font-light text-brand-500 px-4">{match.sets_home} - {match.sets_away}</span>
                                <span className={`text-lg font-medium ${match.away.includes('FUSION') ? 'text-white' : 'text-zinc-500'}`}>{match.away}</span>
                            </div>
                            <div className="mt-auto flex items-center justify-between text-zinc-600 text-xs">
                                <span>{match.date}</span>
                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-500" />
                            </div>
                        </div>
                    ))}
                    <div className="bg-brand-500/5 p-10 flex flex-col items-center justify-center hover:bg-brand-500/10 transition-colors text-brand-500 cursor-pointer text-sm tracking-widest uppercase">
                        + Altri Risultati
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Proposal2;
