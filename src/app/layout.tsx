import type { Metadata } from 'next';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VC in the Box | Practice Your Pitch with AI',
  description: 'A YC-style voice-first pitching game. Practice pitching to AI investors and get real-time feedback.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-950`}>
          <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-3 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
            <Link href="/" className="flex items-center group">
              {/* Logo */}
              <img 
                src="/logo.png" 
                alt="VC in the Box" 
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
            <nav className="flex items-center gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-white/60 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="relative group/btn bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium text-sm h-10 px-5 cursor-pointer hover:shadow-lg hover:shadow-orange-500/25 transition-all hover:scale-105">
                    <span className="relative z-10">Get Started</span>
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link 
                  href="/app" 
                  className="text-sm font-medium text-white/60 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all"
                >
                  Dashboard
                </Link>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/50 to-purple-500/50 rounded-full blur-md opacity-0 hover:opacity-100 transition-opacity" />
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: 'w-9 h-9 ring-2 ring-white/10 hover:ring-orange-500/50 transition-all'
                      }
                    }}
                  />
                </div>
              </SignedIn>
            </nav>
          </header>
          <main className="pt-16">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
