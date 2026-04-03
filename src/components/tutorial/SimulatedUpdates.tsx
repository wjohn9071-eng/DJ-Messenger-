import React from 'react';
import { djStyleText } from '../../lib/utils';
import { RefreshCw } from 'lucide-react';

export function SimulatedUpdates() {
  const updates = [
    { version: '2.4.0', date: '01/04/2026', text: 'Simulation : Ajout du nouveau système de tutoriel isolé.' },
    { version: '2.3.5', date: '28/03/2026', text: 'Simulation : Amélioration des performances du simulateur.' },
    { version: '2.3.0', date: '15/03/2026', text: 'Simulation : Nouveau design pour les discussions simulées.' }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <RefreshCw className={djStyleText} size={24} />
        <h2 className={`text-2xl font-bold ${djStyleText}`}>Mises à jour (Simulation)</h2>
      </div>

      <div className="space-y-6">
        {updates.map((u, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Version {u.version}</span>
              <span className="text-xs text-gray-400">{u.date}</span>
            </div>
            <p className="text-gray-700 font-medium">{u.text}</p>
            {i === 0 && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase">Nouveau</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
