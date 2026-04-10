import React, { useState, useEffect, useRef } from 'react';
import { Point } from '../types';
import { PixelCanvas } from './PixelCanvas';
import { Play, Pause, Square, Send, MapPin, AlertCircle } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { format } from 'date-fns';

export const NewDrawing: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [path, setPath] = useState<Point[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const startRecording = () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo seu navegador.");
      return;
    }

    setIsRecording(true);
    setIsPaused(false);
    setError(null);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPoint: Point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp
        };
        setPath(prev => [...prev, newPoint]);
      },
      (err) => {
        setError("Erro ao obter localização: " + err.message);
        stopRecording();
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const pauseRecording = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsPaused(true);
  };

  const resumeRecording = () => {
    startRecording();
  };

  const stopRecording = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const handlePost = async () => {
    if (path.length < 2) {
      setError("Desenho muito curto! Mova-se um pouco mais.");
      return;
    }

    if (!auth.currentUser) return;

    try {
      const drawingData = {
        creatorUid: auth.currentUser.uid,
        creatorName: auth.currentUser.displayName || 'Anonymous',
        creatorPhoto: auth.currentUser.photoURL || '',
        title: title || 'Meu Caminho',
        path: path,
        likesCount: 0,
        createdAt: serverTimestamp(),
        monthKey: format(new Date(), 'yyyy-MM')
      };

      await addDoc(collection(db, 'drawings'), drawingData);
      
      // Update user stats
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        totalDrawings: increment(1),
        // Simple trophy logic: every 5 drawings increase level
        trophyLevel: increment(0) // Logic handled by a cloud function or just client-side for now
      });

      setPath([]);
      setTitle('');
      onComplete();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'drawings');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white ink-border">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-2xl">Novo Desenho</h2>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500">
          <MapPin size={12} />
          {path.length} pontos
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-2 flex items-center gap-2 text-red-600 text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="relative aspect-square w-full bg-gray-50 flex items-center justify-center overflow-hidden">
        {path.length > 0 ? (
          <PixelCanvas path={path} className="w-full h-full" />
        ) : (
          <div className="text-center p-8 opacity-30">
            <MapPin size={48} className="mx-auto mb-2" />
            <p className="text-sm">Clique em Iniciar e comece a caminhar para desenhar!</p>
          </div>
        )}
        
        {isRecording && !isPaused && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-white px-2 py-1 ink-border">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold">GRAVANDO</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {!isRecording && path.length === 0 ? (
          <button onClick={startRecording} className="ink-button bg-black text-white flex items-center justify-center gap-2 py-3">
            <Play size={20} fill="currentColor" />
            INICIAR DESENHO
          </button>
        ) : isRecording ? (
          <div className="grid grid-cols-2 gap-2">
            {isPaused ? (
              <button onClick={resumeRecording} className="ink-button bg-black text-white flex items-center justify-center gap-2">
                <Play size={18} fill="currentColor" />
                RETOMAR
              </button>
            ) : (
              <button onClick={pauseRecording} className="ink-button flex items-center justify-center gap-2">
                <Pause size={18} fill="currentColor" />
                PAUSAR
              </button>
            )}
            <button onClick={stopRecording} className="ink-button bg-red-50 text-red-600 border-red-200 flex items-center justify-center gap-2">
              <Square size={18} fill="currentColor" />
              PARAR
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              placeholder="Dê um título ao seu desenho..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ink-border p-2 text-sm focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPath([])} className="ink-button">DESCARTAR</button>
              <button onClick={handlePost} className="ink-button bg-black text-white flex items-center justify-center gap-2">
                <Send size={18} />
                POSTAR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
