import { useEffect } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { AlertOctagon } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  isDestructive = false
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white brutal-border brutal-shadow w-full max-w-md flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-[3px] border-black p-4 flex items-center gap-3 bg-white">
          <AlertOctagon className={cn("w-6 h-6", isDestructive ? "text-destructive" : "text-black")} />
          <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
        </div>
        <div className="p-6 text-black border-b-[3px] border-black text-lg font-medium leading-relaxed">
          {message}
        </div>
        <div className="flex gap-4 p-4 bg-muted/30">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? "destructive" : "default"} 
            className="flex-1" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
