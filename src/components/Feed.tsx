import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Post as PostType, User } from '@/types';
import { PostCard } from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';

export function Feed({ token, user }: { token: string, user: User }) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data = await api.get('/posts', token);
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4 px-2">
      {posts.map(post => (
        <PostCard key={post.id} post={post} token={token} currentUserId={user.id} />
      ))}
      {posts.length === 0 && (
        <div className="text-center py-20 opacity-50">
          <p>No posts yet. Follow people to see their updates!</p>
        </div>
      )}
    </div>
  );
}
