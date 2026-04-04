import { Game, GameStatus } from '../domain/models/Game';
import { Position } from '../domain/models/Position';
import { MakeMoveUseCase } from './use-cases/MakeMove';
import { RulesEngine } from '../domain/services/RulesEngine';
import { DomainEventDispatcher, domainEventDispatcher } from './DomainEventDispatcher';
import { MoveNotationService } from '../domain/services/MoveNotationService';
import { GameFactory } from '../domain/services/GameFactory';
import { IGameRepository } from './ports/IGameRepository';

export type Listener = () => void;

export interface StoreState {
  game: Game;
  selectedPosition: Position | null;
  legalMoves: Position[];
  formattedHistory: string[];
}

export class GameStore implements IGameRepository {
  private state: StoreState;
  private listeners: Set<Listener> = new Set();
  private moveUseCase: MakeMoveUseCase;

  constructor(initialGame?: Game) {
    if (!initialGame) {
      initialGame = GameFactory.createStandardGame();
    }

    this.state = {
      game: initialGame,
      selectedPosition: null,
      legalMoves: [],
      formattedHistory: [],
    };
    this.moveUseCase = new MakeMoveUseCase(this, domainEventDispatcher);
  }

  // --- IGameRepository Implementation ---
  public getGame(): Game {
    // Always clone when reading to ensure pure React state guarantees
    return this.state.game.clone();
  }

  public save(game: Game): void {
    const formattedHistory = game.history.map(m =>
      MoveNotationService.toAlgebraic(m, game.status)
    );

    this.state = {
      game,
      selectedPosition: null,
      legalMoves: [],
      formattedHistory,
    };
    this.emitChange();
  }
  // -------------------------------------

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
      this.moveUseCase.execute(from, to);
      return true;
    } catch (error: any) {
      console.error('Move Error:', error.message);
      this.state = { ...this.state, selectedPosition: null, legalMoves: [] };
      this.emitChange();
      return false;
    }
  }

  public reset(newGame?: Game): void {
    if (!newGame) {
      newGame = GameFactory.createStandardGame();
    }

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
