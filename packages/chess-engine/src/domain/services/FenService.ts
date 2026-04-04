import { Board } from '../models/Board';
import { CastlingRights } from '../models/CastlingRights';
import { Game } from '../models/Game';
import { Piece } from '../models/Piece';
import { Position } from '../models/Position';
import type { AlgebraicNotation } from '../models/Position';
import { Color } from '../enums/Color';
import { GameStatus } from '../enums/GameStatus';
import { PieceType } from '../enums/PieceType';

// FEN letter → PieceType
const LETTER_TO_TYPE: Record<string, PieceType> = {
  p: PieceType.PAWN,
  r: PieceType.ROOK,
  n: PieceType.KNIGHT,
  b: PieceType.BISHOP,
  q: PieceType.QUEEN,
  k: PieceType.KING,
};

// PieceType → FEN letter (lowercase; uppercase for white)
const TYPE_TO_LETTER: Record<PieceType, string> = {
  [PieceType.PAWN]:   'p',
  [PieceType.ROOK]:   'r',
  [PieceType.KNIGHT]: 'n',
  [PieceType.BISHOP]: 'b',
  [PieceType.QUEEN]:  'q',
  [PieceType.KING]:   'k',
};

export class FenService {
  // ── Serialization ──────────────────────────────────────────────────────────

  static serialize(game: Game): string {
    return [
      this.serializePieces(game.board),
      game.turn === Color.WHITE ? 'w' : 'b',
      this.serializeCastling(game.castlingRights),
      this.serializeEnPassant(game.enPassantTarget),
      game.halfMoveClock,
      Math.floor(game.history.length / 2) + 1,
    ].join(' ');
  }

  private static serializePieces(board: Board): string {
    const ranks: string[] = [];

    for (let y = 0; y < 8; y++) {
      let rank = '';
      let empty = 0;

      for (let x = 0; x < 8; x++) {
        const piece = board.getPieceAt(new Position(x, y));
        if (!piece) {
          empty++;
        } else {
          if (empty > 0) { rank += empty; empty = 0; }
          const letter = TYPE_TO_LETTER[piece.type];
          rank += piece.color === Color.WHITE ? letter.toUpperCase() : letter;
        }
      }

      if (empty > 0) rank += empty;
      ranks.push(rank);
    }

    return ranks.join('/');
  }

  private static serializeCastling(rights: CastlingRights): string {
    const flags =
      (rights.canCastleKingSide(Color.WHITE)  ? 'K' : '') +
      (rights.canCastleQueenSide(Color.WHITE) ? 'Q' : '') +
      (rights.canCastleKingSide(Color.BLACK)  ? 'k' : '') +
      (rights.canCastleQueenSide(Color.BLACK) ? 'q' : '');
    return flags || '-';
  }

  private static serializeEnPassant(target: Position | null): string {
    if (!target) return '-';
    return target.toAlgebraic();
  }

  // ── Deserialization ────────────────────────────────────────────────────────

  static deserialize(fen: string): Game {
    const [pieces, turn, castling, enPassant, halfMove] = fen.trim().split(/\s+/);

    const board           = this.deserializePieces(pieces);
    const activeColor     = turn === 'w' ? Color.WHITE : Color.BLACK;
    const castlingRights  = this.deserializeCastling(castling);
    const enPassantTarget = this.deserializeEnPassant(enPassant);
    const halfMoveClock = parseInt(halfMove ?? '0', 10);

    return Game.create({
      board,
      turn:          activeColor,
      castlingRights,
      enPassantTarget,
      halfMoveClock,
      status:        GameStatus.ACTIVE,
      history:       [],
    });
  }

  private static deserializePieces(piecesField: string): Board {
    let pieces = new Map<string, Piece>();
    const ranks = piecesField.split('/');

    for (let y = 0; y < 8; y++) {
      let x = 0;
      for (const ch of ranks[y]) {
        if (ch >= '1' && ch <= '8') {
          x += parseInt(ch, 10);
        } else {
          const color = ch === ch.toUpperCase() ? Color.WHITE : Color.BLACK;
          const type  = LETTER_TO_TYPE[ch.toLowerCase()];
          if (!type) throw new Error(`Invalid FEN piece character: ${ch}`);
          pieces.set(new Position(x, y).toString(), new Piece(type, color));
          x++;
        }
      }
    }

    return new Board(pieces);
  }

  private static deserializeCastling(castling: string): CastlingRights {
    return CastlingRights.fromFlags(
      castling.includes('K'),
      castling.includes('Q'),
      castling.includes('k'),
      castling.includes('q'),
    );
  }

  private static deserializeEnPassant(enPassant: string): Position | null {
    if (!enPassant || enPassant === '-') return null;
    return Position.fromAlgebraic(enPassant as AlgebraicNotation);
  }
}
