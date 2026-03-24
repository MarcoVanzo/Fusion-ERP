import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Seo } from '../components/Seo';

interface Athlete {
    id: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
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
    photo_path?: string;
    gender?: string;
}

const AthleteCard = ({ athlete }: { athlete: Athlete }) => {
    const [imgError, setImgError] = useState(false);
    const photoUrl = athlete.photo_path && athlete.photo_path.trim() !== '' ? `/ERP/${athlete.photo_path}` : null;

    return (
        <div className="group relative aspect-[2/3] min-h-[400px] w-full bg-zinc-900 overflow-hidden clip-diagonal-rev transition-all duration-500 hover:-translate-y-2 hover:z-10 hover:scale-[1.02] border border-transparent hover:border-brand-500 animate-shimmer">
            {/* Background Texture/Image */}
            <div className="absolute inset-0 z-0 bg-zinc-950">
                {photoUrl && !imgError ? (
                    <img 
                        loading="lazy"
                        src={photoUrl} 
                        className="w-full h-full object-cover opacity-0 transition-opacity duration-1000 group-hover:scale-110" 
                        alt={athlete.full_name || athlete.last_name} 
                        onLoad={(e) => {
                            e.currentTarget.classList.remove('opacity-0');
                            e.currentTarget.classList.add('opacity-100');
                            e.currentTarget.parentElement?.parentElement?.classList.remove('animate-shimmer');
                        }}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950">
                        <span className="font-heading text-9xl text-zinc-800">F</span>
                    </div>
                )}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10"></div>

            {/* Player Info - Bottom Pinned */}
            <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex flex-col justify-end">
                <div className="font-subheading text-brand-500 tracking-widest text-sm mb-1 uppercase">
                    {athlete.role || 'ROLE TBD'}
                </div>
                <h3 className="@container w-full font-heading leading-none text-white uppercase group-hover:text-brand-500 group-hover:drop-shadow-[0_0_15px_rgba(214,90,134,0.8)] transition-all duration-300">
                    {(() => {
                        const nameObj = athlete.full_name || athlete.first_name || '';
                        const parts = nameObj.split(' ');
                        const first = parts.shift() || '';
                        const last = parts.join(' ') || athlete.last_name || '';
                        return (
                            <div className="flex flex-col w-full">
                                <span 
                                    className="whitespace-nowrap overflow-visible"
                                    style={{ fontSize: `min(1.875rem, calc(100cqi / (${Math.max(1, first.length)} * 1.2)))` }}
                                >
                                    {first}
                                </span>
                                <span 
                                    className="whitespace-nowrap overflow-visible"
                                    style={{ fontSize: `min(2.25rem, calc(100cqi / (${Math.max(1, last.length)} * 1.2)))` }}
                                >
                                    {last}
                                </span>
                            </div>
                        );
                    })()}
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
};

const StaffCard = ({ member }: { member: Staff }) => {
    const [imgError, setImgError] = useState(false);
    const photoUrl = member.photo_path && member.photo_path.trim() !== '' ? `/ERP/${member.photo_path}` : null;
    const shadowImg = member.gender === 'F' ? import.meta.env.BASE_URL + 'assets/ombra_donna.png' : import.meta.env.BASE_URL + 'assets/ombra_uomo.png';

    return (
        <div className="group relative aspect-[3/4] min-h-[350px] w-full bg-zinc-900 overflow-hidden clip-diagonal-rev transition-all duration-500 hover:-translate-y-2 hover:z-10 hover:scale-[1.02] border border-transparent hover:border-brand-500">
            <div className="absolute inset-0 z-0 bg-zinc-950">
                {photoUrl && !imgError ? (
                    <img 
                        loading="lazy"
                        src={photoUrl} 
                        className="w-full h-full object-cover opacity-100 group-hover:scale-110 transition-all duration-500" 
                        alt={`${member.first_name} ${member.last_name}`} 
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <img 
                        loading="lazy"
                        src={shadowImg} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-500" 
                        alt="Silhouette" 
                        onError={(e) => {
                            // If the shadow image itself fails to load, hide it to prevent broken image icons
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                    />
                )}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex flex-col justify-end">
                <div className="font-subheading text-brand-500 tracking-widest text-sm mb-1 uppercase">
                    {member.role || 'ALLENATORE'}
                </div>
                <h3 className="@container w-full font-heading leading-none text-white uppercase group-hover:text-brand-500 group-hover:drop-shadow-[0_0_15px_rgba(214,90,134,0.8)] transition-all duration-300">
                    <div className="flex flex-col w-full">
                        <span 
                            className="whitespace-nowrap overflow-visible"
                            style={{ fontSize: `min(1.875rem, calc(100cqi / (${Math.max(1, (member.first_name || '').length)} * 1.2)))` }}
                        >
                            {member.first_name}
                        </span>
                        <span 
                            className="whitespace-nowrap overflow-visible"
                            style={{ fontSize: `min(2.25rem, calc(100cqi / (${Math.max(1, (member.last_name || '').length)} * 1.2)))` }}
                        >
                            {member.last_name}
                        </span>
                    </div>
                </h3>
            </div>
        </div>
    );
};

const TeamDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const stateTeamId = location.state?.teamId;
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [teamName, setTeamName] = useState('ROSTER UFFICIALE');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setLoading(true);

                let targetTeamId = stateTeamId;

                // Fetch Teams for the header name
                const teamRes = await fetch('/ERP/api/router.php?module=athletes&action=teams');
                const teamData = await teamRes.json();
                if (teamData.status === 'success' || teamData.success === true) {
                    if (!targetTeamId) {
                        const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                        const t = teamData.data.find((t: any) => generateSlug(t.name) === slug);
                        if (t) {
                            targetTeamId = t.id.toString();
                            setTeamName(t.name);
                        }
                    } else {
                        const t = teamData.data.find((t: any) => t.id.toString() === targetTeamId.toString());
                        if (t) setTeamName(t.name);
                    }
                }

                if (!targetTeamId) {
                    setLoading(false);
                    return;
                }

                // Fetch Athletes
                const rosterRes = await fetch(`/ERP/api/router.php?module=athletes&action=getPublicTeamAthletes&teamId=${targetTeamId}`);
                const rosterData = await rosterRes.json();
                if (rosterData.status === 'success' || rosterData.success === true) {
                    setAthletes(rosterData.data || []);
                }

                // Fetch Staff
                const staffRes = await fetch(`/ERP/api/router.php?module=staff&action=getPublicStaff&teamId=${targetTeamId}`);
                const staffData = await staffRes.json();
                if (staffData.status === 'success' || staffData.success === true) {
                    const sortedStaff = (staffData.data || []).sort((a: any, b: any) => {
                        const roleOrder = [
                            'primo allenatore',
                            'secondo allenatore',
                            'dirigente',
                            'preparatore atletico',
                            'fisioterapista',
                            'social media manager',
                            'direttore tecnico'
                        ];
                        const roleA = (a.role || '').toLowerCase().trim();
                        const roleB = (b.role || '').toLowerCase().trim();
                        
                        let indexA = roleOrder.indexOf(roleA);
                        let indexB = roleOrder.indexOf(roleB);
                        
                        if (indexA === -1) indexA = 999;
                        if (indexB === -1) indexB = 999;
                        
                        return indexA - indexB;
                    });
                    setStaff(sortedStaff);
                }
            } catch (err) {
                console.error('API Error', err);
            } finally {
                setLoading(false);
            }
        };

        if (slug || stateTeamId) fetchTeamData();
    }, [slug, stateTeamId]);

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
            <Seo title={teamName !== 'ROSTER UFFICIALE' ? `Roster ${teamName}` : 'Dettaglio Squadra'} description={`Scopri il roster ufficiale, le atlete e lo staff tecnico della squadra ${teamName} del Fusion Team Volley.`} />
            {/* Emotional Header Hero */}
            <section className="relative h-[40vh] min-h-[350px] flex items-center justify-center overflow-hidden mb-12">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${import.meta.env.BASE_URL}assets/Gemini_Generated_Image_lj3yntlj3yntlj3y.jpeg')`, filter: "brightness(0.55) saturate(1.2)" }}
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10"></div>
                <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>

                {/* Breadcrumbs */}
                <div className="absolute top-28 left-4 md:top-32 md:left-12 z-20 flex items-center gap-2 text-[10px] md:text-xs tracking-widest uppercase font-heading bg-zinc-950/60 px-4 py-2 clip-diagonal backdrop-blur-md border border-zinc-800/50">
                    <Link to="/" className="text-zinc-400 hover:text-white transition-colors">Home</Link>
                    <span className="text-zinc-600">/</span>
                    <Link to="/teams" className="text-zinc-400 hover:text-white transition-colors">Squadre</Link>
                    <span className="text-zinc-600">/</span>
                    <span className="text-brand-500">{teamName}</span>
                </div>

                {/* Content */}
                <div className="relative z-20 px-4 flex flex-col items-center w-full mt-8">
                    <h1 className="font-heading text-5xl md:text-7xl lg:text-[7rem] text-center text-white tracking-tighter leading-none drop-shadow-2xl uppercase">
                        {teamName}
                    </h1>
                </div>

                {/* Bottom Border Accent */}
                <div className="absolute bottom-0 left-0 w-full h-2 bg-brand-500 z-20 shadow-[0_0_20px_rgba(214,90,134,0.8)]"></div>
            </section>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-16 md:mt-16 md:pt-24 relative z-20">

                {/* Atlete Grid - "Heroic" Card Style */}
                <div className="mb-24">
                    <h2 className="font-heading text-4xl text-zinc-500 mb-8 border-l-4 border-white pl-4">ATLETE</h2>

                    {(() => {
                        const nameUpper = teamName.toUpperCase();
                        const isU13 = nameUpper.includes('U13') || nameUpper.includes('UNDER 13') || nameUpper.includes('UNDER13');
                        const isU14 = nameUpper.includes('U14') || nameUpper.includes('UNDER 14') || nameUpper.includes('UNDER14');
                        const isU16 = nameUpper.includes('U16') || nameUpper.includes('UNDER 16') || nameUpper.includes('UNDER16');
                        const isU18 = nameUpper.includes('U18') || nameUpper.includes('UNDER 18') || nameUpper.includes('UNDER18');
                        const teamPhoto = isU13 ? import.meta.env.BASE_URL + 'assets/squadra-u13.jpeg' : isU14 ? import.meta.env.BASE_URL + 'assets/squadra-u14.jpeg' : isU16 ? import.meta.env.BASE_URL + 'assets/squadra-u16.jpeg' : isU18 ? import.meta.env.BASE_URL + 'assets/squadra-u18.jpeg' : null;

                        return teamPhoto ? (
                            <div className="w-full mb-16 border border-zinc-800 bg-zinc-900 clip-diagonal overflow-hidden shadow-2xl">
                                <img loading="lazy" src={teamPhoto} alt={`Foto Ufficiale ${teamName}`} className="w-full h-auto object-cover max-h-[600px] hover:scale-105 transition-transform duration-700" />
                            </div>
                        ) : null;
                    })()}

                    {athletes.length === 0 ? (
                        <div className="p-12 border border-zinc-800 bg-zinc-900/30 font-subheading text-xl text-zinc-500 text-center clip-diagonal">Nessuna atleta in rosa.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                            {athletes.map(athlete => <AthleteCard key={athlete.id} athlete={athlete} />)}
                        </div>
                    )}
                </div>

                {/* Staff Grid */}
                {staff.length > 0 && (
                    <div className="mb-24">
                        <h2 className="font-heading text-4xl text-zinc-500 mb-8 border-l-4 border-brand-500 pl-4">STAFF TECNICO</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                            {staff.map(member => <StaffCard key={member.id} member={member} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetail;
