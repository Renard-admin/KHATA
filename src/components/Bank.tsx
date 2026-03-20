import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Transaction } from '../types';
import { Wallet, Plus, Minus, History, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Bank({ profile }: { profile: UserProfile }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(txs);
      setBalance(txs.reduce((acc, tx) => acc + tx.amount, 0));
    });
    return () => unsubscribe();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const numAmount = Number(amount);
    const finalAmount = type === 'deposit' ? Math.abs(numAmount) : -Math.abs(numAmount);

    await addDoc(collection(db, 'transactions'), {
      userId: profile.uid,
      userName: profile.displayName,
      amount: finalAmount,
      type,
      comment,
      timestamp: Timestamp.now()
    });

    setAmount('');
    setComment('');
    setShowAddModal(false);
  };

  const handleDelete = async (id: string) => {
    if (profile.role !== 'admin') return;
    if (confirm('Удалить эту запись?')) {
      await deleteDoc(doc(db, 'transactions', id));
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      {/* Balance Card */}
      <section className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/10 to-transparent pointer-events-none" />
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Общак</p>
        <h2 className="text-5xl font-black text-white mb-6">{balance.toLocaleString()} ₸</h2>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => { setType('deposit'); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform"
          >
            <Plus size={20} /> Пополнить
          </button>
          <button 
            onClick={() => { setType('withdrawal'); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-zinc-800 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform"
          >
            <Minus size={20} /> Списать
          </button>
        </div>
      </section>

      {/* History */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">История операций</h3>
          <History size={14} className="text-zinc-500" />
        </div>
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  tx.type === 'deposit' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {tx.type === 'deposit' ? <Plus size={20} /> : <Minus size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{tx.comment || (tx.type === 'deposit' ? 'Пополнение' : 'Расход')}</h4>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">
                    {tx.userName} • {format(tx.timestamp.toDate(), 'd MMM, HH:mm', { locale: ru })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-black text-sm",
                  tx.type === 'deposit' ? "text-green-500" : "text-red-500"
                )}>
                  {tx.type === 'deposit' ? '+' : ''}{tx.amount.toLocaleString()} ₸
                </span>
                {profile.role === 'admin' && (
                  <button 
                    onClick={() => tx.id && handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-8">История пуста</p>
          )}
        </div>
      </section>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{type === 'deposit' ? 'Пополнение' : 'Расход'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Сумма (₸)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Комментарий</label>
                <input 
                  type="text" 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="На что..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors mt-4"
              >
                Подтвердить
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
