import { Position } from './Position';
import type { AlgebraicNotation } from './Position';
import { Color } from '../enums/Color';
import { PieceType } from '../enums/PieceType';
import { Piece } from './Piece';
import { ValueObject } from '../core/ValueObject';

interface BoardProps {
  pieces: Map<string, Piece>;
}

export class Board extends ValueObject<BoardProps> {
  constructor(pieces: Map<string, Piece> = new Map()) {
    super({ pieces });
  }

  get pieces(): Map<string, Piece> {
    return this.props.pieces;
  }

  getPieceAt(position: Position): Piece | undefined {
    return this.pieces.get(position.toString());
  }

  placePiece(position: Position, piece: Piece): Board {
    const newPieces = new Map(this.pieces);
    newPieces.set(position.toString(), piece);
    return new Board(newPieces);
  }

  movePiece(from: Position, to: Position, explicitPiece?: Piece): Board {
    const piece = explicitPiece || this.getPieceAt(from);
    if (!piece) return this;

    const newPieces = new Map(this.pieces);
    newPieces.delete(from.toString());
    newPieces.set(to.toString(), explicitPiece ?? piece.clone());
    return new Board(newPieces);
  }

  removePieceAt(position: Position): Board {
    const newPieces = new Map(this.pieces);
    newPieces.delete(position.toString());
    return new Board(newPieces);
  }

  isOccupied(position: Position): boolean {
    return this.pieces.has(position.toString());
  }

  isOccupiedBy(position: Position, color: Color): boolean {
    const piece = this.getPieceAt(position);
    return !!piece && piece.color === color;
  }

  findKingPosition(color: Color): Position | null {
    const entries = Array.from(this.pieces.entries());
    for (const [posStr, piece] of entries) {
      if (piece.type === PieceType.KING && piece.color === color) {
        return Position.fromString(posStr as AlgebraicNotation);
      }
    }
    return null;
  }
}
