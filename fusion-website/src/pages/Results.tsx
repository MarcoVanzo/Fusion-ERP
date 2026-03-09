import { useState, useEffect, useMemo } from 'react';
import { Trophy, ChevronRight, Filter } from 'lucide-react';

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

const Results = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChamp, setSelectedChamp] = useState<string>('TUTTI');

    useEffect(() => {
        // Fetch real FIPAV synced matches from the ERP RecentResults endpoint
        const fetchMatches = async () => {
            try {
                const res = await fetch('https://www.fusionteamvolley.it/ERP/api/router.php?module=results&action=getPublicRecentResults&limit=15');
                const data = await res.json();
                if (data.status === 'success' || data.success === true) {
                    // Extract matches from data.data.matches or data.data depending on structure
                    const matchesArray = data.data.matches ? data.data.matches : data.data;
                    setMatches(matchesArray || []);
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

    return (
        <div className="bg-zinc-950 min-h-screen pb-24 font-sans text-white">

            {/* Header Inter Style */}
            <header className="relative pt-32 pb-20 px-4 overflow-hidden mb-12 border-b-8 border-brand-500 clip-diagonal">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/20 via-zinc-950 to-zinc-950"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-start border-l-8 border-brand-500 pl-8">
                    <h1 className="font-heading text-6xl md:text-8xl tracking-tighter text-white mb-2 leading-none uppercase">
                        MATCH <br /> <span className="text-zinc-600">CENTER</span>
                    </h1>
                    <p className="font-subheading text-2xl text-brand-500 tracking-widest mt-4">
                        RISULTATI UFFICIALI FIPAV
                    </p>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Left Column: Match Lists */}
                <div className="lg:col-span-2 space-y-16">

                    {/* Ultimi Risultati Header & Filter */}
                    <section>
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b-2 border-zinc-800 pb-4 gap-4">
                            <div className="flex items-center gap-4">
                                <Trophy className="text-brand-500" size={32} />
                                <h2 className="text-4xl font-heading text-white tracking-tight">ULTIMI RISULTATI</h2>
                            </div>

                            {/* Filter Dropdown */}
                            {championships.length > 1 && (
                                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-4 py-2 clip-diagonal w-full md:w-auto">
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
                                                <div className={`text-right font-heading text-xl w-2/5 truncate ${isFusionHome ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-zinc-500'}`}>
                                                    {match.home}
                                                </div>

                                                <div className="flex items-center justify-center min-w-[100px] h-12 bg-zinc-950 border border-zinc-800 clip-diagonal font-heading text-2xl tracking-widest text-brand-500">
                                                    {match.sets_home} - {match.sets_away}
                                                </div>

                                                <div className={`text-left font-heading text-xl w-2/5 truncate ${isFusionAway ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-zinc-500'}`}>
                                                    {match.away}
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

                {/* Right Column: Mini Dashboard */}
                <div className="lg:col-span-1">
                    <div className="bg-zinc-900 border border-zinc-800 p-8 clip-diagonal-rev sticky top-24">
                        <h3 className="font-heading text-2xl text-white mb-6 border-b-2 border-brand-500 pb-4">
                            INFO <span className="text-zinc-500">GARE</span>
                        </h3>

                        <p className="text-zinc-400 font-sans text-sm mb-6 leading-relaxed">
                            I risultati riportati in questa pagina riflettono il database ufficiale FIPAV (Federazione Italiana Pallavolo).
                            I dati sono aggiornati automaticamente tramite il Match Center ERP.
                        </p>

                        <div className="w-full bg-zinc-950 p-6 border border-zinc-800 clip-diagonal group cursor-pointer hover:border-brand-primary transition-colors">
                            <div className="font-heading text-xl text-white mb-2 group-hover:text-brand-500 transition-colors">TUTTE LE CLASSIFICHE</div>
                            <div className="font-subheading text-zinc-500 text-sm flex items-center gap-2">Vedi Dettaglio <ChevronRight size={16} /></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Results;
