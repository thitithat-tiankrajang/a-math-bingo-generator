// src/components/DisplayBox.tsx
import type { MathBingoResult } from '@/app/types/mathBingo';

interface DisplayBoxProps {
  result: MathBingoResult | null;
}

// ฟังก์ชันกำหนดสีของ element ตามประเภท
function getElementStyle(element: string): string {
  // ตัวเลขเบา (0-9)
  if (/^[0-9]$/.test(element)) {
    return 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm';
  }
  
  // ตัวเลขหนัก (10-20)
  if (/^(1[0-9]|20)$/.test(element)) {
    return 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-sm';
  }
  
  // เครื่องหมายคำนวณพื้นฐาน
  if (['+', '-', '×', '÷'].includes(element)) {
    return 'bg-blue-100 text-blue-800 border-2 border-blue-300 shadow-sm';
  }
  
  // เครื่องหมายทางเลือก
  if (['+/-', '×/÷'].includes(element)) {
    return 'bg-purple-100 text-purple-800 border-2 border-purple-300 shadow-sm';
  }
  
  // เครื่องหมาย =
  if (element === '=') {
    return 'bg-orange-100 text-orange-800 border-2 border-orange-300 shadow-sm';
  }
  
  // Wildcard ?
  if (element === '?') {
    return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300 shadow-sm';
  }
  
  // default
  return 'bg-gray-100 text-gray-800 border-2 border-gray-300 shadow-sm';
}

// ฟังก์ชันกำหนดป้ายชื่อประเภท
function getElementTypeLabel(element: string): string {
  if (/^[0-9]$/.test(element)) return 'ตัวเลขเบา';
  if (/^(1[0-9]|20)$/.test(element)) return 'ตัวเลขหนัก';
  if (['+', '-', '×', '÷'].includes(element)) return 'เครื่องหมายคำนวณ';
  if (['+/-', '×/÷'].includes(element)) return 'เครื่องหมายทางเลือก';
  if (element === '=') return 'เครื่องหมายเท่ากับ';
  if (element === '?') return 'ไวลด์การ์ด';
  return 'ไม่ทราบ';
}

export default function DisplayBox({ result }: DisplayBoxProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🎯 โจทย์บิงโกเอแม็ท
        </h2>
        {result && (
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
            {result.elements.length} ตัว
          </div>
        )}
      </div>
      
      <div className="min-h-32">
        {result ? (
          <div className="space-y-6">
            {/* แสดงชุดตัวเลขและเครื่องหมาย */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                ชุดโจทย์
              </h3>
              <div className="flex flex-wrap gap-3 justify-center p-4 bg-gray-50 rounded-lg">
                {result.elements.map((element, index) => (
                  <div
                    key={index}
                    className={`
                      relative px-4 py-3 rounded-lg text-xl font-bold
                      transform transition-all duration-200 hover:scale-105 hover:shadow-md
                      ${getElementStyle(element)}
                    `}
                    title={getElementTypeLabel(element)}
                  >
                    <div className="text-center">
                      {element}
                    </div>
                    <div className="absolute -top-2 -right-2 bg-white text-xs text-gray-500 px-1 rounded-full border text-center min-w-[20px]">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* แสดงตัวอย่างสมการ */}
            {result.sampleEquation && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  ตัวอย่างคำตอบ
                </h3>
                <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-2xl font-mono font-bold text-blue-800 mb-2">
                    {result.sampleEquation}
                  </p>
                  <p className="text-sm text-blue-600">
                    ✅ สมการที่ถูกต้องตามหลักคณิตศาสตร์
                  </p>
                </div>
              </div>
            )}
            
            {/* แสดงสถิติ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* จำนวนสมการที่พบ */}
              {result.possibleEquations && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                  <div className="text-2xl font-bold text-green-800">
                    {result.possibleEquations.length}
                  </div>
                  <div className="text-sm text-green-600">
                    สมการที่เป็นไปได้
                  </div>
                </div>
              )}
              
              {/* จำนวน tokens */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-800">
                  {result.elements.length}
                </div>
                <div className="text-sm text-blue-600">
                  ตัวเลขและเครื่องหมาย
                </div>
              </div>
              
              {/* ระดับความยาก */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
                <div className="text-2xl font-bold text-purple-800">
                  {result.elements.length <= 8 ? 'ง่าย' : 
                   result.elements.length <= 12 ? 'ปานกลาง' : 'ยาก'}
                </div>
                <div className="text-sm text-purple-600">
                  ระดับความยาก
                </div>
              </div>
            </div>
            
            {/* Legend สีต่าง ๆ */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                คำอธิบายสี
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>ตัวเลขเบา (0-9)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded"></div>
                  <span>ตัวเลขหนัก (10-20)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span>เครื่องหมายคำนวณ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                  <span>เครื่องหมายทางเลือก</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                  <span>เครื่องหมาย =</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>ไวลด์การ์ด ?</span>
                </div>
              </div>
            </div>
            
            {/* แสดงสมการเพิ่มเติม (ถ้ามี) */}
            {result.possibleEquations && result.possibleEquations.length > 1 && (
              <details className="space-y-2">
                <summary className="text-lg font-semibold text-gray-700 cursor-pointer hover:text-blue-600 border-b pb-2">
                  คำตอบอื่น ๆ ({result.possibleEquations.length - 1} สมการ) 👆 คลิกเพื่อดู
                </summary>
                <div className="grid gap-2 mt-4">
                  {result.possibleEquations.slice(1, 6).map((equation, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border font-mono text-center">
                      {equation}
                    </div>
                  ))}
                  {result.possibleEquations.length > 6 && (
                    <div className="text-center text-gray-500 text-sm">
                      และอีก {result.possibleEquations.length - 6} สมการ...
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-12">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold mb-2">เริ่มต้นสร้างโจทย์เอแม็ท</h3>
            <p className="mb-4">กดปุ่ม &quot;สร้างโจทย์&quot; เพื่อเริ่มต้น</p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-md mx-auto">
              <p className="text-sm text-blue-800 font-medium">
                💡 โจทย์บิงโกเอแม็ท
              </p>
              <p className="text-xs text-blue-600 mt-1">
                คือชุดตัวเลขและเครื่องหมายที่สามารถนำมาเรียงเป็นสมการที่ถูกต้องได้อย่างน้อย 1 สมการ ตามกฎของเอแม็ท
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}