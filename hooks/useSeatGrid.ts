'use client';

import { useState, useCallback, useMemo } from 'react';
import { Seat } from '@/types/seat';
import { calculateTotalCapacity, validateSeatConfiguration, assignSeatNumbers, getRowLabel, rowToIndex } from '@/lib/seat-logic';

interface UseSeatGridReturn {
  seats: Seat[];
  history: Seat[][];
  historyIndex: number;
  selectedSeats: Set<string>;
  viewMode: 'admin' | 'preview';
  isDragging: boolean;
  dragStart: Seat | null;
  
  // Computed values
  capacityBreakdown: ReturnType<typeof calculateTotalCapacity>;
  isOverCapacity: boolean;
  validation: ReturnType<typeof validateSeatConfiguration>;
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  setSeats: (seats: Seat[]) => void;
  setViewMode: (mode: 'admin' | 'preview') => void;
  undo: () => void;
  redo: () => void;
  
  // Seat operations
  toggleSeatSelection: (seatId: string) => void;
  selectRange: (startSeat: Seat, endSeat: Seat) => void;
  clearSelection: () => void;
  updateSeat: (seatId: string, updates: Partial<Seat>) => void;
  bulkUpdateSeats: (seatIds: string[], updates: Partial<Seat>) => void;
  
  // Drag selection
  startDrag: (seat: Seat) => void;
  dragOver: (seat: Seat) => void;
  endDrag: () => void;
  
  // Loveseat operations
  createLoveseat: (leftSeatId: string, columns: number) => boolean;
  deleteLoveseat: (seatId: string) => void;
  
  // History management
  pushHistory: (newSeats: Seat[]) => void;
}

export function useSeatGrid(
  hallId: string,
  capacity: number,
  columns: number,
  initialSeats: Seat[] = []
): UseSeatGridReturn {
  // Core state
  const [seats, setSeatsState] = useState<Seat[]>(initialSeats);
  const [history, setHistory] = useState<Seat[][]>([initialSeats]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'admin' | 'preview'>('admin');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Seat | null>(null);

  // Computed values
  const capacityBreakdown = useMemo(() => calculateTotalCapacity(seats), [seats]);
  const isOverCapacity = capacityBreakdown.capacityUsed > capacity;
  const validation = useMemo(() => validateSeatConfiguration(seats, capacity, columns), [seats, capacity, columns]);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushHistoryState = useCallback((newSeats: Seat[]) => {
    setHistory(prev => {
      // Remove any future history if we're in the middle
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newSeats]);
      
      // Limit to 50 steps to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistoryIndex(prevIndex => prevIndex - 1);
      }
      
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Set seats with history tracking
  const setSeats = useCallback((newSeats: Seat[]) => {
    setSeatsState(newSeats);
    pushHistoryState(newSeats);
  }, [pushHistoryState]);

  // Push to history
  const pushHistory = useCallback((newSeats: Seat[]) => {
    pushHistoryState(newSeats);
  }, [pushHistoryState]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSeatsState([...history[newIndex]]);
      setSelectedSeats(new Set()); // Clear selection on undo
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSeatsState([...history[newIndex]]);
      setSelectedSeats(new Set()); // Clear selection on redo
    }
  }, [history, historyIndex]);

  // Toggle seat selection
  const toggleSeatSelection = useCallback((seatId: string) => {
    setSelectedSeats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seatId)) {
        newSet.delete(seatId);
      } else {
        newSet.add(seatId);
      }
      return newSet;
    });
  }, []);

  // Select range (drag selection)
  const selectRange = useCallback((startSeat: Seat, endSeat: Seat) => {
    const startRow = rowToIndex(startSeat.row);
    const endRow = rowToIndex(endSeat.row);
    const startCol = startSeat.column;
    const endCol = endSeat.column;

    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    // Select all seats in rectangle
    const selected = seats.filter(s => {
      const rowIdx = rowToIndex(s.row);
      return rowIdx >= minRow && rowIdx <= maxRow && 
             s.column >= minCol && s.column <= maxCol;
    }).map(s => s.id);

    setSelectedSeats(new Set(selected));
  }, [seats]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedSeats(new Set());
  }, []);

  // Update single seat
  const updateSeat = useCallback((seatId: string, updates: Partial<Seat>) => {
    setSeatsState(prev => {
      const newSeats = prev.map(seat => 
        seat.id === seatId ? { ...seat, ...updates } : seat
      );
      pushHistoryState(newSeats);
      return newSeats;
    });
  }, [pushHistoryState]);

  // Bulk update seats
  const bulkUpdateSeats = useCallback((seatIds: string[], updates: Partial<Seat>) => {
    setSeatsState(prev => {
      const newSeats = prev.map(seat => 
        seatIds.includes(seat.id) ? { ...seat, ...updates } : seat
      );
      pushHistoryState(newSeats);
      return newSeats;
    });
    setSelectedSeats(new Set()); // Clear selection after bulk update
  }, [pushHistoryState]);

  // Drag selection handlers
  const startDrag = useCallback((seat: Seat) => {
    setIsDragging(true);
    setDragStart(seat);
    setSelectedSeats(new Set([seat.id]));
  }, []);

  const dragOver = useCallback((seat: Seat) => {
    if (!isDragging || !dragStart) return;
    selectRange(dragStart, seat);
  }, [isDragging, dragStart, selectRange]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // Create twinseat
  const createLoveseat = useCallback((leftSeatId: string, columns: number): boolean => {
    const leftSeat = seats.find(s => s.id === leftSeatId);
    if (!leftSeat) return false;

    // Check if at row boundary
    if (leftSeat.column >= columns - 1) return false;

    // Find right seat
    const rightSeat = seats.find(s => 
      s.row === leftSeat.row && s.column === leftSeat.column + 1
    );

    if (!rightSeat) return false;
    if (rightSeat.status === 'INACTIVE') return false;
    if (rightSeat.seatType === 'TWINSEAT') return false;

    // Update both seats
    setSeatsState(prev => {
      const newSeats = prev.map(seat => {
        if (seat.id === leftSeatId) {
          return { ...seat, seatType: 'TWINSEAT' as const };
        }
        if (seat.id === rightSeat.id) {
          return { ...seat, seatType: 'TWINSEAT' as const };
        }
        return seat;
      });
      pushHistoryState(newSeats);
      return newSeats;
    });

    return true;
  }, [seats, pushHistoryState]);

  // Delete/convert twinseat
  const deleteLoveseat = useCallback((seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || seat.seatType !== 'TWINSEAT') return;

    setSeatsState(prev => {
      // Find the partner seat using consistent sequential pairing
      const rowTwinSeats = prev
        .filter(s => s.row === seat.row && s.seatType === 'TWINSEAT')
        .sort((a, b) => a.column - b.column);
      
      let partnerId: string | null = null;
      for (let i = 0; i < rowTwinSeats.length; i += 2) {
        if (rowTwinSeats[i].id === seatId) {
          partnerId = rowTwinSeats[i+1]?.id || null;
          break;
        }
        if (rowTwinSeats[i+1]?.id === seatId) {
          partnerId = rowTwinSeats[i].id;
          break;
        }
      }

      const newSeats = prev.map(s => {
        if (s.id === seatId || (partnerId && s.id === partnerId)) {
          return { ...s, seatType: 'REGULAR' as const };
        }
        return s;
      });
      pushHistoryState(newSeats);
      return newSeats;
    });
  }, [seats, pushHistoryState]);

  return {
    seats,
    history,
    historyIndex,
    selectedSeats,
    viewMode,
    isDragging,
    dragStart,
    capacityBreakdown,
    isOverCapacity,
    validation,
    canUndo,
    canRedo,
    setSeats,
    setViewMode,
    undo,
    redo,
    toggleSeatSelection,
    selectRange,
    clearSelection,
    updateSeat,
    bulkUpdateSeats,
    startDrag,
    dragOver,
    endDrag,
    createLoveseat,
    deleteLoveseat,
    pushHistory
  };
}
