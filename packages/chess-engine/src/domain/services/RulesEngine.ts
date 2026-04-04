import { Position } from "../models/Position";
import type { AlgebraicNotation } from "../models/Position";
import { Piece } from "../models/Piece";
import { MoveGenerator } from "./MoveGenerator";
import { Color, getOpponentColor } from "../enums/Color";
import { PieceType } from "../enums/PieceType";
import { Board } from "../models/Board";
import { Move, CastleMove } from "../models/Move";
import { CastlingRights } from "../models/CastlingRights";
import { GameStatus } from "../enums/GameStatus";

export class RulesEngine {
  isKingInCheck(board: Board, color: Color): boolean {
    const kingPos = board.findKingPosition(color);
    if (!kingPos) return false;

    const opponentColor = getOpponentColor(color);
    for (const [posStr, piece] of board.pieces.entries()) {
      if (piece.color === opponentColor) {
        const moves = MoveGenerator.getValidMoves(
          board,
          Position.fromString(posStr as AlgebraicNotation),
        );
        if (moves.some((m) => m.to.equals(kingPos))) return true;
      }
    }
    return false;
  }

  getLegalMoves(
    board: Board,
    position: Position,
    enPassantTarget: Position | null = null,
    castlingRights: CastlingRights | null = null,
  ): Move[] {
    const piece = board.getPieceAt(position);
    if (!piece) return [];

    const pseudoLegal = MoveGenerator.getValidMoves(
      board,
      position,
      enPassantTarget,
      castlingRights,
    );

    return pseudoLegal.filter((move) => {
      // Castling-specific rules
      if (move instanceof CastleMove) {
        // Cannot castle while in check
        if (this.isKingInCheck(board, piece.color)) return false;
        // King cannot pass through an attacked square
        const intermediate = board.movePiece(
          move.from,
          move.passThroughSquare,
          move.piece.clone(),
        );
        if (this.isKingInCheck(intermediate, piece.color)) return false;
      }

      // Standard rule: move must not leave own king in check
      const { board: after } = move.execute(board);
      return !this.isKingInCheck(after, piece.color);
    });
  }

  isCheckmate(
    board: Board,
    color: Color,
    enPassantTarget: Position | null,
    castlingRights: CastlingRights,
  ): boolean {
    return (
      this.isKingInCheck(board, color) &&
      !this.hasAnyLegalMoves(board, color, enPassantTarget, castlingRights)
    );
  }

  isStalemate(
    board: Board,
    color: Color,
    enPassantTarget: Position | null,
    castlingRights: CastlingRights,
  ): boolean {
    return (
      !this.isKingInCheck(board, color) &&
      !this.hasAnyLegalMoves(board, color, enPassantTarget, castlingRights)
    );
  }

  isInsufficientMaterial(board: Board): boolean {
    const entries = Array.from(board.pieces.entries());
    const white = entries
      .filter(([, p]) => p.color === Color.WHITE)
      .map(([pos, piece]) => ({
        pos: Position.fromString(pos as AlgebraicNotation),
        piece,
      }));
    const black = entries
      .filter(([, p]) => p.color === Color.BLACK)
      .map(([pos, piece]) => ({
        pos: Position.fromString(pos as AlgebraicNotation),
        piece,
      }));

    // K vs K
    if (white.length === 1 && black.length === 1) return true;

    const isKingPlusMinor = (side: { piece: Piece }[]) =>
      side.length === 2 &&
      side.some((e) => e.piece.type === PieceType.KING) &&
      side.some(
        (e) =>
          e.piece.type === PieceType.BISHOP ||
          e.piece.type === PieceType.KNIGHT,
      );

    // K vs K+minor  (either side)
    if (white.length === 1 && isKingPlusMinor(black)) return true;
    if (black.length === 1 && isKingPlusMinor(white)) return true;

    // K+B vs K+B — insufficient only if bishops share square colour
    const isKingPlusBishop = (side: { piece: Piece }[]) =>
      side.length === 2 &&
      side.some((e) => e.piece.type === PieceType.KING) &&
      side.some((e) => e.piece.type === PieceType.BISHOP);

    if (isKingPlusBishop(white) && isKingPlusBishop(black)) {
      const wb = white.find((e) => e.piece.type === PieceType.BISHOP)!;
      const bb = black.find((e) => e.piece.type === PieceType.BISHOP)!;
      if ((wb.pos.x + wb.pos.y) % 2 === (bb.pos.x + bb.pos.y) % 2) return true;
    }

    return false;
  }

  evaluateStatus(
    board: Board,
    turn: Color,
    enPassantTarget: Position | null,
    castlingRights: CastlingRights,
    halfMoveClock: number,
  ): GameStatus {
    if (this.isCheckmate(board, turn, enPassantTarget, castlingRights))
      return GameStatus.CHECKMATE;
    if (this.isStalemate(board, turn, enPassantTarget, castlingRights))
      return GameStatus.STALEMATE;
    if (halfMoveClock >= 100 || this.isInsufficientMaterial(board))
      return GameStatus.DRAW;
    if (this.isKingInCheck(board, turn)) return GameStatus.CHECK;
    return GameStatus.ACTIVE;
  }

  private hasAnyLegalMoves(
    board: Board,
    color: Color,
    enPassantTarget: Position | null,
    castlingRights: CastlingRights,
  ): boolean {
    for (const [posStr, piece] of board.pieces.entries()) {
      if (piece.color !== color) continue;
      const moves = this.getLegalMoves(
        board,
        Position.fromString(posStr as AlgebraicNotation),
        enPassantTarget,
        castlingRights,
      );
      if (moves.length > 0) return true;
    }
    return false;
  }
}

export const rulesEngine = new RulesEngine();
