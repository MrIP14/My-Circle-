import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { User, Post as PostType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostCard } from './PostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Search, MoreHorizontal, Pencil, Menu, ChevronDown, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function Profile({ token, user: initialUser }: { token: string, user: User }) {
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [userStats, setUserStats] = useState({ followers: 0, following: 0, posts: 0 });
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchProfileData = async () => {
    if (!currentUser?.id) return;
    try {
      const stats = await api.get(`/users/${currentUser.id}/stats`, token);
      setUserStats(stats);
      
      const allPosts = await api.get('/posts', token);
      setUserPosts(allPosts.filter((p: any) => p.user_id === currentUser.id));
      
      const userDetails = await api.get(`/users/${currentUser.id}`, token);
      setCurrentUser(userDetails);
      setEditName(userDetails.name);
      setEditBio(userDetails.bio || '');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchProfileData();
    }
  }, [token, currentUser?.id]);

  const handleUpdateTextData = async () => {
    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('bio', editBio);

      const res = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    try {
      const res = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          toast.success(`${type === 'profile' ? 'Profile' : 'Cover'} photo updated!`);
        }
      }
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  return (
    <div className="bg-[#1a1a1a] min-h-screen text-white animate-in fade-in duration-500 pb-20">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center space-x-1">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Pencil className="h-5 w-5" />
                </Button>
              }
            />
            <DialogContent className="bg-zinc-900 border-white/5 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-black italic">Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Name</label>
                  <Input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-zinc-800 border-none h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Bio</label>
                  <Textarea 
                    value={editBio} 
                    onChange={(e) => setEditBio(e.target.value)}
                    className="bg-zinc-800 border-none min-h-[100px] font-medium"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <Button 
                  onClick={handleUpdateTextData}
                  className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white h-12 font-black uppercase tracking-widest rounded-xl"
                >
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="relative">
        {/* Cover Photo */}
        <div className="relative h-[220px] bg-zinc-800 overflow-hidden group">
          {currentUser.cover_photo ? (
            <img src={currentUser.cover_photo} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
          )}
          
          <label 
            htmlFor="cover-upload"
            className="absolute bottom-4 right-4 bg-white text-zinc-900 p-2.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer z-30 flex items-center justify-center border-2 border-white"
          >
            <Camera className="h-5 w-5" />
          </label>
          <input 
            id="cover-upload"
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => handleFileUpload(e, 'cover')} 
          />
        </div>

        {/* Profile Section Overflow */}
        <div className="px-6 flex items-end -mt-14 space-x-4 relative z-20">
          {/* Profile Picture */}
          <div className="relative group flex-shrink-0">
            <Avatar className="h-32 w-32 border-[6px] border-[#1a1a1a] shadow-2xl">
              <AvatarImage src={currentUser.profile_pic} className="object-cover" />
              <AvatarFallback className="text-4xl font-black bg-zinc-800 text-white">{currentUser.name[0]}</AvatarFallback>
            </Avatar>
            <label 
              htmlFor="profile-upload"
              className="absolute bottom-1 right-1 z-30 bg-zinc-700 border-2 border-[#1a1a1a] text-white p-1.5 rounded-full shadow-lg hover:bg-zinc-600 transition-colors cursor-pointer"
            >
              <Camera className="h-4 w-4" />
            </label>
            <input 
              id="profile-upload"
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileUpload(e, 'profile')} 
            />
          </div>

          <div className="flex-1 pb-1">
            <h2 className="text-2xl font-black leading-tight tracking-tight">{currentUser.name}</h2>
            <div className="flex items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest space-x-2">
              <span><span className="text-white">{userStats.followers >= 1000 ? (userStats.followers/1000).toFixed(1) + 'K' : userStats.followers}</span> followers</span>
              <span className="text-zinc-600">•</span>
              <span><span className="text-white">{userStats.following}</span> following</span>
              <span className="text-zinc-600">•</span>
              <span><span className="text-white">{userStats.posts}</span> posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio below the name section */}
      {currentUser.bio && (
        <div className="px-6 -mt-2">
          <p className="text-xs text-zinc-500 font-medium italic">"{currentUser.bio}"</p>
        </div>
      )}

      {/* Tabs / Content Section */}
      <div className="mt-8 px-4">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="bg-zinc-900/50 p-1 rounded-xl mb-6">
            <TabsTrigger value="posts" className="flex-1 rounded-lg font-bold">Timeline</TabsTrigger>
            <TabsTrigger value="media" className="flex-1 rounded-lg font-bold">Media</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4">
            {userPosts.map(post => (
              <PostCard key={post.id} post={post} token={token} currentUserId={currentUser.id} />
            ))}
            {userPosts.length === 0 && (
              <div className="text-center py-20 opacity-30 text-sm font-bold uppercase tracking-widest">No activity yet.</div>
            )}
          </TabsContent>
          
          <TabsContent value="media" className="grid grid-cols-3 gap-2">
            {userPosts.filter(p => p.image).map(post => (
              <div key={post.id} className="aspect-square bg-zinc-800 rounded-lg overflow-hidden ring-1 ring-white/5 shadow-inner">
                <img src={post.image} className="w-full h-full object-cover" alt="" />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ count, label }: { count: number, label: string }) {
  return (
    <Card className="border-none bg-zinc-900/50">
      <CardContent className="p-4 text-center">
        <div className="text-xl font-black">{count}</div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{label}</div>
      </CardContent>
    </Card>
  );
}
