import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/app/contexts/AuthContext';
import { UndoRedoProvider } from '@/app/contexts/UndoRedoContext';
import { NavbarWrapper } from '@/app/components/NavbarWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DS Equation Anagram Service",
  description: "Service for Equation Anagram generator by Thitithat Tiankrajang",
  icons: {
    icon: '/logoDasc.png',
    shortcut: '/logoDasc.png',
    apple: '/logoDasc.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-green-100`}
      >
        <AuthProvider>
          <UndoRedoProvider>
            <NavbarWrapper />
            <main className="min-h-screen bg-green-100">
              {children}
            </main>
          </UndoRedoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
