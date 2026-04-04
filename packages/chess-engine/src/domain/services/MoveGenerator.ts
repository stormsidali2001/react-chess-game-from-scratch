import { PieceType } from '../enums/PieceType';
import { Position } from '../models/Position';
import { Color } from '../enums/Color';
import { Board } from '../models/Board';
import { Piece } from '../models/Piece';
import { CastlingRights } from '../models/CastlingRights';
import {
  Move,
  StandardMove,
  DoublePawnPushMove,
  EnPassantMove,
  PromotionMove,
  CastleMove,
} from '../models/Move';

const PROMOTION_TYPES = [
  PieceType.QUEEN,
  PieceType.ROOK,
  PieceType.BISHOP,
  PieceType.KNIGHT,
];

export class MoveGenerator {
  static getValidMoves(
    board: Board,
    position: Position,
    enPassantTarget: Position | null = null,
    castlingRights: CastlingRights | null = null,
  ): Move[] {
    const piece = board.getPieceAt(position);
    if (!piece) return [];

    switch (piece.type) {
      case PieceType.PAWN:
        return this.getPawnMoves(board, position, piece, enPassantTarget);
      case PieceType.ROOK:
        return this.getSlidingMoves(board, position, piece, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
      case PieceType.BISHOP:
        return this.getSlidingMoves(board, position, piece, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
      case PieceType.QUEEN:
        return this.getSlidingMoves(board, position, piece, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
      case PieceType.KNIGHT:
        return this.getSteppingMoves(board, position, piece, [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]);
      case PieceType.KING: {
        const stepping = this.getSteppingMoves(board, position, piece, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
        const castling = castlingRights ? this.getCastlingMoves(board, position, piece, castlingRights) : [];
        return [...stepping, ...castling];
      }
      default:
        return [];
    }
  }

  static getPawnMoves(
    board: Board,
    pos: Position,
    piece: Piece,
    enPassantTarget: Position | null,
  ): Move[] {
    const moves: Move[] = [];
    const forward = piece.color === Color.WHITE ? -1 : 1;
    const startRow = piece.color === Color.WHITE ? 6 : 1;
    const lastRow = piece.color === Color.WHITE ? 0 : 7;

    // Single step forward
    if (Position.isValid(pos.x, pos.y + forward)) {
      const step1 = new Position(pos.x, pos.y + forward);
      if (!board.isOccupied(step1)) {
        if (step1.y === lastRow) {
          for (const pt of PROMOTION_TYPES) {
            moves.push(new PromotionMove(pos, step1, piece, undefined, pt));
          }
        } else {
          moves.push(new StandardMove(pos, step1, piece));
        }

        // Double step from starting row
        if (pos.y === startRow) {
          const step2 = new Position(pos.x, pos.y + forward * 2);
          if (Position.isValid(step2.x, step2.y) && !board.isOccupied(step2)) {
            moves.push(new DoublePawnPushMove(pos, step2, piece));
          }
        }
      }
    }

    // Diagonal captures
    for (const [dx, dy] of [[1, forward], [-1, forward]] as [number, number][]) {
      if (!Position.isValid(pos.x + dx, pos.y + dy)) continue;
      const diagPos = new Position(pos.x + dx, pos.y + dy);
      const targetPiece = board.getPieceAt(diagPos);

      if (targetPiece && targetPiece.color !== piece.color) {
        if (diagPos.y === lastRow) {
          for (const pt of PROMOTION_TYPES) {
            moves.push(new PromotionMove(pos, diagPos, piece, targetPiece, pt));
          }
        } else {
          moves.push(new StandardMove(pos, diagPos, piece, targetPiece));
        }
      } else if (enPassantTarget && enPassantTarget.equals(diagPos)) {
        const victimPos = new Position(diagPos.x, pos.y);
        const victimPiece = board.getPieceAt(victimPos)!;
        moves.push(new EnPassantMove(pos, diagPos, piece, victimPiece, victimPos));
      }
    }

    return moves;
  }

  static getCastlingMoves(
    board: Board,
    kingPos: Position,
    king: Piece,
    castlingRights: CastlingRights,
  ): Move[] {
    const moves: Move[] = [];
    const row = king.color === Color.WHITE ? 7 : 0;

    if (kingPos.x !== 4 || kingPos.y !== row) return [];

    // Kingside: king moves e→g, rook moves h→f
    if (castlingRights.canCastleKingSide(king.color)) {
      const rookPos = new Position(7, row);
      const rook = board.getPieceAt(rookPos);
      const f = new Position(5, row);
      const g = new Position(6, row);
      if (rook?.type === PieceType.ROOK && rook.color === king.color &&
          !board.isOccupied(f) && !board.isOccupied(g)) {
        moves.push(new CastleMove(kingPos, g, king, rookPos, f, rook, f));
      }
    }

    // Queenside: king moves e→c, rook moves a→d
    if (castlingRights.canCastleQueenSide(king.color)) {
      const rookPos = new Position(0, row);
      const rook = board.getPieceAt(rookPos);
      const b = new Position(1, row);
      const c = new Position(2, row);
      const d = new Position(3, row);
      if (rook?.type === PieceType.ROOK && rook.color === king.color &&
          !board.isOccupied(b) && !board.isOccupied(c) && !board.isOccupied(d)) {
        moves.push(new CastleMove(kingPos, c, king, rookPos, d, rook, d));
      }
    }

    return moves;
  }

  static getSlidingMoves(board: Board, pos: Position, piece: Piece, directions: [number, number][]): Move[] {
    const moves: Move[] = [];
    for (const [dx, dy] of directions) {
      let nx = pos.x + dx, ny = pos.y + dy;
      while (Position.isValid(nx, ny)) {
        const nPos = new Position(nx, ny);
        const occupant = board.getPieceAt(nPos);
        if (!occupant) {
          moves.push(new StandardMove(pos, nPos, piece));
        } else {
          if (occupant.color !== piece.color) moves.push(new StandardMove(pos, nPos, piece, occupant));
          break;
        }
        nx += dx; ny += dy;
      }
    }
    return moves;
  }

  static getSteppingMoves(board: Board, pos: Position, piece: Piece, steps: [number, number][]): Move[] {
    const moves: Move[] = [];
    for (const [dx, dy] of steps) {
      if (!Position.isValid(pos.x + dx, pos.y + dy)) continue;
      const nPos = new Position(pos.x + dx, pos.y + dy);
      const occupant = board.getPieceAt(nPos);
      if (!occupant) {
        moves.push(new StandardMove(pos, nPos, piece));
      } else if (occupant.color !== piece.color) {
        moves.push(new StandardMove(pos, nPos, piece, occupant));
      }
    }
    return moves;
  }
}
