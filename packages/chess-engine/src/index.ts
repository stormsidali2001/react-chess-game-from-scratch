// ─── Domain Core ─────────────────────────────────────────────────────────────
export { BaseAggregateRoot } from "./domain/core/BaseAggregateRoot";
export type { IDomainEvent } from "./domain/core/BaseAggregateRoot";
export { BaseEntity } from "./domain/core/BaseEntity";
export { ValueObject } from "./domain/core/ValueObject";

// ─── Domain Enums ────────────────────────────────────────────────────────────
export { Color, getOpponentColor } from "./domain/enums/Color";
export { PieceType } from "./domain/enums/PieceType";
export { GameStatus } from "./domain/enums/GameStatus";

// ─── Domain Events ───────────────────────────────────────────────────────────
export {
  PieceMovedEvent,
  PieceCapturedEvent,
  GameStatusChangedEvent,
} from "./domain/events/ChessEvents";

// ─── Domain Errors ───────────────────────────────────────────────────────────
export {
  DomainError,
  GameOverError,
  InvalidTurnError,
  IllegalMoveError,
  InvalidPositionError,
} from "./domain/errors";

// ─── Domain Models ───────────────────────────────────────────────────────────
export { Board } from "./domain/models/Board";
export { CastlingRights } from "./domain/models/CastlingRights";
export { Game } from "./domain/models/Game";
export type { MoveRecord } from "./domain/models/MoveRecord";
export { Piece } from "./domain/models/Piece";
export { Position } from "./domain/models/Position";

// ─── Domain Services ─────────────────────────────────────────────────────────
export { FenService } from "./domain/services/FenService";
export { GameFactory } from "./domain/services/GameFactory";
export { MoveGenerator } from "./domain/services/MoveGenerator";
export { MoveNotationService } from "./domain/services/MoveNotationService";
export { RulesEngine, rulesEngine } from "./domain/services/RulesEngine";

// ─── Application ─────────────────────────────────────────────────────────────
export { InMemoryGameRepository } from "./application/InMemoryGameRepository";
export {
  DomainEventDispatcher,
  domainEventDispatcher,
} from "./application/DomainEventDispatcher";
export { GameStore } from "./application/GameStore";
export type {
  Listener,
  StoreState,
  PendingPromotion,
} from "./application/GameStore";
export { MakeMoveUseCase } from "./application/use-cases/MakeMove";
export { GetLegalMovesQuery } from "./application/use-cases/GetLegalMoves";
