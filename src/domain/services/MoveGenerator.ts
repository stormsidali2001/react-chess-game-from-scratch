import { PieceType } from '../enums/PieceType';
import { Position } from '../models/Position';
import { Color, getOpponentColor } from '../enums/Color';
import { Board } from '../models/Board';
import { Piece } from '../models/Piece';

export class MoveGenerator {
  static getValidMoves(board: Board, position: Position): Position[] {
    const piece = board.getPieceAt(position);
    if (!piece) return [];

    switch (piece.type) {
      case PieceType.PAWN: return this.getPawnMoves(board, position, piece);
      // Sliding: [dx (col), dy (row)]
      case PieceType.ROOK: return this.getSlidingMoves(board, position, piece, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
      case PieceType.BISHOP: return this.getSlidingMoves(board, position, piece, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
      case PieceType.QUEEN: return this.getSlidingMoves(board, position, piece, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
      case PieceType.KNIGHT: return this.getSteppingMoves(board, position, piece, [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]);
      case PieceType.KING: return this.getSteppingMoves(board, position, piece, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
      default: return [];
    }
  }

  static getPawnMoves(board: Board, pos: Position, piece: Piece): Position[] {
    const moves: Position[] = [];
    const forward = piece.color === Color.WHITE ? -1 : 1;
    const startRow = piece.color === Color.WHITE ? 6 : 1;

    // Single step: Change y (Row)
    if (Position.isValid(pos.x, pos.y + forward)) {
      const step1 = new Position(pos.x, pos.y + forward);
      if (!board.isOccupied(step1)) {
        moves.push(step1);
        // Double step: Only if from startRow
        if (pos.y === startRow) {
          const step2 = new Position(pos.x, pos.y + forward * 2);
          if (Position.isValid(step2.x, step2.y) && !board.isOccupied(step2)) {
            moves.push(step2);
          }
        }
      }
    }

    // Captures: Diagonals
    const captures = [[1, forward], [-1, forward]];
    for (const [dx, dy] of captures) {
      if (Position.isValid(pos.x + dx, pos.y + dy)) {
        const diagPos = new Position(pos.x + dx, pos.y + dy);
        if (board.isOccupiedBy(diagPos, getOpponentColor(piece.color))) {
          moves.push(diagPos);
        }
      }
    }
    return moves;
  }

  static getSlidingMoves(board: Board, pos: Position, piece: Piece, directions: number[][]): Position[] {
    const moves: Position[] = [];
    for (const [dx, dy] of directions) {
      let nx = pos.x + dx, ny = pos.y + dy;
      while (Position.isValid(nx, ny)) {
        const nPos = new Position(nx, ny);
        const occupant = board.getPieceAt(nPos);
        if (!occupant) {
          moves.push(nPos);
        } else {
          if (occupant.color !== piece.color) moves.push(nPos);
          break;
        }
        nx += dx; ny += dy;
      }
    }
    return moves;
  }

  static getSteppingMoves(board: Board, pos: Position, piece: Piece, steps: number[][]): Position[] {
    const moves: Position[] = [];
    for (const [dx, dy] of steps) {
      if (Position.isValid(pos.x + dx, pos.y + dy)) {
        const nPos = new Position(pos.x + dx, pos.y + dy);
        const occupant = board.getPieceAt(nPos);
        if (!occupant || occupant.color !== piece.color) {
          moves.push(nPos);
        }
      }
    }
    return moves;
  }
}
