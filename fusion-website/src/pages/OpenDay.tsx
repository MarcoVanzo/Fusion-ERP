import React, { useState, useEffect } from 'react';
import { Seo } from '../components/Seo';
import { motion, AnimatePresence } from 'framer-motion';

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';
const API_URL = `${ERP_BASE}/api/router.php`;
const ANNATA = 2026;

const OpenDay = () => {
    const [formData, setFormData] = useState({
        nome: '', cognome: '', email: '', data_nascita: '', cellulare: '',
        taglia_tshirt: '', indirizzo: '', citta_cap: '',
        club_tesseramento: '', ruolo: '', campionati: '',
        nome_genitore: '', telefono_genitore: '', email_genitore: '',
    });
    const [privacy, setPrivacy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [spots, setSpots] = useState<{ remaining: number; limit: number } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_URL}?module=openday&action=publicStatus&annata=${ANNATA}`);
                const data = await res.json();
                if (data.success) {
                    const remaining = (data.data.limit || 50) - (data.data.count || 0);
                    setSpots({ remaining: Math.max(0, remaining), limit: data.data.limit });
                }
            } catch { /* silent */ }
        })();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isSoldOut = spots !== null && spots.remaining <= 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSoldOut) return;
        setLoading(true);
        setError('');

        if (!privacy) { setError('Il consenso alla privacy è obbligatorio.'); setLoading(false); return; }

        try {
            const res = await fetch(`${API_URL}?module=openday&action=publicRegister`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ ...formData, privacy_consent: 1, annata: ANNATA }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setError(data.error || 'Si è verificato un errore durante l\'invio.');
            }
        } catch {
            setError('Impossibile connettersi al server. Riprova più tardi.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Shared input class ─────────── */
    const inputCls = "w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-sans placeholder:text-zinc-600";
    const labelCls = "block text-zinc-400 text-xs font-heading tracking-[0.2em] uppercase ml-1";

    return (
        <div className="min-h-screen bg-zinc-950 relative">
            <Seo
                title="Open Day 2026"
                description="Registrazione Open Day Fusion Team Volley — 27 Maggio 2026, Palavega Trivignano, ore 17:00-20:00. Iscriviti ora!"
            />

            {/* Background ambient light */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

            <div className="flex flex-col lg:flex-row min-h-screen">

                {/* ═══ LEFT — Hero ═══ */}
                <div className="w-full lg:w-[45%] relative min-h-[50vh] lg:min-h-screen flex flex-col justify-end lg:justify-center p-8 lg:p-16 xl:p-24 pt-32 shrink-0 lg:sticky lg:top-0 lg:self-start">
                    <div className="absolute inset-0">
                        <img src="/assets/hero-1.jpg" className="w-full h-full object-cover opacity-80 mix-blend-luminosity grayscale-[20%] hover:grayscale-0 transition-all duration-1000" alt="Open Day Fusion Team Volley" />
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
                            OPEN <br/>
                            <span className="text-brand-500 drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]">DAY</span>
                        </h1>
                        <p className="text-zinc-300 font-sans mt-8 text-lg md:text-xl max-w-md leading-relaxed font-light">
                            Vieni a scoprire il mondo della pallavolo. Un pomeriggio di sport, divertimento e talento con <strong className="text-white">Fusion Team Volley</strong>.
                        </p>

                        {/* Event info cards */}
                        <div className="mt-10 space-y-3">
                            {[
                                { icon: '📅', text: 'Martedì 27 Maggio 2026', bold: true },
                                { icon: '📍', text: 'Palavega — Trivignano (VE)', bold: true },
                                { icon: '🕐', text: 'Ore 17:00 – 20:00', bold: false },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.15 }}
                                    className="flex items-center gap-3 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-xl px-4 py-3"
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className={`text-sm ${item.bold ? 'text-white font-semibold' : 'text-zinc-300'}`}>{item.text}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Spots counter */}
                        {spots !== null && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className={`mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold ${
                                    isSoldOut
                                        ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                                        : 'bg-brand-500/20 border border-brand-500/40 text-brand-300'
                                }`}
                            >
                                <span>{isSoldOut ? '🚫' : '✅'}</span>
                                <span>{isSoldOut ? 'SOLD OUT — Posti esauriti' : `${spots.remaining} posti disponibili su ${spots.limit}`}</span>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* ═══ RIGHT — Form ═══ */}
                <div className="w-full lg:w-[55%] flex items-start justify-center p-6 sm:p-10 lg:p-16 relative z-10 bg-zinc-950 lg:bg-transparent -mt-10 lg:mt-0 rounded-t-[40px] lg:rounded-none shadow-[0_-20px_40px_rgba(0,0,0,0.5)] lg:shadow-none">
                    <div className="w-full max-w-xl py-8 lg:py-12">
                        <AnimatePresence mode="wait">
                            {success ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-zinc-900/40 border border-brand-500/30 p-10 md:p-14 rounded-[2rem] text-center backdrop-blur-xl relative overflow-hidden"
                                >
                                    <div className="w-24 h-24 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(217,70,239,0.3)]">
                                        <svg className="w-12 h-12 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <h2 className="text-3xl font-heading text-white mb-4 uppercase tracking-wider">Registrazione Completata</h2>
                                    <p className="text-zinc-400 font-sans text-lg mb-2">
                                        Abbiamo ricevuto i tuoi dati per l'<strong className="text-white">Open Day {ANNATA}</strong>!
                                    </p>
                                    <p className="text-zinc-400 font-sans mb-8">
                                        Riceverai una email di conferma con tutti i dettagli.<br/>
                                        Ti aspettiamo il <strong className="text-white">27 Maggio</strong> al Palavega di Trivignano!
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                >
                                    <div className="lg:hidden mb-8 text-center pt-4">
                                        <h2 className="font-heading text-3xl text-white uppercase tracking-wider">Compila il modulo</h2>
                                    </div>

                                    <form onSubmit={handleSubmit} className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 p-8 md:p-10 rounded-[2rem] space-y-6 shadow-2xl relative overflow-visible hover:border-zinc-700 transition-colors duration-500">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent"></div>

                                        {error && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-sm font-sans flex items-center gap-3">
                                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                {error}
                                            </motion.div>
                                        )}

                                        {/* Dati Atleta */}
                                        <p className="text-brand-400 text-xs font-heading tracking-[0.2em] uppercase border-b border-zinc-800 pb-2">Dati dell'Atleta</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className={labelCls}>Nome *</label>
                                                <input type="text" name="nome" required value={formData.nome} onChange={handleChange} className={inputCls} placeholder="Il tuo nome" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Cognome *</label>
                                                <input type="text" name="cognome" required value={formData.cognome} onChange={handleChange} className={inputCls} placeholder="Il tuo cognome" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Data di Nascita *</label>
                                                <input type="date" name="data_nascita" required value={formData.data_nascita} onChange={handleChange} className={inputCls} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Email *</label>
                                                <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputCls} placeholder="La tua email" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Cellulare *</label>
                                                <input type="tel" name="cellulare" required value={formData.cellulare} onChange={handleChange} className={inputCls} placeholder="Il tuo numero" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Taglia T-Shirt *</label>
                                                <div className="relative">
                                                    <select name="taglia_tshirt" required value={formData.taglia_tshirt} onChange={handleChange} className={`${inputCls} appearance-none cursor-pointer`}>
                                                        <option value="" className="bg-zinc-900">Seleziona taglia...</option>
                                                        {['XXS','XS','S','M','L','XL','XXL'].map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Indirizzo *</label>
                                                <input type="text" name="indirizzo" required value={formData.indirizzo} onChange={handleChange} className={inputCls} placeholder="Via Roma 1" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Città / CAP *</label>
                                                <input type="text" name="citta_cap" required value={formData.citta_cap} onChange={handleChange} className={inputCls} placeholder="Venezia 30100" />
                                            </div>
                                        </div>

                                        {/* Esperienza Sportiva */}
                                        <p className="text-brand-400 text-xs font-heading tracking-[0.2em] uppercase border-b border-zinc-800 pb-2 mt-4">Esperienza Sportiva</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className={labelCls}>Club Attuale *</label>
                                                <input type="text" name="club_tesseramento" required value={formData.club_tesseramento} onChange={handleChange} className={inputCls} placeholder="Nome della società" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Ruolo *</label>
                                                <div className="relative">
                                                    <select name="ruolo" required value={formData.ruolo} onChange={handleChange} className={`${inputCls} appearance-none cursor-pointer`}>
                                                        <option value="" className="bg-zinc-900">Seleziona ruolo...</option>
                                                        {['Palleggiatrice','Schiacciatrice','Centrale','Opposta','Libero'].map(r => <option key={r} value={r} className="bg-zinc-900">{r}</option>)}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className={labelCls}>Campionati Disputati *</label>
                                            <input type="text" name="campionati" required value={formData.campionati} onChange={handleChange} className={inputCls} placeholder="Es. Under 16, Prima Divisione" />
                                        </div>

                                        {/* Genitore */}
                                        <p className="text-brand-400 text-xs font-heading tracking-[0.2em] uppercase border-b border-zinc-800 pb-2 mt-4">Genitore / Tutore</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className={labelCls}>Nome e Cognome *</label>
                                                <input type="text" name="nome_genitore" required value={formData.nome_genitore} onChange={handleChange} className={inputCls} placeholder="Nome del genitore" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Telefono *</label>
                                                <input type="tel" name="telefono_genitore" required value={formData.telefono_genitore} onChange={handleChange} className={inputCls} placeholder="Numero di telefono" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className={labelCls}>Email Genitore *</label>
                                            <input type="email" name="email_genitore" required value={formData.email_genitore} onChange={handleChange} className={inputCls} placeholder="Email del genitore" />
                                        </div>

                                        {/* Privacy */}
                                        <div className="flex items-start gap-3 mt-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4">
                                            <input
                                                type="checkbox"
                                                id="privacy_consent"
                                                checked={privacy}
                                                onChange={e => setPrivacy(e.target.checked)}
                                                className="mt-1 w-5 h-5 rounded accent-brand-500 cursor-pointer shrink-0"
                                            />
                                            <label htmlFor="privacy_consent" className="text-zinc-400 text-sm font-sans cursor-pointer leading-relaxed">
                                                Autorizzo il trattamento dei dati personali ai sensi del Regolamento UE 2016/679 (GDPR).
                                                I dati forniti saranno utilizzati esclusivamente per la gestione dell'Open Day {ANNATA}. <span className="text-red-400">*</span>
                                            </label>
                                        </div>

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={loading || isSoldOut}
                                            className="w-full bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-[length:200%_auto] hover:bg-right hover:scale-[1.02] text-white rounded-2xl py-5 font-heading text-xl uppercase tracking-widest transition-all duration-500 shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(217,70,239,0.6),inset_0_0_15px_rgba(255,255,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-left flex items-center justify-center gap-3 relative overflow-hidden group border border-brand-400/30 font-bold"
                                        >
                                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 -left-[100%] group-hover:left-[200%] transition-all duration-1000 ease-in-out"></div>
                                            {loading && <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10"></div>}
                                            <span className="relative z-10 drop-shadow-md">{isSoldOut ? 'POSTI ESAURITI' : 'Invia Registrazione'}</span>
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OpenDay;
