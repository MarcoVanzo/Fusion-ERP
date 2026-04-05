import { useState, useEffect } from 'react';
import { Seo } from '../components/Seo';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    ArrowRightLeft, 
    PlusCircle, 
    Clock, 
    User, 
    Building2, 
    Calendar, 
    StickyNote,
    Filter,
    MoreHorizontal,
    Lock
} from 'lucide-react';

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';
const API_URL = `${ERP_BASE}/api/router.php`;

interface ScoutingAthlete {
    id: string;
    nome: string;
    cognome: string;
    societa_appartenenza: string | null;
    anno_nascita: string | null;
    ruolo: string | null;
    note: string | null;
    rilevatore: string | null;
    data_rilevazione: string | null;
    source: 'manual' | 'cognito_fusion' | 'cognito_network' | 'website';
    is_locked_edit: number;
}

const Scouting = () => {
    const [athletes, setAthletes] = useState<ScoutingAthlete[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [lastSync, setLastSync] = useState<string | null>(null);

    useEffect(() => {
        const fetchScoutingData = async () => {
            try {
                // In a real scenario, this would fetch from the API
                const res = await fetch(`${API_URL}?module=scouting&action=list`);
                const data = await res.json();
                if (data.success) {
                    setAthletes(data.data);
                    setLastSync(data.last_sync || null);
                }
            } catch (error) {
                console.error('Failed to fetch scouting data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchScoutingData();
    }, []);

    const filteredAthletes = athletes.filter((a) => {
        const searchStr = `${a.nome} ${a.cognome} ${a.societa_appartenenza || ""}`.toLowerCase();
        return searchStr.includes(search.toLowerCase());
    });

    const getSourceConfig = (source: string) => {
        switch (source) {
            case 'cognito_fusion':
                return { label: 'Fusion', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
            case 'cognito_network':
                return { label: 'Network', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
            default:
                return { label: 'Manuale', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' };
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 pb-20 pt-24 px-4 sm:px-6 lg:px-8">
            <Seo 
                title="Database Scouting" 
                description="Gestione atleti segnalati e contatti scouting Fusion Team Volley." 
            />

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="font-heading text-4xl md:text-5xl text-white uppercase tracking-tighter">
                            DATABASE <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.3)]">SCOUTING</span>
                        </h1>
                        <p className="text-zinc-500 font-sans mt-2 max-w-xl">
                            Archivio centralizzato per il monitoraggio dei talenti e dei contatti provenienti da segnalazioni manuali o flussi digitali.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-wrap gap-3"
                    >
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white hover:border-zinc-700 transition-all font-heading text-sm uppercase tracking-wider">
                            <ArrowRightLeft size={18} />
                            Sincronizza
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all font-heading text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(217,70,239,0.2)]">
                            <PlusCircle size={18} />
                            Nuovo Inserimento
                        </button>
                    </motion.div>
                </div>

                {/* Stats & Search Bar */}
                <div className="flex flex-col lg:flex-row gap-6 mb-8">
                    <div className="flex-grow relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Cerca per nome, cognome o società..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-sans"
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 px-6 py-4 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
                                <User className="text-brand-400" size={20} />
                            </div>
                            <div>
                                <div className="text-white font-heading text-xl leading-none">{filteredAthletes.length}</div>
                                <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Atleti</div>
                            </div>
                        </div>

                        {lastSync && (
                            <div className="hidden sm:flex bg-zinc-900/50 border border-zinc-800 px-6 py-4 rounded-2xl items-center gap-4">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                    <Clock className="text-blue-400" size={20} />
                                </div>
                                <div>
                                    <div className="text-zinc-300 font-sans text-xs leading-tight">
                                        Ultimo Sync Cognito<br />
                                        <span className="text-zinc-500">{new Date(lastSync).toLocaleString('it-IT')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Area */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 rounded-3xl overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-bottom border-zinc-800 bg-zinc-900/50">
                                    <th className="px-6 py-5 text-zinc-500 font-heading text-[10px] uppercase tracking-[0.2em]">Atleta</th>
                                    <th className="px-6 py-5 text-zinc-500 font-heading text-[10px] uppercase tracking-[0.2em]">Dettagli Sportivi</th>
                                    <th className="px-6 py-5 text-zinc-500 font-heading text-[10px] uppercase tracking-[0.2em]">Data & Report</th>
                                    <th className="px-6 py-5 text-zinc-500 font-heading text-[10px] uppercase tracking-[0.2em]">Fonte</th>
                                    <th className="px-6 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                <AnimatePresence mode='popLayout'>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-zinc-500 font-heading tracking-widest uppercase text-xs">Ricerca in corso...</p>
                                            </td>
                                        </tr>
                                    ) : filteredAthletes.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <Search className="mx-auto text-zinc-700 mb-4" size={40} />
                                                <p className="text-zinc-400 font-heading">Nessun risultato trovato</p>
                                                <p className="text-zinc-600 text-sm mt-1">Prova a modificare i termini della ricerca.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAthletes.map((athlete) => {
                                            const sync = getSourceConfig(athlete.source);
                                            return (
                                                <motion.tr 
                                                    key={athlete.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="group hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors capitalize font-heading">
                                                                {athlete.nome[0]}{athlete.cognome[0]}
                                                            </div>
                                                            <div>
                                                                <div className="text-white font-heading tracking-tight text-lg leading-tight uppercase">
                                                                    {athlete.nome} {athlete.cognome}
                                                                </div>
                                                                <div className="flex items-center gap-3 text-zinc-500 text-xs mt-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Calendar size={12} />
                                                                        Anno: {athlete.anno_nascita || 'N/D'}
                                                                    </div>
                                                                    {athlete.ruolo && (
                                                                        <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-3 uppercase tracking-wider text-[10px] text-zinc-400">
                                                                            {athlete.ruolo}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2 text-zinc-300 text-sm">
                                                                <Building2 size={14} className="text-brand-500/60" />
                                                                {athlete.societa_appartenenza || 'Svincolato'}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                                                <User size={12} />
                                                                Rilevatore: {athlete.rilevatore || '—'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="text-zinc-400 text-xs font-sans tabular-nums">
                                                                {athlete.data_rilevazione || '—'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-zinc-500 text-xs italic line-clamp-1 max-w-[200px]" title={athlete.note || ''}>
                                                                <StickyNote size={12} />
                                                                {athlete.note || 'Nessuna nota'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 font-sans">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-heading uppercase tracking-wider border ${sync.bg} ${sync.color} ${sync.border}`}>
                                                                {sync.label}
                                                            </span>
                                                            {athlete.is_locked_edit === 1 && (
                                                                <Lock size={12} className="text-zinc-600" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 text-right">
                                                        <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
                                                            <MoreHorizontal size={20} />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Scouting;
