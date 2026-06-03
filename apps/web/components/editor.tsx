'use client';
import { useRef } from 'react';
import { useSocketStore } from '@/lib/socket';

export default function Editor() {
  const { content, updateContent } = useSocketStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 100 * 1024; // 100KB approx characters

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      updateContent(val);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col relative h-full bg-white">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder="START TYPING..."
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        className="flex-1 w-full h-full min-h-[50vh] p-6 text-xl md:text-2xl font-mono bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground/50 text-black leading-relaxed"
      />
      <div className="absolute bottom-4 right-6 text-sm font-bold uppercase text-black brutal-border px-3 py-1.5 bg-primary brutal-shadow flex gap-4">
        <span>WORDS: {content.trim() === '' ? 0 : content.trim().split(/\s+/).length.toLocaleString('en-US')}</span>
        <span>CHARS: {content.length.toLocaleString('en-US')} / {MAX_CHARS.toLocaleString('en-US')}</span>
      </div>
    </div>
  );
}
