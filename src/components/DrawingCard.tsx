import React, { useState } from 'react';
import { Drawing } from '../types';
import { PixelCanvas } from './PixelCanvas';
import { Heart, User, Calendar, Trash2, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, increment, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';

interface DrawingCardProps {
  drawing: Drawing;
  isOwner?: boolean;
  hasLiked?: boolean;
}

export const DrawingCard: React.FC<DrawingCardProps> = ({ drawing, isOwner, hasLiked: initialHasLiked }) => {
  const [likes, setLikes] = useState(drawing.likesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isLiking, setIsLiking] = useState(false);

  const handleShare = () => {
    const appUrl = window.location.origin;
    const title = drawing.title || 'um desenho incrível';
    const message = `🎨 Olha só o que o(a) ${drawing.creatorName} desenhou no Geoinkdraw: "${title}"!\n\nVeja aqui: ${appUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleLike = async () => {
    if (!auth.currentUser || isLiking) return;
    setIsLiking(true);

    const likeId = `${auth.currentUser.uid}_${drawing.id}`;
    const likeRef = doc(db, 'likes', likeId);
    const drawingRef = doc(db, 'drawings', drawing.id);

    try {
      if (hasLiked) {
        await deleteDoc(likeRef);
        await updateDoc(drawingRef, { likesCount: increment(-1) });
        setLikes(prev => prev - 1);
        setHasLiked(false);
      } else {
        await setDoc(likeRef, {
          userId: auth.currentUser.uid,
          drawingId: drawing.id,
          createdAt: serverTimestamp()
        });
        await updateDoc(drawingRef, { likesCount: increment(1) });
        setLikes(prev => prev + 1);
        setHasLiked(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `drawings/${drawing.id}`);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Deseja realmente apagar este desenho?')) return;
    try {
      await deleteDoc(doc(db, 'drawings', drawing.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `drawings/${drawing.id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white ink-border p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {drawing.creatorPhoto ? (
            <img src={drawing.creatorPhoto} alt="" className="w-8 h-8 rounded-full border border-black" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full border border-black flex items-center justify-center bg-gray-100">
              <User size={16} />
            </div>
          )}
          <div>
            <p className="text-xs font-bold leading-none">{drawing.creatorName}</p>
            <p className="text-[10px] text-gray-500">{format(drawing.createdAt.toDate(), "d 'de' MMMM", { locale: ptBR })}</p>
          </div>
        </div>
        {isOwner && (
          <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="relative aspect-square w-full">
        <PixelCanvas path={drawing.path} className="w-full h-full" />
      </div>

      <div className="flex items-center justify-between mt-1">
        <h3 className="font-pixel text-lg truncate flex-1">{drawing.title || 'Sem título'}</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="p-1 text-gray-400 hover:text-black transition-colors"
            title="Compartilhar no WhatsApp"
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={handleLike}
            disabled={!auth.currentUser || isLiking}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${hasLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
          >
            <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
            <span className="font-bold text-sm">{likes}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
