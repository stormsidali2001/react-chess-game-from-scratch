import { Position } from '../models/Position';
import { MoveGenerator } from './MoveGenerator';
import { Color, getOpponentColor } from '../enums/Color';
import { Board } from '../models/Board';

export class RulesEngine {
  static isKingInCheck(board: Board, color: Color): boolean {
    const kingPos = board.findKingPosition(color);
    if (!kingPos) return false;

    const opponentColor = getOpponentColor(color);
    const entries = Array.from(board.pieces.entries());
    for (const [posStr, piece] of entries) {
      if (piece.color === opponentColor) {
        const moves = MoveGenerator.getValidMoves(board, Position.fromString(posStr));
        if (moves.some(m => m.equals(kingPos))) return true;
      }
    }
    return false;
  }

  static getLegalMoves(board: Board, position: Position, enPassantTarget: Position | null = null): Position[] {
    const piece = board.getPieceAt(position);
    if (!piece) return [];

    const pseudoLegalMoves = MoveGenerator.getValidMoves(board, position, enPassantTarget);
    return pseudoLegalMoves.filter(move => {
      const simulatedBoard = board.movePiece(position, move);
      return !this.isKingInCheck(simulatedBoard, piece.color);
    });
  }

  static isCheckmate(board: Board, color: Color, enPassantTarget: Position | null = null): boolean {
    if (!this.isKingInCheck(board, color)) return false;

    const entries = Array.from(board.pieces.entries());
    for (const [posStr, piece] of entries) {
      if (piece.color === color) {
        const legalMoves = this.getLegalMoves(board, Position.fromString(posStr), enPassantTarget);
        if (legalMoves.length > 0) return false;
      }
    }
    return true;
  }
}
