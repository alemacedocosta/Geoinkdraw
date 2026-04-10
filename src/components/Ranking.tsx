import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Drawing } from '../types';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const Ranking: React.FC = () => {
  const [globalTop, setGlobalTop] = useState<Drawing[]>([]);
  const [monthlyTop, setMonthlyTop] = useState<Drawing[]>([]);
  const [view, setView] = useState<'global' | 'monthly'>('monthly');

  useEffect(() => {
    const globalQuery = query(collection(db, 'drawings'), orderBy('likesCount', 'desc'), limit(10));
    const monthlyQuery = query(
      collection(db, 'drawings'), 
      where('monthKey', '==', format(new Date(), 'yyyy-MM')),
      orderBy('likesCount', 'desc'), 
      limit(10)
    );

    const unsubGlobal = onSnapshot(globalQuery, (snapshot) => {
      setGlobalTop(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drawing)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'drawings'));

    const unsubMonthly = onSnapshot(monthlyQuery, (snapshot) => {
      setMonthlyTop(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drawing)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'drawings'));

    return () => {
      unsubGlobal();
      unsubMonthly();
    };
  }, []);

  const currentList = view === 'global' ? globalTop : monthlyTop;

  return (
    <div className="flex flex-col gap-4 p-4 bg-white ink-border">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <h2 className="font-pixel text-2xl flex items-center gap-2">
          <Trophy size={24} />
          RANKING
        </h2>
        <div className="flex gap-1">
          <button 
            onClick={() => setView('monthly')}
            className={`px-2 py-1 text-[10px] font-bold ink-border ${view === 'monthly' ? 'bg-black text-white' : 'bg-white'}`}
          >
            MÊS
          </button>
          <button 
            onClick={() => setView('global')}
            className={`px-2 py-1 text-[10px] font-bold ink-border ${view === 'global' ? 'bg-black text-white' : 'bg-white'}`}
          >
            GERAL
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {currentList.length > 0 ? (
          currentList.map((drawing, index) => (
            <div key={drawing.id} className="flex items-center gap-3 p-2 border-b border-gray-100 last:border-0">
              <span className="font-pixel text-xl w-6 text-center">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{drawing.title || 'Sem título'}</p>
                <p className="text-[10px] text-gray-500">por {drawing.creatorName}</p>
              </div>
              <div className="flex items-center gap-1 text-red-500 font-bold text-sm">
                <TrendingUp size={12} />
                {drawing.likesCount}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-8 text-xs text-gray-400 italic">Nenhum desenho no ranking ainda...</p>
        )}
      </div>
    </div>
  );
};
