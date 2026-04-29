import { ExternalLink } from 'lucide-react';

const Outseason = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="relative flex-grow flex items-center justify-center p-4 overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105"
                    style={{ backgroundImage: `url('${import.meta.env.BASE_URL}assets/Gemini_Generated_Image_x8wipzx8wipzx8wi.jpeg')`, filter: "brightness(0.55) saturate(1.2)" }}
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10 transition-colors"></div>
                <div className="absolute inset-0 z-10 opacity-40 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>

                <div className="relative z-20 max-w-4xl w-full p-12 md:p-24 text-center">
                    <h1 className="font-heading text-6xl md:text-8xl mb-6 text-white uppercase tracking-tighter drop-shadow-2xl">
                        FTV <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(214,90,134,0.5)]">OUTSEASON</span>
                    </h1>

                    <p className="font-subheading text-xl md:text-2xl text-zinc-200 mb-12 max-w-2xl mx-auto tracking-widest leading-relaxed drop-shadow-lg">
                        SCOPRI IL NOSTRO MASTER DI ALTA SPECIALIZZAZIONE SUL PORTALE DEDICATO.
                    </p>

                    <a
                        href="https://www.fusionteamvolley.it/outseason/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-4 bg-brand-500 text-zinc-950 font-heading text-2xl md:text-3xl px-12 py-6 hover:bg-white hover:text-brand-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all clip-diagonal"
                    >
                        VAI AL PORTALE OUTSEASON <ExternalLink size={32} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Outseason;
