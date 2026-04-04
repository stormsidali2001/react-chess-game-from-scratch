import { Position } from './Position';
import { Piece } from './Piece';

export interface MoveRecord {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
}
