import { useState, useEffect, useMemo } from 'react';
import { Trophy, Filter } from 'lucide-react';

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

    useEffect(() => {
        // Fetch real FIPAV synced matches and standings from the ERP MatchCenter endpoint
        const fetchMatches = async () => {
            try {
                const res = await fetch('https://www.fusionteamvolley.it/ERP/api/router.php?module=results&action=getPublicMatchCenter');
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
        <div className="flex flex-col min-h-screen pb-24 font-sans text-white">
            {/* Emotional Header Hero */}
            <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden mb-12">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/demo/assets/Gemini_Generated_Image_g2wpx2g2wpx2g2wp.jpeg')", filter: "brightness(0.8)" }}
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-zinc-950/70 z-10 transition-colors"></div>
                <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-950 to-transparent z-10"></div>

                {/* Content */}
                <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center pt-8">
                    <h1 className="font-heading text-6xl md:text-8xl tracking-tighter mb-4 text-white uppercase drop-shadow-xl leading-none">
                        MATCH <br /> <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(214,90,134,0.5)]">CENTER</span>
                    </h1>
                    <p className="font-subheading text-2xl text-brand-500 tracking-widest mt-4">
                        RISULTATI UFFICIALI FIPAV
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Left Column: Match Lists */}
                <div className="lg:col-span-2 space-y-16">

                    {/* Ultimi Risultati Header & Filter */}
                    <section>
                        <div className="sticky top-24 z-30 bg-zinc-950/90 backdrop-blur-md pt-4 pb-4 border-b-2 border-zinc-800 flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-4">
                                <Trophy className="text-brand-500" size={32} />
                                <h2 className="text-4xl font-heading text-white tracking-tight">ULTIMI RISULTATI</h2>
                            </div>

                            {/* Filter Dropdown */}
                            {championships.length > 1 && (
                                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-4 py-2 clip-diagonal w-full md:w-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                                    <Filter size={20} className="text-brand-500" />
                                    <select
                                        value={selectedChamp}
                                        onChange={(e) => setSelectedChamp(e.target.value)}
                                        className="bg-transparent border-none text-white font-subheading tracking-wider focus:outline-none focus:ring-0 cursor-pointer w-full appearance-none"
                                        aria-label="Filtra per campionato"
                                    >
                                        {championships.map((champ: string) => (
                                            <option key={champ} value={champ} className="bg-zinc-900 text-white">
                                                {champ === 'TUTTI' ? 'TUTTI I CAMPIONATI' : champ}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-zinc-900 h-32 clip-diagonal border border-zinc-800"></div>)}
                            </div>
                        ) : pastMatches.length === 0 ? (
                            <div className="p-12 text-center border border-zinc-800 bg-zinc-900/40 clip-diagonal">
                                <p className="font-subheading text-2xl text-zinc-500">Nessuna partita registrata di recente.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {pastMatches.map((match: Match) => {
                                    const isFusionHome = match.home.toLowerCase().includes('fusion');
                                    const isFusionAway = match.away.toLowerCase().includes('fusion');
                                    // Determina se Fusion ha vinto
                                    let fusionWon = false;
                                    if (isFusionHome && match.sets_home! > match.sets_away!) fusionWon = true;
                                    if (isFusionAway && match.sets_away! > match.sets_home!) fusionWon = true;

                                    return (
                                        <div key={match.id} className="relative group flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-zinc-900 clip-diagonal border-l-4 border-transparent hover:border-brand-500 hover:bg-zinc-800 transition-colors">

                                            <div className="text-center md:text-left min-w-[150px]">
                                                <div className="font-subheading text-brand-500 text-sm tracking-widest mb-1">
                                                    {match.date}
                                                </div>
                                                <div className="text-zinc-400 font-subheading text-xs uppercase">{match.championship_label}</div>
                                            </div>

                                            <div className="flex items-center gap-4 justify-center flex-grow w-full md:w-auto mt-4 md:mt-0">
                                                <div className={`flex items-center justify-end gap-2 w-2/5 ${isFusionHome ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-zinc-500'}`}>
                                                    <span className="font-heading text-sm md:text-xl break-words whitespace-normal leading-tight text-right">{match.home}</span>
                                                    {isFusionHome && (
                                                        <img src="/demo/assets/logo-colorato.png" alt="Fusion" className="w-10 h-10 rounded-full object-contain border-2 border-brand-500/60 shadow-[0_0_12px_rgba(217,70,239,0.5)] bg-zinc-900 flex-shrink-0" />
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-center min-w-[100px] h-12 bg-zinc-950 border border-zinc-800 clip-diagonal font-heading text-2xl tracking-widest text-brand-500">
                                                    {match.sets_home} - {match.sets_away}
                                                </div>

                                                <div className={`flex items-center gap-2 w-2/5 ${isFusionAway ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-zinc-500'}`}>
                                                    {isFusionAway && (
                                                        <img src="/demo/assets/logo-colorato.png" alt="Fusion" className="w-10 h-10 rounded-full object-contain border-2 border-brand-500/60 shadow-[0_0_12px_rgba(217,70,239,0.5)] bg-zinc-900 flex-shrink-0" />
                                                    )}
                                                    <span className="font-heading text-sm md:text-xl break-words whitespace-normal leading-tight">{match.away}</span>
                                                </div>
                                            </div>

                                            <div className="hidden md:flex min-w-[100px] justify-end">
                                                {fusionWon ? (
                                                    <div className="font-subheading text-brand-500 tracking-widest text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">WIN</div>
                                                ) : (
                                                    <div className="font-subheading text-zinc-600 tracking-widest text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">LOSS</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column: Classifiche */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-8">
                        {loading ? (
                            <div className="bg-zinc-900 border border-zinc-800 p-8 clip-diagonal-rev h-96 animate-pulse"></div>
                        ) : filteredStandings.length === 0 ? (
                            <div className="bg-zinc-900 border border-zinc-800 p-8 clip-diagonal-rev font-subheading text-zinc-500 text-center">
                                Nessuna classifica trovata per il campionato selezionato.
                            </div>
                        ) : (
                            filteredStandings.map((champ) => (
                                <div key={champ.championship_id} className="bg-zinc-900 border border-zinc-800 p-4 md:p-6 clip-diagonal-rev overflow-hidden">
                                    <h3 className="font-heading text-lg md:text-xl text-white mb-4 border-b-2 border-brand-500 pb-2 uppercase break-words whitespace-normal leading-tight">
                                        CLASSIFICA <span className="text-zinc-500 block mt-1">{champ.championship_label}</span>
                                    </h3>

                                    <div className="flex flex-col gap-1">
                                        {champ.rows.map((row) => (
                                            <div key={row.team} className={`flex items-center justify-between p-2 text-sm ${row.is_our_team ? 'bg-brand-500/20 text-white font-bold border-l-2 border-brand-500' : 'text-zinc-400 border-l-2 border-transparent hover:bg-zinc-800'}`}>
                                                <div className="flex items-center gap-2 w-3/4">
                                                    <span className="w-5 text-center text-zinc-600 font-heading text-xs">{row.position}</span>
                                                    {row.is_our_team && (
                                                        <img src="/demo/assets/logo-colorato.png" alt="Fusion" className="w-5 h-5 rounded-full object-contain border border-brand-500/60 flex-shrink-0" />
                                                    )}
                                                    <span className="truncate uppercase text-xs tracking-wider">{row.team}</span>
                                                </div>
                                                <div className="w-1/4 text-right font-heading text-white">
                                                    {row.points} <span className="text-brand-500 text-[10px]">PT</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Results;
