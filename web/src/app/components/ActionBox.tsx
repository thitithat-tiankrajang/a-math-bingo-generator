// src/components/ActionBox.tsx
interface ActionBoxProps {
    onGenerate: () => void;
    isGenerating: boolean;
  }
  
  export default function ActionBox({ onGenerate, isGenerating }: ActionBoxProps) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          การดำเนินการ
        </h2>
        
        <div className="space-y-4">
          {/* ปุ่มสร้างโจทย์ */}
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`
              w-full py-3 px-4 rounded-lg font-medium text-white text-lg
              transition-colors duration-200
              ${isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }
            `}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>กำลังสร้างโจทย์...</span>
              </div>
            ) : (
              'สร้างโจทย์'
            )}
          </button>
  
          {/* คำอธิบายเพิ่มเติม */}
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>โจทย์บิงโกเอแม็ท</strong> คือชุดตัวเลขและเครื่องหมายที่สามารถ
              นำมาเรียงเป็นสมการที่ถูกต้องได้อย่างน้อย 1 สมการ
            </p>
            <p className="text-xs text-gray-500">
              ตัวอย่าง: 1 2 3 4 5 + * = สามารถเรียงเป็น 4*2+5=13 ได้
            </p>
          </div>
        </div>
      </div>
    );
  }