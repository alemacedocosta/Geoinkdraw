import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
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

  const copyInviteLink = () => {
    const appUrl = window.location.origin;
    const message = `🎨 Olá! Venha desenhar caminhos comigo no Geoinkdraw! Transforme seus passos em arte digital.\n\nAcesse aqui: ${appUrl}`;
    
    navigator.clipboard.writeText(message).then(() => {
      alert('Texto de convite copiado para a área de transferência! Agora é só colar no WhatsApp.');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      alert('Não foi possível copiar automaticamente. O link é: ' + appUrl);
    });
  };

  const deleteUser = async (user: UserProfile) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o usuário ${user.displayName}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid));
      alert('Usuário excluído com sucesso.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
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

        <div className="flex flex-col gap-6">
          <section className="bg-gray-50 p-4 ink-border">
            <h3 className="font-bold text-xs uppercase text-gray-500 mb-3">Convidar Novos Artistas</h3>
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-600">Gere uma mensagem personalizada para enviar via WhatsApp ou redes sociais.</p>
              <button 
                onClick={copyInviteLink}
                className="ink-button bg-black text-white flex items-center justify-center gap-2 py-3"
              >
                <Send size={18} />
                COPIAR TEXTO DE CONVITE
              </button>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-xs uppercase text-gray-500 mb-2">Usuários Cadastrados ({users.length})</h3>
            <div className="flex flex-col gap-2">
              {users.map(u => (
                <div key={u.uid} className="flex items-center justify-between p-3 bg-gray-50 ink-border">
                  <div className="flex items-center gap-3">
                    <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-black" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-sm font-bold">{u.displayName}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border-2 ${u.status === 'active' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                      {u.status.toUpperCase()}
                    </span>
                    {u.email !== 'alemacedo@gmail.com' && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => toggleUserStatus(u)}
                          title={u.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                          className={`p-2 ink-border ${u.status === 'active' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}
                        >
                          {u.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button 
                          onClick={() => deleteUser(u)}
                          title="Excluir Usuário"
                          className="p-2 ink-border bg-red-50 text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
