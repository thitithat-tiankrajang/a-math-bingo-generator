// src/components/EquationAnagramGenerator.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { generateEquationAnagram, AMATH_TOKENS } from "@/app/lib/equationAnagramLogic";
import type {
  EquationAnagramOptions,
  EquationAnagramResult,
} from "@/app/types/EquationAnagram";
import { jsPDF } from "jspdf";
import { CheckCircle, Lightbulb } from "lucide-react";
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
import TokenCountConfigPanel from "./TokenCountConfigPanel";
import type { AmathToken, AmathTokenInfo } from "../types/EquationAnagram";
import type { LockedPos } from "@/app/lib/assignmentService";

interface EquationAnagramGeneratorProps {
  assignmentMode?: boolean;

  onSendAnswer?: (
    questionText: string,
    answerText: string,
    listPosLock?: LockedPos[] | null
  ) => Promise<void>;

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

  enforcedOptions?: EquationAnagramOptions;

  // Pre-generated elements to lock question (from backend persistence)
  presetElements?: string[] | null;

  presetSolutionTokens?: string[] | null;

  presetListPosLock?: LockedPos[] | null;

  onPersistElements?: (
    elements: string[],
    listPosLock?: LockedPos[] | null,
    solutionTokens?: string[] | null
  ) => void | Promise<void>;
}

type EquationAnagramResultWithLock = EquationAnagramResult & {
  listPosLock?: LockedPos[] | null;
};

function extractListPosLock(x: unknown): LockedPos[] | null {
  if (!x || typeof x !== "object") return null;
  const maybe = (x as { listPosLock?: unknown }).listPosLock;
  if (!Array.isArray(maybe)) return null;

  const ok = maybe.every((it) => {
    if (!it || typeof it !== "object") return false;
    const obj = it as Record<string, unknown>;
    return typeof obj.pos === "number" && "value" in obj;
  });

  return ok ? (maybe as LockedPos[]) : null;
}

export default function EquationAnagramGenerator({
  assignmentMode = false,
  onSendAnswer,
  activeAssignment,
  enforcedOptions,
  presetElements: presetElementsProp,
  presetSolutionTokens: presetSolutionTokensProp,
  presetListPosLock: presetListPosLockProp,
  onPersistElements,
}: EquationAnagramGeneratorProps = {}) {
  const { setUndoRedoHandler, clearUndoRedoHandler } = useUndoRedo();

  // Main page state (for DisplayBox only)
  const defaultOptions: EquationAnagramOptions = useMemo(
    () => ({
      totalCount: 8,
      operatorMode: "random",
      operatorCount: 2,
      equalsCount: 1,
      heavyNumberCount: 0,
      BlankCount: 0,
      zeroCount: 0,
      lockMode: false,
      lockCount: 0,
      operatorFixed: {
        "+": null,
        "-": null,
        "×": null,
        "÷": null,
        "+/-": null,
        "×/÷": null,
      },
    }),
    []
  );

  // Hydration guard
  const [hydrated, setHydrated] = useState(false);
  const [options, setOptions] = useState<EquationAnagramOptions>({
    ...defaultOptions,
  });
  const [numQuestions, setNumQuestions] = useState<number>(1);
  const [optionSets, setOptionSets] = useState<OptionSet[]>([
    { options: { ...defaultOptions }, numQuestions: 3 },
  ]);
  const [results, setResults] = useState<EquationAnagramResultWithLock[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Undo/Redo stacks
  const [history, setHistory] = useState<
    { results: EquationAnagramResultWithLock[]; currentIndex: number }[]
  >([]);
  const [future, setFuture] = useState<
    { results: EquationAnagramResultWithLock[]; currentIndex: number }[]
  >([]);

  const [showOptionModal, setShowOptionModal] = useState(false);
  const [printText, setPrintText] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [showSolution, setShowSolution] = useState(true);
  const [showExampleSolution, setShowExampleSolution] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);

  // Assignment mode states
  const [assignmentQuestion, setAssignmentQuestion] = useState<string>("");
  const [assignmentAnswer, setAssignmentAnswer] = useState<string>("");
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);
  const [lastValidEquation, setLastValidEquation] = useState<string>("");
  const [lastSubmissionAt, setLastSubmissionAt] = useState<number>(0);
  const [presetElements, setPresetElements] = useState<string[] | null>(null);

  // ✅ lock positions for current question
  const [currentListPosLock, setCurrentListPosLock] =
    useState<LockedPos[] | null>(null);

  // ---- Tile Token Count State ----
  const getDefaultTokenCounts = () => {
    const obj = {} as Record<AmathToken, number>;
    (Object.entries(AMATH_TOKENS) as [AmathToken, AmathTokenInfo][]).forEach(
      ([token, info]) => {
        obj[token] = info.count;
      }
    );
    return obj;
  };
  const [tokenCounts, setTokenCounts] = useState<Record<AmathToken, number>>(
    getDefaultTokenCounts()
  );
  const handleResetTokenCounts = () => setTokenCounts(getDefaultTokenCounts());

  // Undo: restore previous state from history
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [{ results: [...results], currentIndex }, ...f]);
    setResults(prev.results);
    setCurrentIndex(prev.currentIndex);
    setHistory((h) => h.slice(0, h.length - 1));
  }, [history, results, currentIndex]);

  // Redo: restore next state from future
  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, { results: [...results], currentIndex }]);
    setResults(next.results);
    setCurrentIndex(next.currentIndex);
    setFuture((f) => f.slice(1));
  }, [future, results, currentIndex]);

  // Set up undo/redo handlers
  useEffect(() => {
    setUndoRedoHandler(handleUndo, handleRedo, history.length > 0, future.length > 0);

    return () => {
      clearUndoRedoHandler();
    };
  }, [
    history.length,
    future.length,
    setUndoRedoHandler,
    clearUndoRedoHandler,
    handleUndo,
    handleRedo,
  ]);

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

  // Load Thai font on component mount
  useEffect(() => {
    const loadThaiFont = async () => {
      try {
        const response = await fetch("/font/THSarabunNew.ttf");
        const fontArrayBuffer = await response.arrayBuffer();
        const fontBase64 = arrayBufferToBase64(fontArrayBuffer);

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
      const storedNumQuestions = window.sessionStorage.getItem("bingo_num_questions");
      if (storedNumQuestions) {
        const n = parseInt(storedNumQuestions, 10);
        if (!isNaN(n) && n > 0 && n <= 100) setNumQuestions(n);
      }
      const storedOptionSets = window.sessionStorage.getItem("bingo_option_sets");
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
      window.sessionStorage.setItem("bingo_num_questions", numQuestions.toString());
    }
  }, [numQuestions, hydrated]);

  useEffect(() => {
    if (typeof window !== "undefined" && hydrated) {
      window.sessionStorage.setItem("bingo_option_sets", JSON.stringify(optionSets));
    }
  }, [optionSets, hydrated]);

  // ✅ sync preset elements + lock positions from props in assignment mode
  useEffect(() => {
    if (!assignmentMode) return;

    // ✅ Only update if values actually changed (prevent unnecessary re-renders)
    const currentElementsKey = presetElementsProp?.join(',') || '';
    const storedElementsKey = presetElements?.join(',') || '';
    
    if (presetElementsProp && presetElementsProp.length > 0) {
      if (currentElementsKey !== storedElementsKey) {
        setPresetElements(presetElementsProp);
      }
    } else if (activeAssignment?.studentProgress?.currentQuestionElements) {
      const dbElementsKey = activeAssignment.studentProgress.currentQuestionElements.join(',');
      if (dbElementsKey !== storedElementsKey) {
        setPresetElements(activeAssignment.studentProgress.currentQuestionElements);
      }
    }

    // ✅ Only update lock positions if they actually changed
    const currentLockPosKey = presetListPosLockProp 
      ? JSON.stringify(presetListPosLockProp.sort((a, b) => a.pos - b.pos))
      : null;
    const storedLockPosKey = currentListPosLock
      ? JSON.stringify(currentListPosLock.sort((a, b) => a.pos - b.pos))
      : null;
    
    if (presetListPosLockProp && presetListPosLockProp.length > 0) {
      if (currentLockPosKey !== storedLockPosKey) {
        setCurrentListPosLock(presetListPosLockProp);
      }
    }
  }, [
    assignmentMode,
    presetElementsProp,
    presetListPosLockProp,
    activeAssignment?.studentProgress?.currentQuestionElements,
    presetElements,
    currentListPosLock,
  ]);

  // ✅ Track if we've already persisted to prevent infinite loops
  const hasPersistedRef = useRef(false);
  const persistedElementsRef = useRef<string | null>(null);
  const persistedLockPosRef = useRef<string | null>(null);
  const lastSubmissionRef = useRef<number | null>(null);
  const lastPresetElementsRef = useRef<string | null>(null);
  const isGeneratingRef = useRef(false); // ✅ Prevent multiple simultaneous generations
  const lastGeneratedKeyRef = useRef<string | null>(null); // ✅ Track what we've already generated

  useEffect(() => {
    if (lastSubmissionAt !== lastSubmissionRef.current) {
      hasPersistedRef.current = false;
      persistedElementsRef.current = null;
      persistedLockPosRef.current = null;
      lastPresetElementsRef.current = null;
      lastSubmissionRef.current = lastSubmissionAt;
      lastGeneratedKeyRef.current = null; // ✅ Reset generation key on new submission
    }
  }, [lastSubmissionAt]);

  // In assignment mode, use enforcedOptions to generate a single problem and regenerate after each submission
  // ---- DB Trust Guard ----
  // เราจะเชื่อ DB (ไม่ generate/set อะไรใหม่) ถ้ามีครบ 3 อย่าง (elements, solutionTokens, lock)
  const isTrustedDb = !!(
    presetElementsProp && presetElementsProp.length > 0 &&
    presetSolutionTokensProp && presetSolutionTokensProp.length > 0 &&
    presetListPosLockProp && presetListPosLockProp.length > 0
  );

  useEffect(() => {
    // ----- TRUST DB PATH -----
    if (assignmentMode && isTrustedDb) {
      setResults([
        {
          elements: presetElementsProp,
          solutionTokens: presetSolutionTokensProp,
          lockPositions: presetListPosLockProp.map(lp => lp.pos),
          listPosLock: presetListPosLockProp,
          sampleEquation: '',
          possibleEquations: [],
        }
      ]);
      setCurrentListPosLock(presetListPosLockProp);
      return;
    }
    // ---- NORMAL GENERATE PATH ----

    const generateForAssignment = async () => {
      if (!assignmentMode) return;
      if (!enforcedOptions) return;
      
      // ✅ Prevent multiple simultaneous generations
      if (isGeneratingRef.current) {
        console.log('⏸️ Generation already in progress, skipping...');
        return;
      }

      setIsGenerating(true);
      isGeneratingRef.current = true;
      try {
        const eo = enforcedOptions as unknown as Record<string, unknown>;

        const normalizedLockMode =
          (eo.lockMode as boolean | undefined) ??
          (eo.isLockPos as boolean | undefined) ??
          false;

        const totalCount = Number(enforcedOptions.totalCount ?? eo.totalCount ?? 8);

        const rawLockCount =
          (eo.lockCount as number | undefined) ??
          (eo.posLockCount as number | undefined) ??
          (eo.lockPosCount as number | undefined) ??
          undefined;

        const normalizedLockCount = normalizedLockMode
          ? Math.max(0, totalCount - 8)
          : (rawLockCount ?? 0);

        const mergedOptions: EquationAnagramOptions = {
          ...defaultOptions,
          ...enforcedOptions,
          lockMode: normalizedLockMode,
          lockCount: normalizedLockCount,
          totalCount,
          operatorFixed: {
            "+": null,
            "-": null,
            "×": null,
            "÷": null,
            "+/-": null,
            "×/÷": null,
            ...(enforcedOptions.operatorFixed || {}),
          },
        };

        // ✅ CASE A: use preset elements (from backend), also keep lock positions
        // ✅ IMPORTANT: ถ้ามีข้อมูลใน DB แล้ว (presetElements, presetSolutionTokens, presetListPosLock) 
        // ให้ใช้ข้อมูลเดิม ไม่ต้อง generate ใหม่
        if (presetElements && presetElements.length > 0) {
          // ✅ Create a unique key for this preset to prevent duplicate generation
          const presetKey = JSON.stringify({
            elements: presetElements.join(','),
            solutionTokens: presetSolutionTokensProp?.join(',') || '',
            lockPos: presetListPosLockProp ? JSON.stringify(presetListPosLockProp.sort((a, b) => a.pos - b.pos)) : ''
          });
          
          // ✅ Skip if we've already generated this exact preset
          if (lastGeneratedKeyRef.current === presetKey) {
            console.log('✅ Already generated this preset, skipping...');
            setIsGenerating(false);
            isGeneratingRef.current = false;
            return;
          }
          
          lastGeneratedKeyRef.current = presetKey;
          
          const lockPosToUse = currentListPosLock ?? presetListPosLockProp ?? null;

          let allElements = presetElements as unknown as string[];
          if (lockPosToUse && lockPosToUse.length > 0) {
            try {
              const { findAllPossibleEquations } = await import("@/app/lib/equationAnagramLogic");
              const { tokenizeExpression } = await import("@/app/lib/expressionUtil");

              const lockedValues = lockPosToUse.map((lp) => lp.value);
              const combinedForEquation = [
                ...(presetElements as unknown as string[]),
                ...lockedValues,
              ];
              const equations = findAllPossibleEquations(combinedForEquation);

              if (equations.length > 0) {
                const tokens = tokenizeExpression(equations[0]);
                if (tokens && tokens.length > 0) {
                  allElements = tokens;
                }
              }
            } catch (e) {
              console.error("Error extracting listPosLock:", e);
              const lockedValues = lockPosToUse.map((lp) => lp.value);
              allElements = [
                ...(presetElements as unknown as string[]),
                ...lockedValues,
              ];
            }
          }

          const rackElementsKey = presetElements.join(",");
          const lockPosKey = lockPosToUse
            ? JSON.stringify(lockPosToUse.sort((a, b) => a.pos - b.pos))
            : "null";

          const hasPresetLockPos =
            presetListPosLockProp && presetListPosLockProp.length > 0;
          const presetLockPosKey = hasPresetLockPos
            ? JSON.stringify(presetListPosLockProp.sort((a, b) => a.pos - b.pos))
            : "null";
          const lockPosAlreadyInDB = hasPresetLockPos && presetLockPosKey === lockPosKey;

          const elementsAlreadyInDB = persistedElementsRef.current === rackElementsKey;
          const dataAlreadyInDB =
            elementsAlreadyInDB &&
            (lockPosAlreadyInDB || !lockPosToUse || lockPosToUse.length === 0);

          if (dataAlreadyInDB) {
            hasPersistedRef.current = true;
            persistedElementsRef.current = rackElementsKey;
            persistedLockPosRef.current = lockPosKey;
            lastPresetElementsRef.current = rackElementsKey;
          }

          const presetElementsChanged = lastPresetElementsRef.current !== rackElementsKey;

          const shouldPersistElements =
            !dataAlreadyInDB &&
            (presetElementsChanged ||
              !hasPersistedRef.current ||
              persistedElementsRef.current !== rackElementsKey);

          const shouldPersistLockPos =
            !dataAlreadyInDB &&
            lockPosToUse &&
            lockPosToUse.length > 0 &&
            !lockPosAlreadyInDB &&
            (presetElementsChanged ||
              presetLockPosKey !== lockPosKey ||
              persistedLockPosRef.current === null ||
              persistedLockPosRef.current !== lockPosKey ||
              !hasPersistedRef.current ||
              persistedElementsRef.current !== rackElementsKey ||
              (hasPersistedRef.current &&
                persistedElementsRef.current === rackElementsKey &&
                persistedLockPosRef.current === null));

          const shouldPersist = shouldPersistElements || shouldPersistLockPos;

          try {
            const { findAllPossibleEquations } = await import("@/app/lib/equationAnagramLogic");
            const equations = findAllPossibleEquations(allElements as unknown as string[]);

            // ✅ ใช้ presetSolutionTokens ถ้ามี (จาก DB) ไม่งั้น generate ใหม่
            let solutionTokens: string[] | undefined = presetSolutionTokensProp && presetSolutionTokensProp.length > 0
              ? presetSolutionTokensProp
              : undefined;
            
            if (!solutionTokens) {
              if (equations.length > 0) {
                const { tokenizeExpression } = await import("@/app/lib/expressionUtil");
                const tokens = tokenizeExpression(equations[0]);
                solutionTokens = tokens && tokens.length > 0 ? tokens : undefined;
                if (!solutionTokens || solutionTokens.length === 0) {
                  solutionTokens = allElements;
                }
              } else {
                solutionTokens = allElements;
              }
            }

            const lockPositions = lockPosToUse ? lockPosToUse.map((lp) => lp.pos) : undefined;

            const r: EquationAnagramResultWithLock = {
              elements: allElements,
              sampleEquation: equations[0] || "",
              possibleEquations: equations,
              listPosLock: lockPosToUse,
              lockPositions,
              solutionTokens,
            };
            setResults([r]);

            // ✅ Persist (NO MORE subtract locked indices)
            if (onPersistElements && shouldPersist) {
              try {
                // Persist "presetElements" directly (still keep sort+slice to 8)
                const { sortTokenStringsByAmathOrder } = await import("@/app/lib/tokenSort");
                const sorted = sortTokenStringsByAmathOrder(
                  (presetElements as unknown as string[]) ?? []
                );
                const elementsForDB = sorted.slice(0, 8);

                await onPersistElements(elementsForDB, lockPosToUse, solutionTokens);

                hasPersistedRef.current = true;
                persistedElementsRef.current = rackElementsKey;
                persistedLockPosRef.current = lockPosKey;
                lastPresetElementsRef.current = rackElementsKey;
              } catch (e) {
                console.error("Persist preset elements failed:", e);
              }
            }
          } catch {
            const lockPositions = lockPosToUse ? lockPosToUse.map((lp) => lp.pos) : undefined;

            // ✅ ใช้ presetSolutionTokens ถ้ามี (จาก DB) ไม่งั้น generate ใหม่
            let solutionTokens: string[] | undefined = presetSolutionTokensProp && presetSolutionTokensProp.length > 0
              ? presetSolutionTokensProp
              : undefined;
            
            if (!solutionTokens) {
              try {
                const { findAllPossibleEquations } = await import("@/app/lib/equationAnagramLogic");
                const { tokenizeExpression } = await import("@/app/lib/expressionUtil");
                const equations = findAllPossibleEquations(presetElements as unknown as string[]);
                if (equations.length > 0) {
                  const tokens = tokenizeExpression(equations[0]);
                  solutionTokens = tokens && tokens.length > 0 ? tokens : undefined;
                }
              } catch {}
            }

            const r: EquationAnagramResultWithLock = {
              elements: presetElements,
              sampleEquation: "",
              possibleEquations: [],
              listPosLock: lockPosToUse,
              lockPositions,
              solutionTokens,
            };
            setResults([r]);

            const elementsKey = presetElements.join(",");
            const lockPosKey2 = lockPosToUse
              ? JSON.stringify(lockPosToUse.sort((a, b) => a.pos - b.pos))
              : "null";

            const shouldPersistElements2 =
              !hasPersistedRef.current || persistedElementsRef.current !== elementsKey;
            const shouldPersistLockPos2 =
              !!lockPosToUse &&
              (persistedLockPosRef.current === null ||
                persistedLockPosRef.current !== lockPosKey2);
            const shouldPersist2 = shouldPersistElements2 || shouldPersistLockPos2;

            if (onPersistElements && shouldPersist2) {
              try {
                const { sortTokenStringsByAmathOrder } = await import("@/app/lib/tokenSort");
                const sorted = sortTokenStringsByAmathOrder(
                  (presetElements as unknown as string[]) ?? []
                );
                const elementsForDB = sorted.slice(0, 8);

                await onPersistElements(elementsForDB, lockPosToUse, solutionTokens);

                hasPersistedRef.current = true;
                persistedElementsRef.current = elementsKey;
                persistedLockPosRef.current = lockPosKey2;
                lastPresetElementsRef.current = elementsKey;
              } catch (e) {
                console.error("Persist preset elements failed (error case):", e);
              }
            }
          }
        } else {
          // ✅ CASE B: generate new
          // ✅ Create a key for this generation to prevent duplicates
          const generationKey = JSON.stringify({
            options: mergedOptions,
            timestamp: Date.now()
          });
          
          // ✅ Skip if we've already generated with these exact options recently
          if (lastGeneratedKeyRef.current === generationKey) {
            console.log('✅ Already generated with these options, skipping...');
            setIsGenerating(false);
            isGeneratingRef.current = false;
            return;
          }
          
          lastGeneratedKeyRef.current = generationKey;
          
          const generated = await generateEquationAnagram(mergedOptions);

          let lockFromGen: LockedPos[] | null = null;

          if (generated.lockPositions && generated.lockPositions.length > 0) {
            const solutionTokens = generated.solutionTokens;

            if (solutionTokens && solutionTokens.length > 0) {
              lockFromGen = generated.lockPositions
                .map((solutionIndex: number) => {
                  const value = solutionTokens[solutionIndex] || "";
                  return { pos: solutionIndex, value };
                })
                .filter((lp: LockedPos) => lp.value !== "");
            } else {
              lockFromGen = generated.lockPositions
                .map((pos: number) => {
                  const value = generated.elements[pos] || "";
                  return { pos, value };
                })
                .filter((lp: LockedPos) => lp.value !== "");
            }
          } else {
            lockFromGen = extractListPosLock(generated);
          }

          setCurrentListPosLock(lockFromGen);

          const lockPositions = lockFromGen
            ? lockFromGen.map((lp) => lp.pos)
            : generated.lockPositions;

          const r: EquationAnagramResultWithLock = {
            ...generated,
            listPosLock: lockFromGen,
            lockPositions,
          };
          setResults([r]);

          // ✅ Persist to backend (NO MORE subtract locked indices)
          const generatedElements = (generated as EquationAnagramResultWithLock)
            .elements as unknown as string[];
          const elementsKey = generatedElements.join(",");
          const lockPosKey = lockFromGen
            ? JSON.stringify(lockFromGen.sort((a, b) => a.pos - b.pos))
            : "null";

          const shouldPersistElements =
            !hasPersistedRef.current || persistedElementsRef.current !== elementsKey;
          const shouldPersistLockPos =
            !!lockFromGen &&
            (persistedLockPosRef.current === null ||
              persistedLockPosRef.current !== lockPosKey);
          const shouldPersist = shouldPersistElements || shouldPersistLockPos;

          if (onPersistElements && shouldPersist) {
            try {
              const { sortTokenStringsByAmathOrder } = await import("@/app/lib/tokenSort");
              const sorted = sortTokenStringsByAmathOrder(generatedElements);
              const elementsForDB = sorted.slice(0, 8);
              
              // ✅ เก็บ solutionTokens จาก generated result
              const solutionTokensForDB = generated.solutionTokens && generated.solutionTokens.length > 0
                ? generated.solutionTokens
                : undefined;

              await onPersistElements(elementsForDB, lockFromGen, solutionTokensForDB);

              hasPersistedRef.current = true;
              persistedElementsRef.current = elementsKey;
              persistedLockPosRef.current = lockPosKey;
            } catch (e) {
              console.error("❌ Persist current elements failed:", e);
            }
          }

          setPresetElements(
            (generated as EquationAnagramResultWithLock).elements as unknown as string[]
          );
        }

        setCurrentIndex(0);
      } catch (error) {
        console.error("Error generating assignment problem:", error);
      } finally {
        setIsGenerating(false);
        isGeneratingRef.current = false;
      }
    };

    if (assignmentMode && enforcedOptions) {
      generateForAssignment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentMode, enforcedOptions, lastSubmissionAt, presetElementsProp, presetSolutionTokensProp, presetListPosLockProp]);

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
      doc.setFont("helvetica", style === "bold" ? "bold" : "normal");
    }
  };

  // Event handlers
  const handleShowSolutionChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setShowSolution(e.target.checked);
  const handleShowExampleSolutionChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setShowExampleSolution(e.target.checked);

  // Handlers for main page
  const handleNumQuestionsChange = (value: string) => {
    let num = parseInt(value, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > 100) num = 100;
    setNumQuestions(num);
  };

  // Handlers for popup optionSets
  const handleAddOptionSet = () => {
    setOptionSets((prev) => [...prev, { options: { ...defaultOptions }, numQuestions: 3 }]);
  };
  const handleRemoveOptionSet = (idx: number) => {
    setOptionSets((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  // Generate multiple problems and store in results (main page)
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      if (results.length > 0) {
        setHistory((prev) => [...prev, { results: [...results], currentIndex }]);
        setFuture([]);
      }
      const generatedResults: EquationAnagramResult[] = [];
      for (let i = 0; i < numQuestions; i++) {
        const generated = await generateEquationAnagram(options, tokenCounts);
        generatedResults.push(generated);
      }
      setResults(generatedResults as EquationAnagramResultWithLock[]);
      setCurrentIndex(0);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
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
        for (let i = 0; i < set.numQuestions; i++) {
          const generated = await generateEquationAnagram(genOptions);
          problemLines.push(
            `${globalIndex}) ${(generated as EquationAnagramResultWithLock).elements.join(", ")}`
          );
          solutionLines.push(
            showSolution
              ? `${globalIndex}) ${(generated as EquationAnagramResultWithLock).sampleEquation || "-"}`
              : `${globalIndex}) -`
          );
          globalIndex++;
        }
      }
      setPrintText(problemLines.join("\n"));
      setSolutionText(solutionLines.join("\n"));
      setShowOptionModal(true);
    } catch (error) {
      alert("Error: " + (error instanceof Error ? error.message : "Unknown error"));
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

  // ✅ manual assignment submission includes lock
  const handleSendAssignmentAnswer = async () => {
    if (!onSendAnswer || !assignmentQuestion.trim() || !assignmentAnswer.trim()) return;

    try {
      setSubmittingAnswer(true);
      await onSendAnswer(
        assignmentQuestion.trim(),
        assignmentAnswer.trim(),
        currentListPosLock ?? presetListPosLockProp ?? null
      );

      setAssignmentQuestion("");
      setAssignmentAnswer("");
      setLastValidEquation("");
    } catch (error) {
      console.error("Error sending assignment answer:", error);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // ✅ auto-submit from valid equation includes lock
  const handleValidEquation = async (equation: string) => {
    if (!assignmentMode) return;

    setLastValidEquation(equation);
    setAssignmentAnswer(equation);

    if (!onSendAnswer) return;
    if (submittingAnswer) return;

    try {
      setSubmittingAnswer(true);
      const current: EquationAnagramResultWithLock = results[currentIndex];
      const questionText = current ? (current.elements || []).join(", ") : `Equation`;

      await onSendAnswer(
        questionText,
        equation,
        (current?.listPosLock as LockedPos[] | undefined) ??
          currentListPosLock ??
          presetListPosLockProp ??
          null
      );

      setLastSubmissionAt(Date.now());
    } catch (error) {
      console.error("Auto submit answer failed:", error);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // SessionStorage: load/save tokenCounts by tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem("bingo_token_counts");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setTokenCounts((prev) => ({ ...prev, ...parsed }));
          }
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("bingo_token_counts", JSON.stringify(tokenCounts));
    }
  }, [tokenCounts]);

  if (!hydrated) return null;

  return (
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
                onNumQuestionsChange={(e) => handleNumQuestionsChange(e.target.value)}
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

        {!assignmentMode && (
          <div>
            <TokenCountConfigPanel counts={tokenCounts} onChange={setTokenCounts} />
            <div className="flex justify-end">
              <button
                className="px-4 py-1 rounded bg-slate-200 text-slate-800 border border-slate-300 hover:bg-slate-300 shadow"
                onClick={handleResetTokenCounts}
                type="button"
              >
                Reset to Default
              </button>
            </div>
          </div>
        )}
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              <OptionSetsSummary optionSets={optionSets} />

              <OptionSetConfig
                options={optionSets[0].options}
                onOptionsChange={(opts) => {
                  setOptionSets((prev) =>
                    prev.map((set, i) => (i === 0 ? { ...set, options: opts } : set))
                  );
                }}
                numQuestions={optionSets[0].numQuestions}
                onNumQuestionsChange={(num) => {
                  setOptionSets((prev) =>
                    prev.map((set, i) => (i === 0 ? { ...set, numQuestions: num } : set))
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
                      prev.map((s, i) => (i === idx + 1 ? { ...s, options: opts } : s))
                    )
                  }
                  numQuestions={set.numQuestions}
                  onNumQuestionsChange={(num) =>
                    setOptionSets((prev) =>
                      prev.map((s, i) => (i === idx + 1 ? { ...s, numQuestions: num } : s))
                    )
                  }
                  onRemove={optionSets.length > 1 ? () => handleRemoveOptionSet(idx + 1) : undefined}
                  setLabel={`Set ${idx + 2}`}
                  setIndex={idx + 1}
                />
              ))}

              <Button color="white" className="mt-2" onClick={handleAddOptionSet}>
                + Add Option Set
              </Button>

              <Button
                color="white"
                className="mt-4 border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                onClick={() => {
                  window.sessionStorage.removeItem("bingo_options");
                  window.sessionStorage.removeItem("bingo_num_questions");
                  window.sessionStorage.removeItem("bingo_option_sets");
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
                        When enabled, solutions will be generated alongside problems
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
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  }
                >
                  Generate Text Output
                </Button>

                {assignmentMode && (
                  <Button
                    onClick={handleSendAssignmentAnswer}
                    disabled={!assignmentQuestion.trim() || !assignmentAnswer.trim() || submittingAnswer}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50"
                    icon={
                      submittingAnswer ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )
                    }
                  >
                    {submittingAnswer ? "Sending..." : "Send Answer to Assignment"}
                  </Button>
                )}
              </div>

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
                      <strong>Tip:</strong> These are your current settings for PDF/text generation. You can modify them here without affecting the main page configuration.
                    </p>
                  </div>
                </div>
              )}

              {assignmentMode && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">
                    Assignment Answer Form
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="assignmentQuestion"
                        className="block text-sm font-medium text-green-800 mb-2"
                      >
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
                      <label
                        htmlFor="assignmentAnswer"
                        className="block text-sm font-medium text-green-800 mb-2"
                      >
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
                          Valid equation detected:{" "}
                          <span className="font-mono font-bold">{lastValidEquation}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-green-700">
                      <Lightbulb size={16} className="inline mr-1" />
                      Tip: You can use the equation generator above to create problems,
                      then copy/paste them into this form.
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
