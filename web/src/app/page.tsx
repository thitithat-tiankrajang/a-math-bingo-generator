// src/app/page.tsx
import EquationAnagramGenerator from '@/app/components/EquationAnagramGenerator';

export default function Home() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <EquationAnagramGenerator />
      </div>
    </div>
  );
}