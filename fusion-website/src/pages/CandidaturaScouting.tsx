import React, { useState } from 'react';
import { Seo } from '../components/Seo';
import { motion } from 'framer-motion';

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';
const API_URL = `${ERP_BASE}/api/router.php`;

const CandidaturaScouting = () => {
    const [formData, setFormData] = useState({
        nome: '',
        cognome: '',
        societa_appartenenza: '',
        anno_nascita: '',
        ruolo: '',
        note: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch(`${API_URL}?module=scouting&action=applyScouting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Si è verificato un errore durante l\'invio.');
            }
        } catch (err) {
            setError('Impossibile connettersi al server. Riprova più tardi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 pb-20 pt-24 px-4 sm:px-6 lg:px-8">
            <Seo 
                title="Candidatura Scouting" 
                description="Invia la tua candidatura per entrare a far parte di Fusion Team Volley." 
            />

            <div className="max-w-3xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="font-heading text-4xl md:text-5xl text-white uppercase tracking-tighter">
                        CANDIDATURA <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.3)]">SCOUTING</span>
                    </h1>
                    <p className="text-zinc-400 font-sans mt-4 max-w-xl mx-auto">
                        Sei un'atleta e vuoi farti notare da Fusion Team Volley? Compila il modulo sottostante per inserire il tuo profilo nel nostro database scouting.
                    </p>
                </motion.div>

                {success ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900/50 border border-brand-500/50 p-10 rounded-3xl text-center backdrop-blur-sm"
                    >
                        <h2 className="text-3xl font-heading text-white mb-4 uppercase">grazie per esserti candidata</h2>
                        <p className="text-zinc-400 mb-8">
                            Abbiamo ricevuto il tuo profilo e lo abbiamo inserito nel nostro database. Il nostro staff tecnico lo valuterà.
                        </p>
                        <button 
                            onClick={() => {
                                setSuccess(false);
                                setFormData({ nome: '', cognome: '', societa_appartenenza: '', anno_nascita: '', ruolo: '', note: '' });
                            }}
                            className="bg-brand-500 text-white px-8 py-3 rounded-xl font-heading uppercase tracking-wider hover:bg-brand-600 transition-colors shadow-[0_0_20px_rgba(217,70,239,0.2)]"
                        >
                            Invia un'altra candidatura
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <form onSubmit={handleSubmit} className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 p-6 md:p-10 rounded-3xl space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm font-sans">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-zinc-400 text-xs font-heading tracking-widest uppercase mb-2">Nome *</label>
                                    <input 
                                        type="text" 
                                        name="nome" 
                                        required 
                                        value={formData.nome} 
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                                        placeholder="Il tuo nome"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-400 text-xs font-heading tracking-widest uppercase mb-2">Cognome *</label>
                                    <input 
                                        type="text" 
                                        name="cognome" 
                                        required 
                                        value={formData.cognome} 
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                                        placeholder="Il tuo cognome"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-400 text-xs font-heading tracking-widest uppercase mb-2">Anno di Nascita</label>
                                    <input 
                                        type="number" 
                                        name="anno_nascita" 
                                        min="1990" 
                                        max={new Date().getFullYear()}
                                        value={formData.anno_nascita} 
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                                        placeholder="Es. 2005"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-400 text-xs font-heading tracking-widest uppercase mb-2">Ruolo</label>
                                    <select 
                                        name="ruolo" 
                                        value={formData.ruolo} 
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all appearance-none"
                                    >
                                        <option value="">Seleziona ruolo...</option>
                                        <option value="Palleggiatrice">Palleggiatrice</option>
                                        <option value="Centrale">Centrale</option>
                                        <option value="Schiacciatrice">Schiacciatrice</option>
                                        <option value="Opposto">Opposto</option>
                                        <option value="Libero">Libero</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-zinc-400 text-xs font-heading tracking-widest uppercase mb-2">Società di Appartenenza</label>
                                <input 
                                    type="text" 
                                    name="societa_appartenenza" 
                                    value={formData.societa_appartenenza} 
                                    onChange={handleChange}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                                    placeholder="Nome della tua società attuale (se presente)"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-heading tracking-widest uppercase mb-2">Note Addizionali</label>
                                <textarea 
                                    name="note" 
                                    value={formData.note} 
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all resize-none"
                                    placeholder="Raccontaci qualcosa di te: altezza, esperienze precedenti, motivazione..."
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-brand-500 text-white rounded-xl py-4 font-heading uppercase tracking-wider hover:bg-brand-600 transition-all shadow-[0_0_20px_rgba(217,70,239,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Invia Candidatura
                            </button>
                        </form>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default CandidaturaScouting;
