import { IDomainEvent } from '../core/BaseAggregateRoot';
import { Position } from '../models/Position';
import { Piece } from '../models/Piece';
import { GameStatus } from '../models/Game';

export class PieceMovedEvent implements IDomainEvent {
  public dateTimeOccurred: Date = new Date();
  constructor(
    public readonly from: Position,
    public readonly to: Position,
    public readonly piece: Piece
  ) {}
}

export class PieceCapturedEvent implements IDomainEvent {
  public dateTimeOccurred: Date = new Date();
  constructor(
    public readonly at: Position,
    public readonly piece: Piece
  ) {}
}

export class GameStatusChangedEvent implements IDomainEvent {
  public dateTimeOccurred: Date = new Date();
  constructor(
    public readonly status: GameStatus
  ) {}
}
