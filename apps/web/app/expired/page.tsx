import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ExpiredPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-900">
        <AlertCircle className="w-8 h-8 text-amber-500" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-100">
        Room Expired
      </h1>
      <p className="text-slate-400 mb-8 max-w-md">
        This room is no longer available. Rooms automatically expire after 24 hours or after 1 hour of inactivity for security and privacy.
      </p>
      <Link href="/">
        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
          Create New Room
        </Button>
      </Link>
    </div>
  );
}
