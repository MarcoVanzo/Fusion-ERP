import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Seo } from '../components/Seo';

interface Team {
    id: number;
    name: string;
    category: string;
    season?: string;
}

const Roster = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await fetch('/ERP/api/router.php?module=athletes&action=getPublicTeams');
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
            <Seo 
                title="Le Squadre" 
                description="I roster ufficiali di tutte le squadre giovanili e prime squadre del Fusion Team Volley." 
                image="https://www.fusionteamvolley.it/assets/Gemini_Generated_Image_5v1qm15v1qm15v1q.jpeg"
            />
            {/* Emotional Header Hero */}
            <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden mb-12">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${import.meta.env.BASE_URL}assets/Gemini_Generated_Image_5v1qm15v1qm15v1q.jpeg')`, filter: "brightness(0.55) saturate(1.2)" }}
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10 transition-colors"></div>
                <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 flex flex-col items-center border-b-4 border-brand-500 pb-6 w-full text-center">
                    <h1 className="font-heading text-6xl md:text-8xl tracking-tighter text-white mb-2 uppercase drop-shadow-xl">
                        LE <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(214,90,134,0.5)]">SQUADRE</span>
                    </h1>
                    <p className="font-subheading text-xl md:text-2xl text-zinc-300 tracking-widest mt-2 bg-zinc-950/50 inline-block px-4 py-1 border border-white/10 rounded-none">
                        FUSION TEAM VOLLEY ROSTER
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow">
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
                        {teams.map(team => {
                            const slug = generateSlug(team.name);
                            return (
                            <Link
                                to={`/teams/${slug}`}
                                state={{ teamId: team.id, teamName: team.name }}
                                key={team.id}
                                className="group relative h-64 overflow-hidden bg-zinc-900 clip-diagonal-rev transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                            >
                                {/* Conditional Background image  */}
                                {(() => {
                                    const nameUpper = team.name.toUpperCase();
                                    const isU13 = nameUpper.includes('U13') || nameUpper.includes('UNDER 13') || nameUpper.includes('UNDER13');
                                    const isU14 = nameUpper.includes('U14') || nameUpper.includes('UNDER 14') || nameUpper.includes('UNDER14');
                                    const isU16 = nameUpper.includes('U16') || nameUpper.includes('UNDER 16') || nameUpper.includes('UNDER16');
                                    const isU18 = nameUpper.includes('U18') || nameUpper.includes('UNDER 18') || nameUpper.includes('UNDER18');
                                    const bgImage = isU13 ? '/assets/squadra-u13.jpeg' : isU14 ? '/assets/squadra-u14.jpeg' : isU16 ? '/assets/squadra-u16.jpeg' : isU18 ? '/assets/squadra-u18.jpeg' : null;

                                    return bgImage ? (
                                        /* Full-card photo — visible, bright, centered on the team */
                                        <div
                                            className="absolute inset-0 z-0 bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity duration-700 scale-100 group-hover:scale-105 transition-transform"
                                            style={{ backgroundImage: `url('${bgImage}')`, backgroundPosition: 'center 20%' }}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-900 to-brand-900/20 flex items-center justify-end opacity-80 group-hover:opacity-100 transition-opacity duration-700 pr-8">
                                            <img src="/assets/logo-colorato.png" loading="lazy" alt="Fusion Logo" className="max-h-40 opacity-10 drop-shadow-2xl" />
                                        </div>
                                    );
                                })()}

                                {/* Left-side text area: dark gradient that fades to transparent on the right */}
                                <div className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/85 via-40% to-transparent" />
                                {/* Bottom gradient to blend into page */}
                                <div className="absolute bottom-0 left-0 right-0 h-12 z-10 bg-gradient-to-t from-zinc-950/60 to-transparent" />
                                {/* Pink accent line on left border */}
                                <div className="absolute top-0 left-0 w-[3px] h-full z-20 bg-brand-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                                {/* Hover pink shimmer on right */}
                                <div className="absolute top-0 right-0 w-1/3 h-full z-10 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-l from-brand-500 to-transparent pointer-events-none" />

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
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Roster;
