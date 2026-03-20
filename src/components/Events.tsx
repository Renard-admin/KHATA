import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, deleteDoc, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Event } from '../types';
import { Compass, Plus, MapPin, Clock, Users, X, CheckCircle2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Events({ profile }: { profile: UserProfile }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('time', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
    });
    return () => unsubscribe();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;

    const eventTime = new Date(`${date}T${time}`);

    await addDoc(collection(db, 'events'), {
      title,
      description,
      time: Timestamp.fromDate(eventTime),
      location,
      creatorUid: profile.uid,
      participants: [profile.uid],
      status: 'planned'
    });

    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
    setShowAddModal(false);
  };

  const handleJoin = async (event: Event) => {
    if (!event.id) return;
    const eventRef = doc(db, 'events', event.id);
    const isParticipating = event.participants.includes(profile.uid);

    await updateDoc(eventRef, {
      participants: isParticipating ? arrayRemove(profile.uid) : arrayUnion(profile.uid)
    });
  };

  const handleMarkHappened = async (event: Event) => {
    if (!event.id || profile.role !== 'admin') return;
    
    const eventRef = doc(db, 'events', event.id);
    const creatorRef = doc(db, 'users', event.creatorUid);

    await updateDoc(eventRef, { status: 'happened' });
    await updateDoc(creatorRef, { xp: increment(20) });
  };

  const handleDelete = async (id: string) => {
    if (profile.role !== 'admin') return;
    if (confirm('Удалить эту движуху?')) {
      await deleteDoc(doc(db, 'events', id));
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Доска движа</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="text-red-500 hover:text-red-400 p-2"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Event List */}
      <div className="space-y-4">
        {events.map(event => (
          <div 
            key={event.id} 
            className={cn(
              "bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden transition-all",
              event.status === 'happened' && "opacity-50 grayscale"
            )}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xl font-black text-white mb-1">{event.title}</h4>
                  <p className="text-sm text-zinc-400">{event.description}</p>
                </div>
                {event.status === 'happened' && (
                  <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                    Состоялось
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-500 uppercase tracking-tighter">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-red-500" />
                  {format(event.time.toDate(), 'd MMMM, HH:mm', { locale: ru })}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-red-500" />
                    {event.location}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-red-500" />
                  {event.participants.length} в теме
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {event.status === 'planned' && (
                  <button 
                    onClick={() => handleJoin(event)}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all",
                      event.participants.includes(profile.uid) 
                        ? "bg-zinc-800 text-zinc-400 hover:text-red-500" 
                        : "bg-red-600 text-white hover:bg-red-700"
                    )}
                  >
                    {event.participants.includes(profile.uid) ? 'Не иду' : 'Я в теме'}
                  </button>
                )}
                {profile.role === 'admin' && event.status === 'planned' && (
                  <button 
                    onClick={() => handleMarkHappened(event)}
                    className="p-3 bg-green-600/20 text-green-500 rounded-xl hover:bg-green-600/30 transition-all"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                )}
                {profile.role === 'admin' && (
                  <button 
                    onClick={() => event.id && handleDelete(event.id)}
                    className="p-3 bg-zinc-800 text-zinc-500 rounded-xl hover:text-red-500 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-12 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
            <p className="text-zinc-600 text-sm">Движух пока нет</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Новая движуха</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Название</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Куда едем?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Дата</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Время</label>
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Место</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Где встречаемся?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors mt-4"
              >
                Создать
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
