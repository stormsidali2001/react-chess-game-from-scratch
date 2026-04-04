// ─── Domain Core ─────────────────────────────────────────────────────────────
export { BaseAggregateRoot } from './domain/core/BaseAggregateRoot';
export type { IDomainEvent } from './domain/core/BaseAggregateRoot';
export { BaseEntity } from './domain/core/BaseEntity';
export { ValueObject } from './domain/core/ValueObject';

// ─── Domain Enums ────────────────────────────────────────────────────────────
export { Color, getOpponentColor } from './domain/enums/Color';
export { PieceType } from './domain/enums/PieceType';

// ─── Domain Events ───────────────────────────────────────────────────────────
export {
    PieceMovedEvent,
    PieceCapturedEvent,
    GameStatusChangedEvent,
} from './domain/events/ChessEvents';

// ─── Domain Models ───────────────────────────────────────────────────────────
export { Board } from './domain/models/Board';
export { Game, GameStatus } from './domain/models/Game';
export type { MoveRecord } from './domain/models/Game';
export { Piece } from './domain/models/Piece';
export { Position } from './domain/models/Position';

// ─── Domain Services ─────────────────────────────────────────────────────────
export { BoardSetup } from './domain/services/BoardSetup';
export { MoveGenerator } from './domain/services/MoveGenerator';
export { MoveNotationService } from './domain/services/MoveNotationService';
export { RulesEngine } from './domain/services/RulesEngine';

// ─── Application ─────────────────────────────────────────────────────────────
export { DomainEventDispatcher, domainEventDispatcher } from './application/DomainEventDispatcher';
export { GameStore, gameStore } from './application/GameStore';
export type { Listener, StoreState } from './application/GameStore';
export { MakeMoveUseCase } from './application/use-cases/MakeMove';
