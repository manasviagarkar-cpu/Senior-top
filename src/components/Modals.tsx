import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, Habit, CalendarEvent } from '../types';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="relative w-full max-w-md glass-card glass-border rounded-[2rem] p-8 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-all">
          <X size={20} />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

export const TaskForm: React.FC<{ onSubmit: (data: Partial<Task>) => void, onCancel: () => void }> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [type, setType] = useState<Task['type']>('task');
  const [priority, setPriority] = useState<Task['priority']>('medium');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Title</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
          placeholder="e.g. OS Revision"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Start Time</label>
          <input 
            type="time" 
            value={startTime} 
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">End Time</label>
          <input 
            type="time" 
            value={endTime} 
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as any)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="task">Task</option>
            <option value="study">Study</option>
            <option value="class">Class</option>
            <option value="break">Break</option>
            <option value="event">Event</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Priority</label>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all">Cancel</button>
        <button 
          onClick={() => onSubmit({ title, startTime, endTime, type, priority })}
          disabled={!title}
          className="flex-1 py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50"
        >
          Inject Mission
        </button>
      </div>
    </div>
  );
};

export const HabitForm: React.FC<{ onSubmit: (data: Partial<Habit>) => void, onCancel: () => void }> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('cyan');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Habit Name</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
          placeholder="e.g. Morning Meditation"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Neural Color</label>
        <div className="flex gap-4">
          {['cyan', 'blue', 'emerald', 'purple', 'pink'].map(c => (
            <button 
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full transition-all",
                c === 'cyan' ? "bg-cyan-500" :
                c === 'blue' ? "bg-blue-500" :
                c === 'emerald' ? "bg-emerald-500" :
                c === 'purple' ? "bg-purple-500" : "bg-pink-500",
                color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#020617] scale-110" : "opacity-50"
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all">Cancel</button>
        <button 
          onClick={() => onSubmit({ title, color })}
          disabled={!title}
          className="flex-1 py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50"
        >
          Initialize Habit
        </button>
      </div>
    </div>
  );
};

export const EventForm: React.FC<{ onSubmit: (data: Partial<CalendarEvent>) => void, onCancel: () => void }> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<CalendarEvent['type']>('study-block');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Event Title</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
          placeholder="e.g. AI Mid-Term"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Date</label>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Type</label>
        <select 
          value={type} 
          onChange={(e) => setType(e.target.value as any)}
          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="study-block">Study Block</option>
          <option value="exam">Exam</option>
          <option value="hackathon">Hackathon</option>
          <option value="holiday">Holiday</option>
        </select>
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all">Cancel</button>
        <button 
          onClick={() => onSubmit({ title, date: new Date(date).toISOString(), type })}
          disabled={!title}
          className="flex-1 py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50"
        >
          Sync to Calendar
        </button>
      </div>
    </div>
  );
};
