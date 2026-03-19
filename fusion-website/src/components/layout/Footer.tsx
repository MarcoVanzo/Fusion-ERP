import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, MapPin, Mail, Phone, Loader2, CheckCircle, XCircle } from 'lucide-react';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) return;
        
        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('https://www.fusionteamvolley.it/ERP/api/?module=website&action=subscribeNewsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setStatus('success');
                setMessage(data.data?.message || 'Iscrizione completata con successo!');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.error || 'Errore durante l\'iscrizione. Riprova più tardi.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Errore di connessione. Riprova più tardi.');
        }
    };

    return (
        <footer className="bg-zinc-950 border-t border-white/5 pt-8 pb-8 mt-8 relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand-500/5 blur-[100px] rounded-[100%] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Newsletter Section */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-8 md:p-12 mb-16 clip-diagonal backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/10 blur-[50px] rounded-full group-hover:bg-brand-500/20 transition-colors pointer-events-none"></div>
                    <div className="md:w-1/2 relative z-10">
                        <h3 className="font-heading text-3xl md:text-4xl text-white mb-2 uppercase tracking-tight">
                            RESTA <span className="text-brand-500">AGGIORNATO</span>
                        </h3>
                        <p className="text-zinc-400 font-subheading text-lg">
                            Iscriviti alla newsletter per non perderti news, risultati sportivi e novità esclusive dal nostro store.
                        </p>
                    </div>
                    <div className="w-full md:w-1/2 relative z-10">
                        <form 
                            className="flex flex-col sm:flex-row gap-3 relative z-10" 
                            onSubmit={handleSubscribe}
                        >
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === 'loading' || status === 'success'}
                                placeholder="Inserisci la tua email..." 
                                className="bg-zinc-950 border border-zinc-700 text-white px-5 py-4 w-full focus:outline-none focus:border-brand-500 font-subheading placeholder:text-zinc-600 transition-colors shadow-inner disabled:opacity-50"
                                required
                            />
                            <button 
                                type="submit" 
                                disabled={status === 'loading' || status === 'success'}
                                className="bg-brand-500 text-zinc-950 font-heading text-xl tracking-widest uppercase px-8 py-4 hover:bg-white transition-all whitespace-nowrap clip-diagonal shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.6)] flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : status === 'success' ? (
                                    <>
                                        <CheckCircle size={20} /> FATTO
                                    </>
                                ) : (
                                    <>
                                        <Mail size={20} /> ISCRIVITI
                                    </>
                                )}
                            </button>
                        </form>
                        {message && (
                            <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                {status === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                {message}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-zinc-950 font-bold text-lg">
                                F
                            </div>
                            <span className="font-extrabold text-xl tracking-tight uppercase text-white drop-shadow-[0_0_8px_rgba(255,20,147,0.4)]">
                                Fusion Team <span className="text-brand-500 font-bold drop-shadow-[0_0_12px_rgba(255,20,147,0.8)]">Volley</span>
                            </span>
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            Il settimo settore giovanile d'Italia. 800 giovani atlete, 800 famiglie, 800 sogni. Cresciamo insieme attraverso la passione per la pallavolo.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="https://instagram.com/fusionteamvolley" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:bg-brand-500 hover:text-zinc-950 transition-all">
                                <Instagram size={20} />
                            </a>
                            <a href="https://facebook.com/FusionTeamVolley" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:bg-brand-500 hover:text-zinc-950 transition-all">
                                <Facebook size={20} />
                            </a>
                            <a href="https://youtube.com/@fusionteamvolley9176" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:bg-brand-500 hover:text-zinc-950 transition-all">
                                <Youtube size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Navigazione</h3>
                        <ul className="space-y-3">
                            {[
                                { label: 'Home', path: '/' },
                                { label: 'News', path: '/news' },
                                { label: 'Le Squadre', path: '/teams' },
                                { label: 'Store', path: '/shop' },
                                { label: 'Il Club', path: '/club' },
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link to={item.path} className="text-zinc-300 hover:text-brand-500 text-sm transition-colors flex items-center gap-2">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contacts */}
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Contatti</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-brand-500 shrink-0 mt-0.5" />
                                <span className="text-zinc-300 text-sm">Via Vicentino 1<br />Trivignano (VE)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-brand-500 shrink-0" />
                                <a href="mailto:info@fusionteamvolley.it" className="text-zinc-300 hover:text-white text-sm transition-colors">info@fusionteamvolley.it</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-brand-500 shrink-0" />
                                <span className="text-zinc-300 text-sm">0422/485757</span>
                            </li>
                        </ul>
                    </div>

                    {/* ERP Access */}
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Staff & Atleti</h3>
                        <p className="text-zinc-300 text-sm mb-4">
                            Accedi all'area gestionale Fusion ERP per gestire roster, risultati e calendari.
                        </p>
                        <a href="/ERP" className="inline-flex items-center justify-center w-full px-5 py-3 rounded-none bg-zinc-800 border border-zinc-600 text-white font-bold tracking-wider hover:bg-white hover:text-zinc-950 transition-colors">
                            Accesso Gestionale
                        </a>
                    </div>

                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-zinc-600 text-xs">
                        © {new Date().getFullYear()} Fusion Team Volley. Tutti i diritti riservati.
                    </p>
                    <div className="flex gap-4 text-xs">
                        <a href="#" className="text-zinc-600 hover:text-zinc-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="text-zinc-600 hover:text-zinc-300 transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
