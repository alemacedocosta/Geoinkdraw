import { useState, useEffect } from 'react';
import { useAuth } from './lib/useAuth';
import { LandingPage } from './components/LandingPage';
import { DrawingCard } from './components/DrawingCard';
import { NewDrawing } from './components/NewDrawing';
import { Ranking } from './components/Ranking';
import { TrophyDisplay } from './components/TrophyDisplay';
import { AdminPanel } from './components/AdminPanel';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Drawing } from './types';
import { LogOut, Plus, LayoutGrid, Trophy as TrophyIcon, User as UserIcon, Loader2, Shield } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'timeline' | 'new' | 'ranking' | 'profile' | 'admin'>('timeline');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }

    const q = query(collection(db, 'drawings'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDrawings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drawing)));
      setIsInitialLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'drawings'));

    // Fetch user likes
    if (user) {
      const likesQuery = query(collection(db, 'likes'), orderBy('createdAt', 'desc'));
      const unsubLikes = onSnapshot(likesQuery, (snapshot) => {
        const likedIds = new Set(snapshot.docs
          .filter(doc => doc.id.startsWith(user.uid + '_'))
          .map(doc => doc.data().drawingId as string));
        setUserLikes(likedIds);
      });
      return () => {
        unsubscribe();
        unsubLikes();
      };
    }

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e0e0e0] flex items-center justify-center">
        <Loader2 className="animate-spin text-black" size={48} />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-[#e0e0e0] pb-24">
      {/* Header */}
      <header className="bg-white border-b-2 border-black p-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black flex items-center justify-center ink-border">
              <Plus className="text-white" size={16} />
            </div>
            <h1 className="font-pixel text-3xl">Geoinkdraw</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {profile && (
              <div className="flex items-center gap-2">
                <TrophyDisplay level={Math.floor(profile.totalDrawings / 5)} size={20} />
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold leading-none">{profile.displayName}</p>
                  <p className="text-[8px] uppercase text-gray-500">{profile.totalDrawings} desenhos</p>
                </div>
              </div>
            )}
            <button onClick={handleLogout} className="text-gray-400 hover:text-black transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'timeline' && (
            <motion.div 
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-pixel text-2xl uppercase tracking-widest">Timeline</h2>
                <span className="text-[10px] font-bold text-gray-500 uppercase">{drawings.length} DESENHOS RECENTES</span>
              </div>
              
              {isInitialLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
              ) : drawings.length > 0 ? (
                drawings.map(drawing => (
                  <DrawingCard 
                    key={drawing.id} 
                    drawing={drawing} 
                    isOwner={drawing.creatorUid === user.uid}
                    hasLiked={userLikes.has(drawing.id)}
                  />
                ))
              ) : (
                <div className="text-center py-20 bg-white ink-border opacity-50">
                  <LayoutGrid size={48} className="mx-auto mb-4" />
                  <p className="font-pixel text-xl">Nenhum desenho ainda.</p>
                  <p className="text-xs">Seja o primeiro a desenhar!</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'new' && (
            <motion.div 
              key="new"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <NewDrawing onComplete={() => setActiveTab('timeline')} />
            </motion.div>
          )}

          {activeTab === 'ranking' && (
            <motion.div 
              key="ranking"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Ranking />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-6"
            >
              <div className="bg-white ink-border p-8 flex flex-col items-center text-center gap-4">
                <div className="relative">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-24 h-24 rounded-full border-4 border-black" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-black flex items-center justify-center bg-gray-100">
                      <UserIcon size={48} />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-white ink-border p-2">
                    <TrophyDisplay level={Math.floor((profile?.totalDrawings || 0) / 5)} size={24} />
                  </div>
                </div>
                <div>
                  <h2 className="font-pixel text-3xl">{profile?.displayName}</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{profile?.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <div className="bg-gray-50 p-4 ink-border">
                    <p className="text-[10px] font-bold uppercase text-gray-500">Desenhos</p>
                    <p className="font-pixel text-3xl">{profile?.totalDrawings}</p>
                  </div>
                  <div className="bg-gray-50 p-4 ink-border">
                    <p className="text-[10px] font-bold uppercase text-gray-500">Nível</p>
                    <p className="font-pixel text-3xl">{Math.floor((profile?.totalDrawings || 0) / 5) + 1}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="font-pixel text-xl uppercase">Meus Desenhos</h3>
                {drawings.filter(d => d.creatorUid === user.uid).map(drawing => (
                  <DrawingCard 
                    key={drawing.id} 
                    drawing={drawing} 
                    isOwner={true}
                    hasLiked={userLikes.has(drawing.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'admin' && profile?.role === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white ink-border px-2 py-2 flex items-center gap-2 z-50">
        <button 
          onClick={() => setActiveTab('timeline')}
          className={`p-3 transition-all ${activeTab === 'timeline' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
        >
          <LayoutGrid size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('ranking')}
          className={`p-3 transition-all ${activeTab === 'ranking' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
        >
          <TrophyIcon size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('new')}
          className={`p-4 -mt-12 ink-border transition-all ${activeTab === 'new' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
        >
          <Plus size={32} />
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`p-3 transition-all ${activeTab === 'profile' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
        >
          <UserIcon size={24} />
        </button>
        {profile?.role === 'admin' && (
          <button 
            onClick={() => setActiveTab('admin')}
            className={`p-3 transition-all ${activeTab === 'admin' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
          >
            <Shield size={24} />
          </button>
        )}
      </nav>
    </div>
  );
}
