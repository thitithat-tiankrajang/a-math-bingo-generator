'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  setUndoRedoHandler: (undoHandler: () => void, redoHandler: () => void, canUndo: boolean, canRedo: boolean) => void;
  clearUndoRedoHandler: () => void;
}

const UndoRedoContext = createContext<UndoRedoState | undefined>(undefined);

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const [undoHandler, setUndoHandler] = useState<(() => void) | null>(null);
  const [redoHandler, setRedoHandler] = useState<(() => void) | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const undo = useCallback(() => {
    if (undoHandler && canUndo) {
      undoHandler();
    }
  }, [undoHandler, canUndo]);

  const redo = useCallback(() => {
    if (redoHandler && canRedo) {
      redoHandler();
    }
  }, [redoHandler, canRedo]);

  const setUndoRedoHandler = useCallback((
    newUndoHandler: () => void,
    newRedoHandler: () => void,
    newCanUndo: boolean,
    newCanRedo: boolean
  ) => {
    setUndoHandler(() => newUndoHandler);
    setRedoHandler(() => newRedoHandler);
    setCanUndo(newCanUndo);
    setCanRedo(newCanRedo);
  }, []);

  const clearUndoRedoHandler = useCallback(() => {
    setUndoHandler(null);
    setRedoHandler(null);
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') || 
                 ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const value = {
    canUndo,
    canRedo,
    undo,
    redo,
    setUndoRedoHandler,
    clearUndoRedoHandler,
  };

  return (
    <UndoRedoContext.Provider value={value}>
      {children}
    </UndoRedoContext.Provider>
  );
}

export function useUndoRedo() {
  const context = useContext(UndoRedoContext);
  if (context === undefined) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider');
  }
  return context;
}
