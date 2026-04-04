import { Game, GameStatus } from '../domain/models/Game';
import { Position } from '../domain/models/Position';
import { MakeMoveUseCase } from './use-cases/MakeMove';
import { RulesEngine } from '../domain/services/RulesEngine';
import { domainEventDispatcher } from './DomainEventDispatcher';
import { MoveNotationService } from '../domain/services/MoveNotationService';

export type Listener = () => void;

export interface StoreState {
  game: Game;
  selectedPosition: Position | null;
  legalMoves: Position[];
  formattedHistory: string[];
}

export class GameStore {
  private state: StoreState;
  private listeners: Set<Listener> = new Set();
  private moveUseCase: MakeMoveUseCase;

  constructor(initialGame: Game = Game.create()) {
    this.state = {
      game: initialGame,
      selectedPosition: null,
      legalMoves: [],
      formattedHistory: [],
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
      const mutableGame = this.state.game.clone();
      this.moveUseCase.execute(mutableGame, from, to);
      
      domainEventDispatcher.dispatchMany(mutableGame.domainEvents);
      mutableGame.clearDomainEvents();

      // NEW: Pass status to standard chess notation formatter
      const formattedHistory = mutableGame.history.map(m => 
        MoveNotationService.toAlgebraic(m, mutableGame.status)
      );

      this.state = {
        game: mutableGame,
        selectedPosition: null,
        legalMoves: [],
        formattedHistory,
      };
      
      this.emitChange();
      return true;
    } catch (error: any) {
      console.error('Move Error:', error.message);
      this.state = { ...this.state, selectedPosition: null, legalMoves: [] };
      this.emitChange();
      return false;
    }
  }

  public reset(newGame: Game = Game.create()): void {
    this.state = {
      game: newGame,
      selectedPosition: null,
      legalMoves: [],
      formattedHistory: [],
    };
    this.emitChange();
  }

  private emitChange(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const gameStore = new GameStore();
