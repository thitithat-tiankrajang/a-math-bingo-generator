import React, { useState } from 'react';
import Button from '../ui/Button';
import { jsPDF } from 'jspdf';

// Subtle CopyTextButton component
function CopyTextButton({ onClick, copied, disabled, label }: { onClick: () => void; copied: boolean; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-150 text-sm shadow-sm
        ${copied ? 'border-green-400 text-green-700 bg-green-50' : ''}
        disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><rect x="3" y="3" width="13" height="13" rx="2" /></svg>
          {label}
        </>
      )}
    </button>
  );
}

interface PrintTextAreaSectionProps {
  problemText: string;
  solutionText: string;
  fontLoaded: boolean;
  addThaiFont: (doc: jsPDF) => boolean;
  setSafeFont: (doc: jsPDF, style?: 'normal' | 'bold') => void;
}

export default function PrintTextAreaSection({ problemText, solutionText, fontLoaded, addThaiFont, setSafeFont }: PrintTextAreaSectionProps) {
  const [problemCopied, setProblemCopied] = useState(false);
  const [solutionCopied, setSolutionCopied] = useState(false);
  const [problemTitle, setProblemTitle] = useState('Equation Anagram Problems');
  const [solutionTitle, setSolutionTitle] = useState('Equation Anagram Solutions');
  const [problemFilename, setProblemFilename] = useState('EquationAnagramProblems.pdf');
  const [solutionFilename, setSolutionFilename] = useState('EquationAnagramSolutions.pdf');

  const handleCopyProblem = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(problemText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = problemText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setProblemCopied(true);
      setTimeout(() => setProblemCopied(false), 2000);
    } catch {
      setProblemCopied(false);
    }
  };

  const handleCopySolution = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(solutionText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = solutionText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setSolutionCopied(true);
      setTimeout(() => setSolutionCopied(false), 2000);
    } catch {
      setSolutionCopied(false);
    }
  };

  const handlePrintProblemPDF = () => {
    if (!fontLoaded) {
      alert('Please wait for the Thai font to load before generating the PDF.');
      return;
    }

    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });
    
    // Add Thai font
    const fontAdded = addThaiFont(doc);
    if (!fontAdded) {
      alert('Failed to load Thai font.');
      return;
    }
    
    const problemsPerPage = 10;
    const cellSize = 8; // even smaller cell
    const xOffset = 8; // margin
    const yStart = 48; // more space below the (now larger) title
    const yStep = 24; // more vertical space between answer and next problem

    const drawHeader = (doc: jsPDF, pageNum: number) => {
      const title = problemTitle || 'Equation Anagram Problems';
      // Title
      doc.setFontSize(24);
      setSafeFont(doc, 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(title, 105, 27, { align: 'center' });
      // Underline
      const titleWidth = doc.getTextWidth(title);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.3);
      doc.line(105 - titleWidth/2, 29, 105 + titleWidth/2, 29);
      // Page number
      doc.setFontSize(9);
      setSafeFont(doc, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${pageNum}`, 200, 10, { align: 'right' });
    };

    const lines = problemText.split('\n');
    let y = yStart;
    let problemCount = 0;
    let pageNum = 1;

    drawHeader(doc, pageNum);

    lines.forEach((line) => {
      if (problemCount > 0 && problemCount % problemsPerPage === 0) {
        doc.addPage();
        pageNum += 1;
        drawHeader(doc, pageNum);
        y = yStart;
      }

      const problemMatch = line.match(/^(\d+)\)\s*(.+)$/);
      if (problemMatch) {
        const problemNumber = problemMatch[1];
        const problemContent = problemMatch[2];

        // Problem number
        setSafeFont(doc, 'bold');
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(`${problemNumber})`, 12 + xOffset, y);
        
        // Problem content
        setSafeFont(doc, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const elements = problemContent.split(',').map(item => item.trim());
        const startX = 30 + xOffset;
        elements.forEach((element, elemIndex) => {
          const x = startX + (elemIndex * (cellSize + 1.5));
          // Draw box
          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(0.3);
          doc.rect(x, y - cellSize + 2, cellSize, cellSize);
          // Draw text in box
          setSafeFont(doc, 'bold');
          const fontSize = 18;
          doc.setFontSize(fontSize); // even larger number in the box
          const textWidth = doc.getTextWidth(element);
          // Center horizontally
          const textX = x + (cellSize - textWidth) / 2;
          // Center vertically: y - cellSize + 2 is the top, y is the bottom
          // jsPDF text is baseline, so we need to adjust for font size
          // Empirically, baseline offset ~0.3*fontSize
          const textY = y - cellSize/2 + 1;
          doc.text(element, textX, textY, { baseline: 'middle' });
        });

        // Answer line (longer and more space below)
        const underlineY = y + 14;
        const underlineStartX = 30 + xOffset;
        const underlineLength = 150;
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.2);
        doc.line(underlineStartX, underlineY, underlineStartX + underlineLength, underlineY);
        
        y += yStep;
        problemCount++;
      }
    });

    doc.save(problemFilename || 'EquationAnagramProblems.pdf');
  };

  const handlePrintSolutionPDF = () => {
    if (!fontLoaded) {
      alert('Please wait for the Thai font to load before generating the PDF.');
      return;
    }

    const doc = new jsPDF({ 
      unit: 'mm', 
      format: 'a4',
      orientation: 'portrait'
    });
    
    // Add Thai font
    const fontAdded = addThaiFont(doc);
    if (!fontAdded) {
      alert('Failed to load Thai font.');
      return;
    }
    
    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 15;
    const marginY = 20;
    const regionWidth = (pageWidth - marginX * 2) / 2;
    const regionHeight = (pageHeight - marginY * 2 - 15) / 2;
    const lines = solutionText.split('\n');
    const solutionsPerCol = 10;
    const colsPerRegion = 2;
    const solutionsPerRegion = solutionsPerCol * colsPerRegion; // 20
    const regionsPerPage = 4;
    const solutionsPerPage = solutionsPerRegion * regionsPerPage;
    const fontSize = 14;
    const lineSpacing = 11;
    const colSpacing = 40; // horizontal space between columns in region
    const headerY = marginY;
    const regionStartY = headerY + 15;
    let pageNum = 1;

    for (let i = 0; i < lines.length; i += solutionsPerPage) {
      // Header
      doc.setFontSize(18);
      setSafeFont(doc, 'bold');
      doc.setTextColor(60, 60, 60);
      const title = solutionTitle || 'Equation Anagram Solutions';
      doc.text(title, 105, headerY, { align: 'center' });
      
      // Page number
      doc.setFontSize(10);
      setSafeFont(doc, 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`Page ${pageNum}`, pageWidth - marginX, headerY, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      // Draw each region
      for (let region = 0; region < regionsPerPage; region++) {
        const regionRow = region % 2;
        const regionCol = Math.floor(region / 2);
        const regionX = marginX + regionCol * regionWidth;
        const regionY = regionStartY + regionRow * regionHeight;
        
        // Draw region border
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.rect(regionX, regionY, regionWidth, regionHeight);
        
        doc.setFontSize(fontSize);
        setSafeFont(doc, 'bold');
        // Custom region base index
        let base = 0;
        if (region === 0) base = 0;
        else if (region === 1) base = 10;
        else if (region === 2) base = 40;
        else if (region === 3) base = 50;
        // Draw solutions in region: 2 columns, 10 rows each, custom order
        for (let col = 0; col < colsPerRegion; col++) {
          for (let row = 0; row < solutionsPerCol; row++) {
            let idx = 0;
            if (col === 0) {
              idx = i + base + row;
            } else {
              idx = i + base + 20 + row;
            }
            if (idx >= lines.length) break;
            const y = regionY + 14 + row * lineSpacing;
            const x = regionX + 8 + col * colSpacing;
            const line = lines[idx];
            setSafeFont(doc, 'bold');
            doc.text(line, x, y);
          }
        }
      }
      
      if (i + solutionsPerPage < lines.length) {
        doc.addPage();
        pageNum++;
      }
    }
    
    doc.save(solutionFilename || 'EquationAnagramSolutions.pdf');
  };

  const printAsHTML = (content: string, title: string, type: 'problems' | 'solutions') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow new windows to open.');
      return;
    }
    const currentDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Sarabun', 'THSarabunNew', sans-serif; font-size: 16px; line-height: 1.6; color: #333; background: white; padding: 20mm; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4F46E5; padding-bottom: 15px; }
          .header h1 { font-size: 28px; font-weight: 700; color: #1F2937; margin-bottom: 5px; }
          .header .date { font-size: 14px; color: #6B7280; font-weight: 400; }
          .content { max-width: 100%; }
          .problem, .solution { margin: 25px 0; page-break-inside: avoid; padding: 15px; background: #F9FAFB; border-radius: 8px; border-left: 4px solid ${type === 'problems' ? '#3B82F6' : '#10B981'}; }
          .problem-number, .solution-number { font-weight: 700; font-size: 18px; color: #1F2937; display: inline-block; min-width: 60px; margin-bottom: 10px; }
          .problem-content, .solution-content { margin-left: 20px; display: inline-block; vertical-align: top; width: calc(100% - 80px); }
          .element-container { margin: 10px 0; }
          .element-box { display: inline-block; border: 2px solid #4B5563; min-width: 40px; height: 40px; text-align: center; line-height: 36px; margin: 0 5px; vertical-align: middle; background: white; border-radius: 4px; font-weight: 600; font-size: 14px; }
          .answer-section { margin-top: 15px; padding-top: 10px; border-top: 1px dashed #D1D5DB; }
          .answer-label { font-weight: 600; color: #6B7280; font-size: 14px; }
          .answer-line { border-bottom: 1px solid #9CA3AF; height: 25px; margin: 5px 0 15px 0; min-width: 200px; }
          .solution-text { font-size: 16px; font-weight: 600; color: #059669; margin-top: 5px; }
          @media print { body { padding: 15mm; font-size: 14px; } .header h1 { font-size: 24px; } .problem, .solution { page-break-inside: avoid; margin: 20px 0; padding: 10px; } .element-box { min-width: 35px; height: 35px; line-height: 31px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="date">${currentDate}</div>
        </div>
        <div class="content">
          ${formatContentForHTML(content, type)}
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const formatContentForHTML = (content: string, type: 'problems' | 'solutions'): string => {
    const lines = content.split('\n');
    let html = '';
    lines.forEach(line => {
      if (type === 'problems') {
        const problemMatch = line.match(/^(\d+)\)\s*(.+)$/);
        if (problemMatch) {
          const problemNumber = problemMatch[1];
          const problemContent = problemMatch[2];
          const elements = problemContent.split(',').map(item => item.trim());
          html += `
            <div class="problem">
              <div class="problem-number">Problem ${problemNumber})</div>
              <div class="problem-content">
                <div class="element-container">
                  ${elements.map(element => `<span class="element-box">${element}</span>`).join('')}
                </div>
                <div class="answer-section">
                  <div class="answer-label">Answer:</div>
                  <div class="answer-line"></div>
                </div>
              </div>
            </div>
          `;
        }
      } else {
        const solutionMatch = line.match(/^(\d+)\)\s*(.+)$/);
        if (solutionMatch) {
          const solutionNumber = solutionMatch[1];
          const solutionContent = solutionMatch[2];
          html += `
            <div class="solution">
              <div class="solution-number">Problem ${solutionNumber})</div>
              <div class="solution-content">
                <div class="solution-text">${solutionContent}</div>
              </div>
            </div>
          `;
        }
      }
    });
    return html;
  };

  return (
    <div className="space-y-6">
      {/* Split Text Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problems Section */}
        <div className="space-y-4">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Problems Title</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
              value={problemTitle}
              onChange={e => setProblemTitle(e.target.value)}
              placeholder="Equation Anagram Problems"
            />
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-2"></div>
              Problems
            </h4>
            <CopyTextButton
              onClick={handleCopyProblem}
              copied={problemCopied}
              disabled={problemCopied}
              label="Copy Text"
            />
          </div>
          <div className="relative">
            <textarea 
              className="w-full h-64 p-4 border border-gray-300 rounded-xl bg-gray-50 font-mono text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              value={problemText} 
              readOnly 
              placeholder="Problems will appear here..."
            />
            <div className="absolute top-3 right-3 text-xs text-gray-700 bg-white px-2 py-1 rounded-md border border-gray-300">
              {problemText.split('\n').length} problems
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Problems PDF Filename</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
              value={problemFilename}
              onChange={e => setProblemFilename(e.target.value)}
              placeholder="EquationAnagramProblems.pdf"
            />
          </div>
        </div>
        {/* Solutions Section */}
        <div className="space-y-4">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Solutions Title</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
              value={solutionTitle}
              onChange={e => setSolutionTitle(e.target.value)}
              placeholder="Equation Anagram Solutions"
            />
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-2"></div>
              Solutions
            </h4>
            <CopyTextButton
              onClick={handleCopySolution}
              copied={solutionCopied}
              disabled={solutionCopied}
              label="Copy Text"
            />
          </div>
          <div className="relative">
            <textarea 
              className="w-full h-64 p-4 border border-gray-300 rounded-xl bg-gray-50 font-mono text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" 
              value={solutionText} 
              readOnly 
              placeholder="Solutions will appear here..."
            />
            <div className="absolute top-3 right-3 text-xs text-gray-700 bg-white px-2 py-1 rounded-md border border-gray-300">
              {solutionText.split('\n').length} solutions
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Solutions PDF Filename</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-gray-400"
              value={solutionFilename}
              onChange={e => setSolutionFilename(e.target.value)}
              placeholder="EquationAnagramSolutions.pdf"
            />
          </div>
        </div>
      </div>
      {/* PDF/Print Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Button
          color="green"
          className="w-full"
          onClick={handlePrintProblemPDF}
          disabled={!fontLoaded}
          icon={
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        >
          Download Problems PDF
        </Button>
        <Button
          color="orange"
          className="w-full"
          onClick={handlePrintSolutionPDF}
          disabled={!fontLoaded}
          icon={
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        >
          Download Solutions PDF
        </Button>
      </div>
      {/* HTML Print Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Button
          color="green"
          className="w-full"
          onClick={() => printAsHTML(problemText, problemTitle, 'problems')}
        >
          Print Problems (HTML)
        </Button>
        <Button
          color="orange"
          className="w-full"
          onClick={() => printAsHTML(solutionText, solutionTitle, 'solutions')}
        >
          Print Solutions (HTML)
        </Button>
      </div>
    </div>
  );
} 