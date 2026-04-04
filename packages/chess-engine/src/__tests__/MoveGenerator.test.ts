import { describe, it, expect } from 'vitest';
import { MoveGenerator } from '../domain/services/MoveGenerator';
import { PieceType } from '../domain/enums/PieceType';
import { Position } from '../domain/models/Position';
import type { AlgebraicNotation } from '../domain/models/Position';
import { CastlingRights } from '../domain/models/CastlingRights';
import {
  StandardMove,
  DoublePawnPushMove,
  EnPassantMove,
  PromotionMove,
  CastleMove,
} from '../domain/models/Move';
import { buildGame } from './helpers/buildGame';

const pos = (square: AlgebraicNotation) => Position.fromAlgebraic(square);
const noRights  = CastlingRights.fromFlags(false, false, false, false);
const allRights = CastlingRights.fromFlags(true,  true,  true,  true);

const destinations = (moves: ReturnType<typeof MoveGenerator.getValidMoves>) =>
  moves.map(m => m.to.toAlgebraic()).sort();

// ─────────────────────────────────────────────────────────────────────────────

describe('MoveGenerator', () => {

  // ── empty square ───────────────────────────────────────────────────────────
  describe('getValidMoves – empty square', () => {
    it('happy path – should return an empty array for a square with no piece', () => {
      // Arrange
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('d4'));

      // Assert
      expect(moves).toHaveLength(0);
    });
  });

  // ── pawn ───────────────────────────────────────────────────────────────────
  describe('getValidMoves – pawn', () => {
    it('happy path – should generate a single push and a double push from the starting rank', () => {
      // Arrange: isolated white pawn on e2
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . P . . .',
        1: '. . . . K . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('e2'));

      // Assert
      expect(moves.some(m => m instanceof StandardMove     && m.to.equals(pos('e3')))).toBe(true);
      expect(moves.some(m => m instanceof DoublePawnPushMove && m.to.equals(pos('e4')))).toBe(true);
      expect(moves).toHaveLength(2);
    });

    it('happy path – should not allow a double push when the pawn is not on its starting rank', () => {
      // Arrange: white pawn already advanced to e3
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . P . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('e3'));

      // Assert
      expect(moves.every(m => !(m instanceof DoublePawnPushMove))).toBe(true);
      expect(moves).toHaveLength(1); // only e4
    });

    it('happy path – should generate a capture move for each enemy piece on the diagonals', () => {
      // Arrange: white pawn at e4, black pawns at d5 and f5
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . p . p . .',
        4: '. . . . P . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('e4'));

      // Assert
      expect(destinations(moves)).toContain('d5');
      expect(destinations(moves)).toContain('e5');
      expect(destinations(moves)).toContain('f5');
    });

    it('happy path – should generate an en passant capture when the target square is set', () => {
      // Arrange: white pawn at e5, black pawn just double-pushed to d5, en passant target d6
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . p P . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      }, { enPassantTarget: pos('d6') });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('e5'), pos('d6'));

      // Assert
      const enPassants = moves.filter(m => m instanceof EnPassantMove);
      expect(enPassants).toHaveLength(1);
      expect(enPassants[0].to.equals(pos('d6'))).toBe(true);
    });

    it('happy path – should generate four promotion moves when a pawn reaches the last rank', () => {
      // Arrange: white pawn one step from promotion; kings placed away from pawn diagonals
      const game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . . . . . k',
        7: '. . . . P . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('e7'));

      // Assert: one promotion move per piece type
      const promotions = moves.filter(m => m instanceof PromotionMove) as PromotionMove[];
      const promotedTypes = promotions.map(m => m.promotionType).sort();
      expect(promotedTypes).toEqual([
        PieceType.BISHOP,
        PieceType.KNIGHT,
        PieceType.QUEEN,
        PieceType.ROOK,
      ]);
    });
  });

  // ── knight ─────────────────────────────────────────────────────────────────
  describe('getValidMoves – knight', () => {
    it('happy path – should generate exactly 8 moves for a knight in the centre of the board', () => {
      // Arrange: isolated white knight at d4
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . N . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('d4'));

      // Assert
      expect(moves).toHaveLength(8);
      expect(destinations(moves)).toEqual(
        ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'],
      );
    });

    it('happy path – should generate only 2 moves for a knight in the corner', () => {
      // Arrange: white knight at a1 — only b3 and c2 are reachable
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: 'N . . . K . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('a1'));

      // Assert
      expect(moves).toHaveLength(2);
      expect(destinations(moves)).toEqual(['b3', 'c2']);
    });
  });

  // ── rook ───────────────────────────────────────────────────────────────────
  describe('getValidMoves – rook', () => {
    it('happy path – should generate 14 moves for a rook in the centre of an empty board', () => {
      // Arrange: isolated white rook at d4
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . R . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('d4'));

      // Assert: 7 along the file + 7 along the rank
      expect(moves).toHaveLength(14);
    });

    it('happy path – should stop sliding when blocked by an own piece and not produce a capture', () => {
      // Arrange: white rook at a1, white pawn at a4 — rook can only reach a2, a3
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: 'P . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: 'R . . . K . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('a1'));
      const fileMoves = moves.filter(m => m.to.toAlgebraic()[0] === 'a');

      // Assert: can only reach a2 and a3 (a4 is blocked by own pawn)
      expect(destinations(fileMoves)).toEqual(['a2', 'a3']);
      expect(destinations(fileMoves)).not.toContain('a4');
      expect(destinations(fileMoves)).not.toContain('a5');
    });

    it('happy path – should stop at and include a capture of an opponent piece', () => {
      // Arrange: white rook at a1, black pawn at a5 — rook can reach a2, a3, a4, a5 (capture)
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: 'p . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: 'R . . . K . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('a1'));
      const fileMoves = moves.filter(m => m.to.toAlgebraic()[0] === 'a');

      // Assert: reaches a5 (capture) but not a6+
      expect(destinations(fileMoves)).toContain('a5');
      expect(destinations(fileMoves)).not.toContain('a6');
      expect(destinations(fileMoves)).not.toContain('a7');
    });
  });

  // ── king ───────────────────────────────────────────────────────────────────
  describe('getValidMoves – king', () => {
    it('happy path – should generate up to 8 moves from a central square', () => {
      // Arrange: isolated white king at d4
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . K . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . . . . .',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('d4'), null, noRights);

      // Assert
      expect(moves).toHaveLength(8);
      expect(destinations(moves)).toEqual(['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5']);
    });

    it('happy path – should generate castling moves when rights are present and squares are clear', () => {
      // Arrange: white king at e1 with both rooks present and clear path
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: 'R . . . K . . R',
      });

      // Act
      const moves = MoveGenerator.getValidMoves(game.board, pos('e1'), null, allRights);

      // Assert: both castle moves are present
      const castleMoves = moves.filter(m => m instanceof CastleMove);
      expect(castleMoves).toHaveLength(2);
      const castleDestinations = castleMoves.map(m => m.to.toAlgebraic()).sort();
      expect(castleDestinations).toEqual(['c1', 'g1']); // queenside and kingside
    });
  });

});
