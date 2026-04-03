import { Game } from '../domain/models/Game';
import { Position } from '../domain/models/Position';
import { MakeMoveUseCase } from './use-cases/MakeMove';
import { RulesEngine } from '../domain/services/RulesEngine';

export type Listener = () => void;

export interface StoreState {
  game: Game;
  selectedPosition: Position | null;
  legalMoves: Position[];
}

export class GameStore {
  private state: StoreState;
  private listeners: Set<Listener> = new Set();
  private moveUseCase: MakeMoveUseCase;

  constructor(initialGame: Game = new Game()) {
    this.state = {
      game: initialGame,
      selectedPosition: null,
      legalMoves: [],
    };
    this.moveUseCase = new MakeMoveUseCase();
  }

  public subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): StoreState => {
    return this.state;
  };

  public selectPosition(pos: Position | null): void {
    if (!pos) {
      this.state = { ...this.state, selectedPosition: null, legalMoves: [] };
    } else {
      const piece = this.state.game.board.getPieceAt(pos);
      if (piece && piece.color === this.state.game.turn) {
        const moves = RulesEngine.getLegalMoves(this.state.game.board, pos);
        this.state = { ...this.state, selectedPosition: pos, legalMoves: moves };
      } else {
        this.state = { ...this.state, selectedPosition: null, legalMoves: [] };
      }
    }
    this.emitChange();
  }

  public makeMove(to: Position): boolean {
    const from = this.state.selectedPosition;
    if (!from) return false;

    try {
      const nextGame = this.moveUseCase.execute(this.state.game, from, to);
      this.state = {
        game: nextGame,
        selectedPosition: null,
        legalMoves: [],
      };
      this.emitChange();
      return true;
    } catch (error: any) {
      this.state = { ...this.state, selectedPosition: null, legalMoves: [] };
      this.emitChange();
      return false;
    }
  }

  public reset(newGame: Game = new Game()): void {
    this.state = {
      game: newGame,
      selectedPosition: null,
      legalMoves: [],
    };
    this.emitChange();
  }

  private emitChange(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const gameStore = new GameStore();
