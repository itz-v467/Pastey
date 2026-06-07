import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/sonner';
import Link from 'next/link';
import { cn } from "@/lib/utils";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Pastey - Share Text Instantly",
  description: "Create a temporary room and start sharing text across devices in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", spaceGrotesk.variable)} suppressHydrationWarning>
      <body suppressHydrationWarning className={`${spaceGrotesk.className} bg-background text-foreground min-h-screen flex flex-col selection:bg-primary selection:text-primary-foreground`}>
        <header className="h-16 border-b-[3px] border-black flex items-center px-6 sticky top-0 bg-white z-10">
          <Link href="/" className="font-bold text-2xl tracking-tight flex items-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] transition-transform">
            <div className="w-6 h-6 bg-primary brutal-border brutal-shadow"></div>
            PASTEY
          </Link>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Toaster position="top-center" toastOptions={{
          className: "bg-transparent border-none shadow-none font-bold text-foreground text-lg",
          style: { background: 'transparent', border: 'none', boxShadow: 'none' }
        }} />
      </body>
    </html>
  );
}
