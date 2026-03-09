import { Facebook, Instagram, Youtube, MapPin, Mail, Phone } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-zinc-950 border-t border-white/5 pt-16 pb-8 mt-20 relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand-500/5 blur-[100px] rounded-[100%] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Il settimo settore giovanile d'Italia. 800 giovani atlete, 800 famiglie, 800 sogni. Cresciamo insieme attraverso la passione per la pallavolo.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="https://instagram.com/fusionteamvolley" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-brand-500 hover:text-zinc-950 transition-all">
                                <Instagram size={20} />
                            </a>
                            <a href="https://facebook.com/FusionTeamVolley" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-brand-500 hover:text-zinc-950 transition-all">
                                <Facebook size={20} />
                            </a>
                            <a href="https://youtube.com/@fusionteamvolley9176" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-brand-500 hover:text-zinc-950 transition-all">
                                <Youtube size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Navigazione</h3>
                        <ul className="space-y-3">
                            {['Home', 'News', 'Le Squadre', 'Ecommerce', 'Chi Siamo'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-zinc-400 hover:text-brand-500 text-sm transition-colors flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-brand-500/50"></span>
                                        {item}
                                    </a>
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
                                <span className="text-zinc-400 text-sm">Via Vicentino 1<br />Trivignano (VE)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-brand-500 shrink-0" />
                                <a href="mailto:info@fusionteamvolley.it" className="text-zinc-400 hover:text-white text-sm transition-colors">info@fusionteamvolley.it</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-brand-500 shrink-0" />
                                <span className="text-zinc-400 text-sm">0422/485757</span>
                            </li>
                        </ul>
                    </div>

                    {/* ERP Access */}
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Staff & Atleti</h3>
                        <p className="text-zinc-400 text-sm mb-4">
                            Accedi all'area gestionale Fusion ERP per gestire roster, risultati e calendari.
                        </p>
                        <a href="/ERP" className="inline-flex items-center justify-center w-full px-5 py-3 rounded-lg bg-zinc-900 border border-white/10 text-white font-medium hover:bg-white hover:text-zinc-950 transition-colors">
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
