import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Trophy, Medal, Star } from 'lucide-react';

export default function Leaderboard({ profile }: { profile: UserProfile }) {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Рейтинг активности</h3>
        <Trophy size={14} className="text-zinc-500" />
      </div>

      {/* Leaderboard List */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
        {users.map((user, idx) => (
          <div 
            key={user.uid} 
            className={cn(
              "p-5 flex items-center justify-between group transition-all",
              user.uid === profile.uid && "bg-red-600/5"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center">
                {idx === 0 ? (
                  <Medal size={24} className="text-yellow-500" />
                ) : idx === 1 ? (
                  <Medal size={24} className="text-zinc-400" />
                ) : idx === 2 ? (
                  <Medal size={24} className="text-orange-600" />
                ) : (
                  <span className="text-lg font-black text-zinc-700">{idx + 1}</span>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 overflow-hidden border-2 border-zinc-800 group-hover:border-red-600/50 transition-all">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-black text-zinc-600">{user.displayName[0]}</div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-white flex items-center gap-2">
                  {user.displayName}
                  {user.uid === profile.uid && <span className="text-[8px] bg-red-600 text-white px-1 rounded uppercase">Ты</span>}
                </h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{user.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-white">{user.xp.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">XP</p>
            </div>
          </div>
        ))}
      </div>

      {/* Level Info */}
      <section className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 border-dashed">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Star size={14} className="text-red-500" /> Уровни иерархии
        </h4>
        <div className="space-y-3">
          <LevelRow label="Легенда" xp="300+" active={profile.xp >= 300} />
          <LevelRow label="Актив" xp="150–300" active={profile.xp >= 150 && profile.xp < 300} />
          <LevelRow label="Свой" xp="50–150" active={profile.xp >= 50 && profile.xp < 150} />
          <LevelRow label="Новичок" xp="0–50" active={profile.xp < 50} />
        </div>
      </section>
    </div>
  );
}

function LevelRow({ label, xp, active }: { label: string, xp: string, active: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-xl border transition-all",
      active ? "bg-red-600/10 border-red-600/30 text-red-500" : "bg-zinc-900 border-zinc-800 text-zinc-500"
    )}>
      <span className="text-sm font-bold">{label}</span>
      <span className="text-xs font-black">{xp} XP</span>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
