import { useState, useEffect } from 'react';
import { Seo } from '../components/Seo';
import { motion } from 'framer-motion';
import { Shield, Eye, Heart, Calendar, Users, ChevronRight, Globe, Facebook, Instagram, Building2 } from 'lucide-react';

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';
const API_URL = `${ERP_BASE}/api/router.php`;

interface ClubProfile {
    mission: string | null;
    vision: string | null;
    values: string | null;
    founded_year: number | null;
    logo_path: string | null;
    primary_color: string | null;
    secondary_color: string | null;
}

interface Role {
    id: string;
    name: string;
    description: string | null;
    parent_role_id: string | null;
}

interface Member {
    id: string;
    full_name: string;
    role_id: string;
    role_name: string;
    photo_path: string | null;
    is_active: number;
}

interface OrganigrammaData {
    roles: Role[];
    members: Member[];
}

interface Company {
    id: string;
    name: string;
    vat_number: string | null;
    legal_address: string | null;
    website: string | null;
    facebook: string | null;
    instagram: string | null;
    logo_path: string | null;
    referent_name: string | null;
    referent_contact: string | null;
    description: string | null;
}

const Club = () => {
    const [profile, setProfile] = useState<ClubProfile | null>(null);
    const [orgData, setOrgData] = useState<OrganigrammaData | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, orgRes, companiesRes] = await Promise.all([
                    fetch(`${API_URL}?module=societa&action=getPublicProfile`),
                    fetch(`${API_URL}?module=societa&action=getPublicOrganigramma`),
                    fetch(`${API_URL}?module=societa&action=getPublicCompanies`)
                ]);
                
                const profileJson = await profileRes.json();
                const orgJson = await orgRes.json();
                const companiesJson = await companiesRes.json();

                if (profileJson.success) setProfile(profileJson.data);
                if (orgJson.success) setOrgData(orgJson.data);
                if (companiesJson.success) setCompanies(companiesJson.data);
            } catch (error) {
                console.error('Failed to fetch club data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-heading tracking-widest uppercase">Caricamento...</p>
                </div>
            </div>
        );
    }

    const currentYear = new Date().getFullYear();
    const yearsActive = profile?.founded_year ? currentYear - profile.founded_year : null;

    // Split values by comma or newline for display
    const valuesList = profile?.values
        ? profile.values.split(/[,\n]+/).map(v => v.trim()).filter(Boolean)
        : [];

    return (
        <div className="min-h-screen bg-zinc-950 pb-20">
            <Seo 
                title="Il Club" 
                description="Scopri la storia, i valori e la dirigenza del Fusion Team Volley." 
                image="https://www.fusionteamvolley.it/assets/Gemini_Generated_Image_1grfoi1grfoi1grf.jpeg"
            />

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{ backgroundImage: `url('${import.meta.env.BASE_URL}assets/Gemini_Generated_Image_1grfoi1grfoi1grf.jpeg')`, filter: "brightness(0.55) saturate(1.2)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/40 to-transparent z-10"></div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center"
                >
                    {profile?.logo_path && (
                        <motion.img
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            src={`${ERP_BASE}/${profile.logo_path}`}
                            alt="Logo Fusion Team Volley"
                            className="w-24 h-24 md:w-32 md:h-32 object-contain mb-6 drop-shadow-2xl"
                        />
                    )}
                    <h1 className="font-heading text-6xl md:text-8xl tracking-tighter text-white mb-6 uppercase drop-shadow-xl">
                        IL <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">CLUB</span>
                    </h1>
                    {profile?.founded_year && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="font-subheading text-xl md:text-2xl text-zinc-300 tracking-widest mt-2"
                        >
                            DAL {profile.founded_year}{yearsActive ? ` · ${yearsActive} ANNI DI PASSIONE` : ''}
                        </motion.p>
                    )}
                </motion.div>
            </section>

            {/* Content Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-30">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-8"
                >
                    {/* Mission */}
                    {profile?.mission && (
                        <motion.div variants={itemVariants}>
                            <div className="group bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-zinc-800 overflow-hidden hover:border-brand-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(217,70,239,0.1)]">
                                <div className="p-8 md:p-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-brand-500/10 rounded-xl ring-1 ring-brand-500/30 group-hover:bg-brand-500/20 transition-colors">
                                            <Shield className="text-brand-400" size={24} />
                                        </div>
                                        <h2 className="font-heading text-3xl md:text-4xl text-white uppercase tracking-tight">
                                            LA NOSTRA <span className="text-brand-500">MISSION</span>
                                        </h2>
                                    </div>
                                    <div className="text-zinc-300 text-lg leading-relaxed font-sans space-y-4">
                                        {profile.mission.split('\n').filter(p => p.trim() !== '').map((paragraph, i) => (
                                            <p key={i}>{paragraph}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Vision */}
                    {profile?.vision && (
                        <motion.div variants={itemVariants}>
                            <div className="group bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-zinc-800 overflow-hidden hover:border-brand-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(217,70,239,0.1)]">
                                <div className="p-8 md:p-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-brand-500/10 rounded-xl ring-1 ring-brand-500/30 group-hover:bg-brand-500/20 transition-colors">
                                            <Eye className="text-brand-400" size={24} />
                                        </div>
                                        <h2 className="font-heading text-3xl md:text-4xl text-white uppercase tracking-tight">
                                            LA NOSTRA <span className="text-brand-500">VISION</span>
                                        </h2>
                                    </div>
                                    <div className="text-zinc-300 text-lg leading-relaxed font-sans space-y-4">
                                        {profile.vision.split('\n').filter(p => p.trim() !== '').map((paragraph, i) => (
                                            <p key={i}>{paragraph}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Values */}
                    {valuesList.length > 0 && (
                        <motion.div variants={itemVariants}>
                            <div className="group bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-zinc-800 overflow-hidden hover:border-brand-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(217,70,239,0.1)]">
                                <div className="p-8 md:p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-brand-500/10 rounded-xl ring-1 ring-brand-500/30 group-hover:bg-brand-500/20 transition-colors">
                                            <Heart className="text-brand-400" size={24} />
                                        </div>
                                        <h2 className="font-heading text-3xl md:text-4xl text-white uppercase tracking-tight">
                                            I NOSTRI <span className="text-brand-500">VALORI</span>
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {valuesList.map((value, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.3 + idx * 0.08 }}
                                                className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 text-center hover:border-brand-500/40 hover:bg-zinc-900/50 transition-all duration-300 group/val"
                                            >
                                                <span className="text-zinc-200 font-heading text-lg uppercase tracking-wide group-hover/val:text-brand-300 transition-colors">
                                                    {value}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Founded Year Card */}
                    {profile?.founded_year && (
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-r from-brand-500/10 via-zinc-900/80 to-brand-500/10 backdrop-blur-sm rounded-2xl border border-brand-500/20 p-8 md:p-10 text-center">
                                <div className="inline-flex items-center justify-center p-4 bg-brand-500/10 rounded-full mb-4 ring-1 ring-brand-500/30">
                                    <Calendar className="text-brand-400" size={28} />
                                </div>
                                <div className="font-heading text-6xl md:text-7xl text-brand-500 mb-2 drop-shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                                    {profile.founded_year}
                                </div>
                                <div className="text-zinc-400 text-sm tracking-[0.3em] uppercase font-heading">
                                    Anno di Fondazione
                                </div>
                                {yearsActive && (
                                    <div className="mt-3 text-zinc-500 text-sm">
                                        {yearsActive} anni di storia sportiva
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Società Fondatrici */}
                    {companies.length > 0 && (
                        <motion.div variants={itemVariants} className="mt-12">
                            <div className="text-center mb-16">
                                <h2 className="font-heading text-4xl md:text-6xl text-white uppercase mb-4 tracking-tighter">
                                    LE <span className="text-brand-500">SOCIETÀ FONDATRICI</span>
                                </h2>
                                <p className="text-zinc-500 uppercase tracking-[0.2em] text-sm">Il cuore del Progetto Fusion</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {companies.map((company) => (
                                    <motion.div
                                        key={company.id}
                                        variants={itemVariants}
                                        whileHover={{ y: -10, scale: 1.02 }}
                                        className="group relative bg-zinc-900/40 overflow-hidden backdrop-blur-sm border border-zinc-800/60 hover:border-brand-500 transition-all duration-500 flex flex-col shadow-2xl hover:shadow-[0_0_30px_rgba(217,70,239,0.3)] rounded-[2rem] min-h-[500px] md:h-[500px]"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/5 to-brand-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                        <div className="relative flex items-center justify-center bg-white shrink-0 p-6 h-40 sm:h-48">
                                            {company.logo_path ? (
                                                <img
                                                    src={company.logo_path.startsWith('http') ? company.logo_path : `${ERP_BASE}/${company.logo_path}`}
                                                    alt={`Logo ${company.name}`}
                                                    className="max-h-full max-w-full object-contain filter grayscale-0 md:grayscale md:group-hover:grayscale-0 transition-all duration-700 hover:scale-105 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="font-heading text-zinc-800 font-bold group-hover:text-brand-500 transition-colors duration-500 text-4xl md:text-5xl">
                                                        {company.name.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 to-transparent"></div>
                                        </div>

                                        <div className="flex flex-col flex-grow min-h-0 overflow-hidden z-10 p-6 md:p-8">
                                            <div className="mb-2 shrink-0">
                                                <span className="inline-block px-3 py-1 bg-zinc-800/80 text-brand-400 text-xs font-bold uppercase tracking-wider rounded-full border border-zinc-700">
                                                    Società Fondatrice
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-heading text-white uppercase tracking-wider group-hover:text-brand-400 transition-colors mb-3 shrink-0">
                                                {company.name}
                                            </h3>
                                            
                                            {company.description ? (
                                                <div 
                                                    className="relative mb-6 h-auto md:h-[92px] shrink-0 overflow-visible md:overflow-y-auto pr-0 md:pr-2" 
                                                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
                                                >
                                                    <p className="text-zinc-400 leading-relaxed font-light text-sm" title={company.description}>
                                                        {company.description}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex-grow flex items-center mb-6 min-h-0">
                                                    <div className="text-zinc-600 text-sm italic">Nessuna descrizione disponibile.</div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-zinc-800/50 shrink-0">
                                                {company.website && (
                                                    <a
                                                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center w-10 h-10 bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-brand-600 transition-all duration-300 hover:scale-110"
                                                        title="Sito Web"
                                                    >
                                                        <Globe size={18} strokeWidth={2} />
                                                    </a>
                                                )}
                                                {company.facebook && (
                                                    <a
                                                        href={company.facebook}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center w-10 h-10 bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-blue-600 transition-all duration-300 hover:scale-110"
                                                        title="Facebook"
                                                    >
                                                        <Facebook size={18} strokeWidth={2} />
                                                    </a>
                                                )}
                                                {company.instagram && (
                                                    <a
                                                        href={company.instagram}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center w-10 h-10 bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-pink-600 transition-all duration-300 hover:scale-110"
                                                        title="Instagram"
                                                    >
                                                        <Instagram size={18} strokeWidth={2} />
                                                    </a>
                                                )}
                                                
                                                {!company.website && !company.facebook && !company.instagram && (
                                                    <span className="text-xs text-zinc-600 italic">Nessun link social</span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Organigramma Section */}
                    {orgData && orgData.roles.length > 0 && (
                        <motion.div variants={itemVariants} className="mt-12">
                            <div className="text-center mb-16">
                                <h2 className="font-heading text-4xl md:text-6xl text-white uppercase mb-4 tracking-tighter">
                                    L' <span className="text-brand-500">ORGANIGRAMMA</span>
                                </h2>
                                <p className="text-zinc-500 uppercase tracking-[0.2em] text-sm">La squadra che lavora dietro le quinte</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto items-start">
                                {orgData.roles
                                    .filter(r => !r.parent_role_id)
                                    .map(rootRole => {
                                        const roleMembers = orgData.members.filter(m => m.role_id === rootRole.id);
                                        const children = orgData.roles.filter(r => r.parent_role_id === rootRole.id);
                                        
                                        return (
                                            <div key={rootRole.id} className="space-y-8">
                                                {/* Parent Role Card */}
                                                <div className="flex justify-center">
                                                    <motion.div 
                                                        whileHover={{ y: -5 }}
                                                        className="w-full max-w-md bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl hover:border-brand-500/50 transition-all duration-500"
                                                    >
                                                        <div className="bg-brand-500/10 p-4 border-b border-zinc-800 flex items-center justify-between">
                                                            <span className="text-brand-400 font-heading uppercase text-sm tracking-widest">{rootRole.name}</span>
                                                            <Users size={18} className="text-brand-500" />
                                                        </div>
                                                        <div className="p-6">
                                                            {roleMembers.length > 0 ? (
                                                                <div className="space-y-4">
                                                                    {roleMembers.map(member => (
                                                                        <div key={member.id} className="flex items-center gap-4">
                                                                            <div className="relative">
                                                                                {member.photo_path ? (
                                                                                    <img 
                                                                                        src={`${ERP_BASE}/${member.photo_path}`} 
                                                                                        className="w-14 h-14 rounded-full object-cover border-2 border-brand-500/30" 
                                                                                        alt={member.full_name} 
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                                                                                        <Users className="text-zinc-500" size={24} />
                                                                                    </div>
                                                                                )}
                                                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-zinc-900 rounded-full" />
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-white font-bold leading-tight">{member.full_name}</h4>
                                                                                <p className="text-zinc-500 text-xs uppercase tracking-wider">{rootRole.name}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-zinc-600 italic text-sm text-center">In attesa di assegnazione</p>
                                                            )}
                                                            {rootRole.description && (
                                                                <p className="mt-4 text-zinc-400 text-xs border-t border-zinc-800/50 pt-3 leading-relaxed">
                                                                    {rootRole.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                </div>

                                                {/* Children Roles Grid */}
                                                {children.length > 0 && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full mx-auto">
                                                        {children.map(childRole => {
                                                            const childMembers = orgData.members.filter(m => m.role_id === childRole.id);
                                                            return (
                                                                <motion.div 
                                                                    key={childRole.id}
                                                                    whileHover={{ y: -5 }}
                                                                    className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:border-brand-500/30 transition-all duration-300 flex flex-col gap-4"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <h5 className="text-brand-300 font-heading text-xs uppercase tracking-widest">{childRole.name}</h5>
                                                                        <ChevronRight size={14} className="text-zinc-600" />
                                                                    </div>
                                                                    {childMembers.length > 0 ? (
                                                                        <div className="space-y-3">
                                                                            {childMembers.map(m => (
                                                                                <div key={m.id} className="flex items-center gap-3">
                                                                                    {m.photo_path ? (
                                                                                        <img src={`${ERP_BASE}/${m.photo_path}`} className="w-8 h-8 rounded-full object-cover grayscale hover:grayscale-0 transition-all" alt="" />
                                                                                    ) : (
                                                                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600"><Users size={12} /></div>
                                                                                    )}
                                                                                    <span className="text-zinc-200 text-sm font-medium">{m.full_name}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-zinc-700 text-xs italic">Non assegnato</span>
                                                                    )}
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </motion.div>
                    )}

                    {/* Fallback if no profile data at all */}
                    {!profile?.mission && !profile?.vision && valuesList.length === 0 && !profile?.founded_year && !orgData?.roles.length && companies.length === 0 && (
                        <motion.div variants={itemVariants}>
                            <div className="bg-zinc-900/50 p-8 md:p-12 border border-zinc-800 rounded-2xl backdrop-blur-sm text-center">
                                <Shield className="mx-auto text-zinc-600 mb-4" size={48} />
                                <h3 className="text-xl text-zinc-300 font-heading">Contenuti in arrivo</h3>
                                <p className="text-zinc-500 mt-2">I dettagli del club saranno disponibili a breve.</p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Club;
