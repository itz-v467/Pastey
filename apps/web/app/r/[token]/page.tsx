'use client';
import { useEffect } from 'react';
import { useSocketStore } from '@/lib/socket';
import { useRouter, useParams } from 'next/navigation';
import Editor from '@/components/editor';
import RoomActions from '@/components/room-actions';
import { Users } from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { connect, disconnect, isConnected, activeUsers, isExpired, error, destroyRoom } = useSocketStore();
  
  useEffect(() => {
    if (token) {
      connect(token);
    }
    
    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  useEffect(() => {
    if (isExpired) {
      router.push('/expired');
    }
  }, [isExpired, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="brutal-border brutal-shadow bg-white p-8 max-w-md w-full text-center">
          <h2 className="text-3xl font-bold text-destructive uppercase mb-4">CONNECTION ERROR</h2>
          <p className="text-black font-medium mb-8 text-lg border-l-4 border-black pl-4 text-left">{error}</p>
          <button onClick={() => router.push('/')} className="brutal-border px-6 py-3 bg-primary text-black font-bold uppercase brutal-shadow hover:brutal-shadow-green active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-transform w-full">
            RETURN HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto w-full p-4 md:p-8">
      <div className="flex-1 flex flex-col brutal-border brutal-shadow bg-white relative">
        {/* Room Status Bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b-[3px] border-black bg-white relative z-10 overflow-x-auto">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-sm md:text-base font-bold uppercase text-black brutal-border px-3 py-1.5 bg-white ${isConnected ? 'brutal-shadow-green' : 'brutal-shadow'} shrink-0`}>
              <div className={`w-3 h-3 rounded-none brutal-border ${isConnected ? 'bg-primary' : 'bg-muted'}`} />
              <span className="hidden sm:inline">{isConnected ? 'SYNC ACTIVE' : 'CONNECTING...'}</span>
              <span className="sm:hidden">{isConnected ? 'SYNC' : 'CONN'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-5 ml-4">
             <div className="brutal-border brutal-shadow bg-primary px-3 md:px-4 py-1.5 font-mono font-bold text-black uppercase flex items-center text-sm md:text-lg shrink-0">
               ID: {token}
             </div>
            <div className="flex items-center gap-2 text-sm md:text-lg font-bold uppercase text-black brutal-border px-3 py-1.5 bg-white brutal-shadow shrink-0">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              <span>{activeUsers}</span>
            </div>
            <button 
              onClick={() => {
                if (confirm('ARE YOU SURE YOU WANT TO KILL THIS ROOM? THIS WILL DISCONNECT ALL USERS IMMEDIATELY AND CANNOT BE UNDONE.')) {
                  destroyRoom();
                }
              }}
              className="flex items-center justify-center text-sm md:text-lg font-bold text-destructive-foreground brutal-border px-3 py-1.5 bg-destructive brutal-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all shrink-0"
              title="KILL ROOM"
            >
              ☠
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <Editor />

        {/* Action Bar */}
        <RoomActions token={token} />
      </div>
    </div>
  );
}
