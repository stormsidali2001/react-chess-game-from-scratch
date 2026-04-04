import { describe, it, expect } from 'vitest';
import { FenService } from '../domain/services/FenService';
import { GameFactory } from '../domain/services/GameFactory';
import { Color } from '../domain/enums/Color';
import { GameStatus } from '../domain/enums/GameStatus';
import { PieceType } from '../domain/enums/PieceType';
import { Position } from '../domain/models/Position';
import type { AlgebraicNotation } from '../domain/models/Position';
import { Piece } from '../domain/models/Piece';

const pos = (sq: AlgebraicNotation) => Position.fromAlgebraic(sq);

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// ─────────────────────────────────────────────────────────────────────────────

describe('FenService', () => {

  // ── serialize ──────────────────────────────────────────────────────────────
  describe('serialize', () => {
    it('happy path – should produce the standard FEN string for the starting position', () => {
      // Arrange
      const game = GameFactory.createStandardGame();

      // Act
      const fen = FenService.serialize(game);

      // Assert
      expect(fen).toBe(STARTING_FEN);
    });

    it('happy path – should reflect the active color in the FEN', () => {
      // Arrange: standard game is white to move
      const game = GameFactory.createStandardGame();

      // Act + Assert
      expect(FenService.serialize(game)).toContain(' w ');
    });

    it('happy path – should serialize an en passant target square correctly', () => {
      // Arrange: deserialize a FEN that already carries an en passant target
      const game = FenService.deserialize('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');

      // Act
      const fen = FenService.serialize(game);

      // Assert
      expect(fen).toContain('e6');
    });

    it('happy path – should produce "-" for castling when all rights have been revoked', () => {
      // Arrange: deserialize a no-castling-rights position, then re-serialize
      const noRightsFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
      const game = FenService.deserialize(noRightsFen);

      // Act
      const fen = FenService.serialize(game);

      // Assert
      expect(fen).toContain(' - '); // castling field is '-'
    });
  });

  // ── deserialize ────────────────────────────────────────────────────────────
  describe('deserialize', () => {
    it('happy path – should restore the standard starting position from FEN', () => {
      // Act
      const game = FenService.deserialize(STARTING_FEN);

      // Assert
      expect(game.turn).toBe(Color.WHITE);
      expect(game.status).toBe(GameStatus.ACTIVE);
      expect(game.halfMoveClock).toBe(0);
      expect(game.enPassantTarget).toBeNull();
      expect(game.history).toHaveLength(0);
      expect(game.board.pieces.size).toBe(32);
    });

    it('happy path – should place pieces on the correct squares', () => {
      // Act
      const game = FenService.deserialize(STARTING_FEN);

      // Assert
      expect(game.board.getPieceAt(pos('e1'))).toEqual(new Piece(PieceType.KING,  Color.WHITE));
      expect(game.board.getPieceAt(pos('e8'))).toEqual(new Piece(PieceType.KING,  Color.BLACK));
      expect(game.board.getPieceAt(pos('d1'))).toEqual(new Piece(PieceType.QUEEN, Color.WHITE));
      expect(game.board.getPieceAt(pos('a2'))).toEqual(new Piece(PieceType.PAWN,  Color.WHITE));
    });

    it('happy path – should restore all four castling rights from "KQkq"', () => {
      // Act
      const game = FenService.deserialize(STARTING_FEN);

      // Assert
      expect(game.castlingRights.canCastleKingSide(Color.WHITE)).toBe(true);
      expect(game.castlingRights.canCastleQueenSide(Color.WHITE)).toBe(true);
      expect(game.castlingRights.canCastleKingSide(Color.BLACK)).toBe(true);
      expect(game.castlingRights.canCastleQueenSide(Color.BLACK)).toBe(true);
    });

    it('happy path – should set all castling rights to false when the FEN field is "-"', () => {
      // Arrange
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';

      // Act
      const game = FenService.deserialize(fen);

      // Assert
      expect(game.castlingRights.canCastleKingSide(Color.WHITE)).toBe(false);
      expect(game.castlingRights.canCastleQueenSide(Color.WHITE)).toBe(false);
      expect(game.castlingRights.canCastleKingSide(Color.BLACK)).toBe(false);
      expect(game.castlingRights.canCastleQueenSide(Color.BLACK)).toBe(false);
    });

    it('happy path – should parse an en passant target square', () => {
      // Arrange: position after 1.e4 e5 — en passant target is e6
      const fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';

      // Act
      const game = FenService.deserialize(fen);

      // Assert
      expect(game.enPassantTarget).toEqual(pos('e6'));
    });

    it('happy path – should restore the half-move clock', () => {
      // Arrange: position with 15 half-moves on the clock
      const fen = '8/5N2/4p2p/5p1k/1p4rP/1P2Q1P1/P4P1K/5q2 w - - 15 44';

      // Act
      const game = FenService.deserialize(fen);

      // Assert
      expect(game.halfMoveClock).toBe(15);
    });

    it('failure path – should throw when the FEN contains an unknown piece character', () => {
      // Arrange: 'x' is not a valid FEN piece letter
      const invalidFen = 'rnbxkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      // Act + Assert
      expect(() => FenService.deserialize(invalidFen)).toThrow();
    });
  });

  // ── roundtrip ──────────────────────────────────────────────────────────────
  describe('roundtrip', () => {
    it('happy path – serialize then deserialize should preserve the full game state', () => {
      // Arrange: a mid-game position loaded from FEN
      const originalFen = '8/5N2/4p2p/5p1k/1p4rP/1P2Q1P1/P4P1K/5q2 w - - 15 44';
      const original = FenService.deserialize(originalFen);

      // Act: serialize back to FEN and deserialize again
      const roundTripped = FenService.deserialize(FenService.serialize(original));

      // Assert
      expect(roundTripped.turn).toBe(original.turn);
      expect(roundTripped.halfMoveClock).toBe(original.halfMoveClock);
      expect(roundTripped.enPassantTarget).toEqual(original.enPassantTarget);
      expect(roundTripped.castlingRights).toEqual(original.castlingRights);
      expect(roundTripped.board.pieces.size).toBe(original.board.pieces.size);
    });
  });

});
