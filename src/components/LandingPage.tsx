import React from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { MapPin, Pencil, Share2, Trophy as TrophyIcon, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  const handleLogin = () => signInWithPopup(auth, googleProvider);

  return (
    <div className="min-h-screen bg-[#e0e0e0] flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full flex flex-col gap-8"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 bg-black flex items-center justify-center ink-border rotate-3">
            <MapPin size={48} className="text-white" />
          </div>
          <h1 className="font-pixel text-6xl mt-4">GeoInk</h1>
          <p className="text-sm font-bold tracking-widest uppercase opacity-60">O mundo é seu papel</p>
        </div>

        <div className="space-y-4 text-left">
          <div className="flex gap-4 items-start">
            <div className="p-2 bg-white ink-border shrink-0"><Pencil size={20} /></div>
            <div>
              <h3 className="font-bold text-sm uppercase">Desenhe com seus pés</h3>
              <p className="text-xs text-gray-600">Transforme sua caminhada, corrida ou pedalada em arte digital única.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-2 bg-white ink-border shrink-0"><Share2 size={20} /></div>
            <div>
              <h3 className="font-bold text-sm uppercase">Compartilhe na Timeline</h3>
              <p className="text-xs text-gray-600">Poste seus caminhos e veja o que outros artistas estão criando pelo mundo.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-2 bg-white ink-border shrink-0"><TrophyIcon size={20} /></div>
            <div>
              <h3 className="font-bold text-sm uppercase">Ganhe Troféus</h3>
              <p className="text-xs text-gray-600">Evolua sua arte, ganhe curtidas e suba no ranking mensal.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleLogin}
            className="ink-button bg-black text-white py-4 flex items-center justify-center gap-2 text-lg font-bold"
          >
            ENTRAR COM GOOGLE
            <ArrowRight size={20} />
          </button>
          <p className="text-[10px] text-gray-500 uppercase font-bold">Totalmente gratuito • Arte por geolocalização</p>
        </div>

        <div className="grid grid-cols-3 gap-2 opacity-40 grayscale">
          <div className="aspect-square bg-white ink-border flex items-center justify-center"><Pencil size={24} /></div>
          <div className="aspect-square bg-white ink-border flex items-center justify-center"><MapPin size={24} /></div>
          <div className="aspect-square bg-white ink-border flex items-center justify-center"><TrophyIcon size={24} /></div>
        </div>
      </motion.div>
    </div>
  );
};
