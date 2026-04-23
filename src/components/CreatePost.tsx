import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, Video, X } from 'lucide-react';
import { toast } from 'sonner';

export function CreatePost({ token, onCreated }: { token: string, onCreated: () => void }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !image) return;
    setIsLoading(true);
    try {
      await api.post('/posts', { content, image }, token);
      toast.success('Post created!');
      onCreated();
    } catch (err) {
      toast.error('Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 animate-in fade-in duration-500">
      <Card className="border-none shadow-none bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-black">Share what's on your mind...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="Write something cool..." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px] bg-neutral-50 dark:bg-zinc-800 border-none rounded-2xl resize-none text-lg p-4"
          />
          
          <div className="space-y-2">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Media (Image URL for demo)</p>
            <div className="relative">
              <Input 
                placeholder="https://example.com/image.jpg" 
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="bg-neutral-50 dark:bg-zinc-800 border-none rounded-xl"
              />
              {image && (
                <button onClick={() => setImage('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {image && (
            <div className="rounded-2xl overflow-hidden border">
              <img src={image} alt="Preview" className="w-full h-40 object-cover" />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold flex gap-2">
              <ImageIcon className="h-5 w-5 text-blue-500" /> Photo
            </Button>
            <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold flex gap-2">
              <Video className="h-5 w-5 text-red-500" /> Video
            </Button>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || (!content && !image)}
            className="w-full h-14 bg-[#1DB954] hover:bg-[#19a34a] text-white font-black text-lg rounded-2xl shadow-lg shadow-green-500/20"
          >
            {isLoading ? 'Posting...' : 'Shoot to Circle'}
          </Button>
        </CardContent>
      </Card>
      
      <div className="mt-8 p-6 bg-neutral-100 dark:bg-zinc-900 rounded-3xl">
        <h3 className="font-black text-sm uppercase tracking-widest text-[#1DB954] mb-2">Circle Tips</h3>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Post high quality images to get more likes. Keep your captions short and engaging. Respect everyone in your circle.
        </p>
      </div>
    </div>
  );
}
