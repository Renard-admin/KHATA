import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Task, TaskType } from '../types';
import { CheckSquare, Plus, ShoppingCart, Trash2, X, CheckCircle2, Clock, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Tasks({ profile }: { profile: UserProfile }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TaskType>('duty');
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [xpReward, setXpReward] = useState('10');
  const [price, setPrice] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('status', 'asc'), orderBy('xpReward', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });
    return () => unsubscribe();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await addDoc(collection(db, 'tasks'), {
      title,
      description,
      status: 'pending',
      type: activeTab,
      xpReward: Number(xpReward),
      price: activeTab === 'shopping' ? Number(price) : undefined,
      createdAt: Timestamp.now()
    });

    setTitle('');
    setDescription('');
    setXpReward('10');
    setPrice('');
    setShowAddModal(false);
  };

  const handleComplete = async (task: Task) => {
    if (!task.id || task.status === 'completed') return;

    const taskRef = doc(db, 'tasks', task.id);
    const userRef = doc(db, 'users', profile.uid);

    await updateDoc(taskRef, {
      status: 'completed',
      completedBy: profile.uid,
      completedAt: Timestamp.now()
    });

    await updateDoc(userRef, {
      xp: increment(task.xpReward),
      tasksCompleted: increment(1)
    });
  };

  const handleDelete = async (id: string) => {
    if (profile.role !== 'admin') return;
    if (confirm('Удалить эту задачу?')) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  const filteredTasks = tasks.filter(t => t.type === activeTab);

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      {/* Tabs */}
      <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
        <TabButton active={activeTab === 'duty'} onClick={() => setActiveTab('duty')} label="Обязанности" />
        <TabButton active={activeTab === 'task'} onClick={() => setActiveTab('task')} label="Задачи" />
        <TabButton active={activeTab === 'shopping'} onClick={() => setActiveTab('shopping')} label="Купить" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          {activeTab === 'duty' ? 'Регулярные дела' : activeTab === 'task' ? 'Разовые задачи' : 'Список покупок'}
        </h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="text-red-500 hover:text-red-400 p-2"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map(task => (
          <div 
            key={task.id} 
            className={cn(
              "bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex items-center justify-between group transition-all",
              task.status === 'completed' && "opacity-50 grayscale"
            )}
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleComplete(task)}
                disabled={task.status === 'completed'}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  task.status === 'completed' ? "bg-green-500/20 text-green-500" : "bg-zinc-800 text-zinc-600 hover:bg-red-600/20 hover:text-red-500"
                )}
              >
                {task.status === 'completed' ? <CheckCircle2 size={24} /> : <CheckSquare size={24} />}
              </button>
              <div>
                <h4 className="font-bold text-white mb-1">{task.title}</h4>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">+{task.xpReward} XP</span>
                  {task.price && <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">~{task.price} ₸</span>}
                  {task.status === 'completed' && (
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Выполнено</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile.role === 'admin' && (
                <button 
                  onClick={() => task.id && handleDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
            <p className="text-zinc-600 text-sm">Список пуст</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Новая запись</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Название</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Что сделать..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Награда (XP)</label>
                  <input 
                    type="number" 
                    value={xpReward}
                    onChange={(e) => setXpReward(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                    required
                  />
                </div>
                {activeTab === 'shopping' && (
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Цена (₸)</label>
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                    />
                  </div>
                )}
              </div>
              <button 
                type="submit"
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors mt-4"
              >
                Добавить
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-3 text-xs font-bold uppercase tracking-tighter rounded-xl transition-all",
        active ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {label}
    </button>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
