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
                if (data.status === 'success' || data.success === true) {
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
        <div className="flex flex-col min-h-screen pb-24">
            {/* Emotional Header Hero */}
            <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden mb-12">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/demo/assets/Gemini_Generated_Image_5v1qm15v1qm15v1q.jpeg')" }}
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-zinc-950/70 z-10"></div>
                <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-950 to-transparent z-10"></div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 relative z-20 flex flex-col items-center border-b-4 border-brand-500 pb-6 w-full text-center">
                    <h1 className="font-heading text-6xl md:text-8xl tracking-tighter text-white mb-2 uppercase drop-shadow-xl">
                        LE <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(214,90,134,0.5)]">SQUADRE</span>
                    </h1>
                    <p className="font-subheading text-xl md:text-2xl text-zinc-300 tracking-widest mt-2 bg-zinc-950/50 inline-block px-4 py-1 border border-white/10 rounded-none">
                        FUSION TEAM VOLLEY ROSTER
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 w-full flex-grow">
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
                                className="group relative h-64 overflow-hidden bg-zinc-900 clip-diagonal-rev transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                            >
                                {/* Conditional Background image  */}
                                {(() => {
                                    const nameUpper = team.name.toUpperCase();
                                    const isU16 = nameUpper.includes('U16') || nameUpper.includes('UNDER 16') || nameUpper.includes('UNDER16');
                                    const isU18 = nameUpper.includes('U18') || nameUpper.includes('UNDER 18') || nameUpper.includes('UNDER18');
                                    const bgImage = isU16 ? '/demo/assets/squadra-u16.jpeg' : isU18 ? '/demo/assets/squadra-u18.jpeg' : null;

                                    return bgImage ? (
                                        <div
                                            className="absolute top-0 bottom-0 right-0 left-[30%] z-0 bg-cover bg-[right_bottom] opacity-60 group-hover:opacity-100 transition-opacity duration-700 mix-blend-screen contrast-125 saturate-150"
                                            style={{ backgroundImage: `url('${bgImage}')` }}
                                        />
                                    ) : (
                                        <div className="absolute top-0 bottom-0 right-0 left-[30%] z-0 bg-gradient-to-br from-zinc-900/50 to-brand-900/20 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-700 p-8">
                                            <img src="/demo/assets/logo-colorato.png" alt="Fusion Logo" className="max-w-full max-h-full opacity-10 drop-shadow-2xl mix-blend-lighten" />
                                        </div>
                                    );
                                })()}
                                {/* Background image placeholder / overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/95 to-transparent z-10"></div>
                                <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-primary opacity-30 group-hover:opacity-60 transition-opacity duration-500 z-0 transform translate-x-12 -skew-x-12 blend-screen mix-blend-color-dodge"></div>

                                <div className="relative z-20 p-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="font-subheading text-brand-500 tracking-widest text-sm mb-2 border-b border-zinc-800 pb-2 inline-block">
                                            {(team.category || 'CATEGORIA').replace(/A$/i, '')} {team.season && `| ${team.season}`}
                                        </div>

                                        <h2 className="font-heading text-4xl text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-brand-500 transition-all">
                                            {team.name.replace(/\s?A$/, '')}
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
