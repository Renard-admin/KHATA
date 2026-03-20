import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import { 
  LayoutDashboard, 
  Wallet, 
  CheckSquare, 
  Compass, 
  Trophy, 
  Plus, 
  ShieldCheck,
  Package
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---
const INVITE_CODE = "KHATA2026"; // Simple invite code for MVP

// --- Components ---
import Dashboard from './components/Dashboard';
import Bank from './components/Bank';
import Tasks from './components/Tasks';
import Events from './components/Events';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';
import Storage from './components/Storage';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Test connection as per guidelines
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode === INVITE_CODE && user) {
      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        xp: 0,
        level: 'Новичок',
        role: user.email === 'mirsiyevr@gmail.com' ? 'admin' : 'member',
        totalContributed: 0,
        tasksCompleted: 0
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
    } else {
      setInviteError('Неверный код доступа');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black tracking-tighter mb-2 text-white">ХАТА ТАТАРА</h1>
          <p className="text-zinc-500 uppercase tracking-widest text-xs">Закрытый цифровой штаб</p>
        </div>
        <button 
          onClick={handleLogin}
          className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2"
        >
          Войти через Google
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-center">Введите код доступа</h2>
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <input 
              type="text" 
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Код доступа"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 transition-colors"
            />
            {inviteError && <p className="text-red-500 text-sm text-center">{inviteError}</p>}
            <button 
              type="submit"
              className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Подтвердить
            </button>
          </form>
          <button 
            onClick={() => signOut(auth)}
            className="w-full mt-4 text-zinc-500 text-sm hover:text-white transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard profile={profile} />;
      case 'bank': return <Bank profile={profile} />;
      case 'tasks': return <Tasks profile={profile} />;
      case 'events': return <Events profile={profile} />;
      case 'leaderboard': return <Leaderboard profile={profile} />;
      case 'profile': return <Profile profile={profile} />;
      case 'admin': return <AdminPanel profile={profile} />;
      case 'storage': return <Storage profile={profile} />;
      default: return <Dashboard profile={profile} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-24">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-black text-white">XT</div>
          <h1 className="text-xl font-black tracking-tighter">ХАТА ТАТАРА</h1>
        </div>
        <div className="flex items-center gap-3">
          {profile.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                activeTab === 'admin' ? "bg-red-600/20 text-red-500" : "text-zinc-500 hover:text-white"
              )}
            >
              <ShieldCheck size={20} />
            </button>
          )}
          <button 
            onClick={() => setActiveTab('profile')}
            className="flex flex-col items-end"
          >
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">{profile.level}</span>
            <span className="text-sm font-black text-red-500">{profile.xp} XP</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto">
        {renderContent()}
      </main>

      {/* Floating Add Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg shadow-red-900/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-50"
      >
        <Plus size={28} />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 p-2 flex justify-around items-center z-50">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Главная" />
        <NavButton active={activeTab === 'bank'} onClick={() => setActiveTab('bank')} icon={<Wallet size={20} />} label="Общак" />
        <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<CheckSquare size={20} />} label="Дела" />
        <NavButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={<Compass size={20} />} label="Движ" />
        <NavButton active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} icon={<Trophy size={20} />} label="Топ" />
        <NavButton active={activeTab === 'storage'} onClick={() => setActiveTab('storage')} icon={<Package size={20} />} label="Склад" />
      </nav>

      {/* Simple Add Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-xl font-bold mb-6">Добавить</h3>
            <div className="grid grid-cols-2 gap-3">
              <AddOption icon={<Wallet size={20} />} label="Транзакция" onClick={() => { setShowAddModal(false); setActiveTab('bank'); }} />
              <AddOption icon={<CheckSquare size={20} />} label="Задача" onClick={() => { setShowAddModal(false); setActiveTab('tasks'); }} />
              <AddOption icon={<Compass size={20} />} label="Движуха" onClick={() => { setShowAddModal(false); setActiveTab('events'); }} />
              <AddOption icon={<Package size={20} />} label="Вещь" onClick={() => { setShowAddModal(false); setActiveTab('storage'); }} />
            </div>
            <button 
              onClick={() => setShowAddModal(false)}
              className="w-full mt-6 py-3 text-zinc-500 font-bold hover:text-white"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 transition-all",
        active ? "text-red-500 scale-110" : "text-zinc-600 hover:text-zinc-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function AddOption({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-colors"
    >
      <div className="w-10 h-10 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
