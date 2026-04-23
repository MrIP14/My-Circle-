import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Post as PostType } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Music2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Reels({ token }: { token: string }) {
  const [reels, setReels] = useState<PostType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // For demo, we'll fetch posts that have images or pretend they are videos
    api.get('/posts', token).then(data => {
      setReels(data.filter((p: any) => p.image || p.video));
    });
  }, [token]);

  if (reels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-400 italic text-sm">
        No reels found...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-128px)] w-full relative bg-black rounded-b-3xl overflow-hidden touch-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={reels[currentIndex].id}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="absolute inset-0"
          onClick={() => setCurrentIndex((currentIndex + 1) % reels.length)}
        >
          {reels[currentIndex].image ? (
            <img 
              src={reels[currentIndex].image} 
              className="w-full h-full object-cover opacity-80" 
              alt="Reel"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
              <PlayVideoPlaceholder />
            </div>
          )}

          {/* Reel Overlays */}
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
            <div className="space-y-4 max-w-[70%]">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border-2 border-[#1DB954] p-0.5 bg-white">
                  <AvatarImage src={reels[currentIndex].profile_pic} className="rounded-full" />
                  <AvatarFallback>{reels[currentIndex].name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white tracking-tight">@{reels[currentIndex].name.replace(' ', '').toLowerCase()}</span>
                  <button className="text-[10px] bg-[#1DB954] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest w-fit mt-1">Follow</button>
                </div>
              </div>
              <p className="text-sm text-white font-medium line-clamp-2">{reels[currentIndex].content}</p>
              <div className="flex items-center space-x-2 text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                <Music2 className="h-3 w-3 animate-spin duration-[3000ms]" />
                <span className="marquee">Original Audio - {reels[currentIndex].name}</span>
              </div>
            </div>

            <div className="flex flex-col space-y-6 items-center">
              <ReelAction icon={<Heart className="h-7 w-7" />} count={reels[currentIndex].likes_count} />
              <ReelAction icon={<MessageCircle className="h-7 w-7" />} count={reels[currentIndex].comments_count} />
              <ReelAction icon={<Share2 className="h-7 w-7" />} count="Share" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex space-x-1 px-4 w-full">
        {reels.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
}

function ReelAction({ icon, count }: { icon: React.ReactNode, count: number | string }) {
  return (
    <div className="flex flex-col items-center space-y-1">
      <div className="p-2 text-white hover:scale-110 active:scale-95 transition-transform">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-white shadow-sm uppercase">{count}</span>
    </div>
  );
}

function PlayVideoPlaceholder() {
  return (
    <div className="text-white flex flex-col items-center space-y-4">
      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
        <div className="translate-x-1 scale-125 border-l-[15px] border-l-white border-y-[10px] border-y-transparent" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest opacity-50">Playing Video...</p>
    </div>
  );
}
