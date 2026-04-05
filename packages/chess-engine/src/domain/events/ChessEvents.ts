import { IDomainEvent } from '../core/BaseAggregateRoot';
import { Position } from '../models/Position';
import { Piece } from '../models/Piece';
import { GameStatus } from '../enums/GameStatus';
import { PieceType } from '../enums/PieceType';

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

export class PawnPromotedEvent implements IDomainEvent {
  public dateTimeOccurred: Date = new Date();
  constructor(
    public readonly from: Position,
    public readonly to: Position,
    public readonly promotedTo: PieceType,
  ) {}
}

export class CastledEvent implements IDomainEvent {
  public dateTimeOccurred: Date = new Date();
  constructor(
    public readonly side: 'kingside' | 'queenside',
    public readonly kingFrom: Position,
    public readonly kingTo: Position,
    public readonly rookFrom: Position,
    public readonly rookTo: Position,
  ) {}
}
