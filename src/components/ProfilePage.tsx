import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, checkUsernameUnique } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { User, Check, X, Loader2, Bot, Cat, Rocket } from 'lucide-react';
import { cn } from '../lib/utils';

const AVATARS = [
  { id: 'robot', icon: Bot, label: 'Robot-Student', color: 'bg-cyan-500' },
  { id: 'cat', icon: Cat, label: 'Pixel-Cat', color: 'bg-purple-500' },
  { id: 'astronaut', icon: Rocket, label: 'Astronaut-Engineer', color: 'bg-orange-500' },
];

export const ProfilePage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(userProfile?.username || '');
  const [avatarId, setAvatarId] = useState(userProfile?.avatarId || 'robot');
  const [isChecking, setIsChecking] = useState(false);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.username) setUsername(userProfile.username);
    if (userProfile?.avatarId) setAvatarId(userProfile.avatarId);
  }, [userProfile]);

  const handleUsernameChange = async (val: string) => {
    const cleanVal = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    setUsername(cleanVal);
    
    if (cleanVal.length < 3) {
      setIsUnique(null);
      return;
    }

    if (cleanVal === userProfile?.username) {
      setIsUnique(true);
      return;
    }

    setIsChecking(true);
    const unique = await checkUsernameUnique(cleanVal);
    setIsUnique(unique);
    setIsChecking(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!isUnique && username !== userProfile?.username) {
      setError('Username is already taken.');
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedProfile = {
        ...userProfile,
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Anonymous Student',
        username: username.toLowerCase(),
        avatarId,
        role: userProfile?.role || 'student',
        createdAt: userProfile?.createdAt || new Date().toISOString(),
      };

      await setDoc(userRef, updatedProfile);

      // Also update usernames collection for uniqueness
      if (username !== userProfile?.username) {
        // Delete old username if exists
        if (userProfile?.username) {
          await deleteDoc(doc(db, 'usernames', userProfile.username));
        }
        await setDoc(doc(db, 'usernames', username.toLowerCase()), { uid: user.uid });
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl"
      >
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Initialize Identity
        </h1>
        <p className="text-slate-400 mb-8 text-sm">Configure your Senior Top node credentials.</p>

        <div className="space-y-8">
          {/* Avatar Selection */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Select Avatar</label>
            <div className="flex justify-between gap-4">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setAvatarId(avatar.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                    avatarId === avatar.id 
                      ? "bg-white/5 border-cyan-500/50 shadow-lg shadow-cyan-500/10" 
                      : "border-white/5 hover:bg-white/5"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", avatar.color)}>
                    <avatar.icon size={24} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">{avatar.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="e.g. topnode1"
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-4 px-4 text-sm focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isChecking ? (
                  <Loader2 size={16} className="animate-spin text-slate-600" />
                ) : isUnique === true ? (
                  <Check size={16} className="text-emerald-500" />
                ) : isUnique === false ? (
                  <X size={16} className="text-rose-500" />
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Max 10 alphanumeric characters. Must be unique.</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !isUnique || username.length < 3}
            className="w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Sync Profile'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
