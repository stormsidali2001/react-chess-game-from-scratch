import { describe, it, expect } from 'vitest';
import { RulesEngine } from '../domain/services/RulesEngine';
import { Color } from '../domain/enums/Color';
import { GameStatus } from '../domain/enums/GameStatus';
import { Position } from '../domain/models/Position';
import type { AlgebraicNotation } from '../domain/models/Position';
import { CastlingRights } from '../domain/models/CastlingRights';
import { CastleMove } from '../domain/models/Move';
import { buildGame } from './helpers/buildGame';

const rules = new RulesEngine();
const pos = (square: AlgebraicNotation) => Position.fromAlgebraic(square);
const noRights  = CastlingRights.fromFlags(false, false, false, false);
const allRights = CastlingRights.fromFlags(true,  true,  true,  true);

// ─────────────────────────────────────────────────────────────────────────────

describe('RulesEngine', () => {

  // ── isKingInCheck ──────────────────────────────────────────────────────────
  describe('isKingInCheck', () => {
    it('happy path – should return false when neither king has any attackers', () => {
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

      // Assert
      expect(rules.isKingInCheck(game.board, Color.WHITE)).toBe(false);
      expect(rules.isKingInCheck(game.board, Color.BLACK)).toBe(false);
    });

    it('happy path – should return true when king is attacked by a rook along the same rank', () => {
      // Arrange: white rook at a8 attacks black king at h8 along rank 8
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'R . . . . . . k',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      // Assert
      expect(rules.isKingInCheck(game.board, Color.BLACK)).toBe(true);
      expect(rules.isKingInCheck(game.board, Color.WHITE)).toBe(false);
    });

    it('happy path – should return true when king is attacked by a bishop along a diagonal', () => {
      // Arrange: black bishop at h4 attacks white king at e1 (diagonal h4–g3–f2–e1)
      const game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . k . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . b',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      // Assert
      expect(rules.isKingInCheck(game.board, Color.WHITE)).toBe(true);
    });

    it('happy path – should return false when an attacker is blocked by an intervening piece', () => {
      // Arrange: same diagonal as above but white pawn at f2 blocks the bishop
      const game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . k . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . b',
        3: '. . . . . . . .',
        2: '. . . . . P . .',
        1: '. . . . K . . .',
      });

      // Assert
      expect(rules.isKingInCheck(game.board, Color.WHITE)).toBe(false);
    });
  });

  // ── getLegalMoves ──────────────────────────────────────────────────────────
  describe('getLegalMoves', () => {
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
      const moves = rules.getLegalMoves(game.board, pos('d4'));

      // Assert
      expect(moves).toHaveLength(0);
    });

    it('happy path – should only allow pinned piece to move along the pin axis', () => {
      // Arrange: white rook at e4 is pinned — black rook at e8 would expose white king at e1
      const game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . . r . . k',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . R . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      // Act
      const moves = rules.getLegalMoves(game.board, pos('e4'), null, noRights);

      // Assert
      const destinations = moves.map(m => m.to.toAlgebraic());
      // Can only move along the e-file (pin axis)
      expect(destinations).toContain('e2');
      expect(destinations).toContain('e3');
      expect(destinations).toContain('e5');
      expect(destinations).toContain('e6');
      expect(destinations).toContain('e7');
      expect(destinations).toContain('e8'); // captures the pinner
      // Cannot leave the e-file
      expect(destinations).not.toContain('d4');
      expect(destinations).not.toContain('f4');
    });

    it('happy path – should not allow castling while the king is in check', () => {
      // Arrange: white king at e1 in check from black rook at e8; castling rights present
      const game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . . r . . k',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: 'R . . . K . . R',
      });

      // Act
      const moves = rules.getLegalMoves(game.board, pos('e1'), null, allRights);

      // Assert
      expect(moves.every(m => !(m instanceof CastleMove))).toBe(true);
    });

    it('happy path – should not allow castling when king passes through an attacked square', () => {
      // Arrange: black rook at f8 attacks f1 — white king cannot castle kingside through f1
      const game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . . . r k .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . R',
      });
      const kingSideOnly = CastlingRights.fromFlags(true, false, false, false);

      // Act
      const moves = rules.getLegalMoves(game.board, pos('e1'), null, kingSideOnly);

      // Assert: no castle move to g1
      const castleMoves = moves.filter(m => m instanceof CastleMove);
      expect(castleMoves).toHaveLength(0);
    });
  });

  // ── isCheckmate ────────────────────────────────────────────────────────────
  describe('isCheckmate', () => {
    it('happy path – should return true for a back-rank checkmate', () => {
      // Arrange: white rook at a8 checks black king at g8; black pawns seal the escape on rank 7
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'R . . . . . k .',
        7: '. . . . . p p p',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      }, { turn: Color.BLACK });

      // Assert
      expect(rules.isCheckmate(game.board, Color.BLACK, null, noRights)).toBe(true);
    });

    it('happy path – should return false when the king is in check but can escape', () => {
      // Arrange: white rook at a8 checks black king at h8; h7 is open for escape
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'R . . . . . . k',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      }, { turn: Color.BLACK });

      // Assert
      expect(rules.isCheckmate(game.board, Color.BLACK, null, noRights)).toBe(false);
    });

    it('happy path – should return false when the king is not in check at all', () => {
      // Arrange: standard opening position
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'r n b q k b n r',
        7: 'p p p p p p p p',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: 'P P P P P P P P',
        1: 'R N B Q K B N R',
      });

      // Assert
      expect(rules.isCheckmate(game.board, Color.WHITE, null, allRights)).toBe(false);
    });
  });

  // ── isStalemate ────────────────────────────────────────────────────────────
  describe('isStalemate', () => {
    it('happy path – should return true when player has no legal moves and is not in check', () => {
      // Arrange: classic stalemate – black king at a8, white queen at b6, white king at c6
      // Black king cannot move to a7 (queen diagonal), b8 (queen file), or b7 (queen + king)
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. Q K . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . . . . .',
      }, { turn: Color.BLACK });

      // Assert
      expect(rules.isStalemate(game.board, Color.BLACK, null, noRights)).toBe(true);
    });

    it('happy path – should return false when the player is in check (checkmate, not stalemate)', () => {
      // Arrange: back-rank checkmate position
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'R . . . . . k .',
        7: '. . . . . p p p',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      }, { turn: Color.BLACK });

      // Assert
      expect(rules.isStalemate(game.board, Color.BLACK, null, noRights)).toBe(false);
    });

    it('happy path – should return false when the player still has legal moves', () => {
      // Arrange: standard opening — white has many legal moves
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'r n b q k b n r',
        7: 'p p p p p p p p',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: 'P P P P P P P P',
        1: 'R N B Q K B N R',
      });

      // Assert
      expect(rules.isStalemate(game.board, Color.WHITE, null, allRights)).toBe(false);
    });
  });

  // ── isInsufficientMaterial ─────────────────────────────────────────────────
  describe('isInsufficientMaterial', () => {
    it('happy path – should return true for K vs K', () => {
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

      expect(rules.isInsufficientMaterial(game.board)).toBe(true);
    });

    it('happy path – should return true for K vs K+N (knight cannot force checkmate)', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k n . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      expect(rules.isInsufficientMaterial(game.board)).toBe(true);
    });

    it('happy path – should return true for K+B vs K+B when bishops are on the same colour squares', () => {
      // White bishop at a1 (parity 1), black bishop at e3 (parity 1) — same colour
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . b . . .',
        2: '. . . . . . . .',
        1: 'B . . . K . . .',
      });

      expect(rules.isInsufficientMaterial(game.board)).toBe(true);
    });

    it('happy path – should return false for K+B vs K+B when bishops are on different colour squares', () => {
      // White bishop at b1 (parity 0), black bishop at e3 (parity 1) — different colour
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . b . . .',
        2: '. . . . . . . .',
        1: '. B . . K . . .',
      });

      expect(rules.isInsufficientMaterial(game.board)).toBe(false);
    });

    it('happy path – should return false when a queen is on the board', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . Q K . . .',
      });

      expect(rules.isInsufficientMaterial(game.board)).toBe(false);
    });
  });

  // ── evaluateStatus ─────────────────────────────────────────────────────────
  describe('evaluateStatus', () => {
    it('happy path – should return CHECKMATE when the current player is checkmated', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'R . . . . . k .',
        7: '. . . . . p p p',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      }, { turn: Color.BLACK });

      const status = rules.evaluateStatus(game.board, Color.BLACK, null, noRights, 0);

      expect(status).toBe(GameStatus.CHECKMATE);
    });

    it('happy path – should return STALEMATE when the current player has no legal moves and is not in check', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. Q K . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . . . . .',
      }, { turn: Color.BLACK });

      const status = rules.evaluateStatus(game.board, Color.BLACK, null, noRights, 0);

      expect(status).toBe(GameStatus.STALEMATE);
    });

    it('happy path – should return DRAW when the half-move clock reaches 100', () => {
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

      const status = rules.evaluateStatus(game.board, Color.WHITE, null, noRights, 100);

      expect(status).toBe(GameStatus.DRAW);
    });

    it('happy path – should return DRAW when only kings remain (insufficient material)', () => {
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

      const status = rules.evaluateStatus(game.board, Color.WHITE, null, noRights, 0);

      expect(status).toBe(GameStatus.DRAW);
    });

    it('happy path – should return CHECK when the current player is in check but has escape moves', () => {
      // Arrange: black rook at e8 checks white king at e1; king can step to d1 or f1
      const game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . . r . . k',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });

      const status = rules.evaluateStatus(game.board, Color.WHITE, null, noRights, 0);

      expect(status).toBe(GameStatus.CHECK);
    });

    it('happy path – should return ACTIVE when the position is completely normal', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'r n b q k b n r',
        7: 'p p p p p p p p',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: 'P P P P P P P P',
        1: 'R N B Q K B N R',
      });

      const status = rules.evaluateStatus(game.board, Color.WHITE, null, allRights, 0);

      expect(status).toBe(GameStatus.ACTIVE);
    });
  });

});
