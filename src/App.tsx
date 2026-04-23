import React, { useState, useEffect } from 'react';
import { Home, Play, PlusSquare, MessageCircle, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { Auth } from './components/Auth';
import { Feed } from './components/Feed';
import { Profile } from './components/Profile';
import { Chat } from './components/Chat';
import { Reels } from './components/Reels';
import { CreatePost } from './components/CreatePost';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'reels' | 'create' | 'chat' | 'profile'>('home');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined') {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
          handleLogout();
        }
      }
    }
  }, [token]);

  // Global listener for auth failures
  useEffect(() => {
    const handleAuthError = (e: any) => {
      if (e.detail?.message?.includes('403') || e.detail?.message?.includes('401')) {
        handleLogout();
        toast.error('Session expired. Please login again.');
      }
    };
    window.addEventListener('api-auth-error', handleAuthError);
    return () => window.removeEventListener('api-auth-error', handleAuthError);
  }, []);

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <Auth onLogin={handleLogin} />
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 text-white selection:bg-[#1DB954]/30">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#121212]/95 border-b border-white/5 backdrop-blur-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="bg-[#1DB954] text-white p-1 rounded-lg font-black text-xl px-3 rotate-1">AC</div>
          <h1 className="text-xl font-black text-white tracking-tighter italic">AmarCircle</h1>
        </div>
        <div className="flex gap-4 items-center">
          <button className="p-2 bg-zinc-800/50 rounded-full hover:bg-zinc-700 transition-colors">🔔</button>
          <button onClick={handleLogout} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors">Logout</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 max-w-2xl mx-auto w-full px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="min-h-[calc(100vh-144px)] py-4"
          >
            {activeTab === 'home' && user && <Feed token={token} user={user} />}
            {activeTab === 'reels' && <Reels token={token} />}
            {activeTab === 'create' && <CreatePost token={token} onCreated={() => setActiveTab('home')} />}
            {activeTab === 'chat' && user && <Chat token={token} user={user} />}
            {activeTab === 'profile' && user && <Profile token={token} user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#121212]/95 border-t border-white/5 backdrop-blur-md flex items-center justify-around px-2 z-50">
        <NavButton active={activeTab === 'home'} icon={<Home className="w-6 h-6" />} label="Home" onClick={() => setActiveTab('home')} />
        <NavButton active={activeTab === 'reels'} icon={<Play className="w-6 h-6" />} label="Reels" onClick={() => setActiveTab('reels')} />
        
        <button 
          onClick={() => setActiveTab('create')}
          className="bg-[#1DB954] text-white w-14 h-14 rounded-2xl -mt-8 border-4 border-[#0a0a0a] shadow-[0_0_20px_rgba(29,185,84,0.3)] flex items-center justify-center text-3xl font-black transition-all hover:scale-110 active:scale-90"
        >
          +
        </button>

        <NavButton active={activeTab === 'chat'} icon={<MessageCircle className="w-6 h-6" />} label="Chat" onClick={() => setActiveTab('chat')} />
        <NavButton active={activeTab === 'profile'} icon={<UserIcon className="w-6 h-6" />} label="Profile" onClick={() => setActiveTab('profile')} />
      </nav>

      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 px-4 h-full relative transition-all ${active ? 'text-[#1DB954]' : 'text-zinc-600 hover:text-zinc-400'}`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
        {icon}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${active ? 'opacity-100 mt-1' : 'opacity-0 scale-50'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-dot"
          className="absolute -bottom-1 w-1 h-1 bg-[#1DB954] rounded-full"
        />
      )}
    </button>
  );
}
