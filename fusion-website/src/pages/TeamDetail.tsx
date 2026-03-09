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
                const teamRes = await fetch('https://www.fusionteamvolley.it/ERP/api/router.php?module=athletes&action=teams');
                const teamData = await teamRes.json();
                if (teamData.status === 'success' || teamData.success === true) {
                    const t = teamData.data.find((t: any) => t.id.toString() === id);
                    if (t) setTeamName(t.name);
                }

                // Fetch Athletes
                const rosterRes = await fetch(`https://www.fusionteamvolley.it/ERP/api/router.php?module=athletes&action=getPublicTeamAthletes&teamId=${id}`);
                const rosterData = await rosterRes.json();
                if (rosterData.status === 'success' || rosterData.success === true) {
                    setAthletes(rosterData.data || []);
                }

                // Fetch Staff
                // Note: we might need to filter staff by team if the API returns all
                const staffRes = await fetch(`https://www.fusionteamvolley.it/ERP/api/router.php?module=staff&action=getPublicStaff`);
                const staffData = await staffRes.json();
                if (staffData.status === 'success' || staffData.success === true) {
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
        <div className="flex flex-col min-h-screen pb-24 bg-zinc-950">
            {/* Emotional Header Hero */}
            <section className="relative h-[40vh] min-h-[350px] flex items-center justify-center overflow-hidden mb-12">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/demo/assets/Gemini_Generated_Image_lj3yntlj3yntlj3y.jpeg')", filter: "brightness(0.7)" }}
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/60 z-10"></div>
                <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>

                {/* Back Button */}
                <Link to="/teams" className="absolute top-8 left-8 md:top-12 md:left-12 font-heading text-zinc-300 hover:text-white flex items-center gap-2 z-20 transition-colors text-sm tracking-widest uppercase bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                    <ChevronLeft size={16} /> Torna alle Squadre
                </Link>

                {/* Content */}
                <div className="relative z-20 px-4 flex flex-col items-center w-full mt-8">
                    <h1 className="font-heading text-5xl md:text-7xl lg:text-[7rem] text-center text-white tracking-tighter leading-none drop-shadow-2xl uppercase">
                        {teamName}
                    </h1>
                </div>

                {/* Bottom Border Accent */}
                <div className="absolute bottom-0 left-0 w-full h-2 bg-brand-500 z-20 shadow-[0_0_20px_rgba(214,90,134,0.8)]"></div>
            </section>

            <div className="max-w-[1400px] mx-auto px-4 -mt-16 relative z-20">

                {/* Atlete Grid - "Heroic" Card Style */}
                <div className="mb-24">
                    <h2 className="font-heading text-4xl text-zinc-500 mb-8 border-l-4 border-white pl-4">ATLETE</h2>

                    {(() => {
                        const nameUpper = teamName.toUpperCase();
                        const isU16 = nameUpper.includes('U16') || nameUpper.includes('UNDER 16') || nameUpper.includes('UNDER16');
                        const isU18 = nameUpper.includes('U18') || nameUpper.includes('UNDER 18') || nameUpper.includes('UNDER18');
                        const teamPhoto = isU16 ? '/demo/assets/squadra-u16.jpeg' : isU18 ? '/demo/assets/squadra-u18.jpeg' : null;

                        return teamPhoto ? (
                            <div className="w-full mb-16 border border-zinc-800 bg-zinc-900 clip-diagonal overflow-hidden shadow-2xl">
                                <img src={teamPhoto} alt={`Foto Ufficiale ${teamName}`} className="w-full h-auto object-cover max-h-[600px] hover:scale-105 transition-transform duration-700" />
                            </div>
                        ) : null;
                    })()}

                    {athletes.length === 0 ? (
                        <div className="p-12 border border-zinc-800 bg-zinc-900/30 font-subheading text-xl text-zinc-500 text-center clip-diagonal">Nessuna atleta in rosa.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {athletes.map(athlete => {
                                const photoUrl = athlete.photo_path ? `/ERP/${athlete.photo_path}` : null;
                                return (
                                    <div key={athlete.id} className="group relative h-[480px] bg-zinc-900 overflow-hidden clip-diagonal-rev transition-all duration-500 hover:-translate-y-2 hover:z-10 hover:scale-[1.02] border border-transparent hover:border-brand-500">

                                        {/* Background Texture/Image */}
                                        <div className="absolute inset-0 z-0">
                                            {photoUrl ? (
                                                <img src={photoUrl} className="w-full h-full object-cover opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500" alt={athlete.last_name} />
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
                                            <h3 className="font-heading text-3xl leading-none text-white uppercase group-hover:text-brand-500 group-hover:drop-shadow-[0_0_15px_rgba(214,90,134,0.8)] transition-all duration-300">
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
                                        <div className="absolute top-4 right-6 z-20 font-heading text-7xl text-white/10 group-hover:text-white group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300">
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
