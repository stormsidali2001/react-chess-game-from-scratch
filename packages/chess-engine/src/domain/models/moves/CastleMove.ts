import { Board } from '../Board';
import { Position } from '../Position';
import { Piece } from '../Piece';
import { Move, MoveExecutionResult } from './Move';

/**
 * Represents a castling move.
 * Moves the king two squares toward the rook and places the rook on the other side.
 * passThroughSquare is the square the king crosses — used by RulesEngine to verify
 * the king does not pass through check.
 */
export class CastleMove extends Move {
  constructor(
    from: Position,
    to: Position,
    piece: Piece,
    public readonly rookFrom: Position,
    public readonly rookTo: Position,
    public readonly rook: Piece,
    public readonly passThroughSquare: Position,
  ) {
    super(from, to, piece);
  }

  matches(to: Position): boolean {
    return this.to.equals(to) || this.rookFrom.equals(to);
  }

  execute(board: Board): MoveExecutionResult {
    const movedKing = this.piece.clone();
    const movedRook = this.rook.clone();
    const boardWithKing = board.movePiece(this.from, this.to, movedKing);
    const boardWithRook = boardWithKing.movePiece(this.rookFrom, this.rookTo, movedRook);

    return {
      board: boardWithRook,
      movedPiece: movedKing,
      enPassantTarget: null,
    };
  }
}
