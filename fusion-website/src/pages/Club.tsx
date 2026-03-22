import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Shield, Eye, Heart, Calendar } from 'lucide-react';

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

const Club = () => {
    const [profile, setProfile] = useState<ClubProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}?module=societa&action=getPublicProfile`);
                const data = await res.json();
                if (data.success) {
                    setProfile(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch club profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
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
            <Helmet>
                <title>Il Club - Fusion Team Volley</title>
                <meta name="description" content="La storia e i valori del Fusion Team Volley." />
            </Helmet>

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/assets/hero-2.jpg')", filter: "brightness(0.7)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent z-10"></div>

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
            <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-30">
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
                                    <p className="text-zinc-300 text-lg leading-relaxed font-sans whitespace-pre-line">
                                        {profile.mission}
                                    </p>
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
                                    <p className="text-zinc-300 text-lg leading-relaxed font-sans whitespace-pre-line">
                                        {profile.vision}
                                    </p>
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

                    {/* Fallback if no profile data at all */}
                    {!profile?.mission && !profile?.vision && valuesList.length === 0 && !profile?.founded_year && (
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
