import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Message } from '@/types';
import { api } from '@/lib/api';
import { Send, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Chat({ token, user: currentUser }: { token: string, user: User }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real app we'd fetch actual chat partners
    // Here we'll just fetch a few users for demo
    const fetchUsers = async () => {
      try {
        // Mocking user list by fetching some profiles
        // In reality you'd want a dedicated /api/recommended-users or similar
        const data = await api.get('/posts', token);
        const uniqueUsers = Array.from(new Set(data.map((p: any) => p.user_id)))
          .filter(id => id !== currentUser.id)
          .map(id => data.find((p: any) => p.user_id === id))
          .map(u => ({ id: u.user_id, name: u.name, profile_pic: u.profile_pic, email: '' }));
        setUsers(uniqueUsers as any);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();

    socketRef.current = io(window.location.origin);
    socketRef.current.emit('join', currentUser.id);

    socketRef.current.on('receive_message', (msg: Message) => {
      if (selectedUser && (msg.sender_id === selectedUser.id || msg.sender_id === currentUser.id)) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, currentUser.id, selectedUser?.id]);

  useEffect(() => {
    if (selectedUser) {
      api.get(`/messages/${selectedUser.id}`, token).then(setMessages);
    }
  }, [selectedUser, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socketRef.current) return;

    const msgData: Message = {
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      message: newMessage,
      timestamp: new Date().toISOString()
    };

    socketRef.current.emit('send_message', msgData);
    setNewMessage('');
  };

  if (!selectedUser) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-black px-2">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input placeholder="Search people..." className="pl-10 rounded-full bg-neutral-100 border-none dark:bg-zinc-800" />
        </div>
        <div className="space-y-1">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className="flex items-center space-x-4 p-3 w-full hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors text-left"
            >
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={u.profile_pic} />
                <AvatarFallback className="bg-[#1DB954]/10 text-[#1DB954]">{u.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-bold">{u.name}</div>
                <div className="text-xs text-neutral-400">Click to start conversation</div>
              </div>
            </button>
          ))}
          {users.length === 0 && (
            <p className="text-center py-20 text-neutral-400 text-sm italic">No conversations yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] animate-in slide-in-from-right-5 duration-300">
      <div className="p-4 border-b dark:border-zinc-800 flex items-center space-x-3 bg-white/80 backdrop-blur-md sticky top-0 z-10 dark:bg-zinc-900/80">
        <button onClick={() => setSelectedUser(null)} className="text-sm font-bold text-[#1DB954]">Back</button>
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={selectedUser.profile_pic} />
          <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
        </Avatar>
        <span className="font-black text-sm">{selectedUser.name}</span>
      </div>

      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMe ? 'bg-[#1DB954] text-white rounded-br-none' : 'bg-neutral-100 dark:bg-zinc-800 rounded-bl-none'}`}>
                  {msg.message}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="rounded-full bg-neutral-100 dark:bg-zinc-800 border-none h-12 px-6"
          />
          <Button type="submit" size="icon" className="rounded-full h-12 w-12 bg-[#1DB954] shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
