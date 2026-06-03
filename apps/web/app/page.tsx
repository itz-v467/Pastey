'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [joinLink, setJoinLink] = useState('');

  const createRoom = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/rooms`, {
        method: 'POST',
      });
      
      if (!res.ok) throw new Error('Failed to create room');
      
      const data = await res.json();
      router.push(data.url);
    } catch {
      toast.error('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinLink.trim()) return;

    // Support both full URL and just the Room ID
    try {
      const url = new URL(joinLink);
      if (url.pathname.startsWith('/r/')) {
        router.push(url.pathname);
      } else {
        router.push(`/r/${joinLink.trim().toUpperCase()}`);
      }
    } catch {
      router.push(`/r/${joinLink.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full text-center px-4 py-12 bg-background">
      <div className="brutal-border brutal-shadow bg-white p-8 md:p-10 max-w-xl w-full">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6 text-black">
          Share Text <br/><span className="text-primary bg-black px-3 py-1 brutal-shadow-green inline-block mt-3">Instantly</span>
        </h1>
        <p className="text-lg md:text-xl text-black font-medium mb-10 border-l-4 border-black pl-4 text-left">
          Create a temporary room and start sharing text across devices in real-time. No account required.
        </p>

        <div className="flex flex-col gap-8 w-full max-w-sm mx-auto">
          <Button size="lg" onClick={createRoom} disabled={isLoading} className="w-full text-xl h-14" suppressHydrationWarning>
            {isLoading ? 'INITIALIZING...' : 'CREATE ROOM'}
          </Button>
          
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-[3px] border-black" />
            </div>
            <div className="relative flex justify-center text-sm font-bold uppercase">
              <span className="bg-white px-4 text-black brutal-border">OR JOIN EXISTING</span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <Input 
              type="text" 
              placeholder="ENTER ROOM ID" 
              value={joinLink}
              onChange={(e) => setJoinLink(e.target.value.toUpperCase())}
              className="flex-1 text-center font-bold tracking-widest text-lg uppercase placeholder:text-muted-foreground/60 h-14"
              maxLength={6}
              suppressHydrationWarning
            />
            <Button type="submit" variant="outline" className="h-14 px-8 text-lg" suppressHydrationWarning>
              JOIN
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
