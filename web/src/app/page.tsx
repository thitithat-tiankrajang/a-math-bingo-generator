// src/app/page.tsx
import MathBingoGenerator from '@/app/components/MathBingoGenerator';

export default function Home() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <MathBingoGenerator />
      </div>
    </div>
  );
}