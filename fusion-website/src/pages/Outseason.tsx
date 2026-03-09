import { ExternalLink } from 'lucide-react';

const Outseason = () => {
    return (
        <div className="bg-zinc-950 min-h-screen flex items-center justify-center p-4">
            <div className="max-w-3xl w-full glass-panel p-12 md:p-24 text-center border-t-8 border-brand-500 clip-diagonal shadow-[0_20px_50px_rgba(234,179,8,0.1)]">

                <h1 className="font-heading text-5xl md:text-7xl mb-6 text-white uppercase tracking-tighter">
                    FTV <span className="text-zinc-500">OUTSEASON</span>
                </h1>

                <p className="font-subheading text-xl text-zinc-400 mb-12 max-w-xl mx-auto tracking-widest leading-relaxed">
                    SCOPRI I NOSTRI CAMP ESTIVI E LE ATTIVITÀ OFF-SEASON SUL NOSTRO PORTALE DEDICATO.
                </p>

                <a
                    href="https://www.ftvoutseason.it"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-4 bg-brand-500 text-zinc-950 font-heading text-2xl px-12 py-6 hover:bg-white transition-all clip-diagonal"
                >
                    VAI AL PORTALE OUTSEASON <ExternalLink size={28} />
                </a>

            </div>
        </div>
    );
};

export default Outseason;
