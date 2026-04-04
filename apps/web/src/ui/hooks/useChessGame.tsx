import { useCallback } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import {
  gameStore,
  Game,
  GameStatus,
  Position,
  Board,
  Color,
} from '@chess/engine';

export interface UseChessGameReturn {
  game: Game;
  selectedPosition: Position | null;
  legalMoves: Position[];
  formattedHistory: string[];
  selectPosition: (pos: Position | null) => void;
  makeMove: (to: Position) => boolean;
  board: Board;
  turn: Color;
  status: GameStatus;
}

export function useChessGame(): UseChessGameReturn {
  const store = useSyncExternalStore(
    gameStore.subscribe,
    gameStore.getSnapshot,
    gameStore.getSnapshot
  );

  const selectPosition = useCallback((pos: Position | null) => {
    gameStore.selectPosition(pos);
  }, []);

  const makeMove = useCallback((to: Position) => {
    return gameStore.makeMove(to);
  }, []);

  return {
    game: store.game,
    selectedPosition: store.selectedPosition,
    legalMoves: store.legalMoves,
    formattedHistory: store.formattedHistory,
    selectPosition,
    makeMove,
    board: store.game.board,
    turn: store.game.turn,
    status: store.game.status,
  };
}
