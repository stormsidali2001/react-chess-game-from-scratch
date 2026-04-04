import { Game } from "../domain/models/Game";
import { Position } from "../domain/models/Position";
import { PieceType } from "../domain/enums/PieceType";
import { Color } from "../domain/enums/Color";
import { RulesEngine, rulesEngine } from "../domain/services/RulesEngine";
import { MoveNotationService } from "../domain/services/MoveNotationService";
import { GameFactory } from "../domain/services/GameFactory";
import { FenService } from "../domain/services/FenService";
import {
  DomainEventDispatcher,
  domainEventDispatcher,
} from "./DomainEventDispatcher";
import { IGameRepository } from "./ports/IGameRepository";
import { MakeMoveUseCase } from "./use-cases/MakeMove";
import { GetLegalMovesQuery } from "./use-cases/GetLegalMoves";

export type Listener = () => void;

export interface PendingPromotion {
  from: Position;
  to: Position;
  color: Color;
}

export interface StoreState {
  game: Game;
  selectedPosition: Position | null;
  legalMoves: Position[];
  formattedHistory: string[];
  pendingPromotion: PendingPromotion | null;
}

export class GameStore {
  private readonly repo: IGameRepository;
  private readonly moveUseCase: MakeMoveUseCase;
  private readonly legalMovesQuery: GetLegalMovesQuery;
  private state: StoreState;
  private readonly listeners = new Set<Listener>();

  constructor(
    repo: IGameRepository,
    rules: RulesEngine = rulesEngine,
    dispatcher: DomainEventDispatcher = domainEventDispatcher,
  ) {
    this.repo = repo;
    this.moveUseCase = new MakeMoveUseCase(repo, dispatcher, rules);
    this.legalMovesQuery = new GetLegalMovesQuery(repo, rules);
    this.state = this.buildState(repo.getGame());
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): StoreState => this.state;

  selectPosition(pos: Position | null): void {
    if (!pos) {
      this.state = { ...this.state, selectedPosition: null, legalMoves: [] };
    } else {
      const legalMoves = this.legalMovesQuery.execute(pos);
      this.state =
        legalMoves.length > 0
          ? { ...this.state, selectedPosition: pos, legalMoves }
          : { ...this.state, selectedPosition: null, legalMoves: [] };
    }
    this.emitChange();
  }

  makeMove(to: Position, promotionType?: PieceType): boolean {
    const from = this.state.selectedPosition;
    if (!from) return false;

    // Intercept pawn promotions — ask the UI to pick a piece first
    if (promotionType === undefined && this.isPawnPromotion(from, to)) {
      const piece = this.repo.getGame().board.getPieceAt(from)!;
      this.state = {
        ...this.state,
        selectedPosition: null,
        legalMoves: [],
        pendingPromotion: { from, to, color: piece.color },
      };
      this.emitChange();
      return false;
    }

    try {
      this.moveUseCase.execute(from, to, promotionType ?? PieceType.QUEEN);
      this.state = this.buildState(this.repo.getGame());
      this.emitChange();
      return true;
    } catch (e: any) {
      console.error("Move Error:", e.message);
      this.state = {
        ...this.state,
        selectedPosition: null,
        legalMoves: [],
        pendingPromotion: null,
      };
      this.emitChange();
      return false;
    }
  }

  confirmPromotion(pieceType: PieceType): boolean {
    const pending = this.state.pendingPromotion;
    if (!pending) return false;
    this.state = {
      ...this.state,
      selectedPosition: pending.from,
      pendingPromotion: null,
    };
    return this.makeMove(pending.to, pieceType);
  }

  cancelPromotion(): void {
    this.state = {
      ...this.state,
      selectedPosition: null,
      legalMoves: [],
      pendingPromotion: null,
    };
    this.emitChange();
  }

  reset(newGame?: Game): void {
    const game = newGame ?? GameFactory.createStandardGame();
    this.repo.save(game);
    this.state = this.buildState(game);
    this.emitChange();
  }

  loadFen(fen: string): boolean {
    try {
      const game = FenService.deserialize(fen);
      this.reset(game);
      return true;
    } catch {
      return false;
    }
  }

  private isPawnPromotion(from: Position, to: Position): boolean {
    const piece = this.repo.getGame().board.getPieceAt(from);
    if (piece?.type !== PieceType.PAWN) return false;
    const lastRank = piece.color === Color.WHITE ? 0 : 7;
    return to.y === lastRank;
  }

  private buildState(game: Game): StoreState {
    return {
      game,
      selectedPosition: null,
      legalMoves: [],
      formattedHistory: game.history.map((m) =>
        MoveNotationService.toAlgebraic(m, game.status),
      ),
      pendingPromotion: null,
    };
  }

  private emitChange(): void {
    this.listeners.forEach((l) => l());
  }
}
