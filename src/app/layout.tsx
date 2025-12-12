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
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
          <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-200">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-yc-orange rounded-sm flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-105">
                VC
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">
                VC in the Box
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-yc-orange text-white rounded-lg font-medium text-sm h-10 px-5 cursor-pointer hover:bg-[#e55c00] transition-colors">
                    Get Started
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link 
                  href="/app" 
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: 'w-9 h-9'
                    }
                  }}
                />
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
