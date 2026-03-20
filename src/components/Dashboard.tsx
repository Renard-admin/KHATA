import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Transaction, Task, Event } from '../types';
import { Wallet, CheckSquare, Compass, Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

enum OperationType {
  GET = 'get',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export default function Dashboard({ profile }: { profile: UserProfile }) {
  const [balance, setBalance] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Fetch Balance (sum of transactions)
    const unsubscribeBank = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const total = snapshot.docs.reduce((acc, doc) => acc + doc.data().amount, 0);
      setBalance(total);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'transactions'));

    // Fetch Recent Pending Tasks
    const qTasks = query(
      collection(db, 'tasks'), 
      where('status', '==', 'pending'),
      limit(3)
    );
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      setRecentTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'tasks'));

    // Fetch Next Event
    const qEvents = query(
      collection(db, 'events'),
      where('status', '==', 'planned'),
      orderBy('time', 'asc'),
      limit(1)
    );
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      if (!snapshot.empty) {
        setNextEvent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Event);
      } else {
        setNextEvent(null);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'events'));

    // Fetch Top 3 Users
    const qUsers = query(
      collection(db, 'users'),
      orderBy('xp', 'desc'),
      limit(3)
    );
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setTopUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

    return () => {
      unsubscribeBank();
      unsubscribeTasks();
      unsubscribeEvents();
      unsubscribeUsers();
    };
  }, []);

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp size={120} />
        </div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Общий баланс</p>
        <h2 className="text-4xl font-black text-white mb-4">{balance.toLocaleString()} ₸</h2>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-red-600/20 text-red-500 rounded-full text-[10px] font-bold uppercase tracking-tighter">
            Активно
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <CheckSquare size={16} />
            <span className="text-[10px] font-bold uppercase">Дела</span>
          </div>
          <p className="text-xl font-black text-white">{recentTasks.length} задач</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Trophy size={16} />
            <span className="text-[10px] font-bold uppercase">Твой ранг</span>
          </div>
          <p className="text-xl font-black text-white">#{topUsers.findIndex(u => u.uid === profile.uid) + 1 || '?'}</p>
        </div>
      </div>

      {/* Next Event */}
      <section>
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ближайший движ</h3>
          <Compass size={14} className="text-zinc-500" />
        </div>
        {nextEvent ? (
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white">{nextEvent.title}</h4>
              <p className="text-xs text-zinc-500">
                {format(nextEvent.time.toDate(), 'd MMMM, HH:mm', { locale: ru })}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold">
              {format(nextEvent.time.toDate(), 'dd')}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-dashed border-zinc-800 text-center">
            <p className="text-zinc-600 text-sm">Пока ничего не планируется</p>
          </div>
        )}
      </section>

      {/* Urgent Tasks */}
      <section>
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Срочные задачи</h3>
          <AlertCircle size={14} className="text-zinc-500" />
        </div>
        <div className="space-y-2">
          {recentTasks.map(task => (
            <div key={task.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  task.type === 'duty' ? "bg-blue-500" : task.type === 'shopping' ? "bg-yellow-500" : "bg-red-500"
                )} />
                <span className="font-medium text-sm">{task.title}</span>
              </div>
              <span className="text-[10px] font-bold text-red-500">+{task.xpReward} XP</span>
            </div>
          ))}
          {recentTasks.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-4">Все дела сделаны!</p>
          )}
        </div>
      </section>

      {/* Top 3 Leaderboard */}
      <section>
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Топ по XP</h3>
          <Trophy size={14} className="text-zinc-500" />
        </div>
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
          {topUsers.map((user, idx) => (
            <div key={user.uid} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-lg font-black",
                  idx === 0 ? "text-yellow-500" : idx === 1 ? "text-zinc-400" : "text-orange-600"
                )}>{idx + 1}</span>
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold">{user.displayName[0]}</div>
                  )}
                </div>
                <span className="font-bold text-sm">{user.displayName}</span>
              </div>
              <span className="text-xs font-black text-zinc-400">{user.xp} XP</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
