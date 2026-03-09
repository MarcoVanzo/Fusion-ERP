import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface Athlete {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    jersey_number?: number;
    height_cm?: number;
    weight_kg?: number;
    photo_path?: string;
}

interface Staff {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
}

const TeamDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [teamName, setTeamName] = useState('ROSTER UFFICIALE');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setLoading(true);

                // Fetch Teams for the header name
                const teamRes = await fetch('/ERP/api/?module=athletes&action=teams');
                const teamData = await teamRes.json();
                if (teamData.status === 'success') {
                    const t = teamData.data.find((t: any) => t.id.toString() === id);
                    if (t) setTeamName(t.name);
                }

                // Fetch Athletes
                const rosterRes = await fetch(`/ERP/api/?module=athletes&action=listLight&teamId=${id}`);
                const rosterData = await rosterRes.json();
                if (rosterData.status === 'success') {
                    setAthletes(rosterData.data || []);
                }

                // Fetch Staff
                // Note: we might need to filter staff by team if the API returns all
                const staffRes = await fetch(`/ERP/api/?module=staff&action=list`);
                const staffData = await staffRes.json();
                if (staffData.status === 'success') {
                    // Assuming staff logic can map to teams. Showing all for mock if not explicitly mapped.
                    setStaff(staffData.data ? staffData.data.slice(0, 3) : []); // Mocking 3 staff members
                }
            } catch (err) {
                console.error('API Error', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchTeamData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 p-24">
                <div className="animate-pulse h-32 bg-zinc-900 border border-zinc-800 mb-12 clip-diagonal"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="animate-pulse h-[450px] bg-zinc-900 clip-diagonal-rev"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-950 min-h-screen pb-24 overflow-hidden">

            {/* Aggressive Header */}
            <header className="relative h-[40vh] bg-zinc-900 flex items-center justify-center border-b-[16px] border-brand-500 clip-diagonal">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-primary/20 via-zinc-950 to-zinc-950"></div>

                <Link to="/teams" className="absolute top-12 left-12 font-subheading text-zinc-400 hover:text-white flex items-center gap-2 z-20 transition-colors text-lg tracking-widest">
                    <ChevronLeft size={20} /> TORNA ALLE SQUADRE
                </Link>

                <h1 className="relative z-10 font-heading text-6xl md:text-[8rem] text-center text-white tracking-tighter leading-none px-4">
                    {teamName}
                </h1>
            </header>

            <div className="max-w-[1400px] mx-auto px-4 -mt-16 relative z-20">

                {/* Atlete Grid - "Heroic" Card Style */}
                <div className="mb-24">
                    <h2 className="font-heading text-4xl text-zinc-500 mb-8 border-l-4 border-white pl-4">ATLETE</h2>

                    {athletes.length === 0 ? (
                        <div className="p-12 border border-zinc-800 bg-zinc-900/30 font-subheading text-xl text-zinc-500 text-center clip-diagonal">Nessuna atleta in rosa.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {athletes.map(athlete => {
                                const photoUrl = athlete.photo_path ? `/ERP/${athlete.photo_path}` : null;
                                return (
                                    <div key={athlete.id} className="group relative h-[480px] bg-zinc-900 overflow-hidden clip-diagonal-rev transition-all duration-300 hover:z-10 hover:scale-105 border border-transparent hover:border-brand-500">

                                        {/* Background Texture/Image */}
                                        <div className="absolute inset-0 z-0">
                                            {photoUrl ? (
                                                <img src={photoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500" alt={athlete.last_name} />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950">
                                                    <span className="font-heading text-9xl text-zinc-800">F</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10"></div>

                                        {/* Player Info - Bottom Pinned */}
                                        <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex flex-col justify-end">
                                            <div className="font-subheading text-brand-500 tracking-widest text-sm mb-1 uppercase">
                                                {athlete.role || 'ROLE TBD'}
                                            </div>
                                            <h3 className="font-heading text-3xl leading-none text-white uppercase group-hover:text-brand-500 transition-colors">
                                                {athlete.first_name}<br />
                                                <span className="text-4xl">{athlete.last_name}</span>
                                            </h3>

                                            {(athlete.height_cm || athlete.weight_kg) && (
                                                <div className="flex gap-4 mt-4 font-subheading text-zinc-400 text-sm">
                                                    {athlete.height_cm && <div>H: <span className="text-white">{athlete.height_cm} CM</span></div>}
                                                    {athlete.weight_kg && <div>W: <span className="text-white">{athlete.weight_kg} KG</span></div>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Jumbo Jersey Number */}
                                        <div className="absolute top-4 right-6 z-20 font-heading text-7xl text-white/10 group-hover:text-white/30 transition-colors">
                                            {athlete.jersey_number || ''}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Staff Grid */}
                {staff.length > 0 && (
                    <div>
                        <h2 className="font-heading text-4xl text-zinc-500 mb-8 border-l-4 border-brand-primary pl-4">STAFF TECNICO</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {staff.map(member => (
                                <div key={member.id} className="bg-zinc-900 p-8 border border-zinc-800 clip-diagonal flex flex-col justify-between h-48 hover:bg-zinc-800 transition-colors">
                                    <div>
                                        <div className="font-subheading text-brand-primary tracking-widest text-sm mb-2">{member.role || 'ALLENATORE'}</div>
                                        <div className="font-heading text-3xl text-white">{member.first_name} {member.last_name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetail;
