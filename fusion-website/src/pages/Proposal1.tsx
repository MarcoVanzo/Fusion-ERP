import { useState, useEffect } from 'react';
import { ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Mocked data mirroring the Home page
const recentMatches = [
    { id: 1, home: 'FUSION VOLLEY', away: 'TEAM B', sets_home: 3, sets_away: 1, date: '12 Nov', championship_label: 'U18 REGIONALE' },
    { id: 2, home: 'TEAM C', away: 'FUSION VOLLEY', sets_home: 0, sets_away: 3, date: '10 Nov', championship_label: 'SERIE C' },
    { id: 3, home: 'FUSION VOLLEY', away: 'TEAM D', sets_home: 3, sets_away: 2, date: '05 Nov', championship_label: 'U16 ECCELLENZA' },
];

const news = [
    { id: 1, title: 'Grande vittoria contro la capolista in U18', category_name: 'Giovanili', published_at: '2026-11-12' },
    { id: 2, title: 'Iscrizioni aperte per la stagione 2027', category_name: 'Club', published_at: '2026-11-10' },
];

const Proposal1 = () => {
    return (
        <div className="flex flex-col gap-0 pb-20 bg-black min-h-screen font-sans text-white">
            <Helmet>
                <title>Proposal 1: Dynamic Neon - Fusion Team Volley</title>
            </Helmet>

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('/assets/hero-1.jpg')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/30 to-black z-10"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-brand-500/20 blur-[120px] rounded-full z-0 mix-blend-screen pointer-events-none"></div>

                <div className="relative z-20 text-center px-4 w-full flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-8 py-3 bg-brand-500 text-black clip-diagonal uppercase text-sm font-black tracking-[0.3em] mb-8 italic skew-x-[-10deg]">
                        Settore Giovanile d'Eccellenza
                    </div>

                    <h1 className="font-heading text-6xl md:text-[9rem] tracking-tighter mb-4 text-white leading-none italic uppercase -skew-x-12 drop-shadow-[0_0_30px_rgba(255,20,147,0.8)]">
                        FUSION
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-brand-400 to-brand-600">
                            TEAM VOLLEY
                        </span>
                    </h1>

                    <p className="font-subheading text-xl md:text-3xl text-zinc-300 mt-6 tracking-widest uppercase italic max-w-2xl mx-auto">
                        800 ATLETE. UN UNICO GRANDE SOGNO.
                    </p>

                    <div className="flex gap-6 mt-16 justify-center w-full max-w-xl">
                        <Link to="#" className="flex-1 py-6 bg-brand-500 text-black font-black text-2xl hover:bg-white transition-all clip-diagonal-rev flex justify-center items-center gap-2 skew-x-[-15deg]">
                            <span className="skew-x-[15deg] uppercase">I Roster</span>
                        </Link>
                        <Link to="#" className="flex-1 py-6 bg-transparent border-4 border-brand-500 text-brand-500 font-black text-2xl hover:bg-brand-500 hover:text-black transition-all clip-diagonal flex justify-center items-center gap-2 skew-x-[-15deg]">
                            <span className="skew-x-[15deg] uppercase">Lo Store</span>
                        </Link>
                    </div>
                </div>
                
                {/* Diagonal Separator */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-zinc-950 clip-diagonal-rev z-30 translate-y-16"></div>
            </section>

            {/* Results Section */}
            <section className="relative z-40 bg-zinc-950 pt-20 pb-32 px-4 md:px-12">
                <h2 className="font-heading text-5xl md:text-7xl italic text-white uppercase -skew-x-12 mb-16 border-l-8 border-brand-500 pl-6">
                    ULTIMI <span className="text-brand-500">RISULTATI</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {recentMatches.map(match => (
                        <div key={match.id} className="relative bg-zinc-900 clip-diagonal-rev p-1 border border-zinc-800 hover:border-brand-500 transition-colors group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-[50px] group-hover:bg-brand-500/30 transition-all rounded-full pointer-events-none"></div>
                            <div className="bg-zinc-950 h-full w-full clip-diagonal-rev p-8 flex flex-col justify-between">
                                <div className="text-brand-500 font-bold text-xs tracking-[0.2em] uppercase mb-4">{match.championship_label}</div>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="font-heading text-2xl w-1/3 truncate text-zinc-300">{match.home}</div>
                                    <div className="font-heading text-5xl text-white drop-shadow-[0_0_10px_rgba(255,20,147,0.5)]">
                                        {match.sets_home} - {match.sets_away}
                                    </div>
                                    <div className="font-heading text-2xl w-1/3 text-right truncate text-zinc-300">{match.away}</div>
                                </div>
                                <div className="text-zinc-600 text-sm italic font-bold tracking-widest">{match.date}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Proposal1;
