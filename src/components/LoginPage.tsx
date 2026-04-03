import React from 'react';
import { signInWithGoogle } from '../firebase';
import { motion } from 'motion/react';
import { LogIn, GraduationCap, Sparkles, Cpu } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center z-10"
      >
        <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-2xl shadow-cyan-500/20 mb-8">
          <Cpu size={48} className="text-white" />
        </div>
        
        <h1 className="text-5xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
          COLLEGE BUDDY OS
        </h1>
        <p className="text-slate-400 text-lg mb-12 font-medium">
          The next-generation student life operating system.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="w-full py-5 rounded-2xl bg-white text-black font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
          >
            <LogIn size={20} />
            Initialize with Google
          </button>
          
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Secure Node Access</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
              <GraduationCap size={20} className="text-cyan-400 mb-2" />
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Academic</div>
              <div className="text-xs text-slate-300">AI Syllabus Analysis</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
              <Sparkles size={20} className="text-purple-400 mb-2" />
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Growth</div>
              <div className="text-xs text-slate-300">Neural Habit Matrix</div>
            </div>
          </div>
        </div>

        <p className="mt-12 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          Powered by Senior Top AI • v4.0.2
        </p>
      </motion.div>
    </div>
  );
};
