import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    category: string;
    season?: string;
}

const Roster = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await fetch('https://www.fusionteamvolley.it/ERP/api/router.php?module=athletes&action=getPublicTeams');
                const data = await res.json();
                if (data.status === 'success') {
                    setTeams(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch teams:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    return (
        <div className="bg-zinc-950 min-h-screen pb-24">
            {/* Header Inter Style */}
            <header className="relative py-24 px-4 overflow-hidden mb-12">
                <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #eab308 0, #eab308 2px, transparent 2px, transparent 100px)' }}></div>
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-start border-l-8 border-brand-500 pl-8">
                    <h1 className="font-heading text-6xl md:text-8xl tracking-tight text-white mb-2">
                        LE <span className="text-zinc-500">SQUADRE</span>
                    </h1>
                    <p className="font-subheading text-2xl text-brand-500 tracking-widest">
                        FUSION TEAM VOLLEY ROSTER
                    </p>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse h-64 bg-zinc-900 border border-zinc-800 clip-diagonal-rev"></div>
                        ))}
                    </div>
                ) : teams.length === 0 ? (
                    <div className="p-16 text-center border border-zinc-800 bg-zinc-900/50 clip-diagonal">
                        <p className="font-subheading text-2xl text-zinc-500">Nessuna squadra trovata nel sistema.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {teams.map(team => (
                            <Link
                                to={`/teams/${team.id}`}
                                key={team.id}
                                className="group relative h-64 overflow-hidden bg-zinc-900 clip-diagonal-rev transition-all duration-500 hover:scale-[1.02]"
                            >
                                {/* Background image placeholder / overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/90 to-transparent z-10"></div>
                                <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-primary opacity-20 group-hover:opacity-40 transition-opacity z-0 transform translate-x-12 -skew-x-12"></div>

                                <div className="relative z-20 p-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="font-subheading text-brand-500 tracking-widest text-sm mb-2 border-b border-zinc-800 pb-2 inline-block">
                                            {team.category || 'CATEGORIA'} {team.season && `| ${team.season}`}
                                        </div>

                                        <h2 className="font-heading text-4xl text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-brand-500 transition-all">
                                            {team.name}
                                        </h2>
                                    </div>

                                    <div className="flex items-center text-zinc-400 group-hover:text-white font-subheading text-lg tracking-wider transition-colors mt-auto">
                                        VEDI ROSTER <ChevronRight size={24} className="ml-2 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Roster;
