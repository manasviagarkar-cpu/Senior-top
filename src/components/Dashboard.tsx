import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Search,
  LayoutDashboard,
  Sparkles,
  ExternalLink,
  Loader2,
  Box as LucideBox,
  Cpu,
  Check,
  X,
  Activity,
  Bot,
  MessageSquare,
  Upload,
  Bell,
  MapPin,
  Users,
  Terminal,
  Mic,
  LogOut,
  Settings,
  Smile,
  Frown,
  Zap as Focused,
  Coffee,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, subDays, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { Task, Opportunity, CalendarEvent, Habit, CommunityPost, Mood } from '../types';
import { schedulerAgent, opportunityAgent, mentorAgent, pdfAnalysisAgent } from '../geminiService';
import { HabitMatrix } from './HabitMatrix';
import { LiveVoice } from './LiveVoice';
import { StreakService } from '../lib/streakService';
import { db, logout, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, orderBy, limit, setDoc } from 'firebase/firestore';
import { Modal, TaskForm, HabitForm, EventForm } from './Modals';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AVATAR_ICONS: { [key: string]: any } = {
  robot: Bot,
  cat: LucideBox, // Pixel-Cat
  astronaut: Cpu, // Astronaut-Engineer
};

export const Dashboard: React.FC<{ activeTab?: 'dashboard' | 'opportunities' | 'habits' | 'community' | 'calendar' | 'tasks' }> = ({ activeTab: initialTab = 'dashboard' }) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showChat, setShowChat] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [showLiveVoice, setShowLiveVoice] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood>('happy');
  
  // Modals
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);

  // Fake Data for Prototype
  const FAKE_TASKS: Task[] = [
    { id: 'f1', uid: 'fake', title: 'AI/ML Assignment 3', startTime: '10:00', endTime: '12:00', type: 'study', priority: 'high', completed: false, description: 'Neural Networks implementation' },
    { id: 'f2', uid: 'fake', title: 'DSA Lab Viva', startTime: '14:00', endTime: '15:00', type: 'class', priority: 'medium', completed: false, description: 'Graph algorithms' },
    { id: 'f3', uid: 'fake', title: 'OS Revision', startTime: '16:00', endTime: '17:30', type: 'study', priority: 'low', completed: false, description: 'Process scheduling' }
  ];

  const FAKE_HABITS: Habit[] = [
    { id: 'h1', uid: 'fake', title: 'LeetCode Daily', icon: 'Terminal', color: 'cyan', streak: 12, history: [] },
    { id: 'h2', uid: 'fake', title: 'Deep Work', icon: 'Brain', color: 'purple', streak: 5, history: [] }
  ];

  useEffect(() => {
    if (!user) return;

    const tasksQuery = query(collection(db, 'tasks'), where('uid', '==', user.uid));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const dbTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
      setTasks(dbTasks.length > 0 ? dbTasks : FAKE_TASKS);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));

    const habitsQuery = query(collection(db, 'habits'), where('uid', '==', user.uid));
    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      const dbHabits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Habit));
      setHabits(dbHabits.length > 0 ? dbHabits : FAKE_HABITS);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'habits'));

    const eventsQuery = query(collection(db, 'calendarEvents'), where('uid', '==', user.uid));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      setCalendarEvents(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CalendarEvent)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'calendarEvents'));

    const communityQuery = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeCommunity = onSnapshot(communityQuery, (snapshot) => {
      setCommunityPosts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CommunityPost)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'communityPosts'));

    return () => {
      unsubscribeTasks();
      unsubscribeHabits();
      unsubscribeEvents();
      unsubscribeCommunity();
    };
  }, [user]);

  const handleToggleHabit = async (habitId: string) => {
    if (!user) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const history = [...habit.history];
    const index = history.indexOf(todayStr);
    let isCompleted = false;

    if (index > -1) {
      history.splice(index, 1);
    } else {
      history.push(todayStr);
      isCompleted = true;
    }

    const streak = StreakService.calculateStreak(history);
    try {
      await updateDoc(doc(db, 'habits', habitId), {
        history,
        streak,
        lastCompleted: isCompleted ? new Date().toISOString() : habit.lastCompleted
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `habits/${habitId}`);
    }
  };

  const handleAddTask = async (taskData: Partial<Task>) => {
    if (!user) return;
    try {
      const newTask: Omit<Task, 'id'> = {
        uid: user.uid,
        title: taskData.title || 'New Task',
        startTime: taskData.startTime || '09:00',
        endTime: taskData.endTime || '10:00',
        type: taskData.type || 'task',
        priority: taskData.priority || 'medium',
        completed: false,
        description: taskData.description || ''
      };
      await addDoc(collection(db, 'tasks'), newTask);
      setShowAddTask(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tasks');
    }
  };

  const handleAddHabit = async (habitData: Partial<Habit>) => {
    if (!user) return;
    try {
      const newHabit: Omit<Habit, 'id'> = {
        uid: user.uid,
        title: habitData.title || 'New Habit',
        icon: habitData.icon || 'Terminal',
        color: habitData.color || 'cyan',
        streak: 0,
        history: []
      };
      await addDoc(collection(db, 'habits'), newHabit);
      setShowAddHabit(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'habits');
    }
  };

  const handleAddEvent = async (eventData: Partial<CalendarEvent>) => {
    if (!user) return;
    try {
      const newEvent: Omit<CalendarEvent, 'id'> = {
        uid: user.uid,
        title: eventData.title || 'New Event',
        date: eventData.date || new Date().toISOString(),
        type: eventData.type || 'study-block'
      };
      await addDoc(collection(db, 'calendarEvents'), newEvent);
      setShowAddEvent(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'calendarEvents');
    }
  };

  const handlePostToCommunity = async (content: string) => {
    if (!user || !userProfile) return;
    try {
      const newPost: Omit<CommunityPost, 'id'> = {
        uid: user.uid,
        authorName: userProfile.displayName,
        authorPhoto: userProfile.photoURL || '',
        content,
        hubId: 'general',
        createdAt: new Date().toISOString(),
        likes: []
      };
      await addDoc(collection(db, 'communityPosts'), newPost);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'communityPosts');
    }
  };

  const top3Tasks = tasks.filter(t => !t.completed).sort((a, b) => {
    const priorityMap = { high: 3, medium: 2, low: 1 };
    return priorityMap[b.priority] - priorityMap[a.priority];
  }).slice(0, 3);

  const AvatarIcon = AVATAR_ICONS[userProfile?.avatarId || 'robot'] || Bot;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex font-sans selection:bg-cyan-500/30 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-[#0d0d10] flex flex-col py-8 z-50">
        {/* User Profile Mini */}
        <div className="px-6 mb-10">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <AvatarIcon size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{userProfile?.displayName}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">@{userProfile?.username}</div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2 px-4">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); navigate('/'); }} />
          <SidebarItem icon={<Calendar size={20} />} label="Calendar" active={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); navigate('/calendar'); }} />
          <SidebarItem icon={<Clock size={20} />} label="Tasks" active={activeTab === 'tasks'} onClick={() => { setActiveTab('tasks'); navigate('/tasks'); }} />
          <SidebarItem icon={<Activity size={20} />} label="Habits" active={activeTab === 'habits'} onClick={() => { setActiveTab('habits'); navigate('/habits'); }} />
          <SidebarItem icon={<Trophy size={20} />} label="Opportunities" active={activeTab === 'opportunities'} onClick={() => { setActiveTab('opportunities'); navigate('/opportunities'); }} />
          <SidebarItem icon={<Users size={20} />} label="Community" active={activeTab === 'community'} onClick={() => { setActiveTab('community'); navigate('/community'); }} />
        </nav>

        <div className="px-4 mt-auto flex flex-col gap-2">
          <SidebarItem icon={<Settings size={20} />} label="Profile Settings" active={false} onClick={() => navigate('/profile')} />
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto scrollbar-hide bg-[radial-gradient(circle_at_50%_-20%,rgba(56,189,248,0.08),transparent)]">
        <div className="p-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back, {userProfile?.displayName}</h1>
              <p className="text-slate-500 font-medium">Your AI-optimized student OS is ready.</p>
            </div>
            <button 
              onClick={() => setShowChat(!showChat)}
              className={cn(
                "p-4 rounded-2xl transition-all shadow-lg",
                showChat ? "bg-cyan-500 text-white shadow-cyan-500/20" : "bg-white/5 text-slate-400 hover:text-white"
              )}
            >
              <MessageSquare size={24} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Top 3 Must-Do */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                      <Zap size={20} className="text-amber-400" />
                      Must-Do Missions
                    </h2>
                    <button onClick={() => setShowAddTask(true)} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {top3Tasks.length > 0 ? top3Tasks.map((task) => (
                      <motion.div 
                        key={task.id} 
                        layout
                        className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm",
                            task.priority === 'high' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                            task.priority === 'medium' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                            "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                          )}>
                            <Clock size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{task.title}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{task.startTime} • {task.type}</p>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            if (task.id.startsWith('f')) {
                              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t));
                            } else {
                              await updateDoc(doc(db, 'tasks', task.id), { completed: true });
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        >
                          <Check size={16} />
                        </button>
                      </motion.div>
                    )) : (
                      <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center text-slate-600 text-center">
                        <CheckCircle2 size={32} className="mb-3 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">All Clear</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Habit Matrix (Auto-streak counter) */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                      <Activity size={20} className="text-emerald-400" />
                      Neural Pathways
                    </h2>
                    <button onClick={() => setShowAddHabit(true)} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                      Manage
                    </button>
                  </div>
                  <div className="space-y-4">
                    {habits.slice(0, 3).map((habit) => (
                      <div key={habit.id} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm",
                            habit.color === 'cyan' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                            habit.color === 'purple' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                            "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          )}>
                            <Zap size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{habit.title}</h4>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i < (habit.streak % 5 || 5) ? "bg-cyan-500" : "bg-white/10")} />
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{habit.streak} Day Streak</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleToggleHabit(habit.id)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Quick Stats / AI Insights */}
                <section className="lg:col-span-2">
                  <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <Sparkles size={120} />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-4">Senior Top's Daily Brief</h3>
                      <p className="text-slate-300 max-w-xl leading-relaxed mb-6">
                        You've completed <span className="text-cyan-400 font-bold">85%</span> of your weekly goals. 
                        Your focus peak is usually around <span className="text-purple-400 font-bold">11:00 AM</span>. 
                        The upcoming AI/ML assignment is 40% of your grade—recommend starting the "Neural Win" block today.
                      </p>
                      <div className="flex gap-4">
                        <button className="px-6 py-3 rounded-2xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-all">
                          Generate Study Plan
                        </button>
                        <button className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all">
                          Analyze Syllabus
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'opportunities' && (
              <motion.div 
                key="opportunities"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">Opportunity Node</h2>
                  <button 
                    onClick={async () => {
                      setLoading(prev => ({ ...prev, opportunities: true }));
                      const opps = await opportunityAgent();
                      setOpportunities(opps);
                      setLoading(prev => ({ ...prev, opportunities: false }));
                    }}
                    disabled={loading.opportunities}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all disabled:opacity-50"
                  >
                    {loading.opportunities ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    Scan for Nodes
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {opportunities.map((opp, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-8 rounded-[2.5rem] bg-slate-900/30 border border-white/5 hover:border-cyan-500/30 transition-all group cursor-pointer"
                      onClick={() => setSelectedOpportunity(opp)}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest border border-cyan-500/20">
                          {opp.type}
                        </div>
                        <div className="text-slate-600 group-hover:text-cyan-400 transition-colors">
                          <ExternalLink size={18} />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">{opp.title}</h3>
                      <div className="flex items-center gap-2 text-slate-500 text-xs mb-6">
                        <MapPin size={14} />
                        {opp.location}
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{opp.relevance}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'habits' && (
              <motion.div 
                key="habits"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">Neural Pathways</h2>
                  <button onClick={() => setShowAddHabit(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all">
                    <Plus size={18} />
                    New Pathway
                  </button>
                </div>
                <HabitMatrix habits={habits} onToggle={handleToggleHabit} />
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">Mission Log</h2>
                  <button onClick={() => setShowAddTask(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-all">
                    <Plus size={18} />
                    Add Mission
                  </button>
                </div>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className={cn(
                      "p-6 rounded-3xl bg-slate-900/30 border border-white/5 flex items-center justify-between group",
                      task.completed && "opacity-50"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg",
                          task.priority === 'high' ? "bg-rose-500/20 border-rose-500/30 text-rose-400" :
                          task.priority === 'medium' ? "bg-amber-500/20 border-amber-500/30 text-amber-400" :
                          "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                        )}>
                          <Clock size={24} />
                        </div>
                        <div>
                          <h4 className={cn("font-bold", task.completed && "line-through")}>{task.title}</h4>
                          <p className="text-xs text-slate-500">{task.startTime} - {task.endTime}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={async () => await updateDoc(doc(db, 'tasks', task.id), { completed: !task.completed })}
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        >
                          <Check size={20} />
                        </button>
                        <button 
                          onClick={async () => await deleteDoc(doc(db, 'tasks', task.id))}
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">Neural Calendar</h2>
                  <button onClick={() => setShowAddEvent(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all">
                    <Plus size={18} />
                    Add Event
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {calendarEvents.map((event) => (
                    <div key={event.id} className="p-6 rounded-3xl bg-slate-900/30 border border-white/5">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
                        event.type === 'exam' ? "bg-rose-500/20 text-rose-400" : "bg-cyan-500/20 text-cyan-400"
                      )}>
                        <Calendar size={20} />
                      </div>
                      <h4 className="font-bold mb-1">{event.title}</h4>
                      <p className="text-xs text-slate-500 mb-4">{format(parseISO(event.date), 'EEEE, MMMM do')}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{event.type}</span>
                        <button 
                          onClick={async () => await deleteDoc(doc(db, 'calendarEvents', event.id))}
                          className="text-slate-600 hover:text-rose-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {activeTab === 'community' && (
              <motion.div 
                key="community"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="p-8 rounded-[2.5rem] bg-slate-900/30 border border-white/5">
                  <h3 className="text-xl font-bold mb-6">Broadcast to Mesh</h3>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 shrink-0 overflow-hidden">
                      <AvatarIcon size={24} className="text-slate-500 m-3" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <textarea 
                        placeholder="Share an insight or ask the mesh..."
                        className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder:text-slate-600 resize-none h-24"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePostToCommunity(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-2">
                          <button className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors"><Upload size={18} /></button>
                          <button className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors"><MapPin size={18} /></button>
                        </div>
                        <button className="px-6 py-2 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-500 transition-all">
                          Broadcast
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {communityPosts.map((post, idx) => (
                    <motion.div 
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-8 rounded-[2.5rem] bg-slate-900/30 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                            <Users size={24} className="text-slate-500" />
                          </div>
                          <div>
                            <div className="font-bold">{post.authorName}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">{format(parseISO(post.createdAt), 'MMM do, h:mm a')}</div>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                          {post.hubId}
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed mb-6">{post.content}</p>
                      <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                        <button 
                          onClick={async () => {
                            if (!user) return;
                            const likes = [...post.likes];
                            const idx = likes.indexOf(user.uid);
                            if (idx > -1) likes.splice(idx, 1);
                            else likes.push(user.uid);
                            await updateDoc(doc(db, 'communityPosts', post.id), { likes });
                          }}
                          className={cn(
                            "flex items-center gap-2 text-sm transition-colors",
                            post.likes.includes(user?.uid || '') ? "text-rose-500" : "text-slate-500 hover:text-rose-400"
                          )}
                        >
                          <Zap size={18} fill={post.likes.includes(user?.uid || '') ? "currentColor" : "none"} />
                          {post.likes.length}
                        </button>
                        <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-400 transition-colors">
                          <MessageSquare size={18} />
                          Reply
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Right Sidebar: Senior Top Chat (Sliding) */}
      <AnimatePresence>
        {showChat && (
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-96 border-l border-white/5 bg-[#0d0d10]/95 backdrop-blur-xl flex flex-col z-[100] shadow-2xl shadow-black"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Bot size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Senior Top</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Protocol</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowChat(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <ChatInterface mood={mood} onMoodChange={setMood} context={{ tasks, habits, calendarEvents }} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Opportunity Detail Modal */}
      <AnimatePresence>
        {selectedOpportunity && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0a0a0c]/90 backdrop-blur-md"
            onClick={() => setSelectedOpportunity(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <Trophy size={160} />
              </div>
              
              <button 
                onClick={() => setSelectedOpportunity(null)}
                className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <X size={24} />
              </button>

              <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest border border-indigo-500/20 inline-block mb-6">
                {selectedOpportunity.type} Node
              </div>
              
              <h2 className="text-4xl font-bold mb-8 leading-tight">{selectedOpportunity.title}</h2>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-4 text-slate-400">
                  <Search size={20} className="text-purple-500" />
                  <span className="text-lg">{selectedOpportunity.location}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <Calendar size={20} className="text-purple-500" />
                  <span className="text-lg">{selectedOpportunity.date}</span>
                </div>
                <div className="p-6 rounded-3xl bg-cyan-900/10 border border-cyan-500/20">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">AI Relevance Analysis</h4>
                  <p className="text-slate-300 leading-relaxed italic">
                    "{selectedOpportunity.relevance}"
                  </p>
                </div>
              </div>

              <a 
                href={selectedOpportunity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-cyan-600/20"
              >
                Access Opportunity Node
                <ExternalLink size={20} />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals... */}
      <AnimatePresence>
        {showAddTask && (
          <Modal title="Add Mission" onClose={() => setShowAddTask(false)}>
            <TaskForm onSubmit={handleAddTask} onCancel={() => setShowAddTask(false)} />
          </Modal>
        )}
        {showAddHabit && (
          <Modal title="Add Habit" onClose={() => setShowAddHabit(false)}>
            <HabitForm onSubmit={handleAddHabit} onCancel={() => setShowAddHabit(false)} />
          </Modal>
        )}
        {showAddEvent && (
          <Modal title="Add Event" onClose={() => setShowAddEvent(false)}>
            <EventForm onSubmit={handleAddEvent} onCancel={() => setShowAddEvent(false)} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
        active 
          ? "bg-cyan-500/10 text-cyan-400" 
          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

const ChatInterface: React.FC<{ mood: Mood, onMoodChange: (m: Mood) => void, context: any }> = ({ mood, onMoodChange, context }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: any }[]>([
    { role: 'assistant', content: "Senior Top online. Mission status?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await mentorAgent(userMsg, context, mood);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error("Chat failed:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Protocol error. Retrying neural link..." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mood Selector */}
      <div className="p-6 border-b border-white/5 bg-white/[0.02]">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Current Biometrics</div>
        <div className="flex justify-between gap-2">
          <MoodButton icon={<Smile size={18} />} active={mood === 'happy'} onClick={() => onMoodChange('happy')} label="Happy" />
          <MoodButton icon={<Focused size={18} />} active={mood === 'focused'} onClick={() => onMoodChange('focused')} label="Focused" />
          <MoodButton icon={<Coffee size={18} />} active={mood === 'tired'} onClick={() => onMoodChange('tired')} label="Tired" />
          <MoodButton icon={<Brain size={18} />} active={mood === 'stressed'} onClick={() => onMoodChange('stressed')} label="Stressed" />
          <MoodButton icon={<Frown size={18} />} active={mood === 'sad'} onClick={() => onMoodChange('sad')} label="Sad" />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}
          >
            <div className={cn(
              "max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
              msg.role === 'user' 
                ? "bg-cyan-600 text-white rounded-tr-none" 
                : "bg-white/5 text-slate-300 border border-white/5 rounded-tl-none"
            )}>
              {typeof msg.content === 'string' ? msg.content : (
                <div className="space-y-4">
                  <p>{msg.content.response}</p>
                  {msg.content.suggestedBlocks && msg.content.suggestedBlocks.length > 0 && (
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Suggested Blocks</div>
                      {msg.content.suggestedBlocks.map((block: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-xs font-medium">{block.title}</span>
                          <span className="text-[10px] text-slate-500">{block.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.content.action && (
                    <button className="w-full py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/30 transition-all">
                      Execute: {msg.content.action.replace('-', ' ')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/5 bg-white/[0.02]">
        <div className="relative group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Senior Top..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all placeholder:text-slate-600"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-600/20"
          >
            <Zap size={18} />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <Mic size={12} />
            Voice Ready
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Terminal size={12} />
            JSON Protocol
          </div>
        </div>
      </div>
    </div>
  );
};

function MoodButton({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-2 p-2 rounded-xl border transition-all group",
        active 
          ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" 
          : "border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/5"
      )}
    >
      {icon}
      <span className="text-[8px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
}
