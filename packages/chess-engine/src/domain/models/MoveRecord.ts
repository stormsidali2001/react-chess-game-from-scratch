import { Position } from './Position';
import { Piece } from './Piece';
import { PieceType } from '../enums/PieceType';

export interface MoveRecord {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  promotedTo?: PieceType;
}
