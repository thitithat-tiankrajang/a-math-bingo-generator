'use client';

import React from 'react';
import Navbar from './Navbar';
import { useUndoRedo } from '@/app/contexts/UndoRedoContext';

export function NavbarWrapper() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  return (
    <Navbar
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
    />
  );
}
