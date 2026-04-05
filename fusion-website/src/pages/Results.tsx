import { useState, useEffect, useMemo } from 'react';
import { Trophy, Filter } from 'lucide-react';
import { Seo } from '../components/Seo';

interface Match {
    id: number;
    home: string;
    away: string;
    date: string;
    time?: string;
    championship_label: string;
    sets_home?: number;
    sets_away?: number;
    is_our_team: boolean;
}

interface StandingRow {
    team: string;
    position: number;
    points: number;
    played: number;
    won: number;
    lost: number;
    is_our_team: boolean;
}

interface ChampionshipStanding {
    championship_id: string;
    championship_label: string;
    rows: StandingRow[];
}

const Results = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [standings, setStandings] = useState<ChampionshipStanding[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChamp, setSelectedChamp] = useState<string>('TUTTI');
    const [activeTab, setActiveTab] = useState<'risultati' | 'classifiche'>('risultati');

    useEffect(() => {
        // Fetch real FIPAV synced matches and standings from the ERP MatchCenter endpoint
        const fetchMatches = async () => {
            try {
                const res = await fetch('/ERP/api/router.php?module=results&action=getPublicMatchCenter');
                const data = await res.json();
                if (data.status === 'success' || data.success === true) {
                    setMatches(data.data.matches || []);
                    setStandings(data.data.standings || []);
                }
            } catch (error) {
                console.error('Failed to fetch matches:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, []);

    // Extract unique championships
    const championships = useMemo(() => {
        const set = new Set<string>();
        matches.forEach(m => {
            if (m.championship_label) set.add(m.championship_label);
        });
        return ['TUTTI', ...Array.from(set)];
    }, [matches]);

    // Filter matches by selected championship
    const filteredMatches = useMemo(() => {
        if (selectedChamp === 'TUTTI') return matches;
        return matches.filter(m => m.championship_label === selectedChamp);
    }, [matches, selectedChamp]);

    const pastMatches = filteredMatches;

    // Filter standings by selected championship
    const filteredStandings = useMemo(() => {
        if (selectedChamp === 'TUTTI') return standings;
        return standings.filter(s => s.championship_label === selectedChamp);
    }, [standings, selectedChamp]);

    return (
        <div className="flex flex-col min-h-screen pb-24 font-sans text-white bg-zinc-950">
            <Seo title="Match Center - Risultati e Classifiche" description="Scopri i risultati ufficiali e le classifiche di tutte le squadre del Fusion Team Volley." />
            
            {/* Emotional Header Hero */}
            <section className="relative h-[40vh] min-h-[350px] flex items-center justify-center overflow-hidden mb-8">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${import.meta.env.BASE_URL}assets/Gemini_Generated_Image_g2wpx2g2wpx2g2wp.jpeg')`, filter: "brightness(0.4) saturate(1.2)" }}
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10 transition-colors"></div>
                
                {/* Content */}
                <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center pt-12">
                    <Trophy className="text-brand-500 mb-6 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]" size={48} />
                    <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-4 text-white uppercase drop-shadow-xl leading-none">
                        MATCH <span className="text-brand-500">CENTER</span>
                    </h1>
                    <p className="font-subheading text-lg md:text-2xl text-zinc-300 tracking-widest mt-2 uppercase">
                        Risultati e Classifiche Ufficiali
                    </p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 w-full">
                
                {/* Tabs Navigation */}
                <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 mb-8 max-w-2xl mx-auto backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('risultati')}
                        className={`flex-1 py-3 md:py-4 px-6 text-sm md:text-lg font-heading tracking-widest uppercase transition-all duration-300 rounded-xl ${
                            activeTab === 'risultati' 
                                ? 'bg-brand-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]' 
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                    >
                        Ultimi Risultati
                    </button>
                    <button
                        onClick={() => setActiveTab('classifiche')}
                        className={`flex-1 py-3 md:py-4 px-6 text-sm md:text-lg font-heading tracking-widest uppercase transition-all duration-300 rounded-xl ${
                            activeTab === 'classifiche' 
                                ? 'bg-brand-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]' 
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                    >
                        Classifiche
                    </button>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-zinc-900/40 p-4 border border-zinc-800/50 rounded-2xl">
                    <h2 className="text-2xl font-heading text-white tracking-tight flex items-center gap-3">
                        <Filter className="text-brand-500" size={24} />
                        {activeTab === 'risultati' ? 'RISULTATI' : 'CLASSIFICHE'}
                    </h2>

                    {championships.length > 1 && (
                        <div className="w-full md:w-auto relative group">
                            <select
                                value={selectedChamp}
                                onChange={(e) => setSelectedChamp(e.target.value)}
                                className="w-full md:w-64 bg-zinc-950 border border-zinc-700 text-white font-subheading tracking-wider py-3 px-4 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer appearance-none transition-colors shadow-inner"
                                aria-label="Filtra per campionato"
                            >
                                {championships.map((champ: string) => (
                                    <option key={champ} value={champ} className="bg-zinc-900 text-white">
                                        {champ === 'TUTTI' ? 'TUTTI I CAMPIONATI' : champ}
                                    </option>
                                ))}
                            </select>
                            {/* Custom Down Arrow */}
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-zinc-500 font-heading tracking-widest uppercase">Sincronizzazione FIPAV...</p>
                        </div>
                    ) : (
                        <>
                            {/* Risultati Tab Content */}
                            {activeTab === 'risultati' && (
                                <div className="space-y-4">
                                    {pastMatches.length === 0 ? (
                                        <div className="py-16 text-center border border-zinc-800/50 bg-zinc-900/20 rounded-2xl">
                                            <p className="font-subheading text-xl text-zinc-500">Nessuna partita trovata per i criteri selezionati.</p>
                                        </div>
                                    ) : (
                                        pastMatches.map((match: Match) => {
                                            const isFusionHome = match.home.toLowerCase().includes('fusion');
                                            const isFusionAway = match.away.toLowerCase().includes('fusion');
                                            
                                            // Determine if Fusion won
                                            let fusionWonStatus: 'win' | 'loss' | null = null;
                                            if ((isFusionHome || isFusionAway) && match.sets_home != null && match.sets_away != null) {
                                                const homeSets = Number(match.sets_home);
                                                const awaySets = Number(match.sets_away);
                                                if (homeSets > 0 || awaySets > 0) {
                                                    if (isFusionHome) {
                                                        fusionWonStatus = homeSets > awaySets ? 'win' : (homeSets < awaySets ? 'loss' : null);
                                                    } else if (isFusionAway) {
                                                        fusionWonStatus = awaySets > homeSets ? 'win' : (awaySets < homeSets ? 'loss' : null);
                                                    }
                                                }
                                            }

                                            return (
                                                <div key={match.id} className="group flex flex-col md:flex-row items-center justify-between gap-6 p-5 md:p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl hover:border-brand-500/40 hover:bg-zinc-800 transition-all duration-300 shadow-lg">
                                                    
                                                    {/* Date and Championship Info */}
                                                    <div className="text-center md:text-left w-full md:w-1/4">
                                                        <div className="inline-flex items-center gap-2 mb-2">
                                                            <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(217,70,239,0.8)]"></div>
                                                            <span className="font-subheading text-white text-sm md:text-base tracking-widest">
                                                                {match.date} {match.time && `- ${match.time}`}
                                                            </span>
                                                        </div>
                                                        <div className="text-zinc-400 font-subheading text-xs uppercase tracking-wider line-clamp-2">
                                                            {match.championship_label}
                                                        </div>
                                                    </div>

                                                    {/* Score & Teams */}
                                                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-2/4 justify-center">
                                                        {/* Home Team */}
                                                        <div className={`flex flex-col md:flex-row items-center md:justify-end gap-3 flex-1 text-center md:text-right w-full ${isFusionHome ? 'text-white' : 'text-zinc-300'}`}>
                                                            <span className={`font-heading text-sm md:text-lg leading-tight uppercase ${isFusionHome ? 'font-bold drop-shadow-md text-brand-50' : ''}`}>
                                                                {match.home}
                                                            </span>
                                                        </div>

                                                        {/* Score Badge */}
                                                        <div className="flex items-center justify-center shrink-0">
                                                            <div className="px-5 py-2 min-w-[90px] text-center bg-zinc-950 border border-zinc-700/80 rounded-xl font-heading text-2xl tracking-widest text-brand-500 shadow-inner">
                                                                {match.sets_home} - {match.sets_away}
                                                            </div>
                                                        </div>

                                                        {/* Away Team */}
                                                        <div className={`flex flex-col-reverse md:flex-row items-center md:justify-start gap-3 flex-1 text-center md:text-left w-full ${isFusionAway ? 'text-white' : 'text-zinc-300'}`}>
                                                            <span className={`font-heading text-sm md:text-lg leading-tight uppercase ${isFusionAway ? 'font-bold drop-shadow-md text-brand-50' : ''}`}>
                                                                {match.away}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Result Status Label */}
                                                    <div className="flex w-full md:w-1/4 justify-center md:justify-end">
                                                        {fusionWonStatus === 'win' && (
                                                            <div className="px-4 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 font-subheading tracking-widest text-xs rounded-full uppercase">
                                                                Vittoria
                                                            </div>
                                                        )}
                                                        {fusionWonStatus === 'loss' && (
                                                            <div className="px-4 py-1.5 bg-zinc-800/80 text-zinc-400 border border-zinc-700 font-subheading tracking-widest text-xs rounded-full uppercase">
                                                                Sconfitta
                                                            </div>
                                                        )}
                                                        {!fusionWonStatus && (
                                                            <div className="w-20"></div> // Spacer for alignment if neutral match
                                                        )}
                                                    </div>

                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* Classifiche Tab Content */}
                            {activeTab === 'classifiche' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {filteredStandings.length === 0 ? (
                                        <div className="col-span-1 lg:col-span-2 py-16 text-center border border-zinc-800/50 bg-zinc-900/20 rounded-2xl">
                                            <p className="font-subheading text-xl text-zinc-500">Nessuna classifica trovata per i criteri selezionati.</p>
                                        </div>
                                    ) : (
                                        filteredStandings.map((champ) => (
                                            <div key={champ.championship_id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-brand-500/40 transition-colors">
                                                {/* Top Glowing edge */}
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                
                                                <h3 className="font-heading text-lg md:text-xl text-white mb-6 text-center pb-4 border-b border-zinc-800 uppercase tracking-widest break-words whitespace-normal leading-tight">
                                                    {champ.championship_label}
                                                </h3>

                                                <div className="flex flex-col gap-1.5">
                                                    {/* Header row */}
                                                    <div className="flex items-center justify-between px-3 py-1 mb-2">
                                                        <div className="flex items-center gap-3 w-3/4">
                                                            <span className="w-6 text-center text-zinc-600 font-subheading text-xs tracking-widest">POS</span>
                                                            <span className="text-zinc-600 font-subheading text-xs tracking-widest">SQUADRA</span>
                                                        </div>
                                                        <div className="w-1/4 text-center text-zinc-600 font-subheading text-xs tracking-widest">
                                                            PUNTI
                                                        </div>
                                                    </div>

                                                    {/* Standings rows */}
                                                    {champ.rows.map((row) => (
                                                        <div 
                                                            key={row.team} 
                                                            className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                                                                row.is_our_team 
                                                                    ? 'bg-brand-500/15 text-white font-bold border border-brand-500/30 shadow-[0_0_15px_rgba(217,70,239,0.05)]' 
                                                                    : 'text-zinc-300 hover:bg-zinc-800 border border-transparent'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-4 w-3/4 overflow-hidden">
                                                                {/* Position Circle */}
                                                                <div className={`w-7 h-7 flex flex-shrink-0 items-center justify-center rounded-full font-heading text-sm ${
                                                                    row.position === 1 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' :
                                                                    row.position === 2 ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/50' :
                                                                    row.position === 3 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/50' :
                                                                    'bg-zinc-950 text-zinc-500 border border-zinc-800'
                                                                }`}>
                                                                    {row.position}
                                                                </div>
                                                                
                                                                <span className="truncate uppercase text-xs md:text-sm tracking-widest font-semibold flex-1">
                                                                    {row.team}
                                                                </span>
                                                            </div>
                                                            <div className="w-1/4 flex justify-center">
                                                                <div className={`min-w-[40px] text-center px-2 py-1 rounded bg-zinc-950 font-heading text-base ${row.is_our_team ? 'text-white' : 'text-zinc-300'}`}>
                                                                    {row.points} <span className="text-brand-500 text-[10px] ml-0.5">PT</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Results;

