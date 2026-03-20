import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, StorageItem } from '../types';
import { Package, Plus, Trash2, X, Search, MapPin, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Storage({ profile }: { profile: UserProfile }) {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [location, setLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'storage'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StorageItem)));
    });
    return () => unsubscribe();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !location) return;

    await addDoc(collection(db, 'storage'), {
      ownerName: profile.displayName,
      itemName,
      location,
      timestamp: Timestamp.now()
    });

    setItemName('');
    setLocation('');
    setShowAddModal(false);
  };

  const handleDelete = async (id: string) => {
    if (profile.role !== 'admin') return;
    if (confirm('Удалить эту запись?')) {
      await deleteDoc(doc(db, 'storage', id));
    }
  };

  const filteredItems = items.filter(i => 
    i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      {/* Search & Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Хранение вещей</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="text-red-500 hover:text-red-400 p-2"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Поиск вещей..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-red-600 transition-colors"
        />
      </div>

      {/* Item List */}
      <div className="space-y-3">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500">
                <Package size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">{item.itemName}</h4>
                <div className="flex flex-wrap gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                  <div className="flex items-center gap-1">
                    <UserIcon size={12} className="text-red-500" />
                    {item.ownerName}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-red-500" />
                    {item.location}
                  </div>
                  <div className="flex items-center gap-1">
                    {format(item.timestamp.toDate(), 'd MMM yyyy', { locale: ru })}
                  </div>
                </div>
              </div>
            </div>
            {profile.role === 'admin' && (
              <button 
                onClick={() => item.id && handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
            <p className="text-zinc-600 text-sm">Ничего не найдено</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-sm:max-w-xs rounded-3xl p-6 border border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Оставить вещь</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Что оставляешь?</label>
                <input 
                  type="text" 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Шлем, ключи..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Где лежит?</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Полка 2, верстак..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  required
                />
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
