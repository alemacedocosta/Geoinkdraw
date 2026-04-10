import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { UserProfile, Invitation } from '../types';
import { Shield, UserX, UserCheck, Mail, Send, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
      setLoading(false);
    });

    const unsubInvites = onSnapshot(collection(db, 'invitations'), (snapshot) => {
      setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
    });

    return () => {
      unsubUsers();
      unsubInvites();
    };
  }, []);

  const toggleUserStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.uid), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await addDoc(collection(db, 'invitations'), {
        email: inviteEmail,
        invitedBy: 'admin', // Simplified
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      setInviteEmail('');
      alert('Convite enviado (simulado)!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invitations');
    }
  };

  const deleteInvite = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invitations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `invitations/${id}`);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white ink-border p-4">
        <h2 className="font-pixel text-2xl flex items-center gap-2 mb-4">
          <Shield size={24} />
          PAINEL DE CONTROLE
        </h2>

        <div className="flex flex-col gap-4">
          <section>
            <h3 className="font-bold text-xs uppercase text-gray-500 mb-2">Enviar Convite</h3>
            <form onSubmit={sendInvite} className="flex gap-2">
              <input 
                type="email" 
                placeholder="email@exemplo.com" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="ink-border p-2 text-sm flex-1 focus:outline-none"
              />
              <button type="submit" className="ink-button bg-black text-white flex items-center gap-2">
                <Send size={16} />
                CONVIDAR
              </button>
            </form>
          </section>

          <section>
            <h3 className="font-bold text-xs uppercase text-gray-500 mb-2">Usuários ({users.length})</h3>
            <div className="flex flex-col gap-2">
              {users.map(u => (
                <div key={u.uid} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full border border-black" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-xs font-bold">{u.displayName}</p>
                      <p className="text-[10px] text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-bold px-1 rounded border ${u.status === 'active' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                      {u.status.toUpperCase()}
                    </span>
                    {u.email !== 'alemacedo@gmail.com' && (
                      <button 
                        onClick={() => toggleUserStatus(u)}
                        className={`p-1 ink-border ${u.status === 'active' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                      >
                        {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-bold text-xs uppercase text-gray-500 mb-2">Convites Pendentes</h3>
            <div className="flex flex-col gap-2">
              {invitations.map(i => (
                <div key={i.id} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <p className="text-xs">{i.email}</p>
                  </div>
                  <button onClick={() => deleteInvite(i.id)} className="text-red-500 hover:bg-red-50 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
