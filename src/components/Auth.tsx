import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function Auth({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const body = isLogin ? { email, password } : { name, email, password };
      const data = await api.post(endpoint, body);
      onLogin(data.token, data.user);
      toast.success(isLogin ? 'Logged in successfully' : 'Account created successfully');
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-full max-w-md"
      id="auth-container"
    >
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden rounded-2xl">
        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#1DB954] text-white p-2 rounded-xl font-black text-3xl px-4 skew-logo">AC</div>
          </div>
          <CardTitle className="text-4xl font-black text-[#1DB954] tracking-tighter">AmarCircle</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Your People. Your Circle.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Signup</TabsTrigger>
            </TabsList>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Input
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-neutral-50 dark:bg-zinc-800"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-neutral-50 dark:bg-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-neutral-50 dark:bg-zinc-800"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-[#1DB954] hover:bg-[#19a34a] text-white font-bold py-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Signup')}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-xs text-neutral-400 dark:text-zinc-500 font-medium uppercase tracking-widest leading-loose">
        Connecting Bangladesh <br /> One Circle at a time.
      </p>
    </motion.div>
  );
}
