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
        email: '',
        cellulare: '',
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
        <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row relative overflow-hidden">
            <Seo 
                title="Candidatura Scouting" 
                description="Invia la tua candidatura per entrare a far parte di Fusion Team Volley." 
            />

            {/* Background ambient light */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

            {/* Left side Image / Hero Area */}
            <div className="w-full lg:w-[45%] relative min-h-[50vh] lg:min-h-screen flex flex-col justify-end lg:justify-center p-8 lg:p-16 xl:p-24 pt-32 shrink-0">
                <div className="absolute inset-0">
                    <img src="/assets/hero-1.jpg" className="w-full h-full object-cover opacity-80 mix-blend-luminosity grayscale-[20%] hover:grayscale-0 transition-all duration-1000" alt="Scouting Fusion Team Volley" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/30 lg:bg-gradient-to-r lg:from-transparent lg:via-zinc-950/80 lg:to-zinc-950"></div>
                </div>
                
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 max-w-xl mt-auto lg:mt-0"
                >
                    <div className="w-16 h-1 bg-brand-500 mb-8 rounded-full shadow-[0_0_10px_rgba(217,70,239,0.8)]"></div>
                    <h1 className="font-heading text-5xl md:text-7xl xl:text-8xl text-white uppercase tracking-tighter leading-[0.9]">
                        ENTRA <br/>
                        <span className="text-brand-500 drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]">IN GIOCO</span>
                    </h1>
                    <p className="text-zinc-300 font-sans mt-8 text-lg md:text-xl max-w-md leading-relaxed font-light">
                        Vivi il tuo sogno nel mondo della pallavolo. Invia il profilo e mettiti in mostra per entrare nel roster <strong className="text-white">Fusion Team Volley</strong>.
                    </p>
                </motion.div>
            </div>

            {/* Right side Form Area */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-10 lg:p-16 relative z-10 bg-zinc-950 lg:bg-transparent -mt-10 lg:mt-0 rounded-t-[40px] lg:rounded-none shadow-[0_-20px_40px_rgba(0,0,0,0.5)] lg:shadow-none">
                
                <div className="w-full max-w-xl">
                {success ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900/40 border border-brand-500/30 p-10 md:p-14 rounded-[2rem] text-center backdrop-blur-xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="w-24 h-24 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(217,70,239,0.3)]">
                            <svg className="w-12 h-12 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h2 className="text-4xl font-heading text-white mb-6 uppercase tracking-wider relative z-10">Candidatura Inviata</h2>
                        <p className="text-zinc-400 font-sans text-lg mb-10 relative z-10">
                            Abbiamo ricevuto il tuo profilo! Il nostro staff tecnico valuterà i tuoi dati e ti contatterà in caso di opportunità.
                        </p>
                        <button 
                            onClick={() => {
                                setSuccess(false);
                                setFormData({ nome: '', cognome: '', societa_appartenenza: '', anno_nascita: '', ruolo: '', email: '', cellulare: '', note: '' });
                            }}
                            className="bg-zinc-800 text-white px-8 py-4 rounded-xl font-heading uppercase tracking-wider hover:bg-brand-500 hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all relative z-10"
                        >
                            Nuova Candidatura
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="space-y-8"
                    >
                        <div className="lg:hidden mb-8 text-center pt-4">
                            <h2 className="font-heading text-3xl text-white uppercase tracking-wider">Compila il modulo</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 p-8 md:p-10 rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden hover:border-zinc-700 transition-colors duration-500">
                            
                            {/* Inner subtle glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent"></div>

                            {error && (
                                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-sm font-sans flex items-center gap-3">
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {error}
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-zinc-400 text-xs font-heading tracking-[0.2em] uppercase ml-1">Nome *</label>
                                    <input 
                                        type="text" 
                                        name="nome" 
                                        required 
                                        value={formData.nome} 
                                        onChange={handleChange}
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-sans"
                                        placeholder="Il tuo nome"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-zinc-400 text-xs font-heading tracking-[0.2em] uppercase ml-1">Cognome *</label>
                                    <input 
                                        type="text" 
                                        name="cognome" 
                                        required 
                                        value={formData.cognome} 
                                        onChange={handleChange}
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-sans"
                                        placeholder="Il tuo cognome"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-zinc-400 text-xs font-heading tracking-[0.2em] uppercase ml-1">Email *</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        required 
                                        value={formData.email} 
                                        onChange={handleChange}
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-sans"
                                        placeholder="La tua email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-zinc-400 text-xs font-heading tracking-[0.2em] uppercase ml-1">Cellulare *</label>
                                    <input 
                                        type="tel" 
                                        name="cellulare" 
                                        required 
                                        value={formData.cellulare} 
                                        onChange={handleChange}
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-sans"
                                        placeholder="Il tuo numero di cellulare"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-zinc-400 text-xs font-heading tracking-[0.2em] uppercase ml-1">Anno di Nascita</label>
                                    <input 
                                        type="number" 
                                        name="anno_nascita" 
                                        min="1990" 
                                        max={new Date().getFullYear()}
                                        value={formData.anno_nascita} 
                                        onChange={handleChange}
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-sans"
                                        placeholder="Es. 2005"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-zinc-400 text-xs font-heading tracking-[0.2em] uppercase ml-1">Ruolo</label>
                                    <div className="relative">
                                        <select 
                                            name="ruolo" 
                                            value={formData.ruolo} 
                                            onChange={handleChange}
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all appearance-none font-sans cursor-pointer"
                                        >
                                            <option value="" className="bg-zinc-900">Seleziona ruolo...</option>
                                            <option value="Palleggiatrice" className="bg-zinc-900">Palleggiatrice</option>
                                            <option value="Centrale" className="bg-zinc-900">Centrale</option>
                                            <option value="Schiacciatrice" className="bg-zinc-900">Schiacciatrice</option>
                                            <option value="Opposto" className="bg-zinc-900">Opposto</option>
                                            <option value="Libero" className="bg-zinc-900">Libero</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-zinc-400 text-xs font-heading tracking-[0.2em] uppercase ml-1">Società di Appartenenza</label>
                                <input 
                                    type="text" 
                                    name="societa_appartenenza" 
                                    value={formData.societa_appartenenza} 
                                    onChange={handleChange}
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-sans"
                                    placeholder="Nome della tua società attuale (se presente)"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-zinc-400 text-xs font-heading tracking-[0.2em] uppercase ml-1">Presentazione / Note</label>
                                <textarea 
                                    name="note" 
                                    value={formData.note} 
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none font-sans"
                                    placeholder="Raccontaci di te: altezza, esperienza, motivazione..."
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-[length:200%_auto] hover:bg-right hover:scale-[1.02] text-white rounded-2xl py-5 font-heading text-xl uppercase tracking-widest transition-all duration-500 shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(217,70,239,0.6),inset_0_0_15px_rgba(255,255,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-left disabled:hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] flex items-center justify-center gap-3 relative overflow-hidden group border border-brand-400/30 font-bold"
                            >
                                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 -left-[100%] group-hover:left-[200%] transition-all duration-1000 ease-in-out"></div>
                                {loading && <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10"></div>}
                                <span className="relative z-10 drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300">Invia Candidatura</span>
                            </button>
                        </form>
                    </motion.div>
                )}
                </div>
            </div>
        </div>
    );
};

export default CandidaturaScouting;
