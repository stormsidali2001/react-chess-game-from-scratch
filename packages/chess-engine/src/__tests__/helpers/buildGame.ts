import { Board } from '../../domain/models/Board';
import { CastlingRights } from '../../domain/models/CastlingRights';
import { Game } from '../../domain/models/Game';
import { Piece } from '../../domain/models/Piece';
import { Position } from '../../domain/models/Position';
import { Color } from '../../domain/enums/Color';
import { PieceType } from '../../domain/enums/PieceType';

const CHAR_TO_TYPE: Record<string, PieceType> = {
  p: PieceType.PAWN,
  r: PieceType.ROOK,
  n: PieceType.KNIGHT,
  b: PieceType.BISHOP,
  q: PieceType.QUEEN,
  k: PieceType.KING,
};

type RankKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Maps each chess rank (1–8) to a rank string, with an optional file-label
 * header at key 0 for readability.
 *
 * Key 8 = rank 8 (top of board), key 1 = rank 1 (bottom of board).
 * Key 0 = optional 'a b c d e f g h' header — parsed and ignored.
 */
export type BoardRows = { [K in RankKey]: string } & { 0?: string };

interface BuildGameOptions {
  turn?:            Color;
  castlingRights?:  CastlingRights;
  enPassantTarget?: Position | null;
  halfMoveClock?:   number;
}

/**
 * Creates a Game from a BoardRows object.
 *
 * Each rank string contains 8 space-separated tokens:
 *   uppercase letter  = white piece  (K Q R B N P)
 *   lowercase letter  = black piece  (k q r b n p)
 *   dot               = empty square (.)
 *
 * Example:
 *
 *   buildGame({
 *     0: 'a b c d e f g h',
 *     8: 'r n b q k b n r',
 *     7: 'p p p . p p p p',
 *     6: '. . . . . . . .',
 *     5: '. . . p P . . .',
 *     4: '. . . . . . . .',
 *     3: '. . . . . . . .',
 *     2: 'P P P P . P P P',
 *     1: 'R N B Q K B N R',
 *   })
 */
export function buildGame(rows: BoardRows, options: BuildGameOptions = {}): Game {
  const pieces = new Map<string, Piece>();

  for (let rank = 8; rank >= 1; rank--) {
    const y = 8 - rank;
    const row = rows[rank as RankKey];
    const cells = row.trim().split(/\s+/);
    if (cells.length !== 8) {
      throw new Error(`Rank ${rank} must have exactly 8 cells, got: "${row}"`);
    }
    for (let x = 0; x < 8; x++) {
      const cell = cells[x];
      if (cell === '.') continue;
      const type = CHAR_TO_TYPE[cell.toLowerCase()];
      if (!type) throw new Error(`Unknown piece character: "${cell}" at rank ${rank}, file ${x}`);
      const color = cell === cell.toUpperCase() ? Color.WHITE : Color.BLACK;
      pieces.set(new Position(x, y).toString(), new Piece(type, color));
    }
  }

  return Game.create({
    board:           new Board(pieces),
    turn:            options.turn            ?? Color.WHITE,
    castlingRights:  options.castlingRights  ?? CastlingRights.fromFlags(false, false, false, false),
    enPassantTarget: options.enPassantTarget ?? null,
    halfMoveClock:   options.halfMoveClock   ?? 0,
  });
}
