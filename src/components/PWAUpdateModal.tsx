import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PWAUpdateModalProps {
  show: boolean;
  onUpdate: () => void;
}

export const PWAUpdateModal: React.FC<PWAUpdateModalProps> = ({ show, onUpdate }) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-[#00FFFF]/10 rounded-full flex items-center justify-center animate-pulse">
              <RefreshCw size={48} className="text-[#00FFFF]" />
            </div>
          </div>
          
          <h2 className="text-4xl font-black uppercase tracking-tighter text-[#00FFFF] mb-4">
            Mise à jour disponible
          </h2>
          
          <p className="text-[#00FFFF]/80 text-lg font-medium mb-12 leading-relaxed">
            Une nouvelle version de DJ Messenger est prête. Installez-la pour profiter des dernières fonctionnalités de 2026.
          </p>
          
          <button
            onClick={onUpdate}
            className="w-full py-5 bg-[#32CD32] text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(50,205,50,0.4)] hover:scale-105 transition-transform active:scale-95 text-xl"
          >
            Mettre à jour maintenant
          </button>
          
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-[#00FFFF]/40">
            Version 2026.4.12
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
