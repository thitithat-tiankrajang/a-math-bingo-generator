// src/components/DisplayBox.tsx
import type { MathBingoResult } from '@/app/types/mathBingo';

interface DisplayBoxProps {
  result: MathBingoResult | null;
}

export default function DisplayBox({ result }: DisplayBoxProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        โจทย์บิงโกเอแม็ท
      </h2>
      
      <div className="min-h-24 flex items-center justify-center">
        {result ? (
          <div className="space-y-4">
            {/* แสดงชุดตัวเลขและเครื่องหมาย */}
            <div className="flex flex-wrap gap-3 justify-center">
              {result.elements.map((element, index) => (
                <div
                  key={index}
                  className={`
                    px-4 py-2 rounded-lg text-lg font-medium
                    ${isNaN(Number(element))
                      ? 'bg-blue-100 text-blue-800' // เครื่องหมาย
                      : 'bg-green-100 text-green-800' // ตัวเลข
                    }
                  `}
                >
                  {element}
                </div>
              ))}
            </div>
            
            {/* แสดงตัวอย่างสมการ (ถ้ามี) */}
            {result.sampleEquation && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">ตัวอย่างสมการที่เป็นไปได้:</p>
                <p className="text-lg font-mono bg-gray-100 inline-block px-4 py-2 rounded">
                  {result.sampleEquation}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            <p>กดปุ่ม "สร้างโจทย์" เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>
    </div>
  );
}