// src/components/EquationAnagramGenerator.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { generateEquationAnagram } from "@/app/lib/equationAnagramLogic";
import type {
  EquationAnagramOptions,
  EquationAnagramResult,
} from "@/app/types/EquationAnagram";
import { jsPDF } from "jspdf";
import { CheckCircle, Lightbulb } from 'lucide-react';
import HeaderSection from "./HeaderSection";
import ConfigSection from "./ConfigSection";
import DisplaySection from "./DisplaySection";
import ActionSection from "./ActionSection";
import OptionSetConfig from "./OptionSetConfig";
import PrintTextAreaSection from "./PrintTextAreaSection";
import Button from "../ui/Button";
import type { OptionSet } from "../types/EquationAnagram";
import OptionSetsSummary from "./OptionSetsSummary";
import { useUndoRedo } from "@/app/contexts/UndoRedoContext";


interface EquationAnagramGeneratorProps {
  assignmentMode?: boolean;
  onSendAnswer?: (questionText: string, answerText: string) => Promise<void>;
  activeAssignment?: {
    id: string;
    studentProgress?: {
      answers?: Array<{
        questionNumber: number;
        questionText: string;
        answerText: string;
        answeredAt: string;
      }>;
      currentQuestionElements?: string[] | null;
    };
  } | null;
  // When in assignment mode, enforced options from current option set
  enforcedOptions?: EquationAnagramOptions;
  // Pre-generated elements to lock question (from backend persistence)
  presetElements?: string[] | null;
  // Callback to persist generated elements to backend if not present
  onPersistElements?: (elements: string[]) => void | Promise<void>;
}

export default function EquationAnagramGenerator({ 
  assignmentMode = false, 
  onSendAnswer,
  activeAssignment,
  enforcedOptions,
  presetElements: presetElementsProp,
  onPersistElements,
}: EquationAnagramGeneratorProps = {}) {
  const { setUndoRedoHandler, clearUndoRedoHandler } = useUndoRedo();
  
  // Main page state (for DisplayBox only)
  const defaultOptions: EquationAnagramOptions = useMemo(() => ({
    totalCount: 8,
    operatorMode: "random",
    operatorCount: 2,
    equalsCount: 1,
    heavyNumberCount: 0,
    BlankCount: 0,
    zeroCount: 0,
    operatorFixed: {
      '+': null,
      '-': null,
      '×': null,
      '÷': null,
      '+/-': null,
      '×/÷': null
    }
  }), []);

  // Hydration guard
  const [hydrated, setHydrated] = useState(false);
  const [options, setOptions] = useState<EquationAnagramOptions>({
    ...defaultOptions,
  });
  const [numQuestions, setNumQuestions] = useState<number>(1);
  const [optionSets, setOptionSets] = useState<OptionSet[]>([
    { options: { ...defaultOptions }, numQuestions: 3 },
  ]);
  const [results, setResults] = useState<EquationAnagramResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  // Undo/Redo stacks
  const [history, setHistory] = useState<{results: EquationAnagramResult[], currentIndex: number}[]>([]);
  const [future, setFuture] = useState<{results: EquationAnagramResult[], currentIndex: number}[]>([]);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [printText, setPrintText] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [showSolution, setShowSolution] = useState(true);
  const [showExampleSolution, setShowExampleSolution] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  
  // Assignment mode states
  const [assignmentQuestion, setAssignmentQuestion] = useState<string>('');
  const [assignmentAnswer, setAssignmentAnswer] = useState<string>('');
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);
  const [lastValidEquation, setLastValidEquation] = useState<string>('');
  const [lastSubmissionAt, setLastSubmissionAt] = useState<number>(0);
  const [presetElements, setPresetElements] = useState<string[] | null>(null);

  // Undo: restore previous state from history
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture(f => [{ results: [...results], currentIndex }, ...f]);
    setResults(prev.results);
    setCurrentIndex(prev.currentIndex);
    setHistory(h => h.slice(0, h.length - 1));
  }, [history, results, currentIndex]);

  // Redo: restore next state from future
  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(h => [...h, { results: [...results], currentIndex }]);
    setResults(next.results);
    setCurrentIndex(next.currentIndex);
    setFuture(f => f.slice(1));
  }, [future, results, currentIndex]);

  // Set up undo/redo handlers
  useEffect(() => {
    setUndoRedoHandler(
      handleUndo,
      handleRedo,
      history.length > 0,
      future.length > 0
    );

    // Cleanup on unmount
    return () => {
      clearUndoRedoHandler();
    };
  }, [history.length, future.length, setUndoRedoHandler, clearUndoRedoHandler, handleUndo, handleRedo]);

  // Load Thai font on component mount
  useEffect(() => {
    const loadThaiFont = async () => {
      try {
        const response = await fetch("/font/THSarabunNew.ttf");
        const fontArrayBuffer = await response.arrayBuffer();
        const fontBase64 = arrayBufferToBase64(fontArrayBuffer);

        // Store font in global variable for later use
        (window as unknown as { thaiFont?: string }).thaiFont = fontBase64;
        setFontLoaded(true);
      } catch (error) {
        alert(error);
        setFontLoaded(false);
      }
    };

    loadThaiFont();
  }, []);

  // Restore from sessionStorage (client only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedOptions = window.sessionStorage.getItem("bingo_options");
      if (storedOptions) {
        try {
          setOptions(JSON.parse(storedOptions));
        } catch {}
      }
      const storedNumQuestions = window.sessionStorage.getItem(
        "bingo_num_questions"
      );
      if (storedNumQuestions) {
        const n = parseInt(storedNumQuestions, 10);
        if (!isNaN(n) && n > 0 && n <= 100) setNumQuestions(n);
      }
      const storedOptionSets =
        window.sessionStorage.getItem("bingo_option_sets");
      if (storedOptionSets) {
        try {
          setOptionSets(JSON.parse(storedOptionSets));
        } catch {}
      }
      setHydrated(true);
    }
  }, []);

  // --- sessionStorage Save ---
  useEffect(() => {
    if (typeof window !== "undefined" && hydrated) {
      window.sessionStorage.setItem("bingo_options", JSON.stringify(options));
    }
  }, [options, hydrated]);
  useEffect(() => {
    if (typeof window !== "undefined" && hydrated) {
      window.sessionStorage.setItem(
        "bingo_num_questions",
        numQuestions.toString()
      );
    }
  }, [numQuestions, hydrated]);
  useEffect(() => {
    if (typeof window !== "undefined" && hydrated) {
      window.sessionStorage.setItem(
        "bingo_option_sets",
        JSON.stringify(optionSets)
      );
    }
  }, [optionSets, hydrated]);

  // In assignment mode, sync preset elements from props or activeAssignment if available
  useEffect(() => {
    if (!assignmentMode) return;
    if (presetElementsProp && presetElementsProp.length > 0) {
      setPresetElements(presetElementsProp);
      return;
    }
    if (activeAssignment?.studentProgress?.currentQuestionElements) {
      setPresetElements(activeAssignment.studentProgress.currentQuestionElements);
    }
  }, [assignmentMode, presetElementsProp, activeAssignment?.studentProgress?.currentQuestionElements]);

  // In assignment mode, use enforcedOptions to generate a single problem and regenerate after each submission
  useEffect(() => {
    const generateForAssignment = async () => {
      if (!assignmentMode) return;
      if (!enforcedOptions) return;
      setIsGenerating(true);
      try {
        // Merge with defaults to ensure all required fields are present
        const mergedOptions: EquationAnagramOptions = {
          ...defaultOptions,
          ...enforcedOptions,
          operatorFixed: {
            '+': null,
            '-': null,
            '×': null,
            '÷': null,
            '+/-': null,
            '×/÷': null,
            ...(enforcedOptions.operatorFixed || {})
          }
        };
        if (presetElements && presetElements.length > 0) {
          // Use preset elements from backend persistence, but compute solutions so ExampleSolution can show in assignment mode
          try {
            const { findAllPossibleEquations } = await import('@/app/lib/equationAnagramLogic');
            const equations = findAllPossibleEquations(presetElements as unknown as string[]);
            setResults([{ 
              elements: presetElements, 
              sampleEquation: equations[0] || '', 
              possibleEquations: equations 
            }]);
          } catch {
            setResults([{ elements: presetElements, sampleEquation: '', possibleEquations: [] }]);
          }
        } else {
          const generated = await generateEquationAnagram(mergedOptions);
          setResults([generated]);
          // Persist to backend so refresh won't change
          if (onPersistElements) {
            try {
              await onPersistElements(generated.elements as unknown as string[]);
            } catch (e) {
              console.error('Persist current elements failed:', e);
              // Continue without persistence - not critical
            }
          }
          setPresetElements(generated.elements as unknown as string[]);
        }
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error generating assignment problem:', error);
      } finally {
        setIsGenerating(false);
      }
    };
    
    // Only trigger generation if we're in assignment mode AND have enforced options
    if (assignmentMode && enforcedOptions) {
      generateForAssignment();
    }
  }, [assignmentMode, enforcedOptions, lastSubmissionAt, defaultOptions, presetElements, onPersistElements]);

  // Helper function to convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Function to add Thai font to jsPDF
  const addThaiFont = (doc: jsPDF) => {
    try {
      const fontBase64 = (window as unknown as { thaiFont?: string }).thaiFont;
      if (fontBase64) {
        doc.addFileToVFS("THSarabunNew.ttf", fontBase64);
        doc.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
        doc.addFont("THSarabunNew.ttf", "THSarabunNew", "bold");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding Thai font:", error);
      return false;
    }
  };

  // Safe font setting function
  const setSafeFont = (doc: jsPDF, style: "normal" | "bold" = "normal") => {
    try {
      doc.setFont("THSarabunNew", style);
    } catch {
      // Fallback to helvetica if Thai font fails
      doc.setFont("helvetica", style === "bold" ? "bold" : "normal");
    }
  };

  // Event handlers
  const handleShowSolutionChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setShowSolution(e.target.checked);
  const handleShowExampleSolutionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setShowExampleSolution(e.target.checked);

  // Handlers for main page
  const handleNumQuestionsChange = (value: string) => {
    let num = parseInt(value, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > 100) num = 100;
    setNumQuestions(num);
  };

  // Handlers for popup optionSets
  const handleAddOptionSet = () => {
    setOptionSets((prev) => [
      ...prev,
      { options: { ...defaultOptions }, numQuestions: 3 },
    ]);
  };
  const handleRemoveOptionSet = (idx: number) => {
    setOptionSets((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
    );
  };

  // Generate multiple problems and store in results (main page)
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Save current state to history before generating new
      if (results.length > 0) {
        setHistory(prev => [...prev, { results: [...results], currentIndex }]);
        setFuture([]); // Clear redo stack on new generate
      }
      const generatedResults: EquationAnagramResult[] = [];
      for (let i = 0; i < numQuestions; i++) {
        const generated = await generateEquationAnagram(options);
        generatedResults.push(generated);
      }
      setResults(generatedResults);
      setCurrentIndex(0);
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // For print/textarea (all problems, use optionSets from popup)
  const handlePrintText = async () => {
    setIsGenerating(true);
    try {
      const problemLines: string[] = [];
      const solutionLines: string[] = [];
      let globalIndex = 1;
      for (let setIdx = 0; setIdx < optionSets.length; setIdx++) {
        const set = optionSets[setIdx];
        const genOptions = { ...set.options };
        // ไม่ต้องใช้ completeOperatorCounts เพราะเราใช้ operatorFixed แล้ว
        for (let i = 0; i < set.numQuestions; i++) {
          const generated = await generateEquationAnagram(genOptions);
          problemLines.push(`${globalIndex}) ${generated.elements.join(", ")}`);
          solutionLines.push(
            showSolution
              ? `${globalIndex}) ${generated.sampleEquation || "-"}`
              : `${globalIndex}) -`
          );
          globalIndex++;
        }
      }
      setPrintText(problemLines.join("\n"));
      setSolutionText(solutionLines.join("\n"));
      setShowOptionModal(true);
    } catch (error) {
      alert(
        "Error: " + (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShowOptionModal = () => {
    setPrintText("");
    setSolutionText("");
    setShowOptionModal(true);
  };

  const handleCloseOptionModal = () => {
    setShowOptionModal(false);
  };

  // Handle assignment answer submission
  const handleSendAssignmentAnswer = async () => {
    if (!onSendAnswer || !assignmentQuestion.trim() || !assignmentAnswer.trim()) return;
    
    try {
      setSubmittingAnswer(true);
      await onSendAnswer(assignmentQuestion.trim(), assignmentAnswer.trim());
      
      // Clear form after successful submission
      setAssignmentQuestion('');
      setAssignmentAnswer('');
      setLastValidEquation('');
    } catch (error) {
      console.error('Error sending assignment answer:', error);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Handle valid equation from DisplayBox in assignment mode
  const handleValidEquation = async (equation: string) => {
    if (!assignmentMode) return;
    setLastValidEquation(equation);
    setAssignmentAnswer(equation);

    // Auto-submit when equation is valid
    if (!onSendAnswer) return;
    if (submittingAnswer) return;
    try {
      setSubmittingAnswer(true);
      const current = results[currentIndex];
      const questionText = current ? current.elements.join(", ") : `Equation`;
      await onSendAnswer(questionText, equation);
      // Trigger regeneration for next problem
      setLastSubmissionAt(Date.now());
      // Auto-exit handled in play/page after refresh; no type-safe access needed here
    } catch (error) {
      console.error('Auto submit answer failed:', error);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeaderSection />
        <div className="space-y-6">
          <DisplaySection
            results={results}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={history.length > 0}
            canRedo={future.length > 0}
            assignmentMode={assignmentMode}
            onValidEquation={handleValidEquation}
            activeAssignment={activeAssignment}
            onSubmitAnswer={onSendAnswer}
          />
          {!assignmentMode && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-3">
                <ConfigSection
                  options={options}
                  setOptions={setOptions}
                  numQuestions={numQuestions}
                  setNumQuestions={setNumQuestions}
                />
              </div>
              <div className="xl:col-span-2">
                <ActionSection
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  options={options}
                  numQuestions={numQuestions.toString()}
                  onNumQuestionsChange={(e) =>
                    handleNumQuestionsChange(e.target.value)
                  }
                  onNumQuestionsBlur={() => {}}
                  onShowOptionModal={handleShowOptionModal}
                  onPrintText={handlePrintText}
                  showSolution={showSolution}
                  onShowSolutionChange={handleShowSolutionChange}
                  showExampleSolution={showExampleSolution}
                  onShowExampleSolutionChange={handleShowExampleSolutionChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Enhanced Modal */}
      {!assignmentMode && showOptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseOptionModal}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="text-xl font-semibold text-gray-900">
                Print Settings & Configuration
              </h3>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800"
                onClick={handleCloseOptionModal}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {/* Enhanced Summary */}
              <OptionSetsSummary optionSets={optionSets} />

              {/* Enhanced OptionSetConfig components */}
              <OptionSetConfig
                options={optionSets[0].options}
                onOptionsChange={(opts) => {
                  setOptionSets((prev) =>
                    prev.map((set, i) =>
                      i === 0 ? { ...set, options: opts } : set
                    )
                  );
                }}
                numQuestions={optionSets[0].numQuestions}
                onNumQuestionsChange={(num) => {
                  setOptionSets((prev) =>
                    prev.map((set, i) =>
                      i === 0 ? { ...set, numQuestions: num } : set
                    )
                  );
                }}
                setLabel="Set 1"
                setIndex={0}
              />

              {optionSets.slice(1).map((set, idx) => (
                <OptionSetConfig
                  key={idx + 1}
                  options={set.options}
                  onOptionsChange={(opts) =>
                    setOptionSets((prev) =>
                      prev.map((s, i) =>
                        i === idx + 1 ? { ...s, options: opts } : s
                      )
                    )
                  }
                  numQuestions={set.numQuestions}
                  onNumQuestionsChange={(num) =>
                    setOptionSets((prev) =>
                      prev.map((s, i) =>
                        i === idx + 1 ? { ...s, numQuestions: num } : s
                      )
                    )
                  }
                  onRemove={
                    optionSets.length > 1
                      ? () => handleRemoveOptionSet(idx + 1)
                      : undefined
                  }
                  setLabel={`Set ${idx + 2}`}
                  setIndex={idx + 1}
                />
              ))}
              <Button
                color="white"
                className="mt-2"
                onClick={handleAddOptionSet}
              >
                + Add Option Set
              </Button>
              {/* Reset Options Button */}
              <Button
                color="white"
                className="mt-4 border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                onClick={() => {
                  // Clear all relevant sessionStorage keys
                  window.sessionStorage.removeItem("bingo_options");
                  window.sessionStorage.removeItem("bingo_num_questions");
                  window.sessionStorage.removeItem("bingo_option_sets");
                  // Remove all bingo_option_set_show_X keys
                  Object.keys(window.sessionStorage).forEach((key) => {
                    if (key.startsWith("bingo_option_set_show_")) {
                      window.sessionStorage.removeItem(key);
                    }
                  });
                  window.location.reload();
                }}
              >
                Reset Options
              </Button>
              {/* Include Solutions toggle and Print Text Output button */}
              <div className="mb-6 mt-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        id="showSolution"
                        type="checkbox"
                        checked={showSolution}
                        onChange={handleShowSolutionChange}
                        className="sr-only"
                      />
                      <label
                        htmlFor="showSolution"
                        className={`flex items-center justify-center w-12 h-6 rounded-full cursor-pointer transition-all duration-200 ${
                          showSolution ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            showSolution ? "translate-x-3" : "-translate-x-3"
                          }`}
                        ></div>
                      </label>
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="showSolution"
                        className="text-sm font-medium text-blue-900 cursor-pointer select-none"
                      >
                        Include Solutions in Text Output
                      </label>
                      <p className="text-xs text-blue-700 mt-1">
                        When enabled, solutions will be generated alongside
                        problems
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  color="orange"
                  className="w-full mb-2"
                  onClick={handlePrintText}
                  disabled={isGenerating}
                  loading={isGenerating}
                  loadingText="Generating..."
                  icon={
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  }
                >
                  Generate Text Output
                </Button>
                
                {/* Assignment Send Answer Button */}
                {assignmentMode && (
                  <Button
                    onClick={handleSendAssignmentAnswer}
                    disabled={!assignmentQuestion.trim() || !assignmentAnswer.trim() || submittingAnswer}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50"
                    icon={
                      submittingAnswer ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      )
                    }
                  >
                    {submittingAnswer ? 'Sending...' : 'Send Answer to Assignment'}
                  </Button>
                )}
              </div>
              {/* PrintTextAreaSection (SplitTextAreas) */}
              {printText ? (
                <PrintTextAreaSection
                  problemText={printText}
                  solutionText={solutionText}
                  fontLoaded={fontLoaded}
                  addThaiFont={addThaiFont}
                  setSafeFont={setSafeFont}
                />
              ) : (
                <div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> These are your current settings for
                      PDF/text generation. You can modify them here without
                      affecting the main page configuration.
                    </p>
                  </div>
                </div>
              )}

              {/* Assignment Answer Form */}
              {assignmentMode && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Assignment Answer Form</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="assignmentQuestion" className="block text-sm font-medium text-green-800 mb-2">
                        Question/Problem Statement
                      </label>
                      <textarea
                        id="assignmentQuestion"
                        value={assignmentQuestion}
                        onChange={(e) => setAssignmentQuestion(e.target.value)}
                        placeholder="Enter the math problem or question you want to submit..."
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label htmlFor="assignmentAnswer" className="block text-sm font-medium text-green-800 mb-2">
                        Your Answer/Solution
                      </label>
                      <textarea
                        id="assignmentAnswer"
                        value={assignmentAnswer}
                        onChange={(e) => setAssignmentAnswer(e.target.value)}
                        placeholder="Enter your answer or solution here..."
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                        rows={4}
                      />
                      {lastValidEquation && (
                        <div className="mt-2 text-sm text-green-600">
                          <CheckCircle size={16} className="inline mr-1" />
                          Valid equation detected: <span className="font-mono font-bold">{lastValidEquation}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-green-700">
                      <Lightbulb size={16} className="inline mr-1" />
                      Tip: You can use the equation generator above to create problems, then copy/paste them into this form.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
