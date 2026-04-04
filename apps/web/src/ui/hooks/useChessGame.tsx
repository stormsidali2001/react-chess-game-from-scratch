import React, { useCallback, useRef } from "react";
import {
  Game,
  GameStatus,
  Position,
  Board,
  Color,
  PieceType,
  GameStore,
  InMemoryGameRepository,
  GameFactory,
  PendingPromotion,
} from "@chess/engine";

export interface UseChessGameReturn {
  game: Game;
  selectedPosition: Position | null;
  legalMoves: Position[];
  formattedHistory: string[];
  pendingPromotion: PendingPromotion | null;
  selectPosition: (pos: Position | null) => void;
  makeMove: (to: Position) => boolean;
  confirmPromotion: (pieceType: PieceType) => boolean;
  cancelPromotion: () => void;
  reset: () => void;
  loadFen: (fen: string) => boolean;
  board: Board;
  turn: Color;
  status: GameStatus;
}

export function useChessGame(): UseChessGameReturn {
  const storeRef = useRef<GameStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new GameStore(
      new InMemoryGameRepository(GameFactory.createStandardGame()),
    );
  }
  const store = storeRef.current;

  const state = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  const selectPosition = useCallback(
    (pos: Position | null) => store.selectPosition(pos),
    [store],
  );

  const makeMove = useCallback(
    (to: Position) => store.makeMove(to),
    [store],
  );

  const confirmPromotion = useCallback(
    (pieceType: PieceType) => store.confirmPromotion(pieceType),
    [store],
  );

  const cancelPromotion = useCallback(
    () => store.cancelPromotion(),
    [store],
  );

  const reset = useCallback(
    () => store.reset(),
    [store],
  );

  const loadFen = useCallback(
    (fen: string) => store.loadFen(fen),
    [store],
  );

  return {
    game: state.game,
    selectedPosition: state.selectedPosition,
    legalMoves: state.legalMoves,
    formattedHistory: state.formattedHistory,
    pendingPromotion: state.pendingPromotion,
    selectPosition,
    makeMove,
    confirmPromotion,
    cancelPromotion,
    reset,
    loadFen,
    board: state.game.board,
    turn: state.game.turn,
    status: state.game.status,
  };
}
