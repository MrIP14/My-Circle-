import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { Post, Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export function PostCard({ post: initialPost, token, currentUserId }: { post: Post, token: string, currentUserId: number, key?: any }) {
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(!!initialPost.has_liked);
  const [likesCount, setLikesCount] = useState(initialPost.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const handleLike = async () => {
    try {
      const data = await api.post(`/posts/${post.id}/like`, {}, token);
      setIsLiked(!isLiked);
      setLikesCount(prev => data.removed ? prev - 1 : prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    try {
      const data = await api.get(`/posts/${post.id}/comments`, token);
      setComments(data);
      setShowComments(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/posts/${post.id}/comments`, { comment: newComment }, token);
      setNewComment('');
      const data = await api.get(`/posts/${post.id}/comments`, token);
      setComments(data);
      setPost(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="border-white/5 bg-[#121212] overflow-hidden rounded-2xl shadow-2xl mb-4">
      <CardHeader className="flex flex-row items-center justify-between p-4 px-5 space-y-0">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border border-white/10 p-0.5">
            <AvatarImage src={post.profile_pic} className="rounded-full object-cover" />
            <AvatarFallback className="bg-zinc-800 text-zinc-500 font-bold">{post.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight leading-none text-white">{post.name}</span>
            <span className="text-[9px] text-zinc-500 mt-1.5 uppercase font-bold tracking-widest">{formatDistanceToNow(new Date(post.created_at))} ago · 🌍</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-zinc-600 hover:text-white">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {post.content && (
          <div className="px-5 pb-4 text-sm font-medium leading-relaxed whitespace-pre-wrap text-zinc-200">{post.content}</div>
        )}
        {post.image && (
          <div className="px-2 pb-2">
            <img src={post.image} alt="Post content" className="w-full h-auto max-h-[500px] object-cover rounded-xl border border-white/5 bg-zinc-900" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col p-0 space-y-0 border-t border-white/5">
        <div className="w-full px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <span className="w-5 h-5 flex items-center justify-center bg-blue-500 text-white rounded-full text-[8px] border border-[#121212]">👍</span>
              <span className="w-5 h-5 flex items-center justify-center bg-zinc-800 text-white rounded-full text-[8px] border border-[#121212]">❤️</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{likesCount} Likes</span>
          </div>
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
            {post.comments_count} Comments · 0 Shares
          </div>
        </div>
        
        <div className="flex w-full p-1 bg-white/[0.01]">
          <button
            onClick={handleLike}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg hover:bg-white/5 flex items-center justify-center gap-2 ${isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-white'}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            Like
          </button>
          <button
            onClick={fetchComments}
            className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Comment
          </button>
          <button className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg flex items-center justify-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        {showComments && (
          <div className="w-full space-y-4 pt-2 border-t dark:border-zinc-800 px-1">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c.id} className="flex space-x-3 items-start">
                  <Avatar className="h-6 w-6 border text-[8px]">
                    <AvatarImage src={c.profile_pic} />
                    <AvatarFallback>{c.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col bg-neutral-100 dark:bg-zinc-800 p-2 rounded-2xl flex-1">
                    <span className="text-[10px] font-bold">{c.name}</span>
                    <p className="text-xs">{c.comment}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="flex items-center gap-2">
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="rounded-full bg-neutral-100 border-none dark:bg-zinc-800 h-9 text-xs"
              />
              <Button type="submit" size="sm" className="rounded-full bg-[#1DB954] h-9">Post</Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
