'use client';
import { useRef } from 'react';
import { Copy, Share2, Trash2, Download, Paperclip, X } from 'lucide-react';
import { useSocketStore } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RoomActions({ token }: { token: string }) {
  const { updateContent, content, uploadFile, files, deleteFile } = useSocketStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('COPIED TO CLIPBOARD');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pastey Room',
          url
        });
      } catch {
        // User cancelled or failed
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('URL COPIED');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pastey-room-${token}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('DOWNLOAD STARTED');
  };

  const handleClear = () => {
    if (confirm('ARE YOU SURE YOU WANT TO CLEAR THE ROOM CONTENT?')) {
      updateContent('');
      toast.success('ROOM CLEARED');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (files.length >= 3) {
      toast.error('Maximum of 3 files allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      uploadFile({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: base64
      });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col border-t-[3px] border-black bg-white relative z-10">
      {/* File List Area */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-4 border-b-[3px] border-black bg-muted/30">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-2 brutal-border bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_#000]">
              <a href={f.data} download={f.name} className="text-sm font-bold max-w-[150px] md:max-w-[200px] truncate hover:underline">
                {f.name}
              </a>
              <button onClick={() => deleteFile(f.id)} className="text-destructive hover:bg-muted p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4 p-4 md:p-6">
        <Button variant="outline" onClick={handleCopy} className="flex-1 h-14 text-lg">
          <Copy className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">COPY TEXT</span>
        </Button>
        <Button variant="outline" onClick={handleShare} className="flex-1 h-14 text-lg">
          <Share2 className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">SHARE URL</span>
        </Button>
        <Button variant="outline" onClick={handleDownload} className="flex-1 h-14 text-lg">
          <Download className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">DOWNLOAD</span>
        </Button>
        <div className="flex gap-4 flex-1">
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 h-14 text-lg">
            <Paperclip className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">ATTACH</span>
          </Button>
          <Button variant="destructive" onClick={handleClear} className="h-14 px-6 md:px-8 shrink-0">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
