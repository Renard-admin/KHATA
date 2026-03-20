import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { LogOut, User as UserIcon, ShieldCheck, Mail, Trophy, CheckSquare, Wallet } from 'lucide-react';

export default function Profile({ profile }: { profile: UserProfile }) {
  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      {/* Profile Card */}
      <section className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/10 to-transparent pointer-events-none" />
        <div className="w-24 h-24 rounded-3xl bg-zinc-800 mx-auto mb-6 overflow-hidden border-4 border-zinc-800 shadow-xl shadow-black/50">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-black text-zinc-600">{profile.displayName[0]}</div>
          )}
        </div>
        <h2 className="text-3xl font-black text-white mb-1">{profile.displayName}</h2>
        <p className="text-red-500 font-bold uppercase tracking-widest text-xs mb-6">{profile.level}</p>
        
        <div className="flex justify-center gap-4">
          <div className="px-4 py-2 bg-zinc-800 rounded-xl border border-zinc-700">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">XP</p>
            <p className="text-xl font-black text-white">{profile.xp}</p>
          </div>
          <div className="px-4 py-2 bg-zinc-800 rounded-xl border border-zinc-700">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Роль</p>
            <p className="text-xl font-black text-white uppercase tracking-tighter">{profile.role === 'admin' ? 'Админ' : 'Свой'}</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 mb-3">
            <CheckSquare size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Дела</span>
          </div>
          <p className="text-2xl font-black text-white">{profile.tasksCompleted || 0}</p>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Выполнено</p>
        </div>
        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 mb-3">
            <Wallet size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Взнос</span>
          </div>
          <p className="text-2xl font-black text-white">{profile.totalContributed || 0} ₸</p>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Внесено в банк</p>
        </div>
      </section>

      {/* Info List */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">Email</span>
          </div>
          <span className="text-sm font-bold text-white">{profile.email || '—'}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">Статус аккаунта</span>
          </div>
          <span className="text-xs font-bold text-green-500 uppercase tracking-tighter">Активен</span>
        </div>
      </section>

      {/* Actions */}
      <button 
        onClick={() => signOut(auth)}
        className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 text-zinc-500 rounded-2xl border border-zinc-800 hover:text-red-500 hover:bg-red-600/5 transition-all font-bold"
      >
        <LogOut size={20} /> Выйти из системы
      </button>
    </div>
  );
}
