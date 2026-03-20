import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { ShieldCheck, User as UserIcon, Trash2, Edit2, X, Check, Star } from 'lucide-react';

export default function AdminPanel({ profile }: { profile: UserProfile }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [xpChange, setXpChange] = useState('0');

  useEffect(() => {
    if (profile.role !== 'admin') return;
    const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    });
    return () => unsubscribe();
  }, [profile.role]);

  const handleUpdateXP = async (uid: string, amount: number) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      xp: increment(amount)
    });
    setEditingUser(null);
  };

  const handleToggleRole = async (user: UserProfile) => {
    if (user.email === 'mirsiyevr@gmail.com') return; // Cannot demote main admin
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      role: user.role === 'admin' ? 'member' : 'admin'
    });
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === profile.uid) return;
    if (confirm('Удалить пользователя навсегда?')) {
      await deleteDoc(doc(db, 'users', uid));
    }
  };

  if (profile.role !== 'admin') {
    return (
      <div className="p-12 text-center text-zinc-500">
        <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
        <p>Доступ запрещен. Только для админов.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Управление командой</h3>
        <ShieldCheck size={14} className="text-red-500" />
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
        {users.map(user => (
          <div key={user.uid} className="p-5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 overflow-hidden border-2 border-zinc-800">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-black text-zinc-600">{user.displayName[0]}</div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-white flex items-center gap-2">
                  {user.displayName}
                  {user.role === 'admin' && <ShieldCheck size={12} className="text-red-500" />}
                </h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{user.xp} XP • {user.level}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setEditingUser(user)}
                className="p-2 text-zinc-500 hover:text-white transition-all"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleToggleRole(user)}
                className={cn(
                  "p-2 transition-all",
                  user.role === 'admin' ? "text-red-500" : "text-zinc-500 hover:text-white"
                )}
              >
                <Star size={18} />
              </button>
              <button 
                onClick={() => handleDeleteUser(user.uid)}
                className="p-2 text-zinc-500 hover:text-red-500 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit XP Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Изменить XP: {editingUser.displayName}</h3>
              <button onClick={() => setEditingUser(null)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Количество XP (можно минус)</label>
                <input 
                  type="number" 
                  value={xpChange}
                  onChange={(e) => setXpChange(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleUpdateXP(editingUser.uid, Number(xpChange))}
                  className="bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                  Обновить
                </button>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="bg-zinc-800 text-white py-4 rounded-xl font-bold hover:bg-zinc-700 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
