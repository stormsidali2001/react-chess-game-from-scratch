import { describe, it, expect } from 'vitest';
import { MoveNotationService } from '../domain/services/MoveNotationService';
import { GameStatus } from '../domain/enums/GameStatus';
import { PieceType } from '../domain/enums/PieceType';
import { Color } from '../domain/enums/Color';
import { Position } from '../domain/models/Position';
import type { AlgebraicNotation } from '../domain/models/Position';
import { Piece } from '../domain/models/Piece';
import type { MoveRecord } from '../domain/models/MoveRecord';

const pos   = (sq: AlgebraicNotation) => Position.fromAlgebraic(sq);
const white = (type: PieceType)       => new Piece(type, Color.WHITE);
const black = (type: PieceType)       => new Piece(type, Color.BLACK);

// ─────────────────────────────────────────────────────────────────────────────

describe('MoveNotationService', () => {

  describe('toAlgebraic', () => {
    it('happy path – should produce a destination-only string for a quiet pawn move', () => {
      // Arrange
      const record: MoveRecord = {
        from: pos('e2'), to: pos('e4'),
        piece: white(PieceType.PAWN),
      };

      // Act
      const notation = MoveNotationService.toAlgebraic(record, GameStatus.ACTIVE);

      // Assert
      expect(notation).toBe('e4');
    });

    it('happy path – should prefix the source file and add "x" for a pawn capture', () => {
      // Arrange: white pawn on e4 captures on d5
      const record: MoveRecord = {
        from: pos('e4'), to: pos('d5'),
        piece: white(PieceType.PAWN),
        captured: black(PieceType.PAWN),
      };

      // Act
      const notation = MoveNotationService.toAlgebraic(record, GameStatus.ACTIVE);

      // Assert
      expect(notation).toBe('exd5');
    });

    it('happy path – should prefix the piece letter for a quiet piece move', () => {
      // Arrange: white knight from g1 to f3
      const record: MoveRecord = {
        from: pos('g1'), to: pos('f3'),
        piece: white(PieceType.KNIGHT),
      };

      // Act
      const notation = MoveNotationService.toAlgebraic(record, GameStatus.ACTIVE);

      // Assert
      expect(notation).toBe('Nf3');
    });

    it('happy path – should include "x" after the piece letter for a piece capture', () => {
      // Arrange: white bishop captures on e5
      const record: MoveRecord = {
        from: pos('c3'), to: pos('e5'),
        piece: white(PieceType.BISHOP),
        captured: black(PieceType.KNIGHT),
      };

      // Act
      const notation = MoveNotationService.toAlgebraic(record, GameStatus.ACTIVE);

      // Assert
      expect(notation).toBe('Bxe5');
    });

    it('happy path – should produce "O-O" for a kingside castle', () => {
      // Arrange: king moves two squares right (e1→g1)
      const record: MoveRecord = {
        from: pos('e1'), to: pos('g1'),
        piece: white(PieceType.KING),
      };

      // Act
      const notation = MoveNotationService.toAlgebraic(record, GameStatus.ACTIVE);

      // Assert
      expect(notation).toBe('O-O');
    });

    it('happy path – should produce "O-O-O" for a queenside castle', () => {
      // Arrange: king moves two squares left (e1→c1)
      const record: MoveRecord = {
        from: pos('e1'), to: pos('c1'),
        piece: white(PieceType.KING),
      };

      // Act
      const notation = MoveNotationService.toAlgebraic(record, GameStatus.ACTIVE);

      // Assert
      expect(notation).toBe('O-O-O');
    });

    it('happy path – should append "=<piece>" for a pawn promotion', () => {
      // Arrange: white pawn promotes to queen on a8
      const record: MoveRecord = {
        from: pos('a7'), to: pos('a8'),
        piece: white(PieceType.PAWN),
        promotedTo: PieceType.QUEEN,
      };

      // Act
      const notation = MoveNotationService.toAlgebraic(record, GameStatus.ACTIVE);

      // Assert
      expect(notation).toBe('a8=Q');
    });

    it('happy path – should append "+" when the move results in check', () => {
      // Arrange: any move that leads to CHECK status
      const record: MoveRecord = {
        from: pos('d1'), to: pos('d8'),
        piece: white(PieceType.QUEEN),
      };

      // Act
      const notation = MoveNotationService.toAlgebraic(record, GameStatus.CHECK);

      // Assert
      expect(notation).toBe('Qd8+');
    });

    it('happy path – should append "#" when the move results in checkmate', () => {
      // Arrange: the mating move
      const record: MoveRecord = {
        from: pos('a1'), to: pos('a8'),
        piece: white(PieceType.ROOK),
      };

      // Act
      const notation = MoveNotationService.toAlgebraic(record, GameStatus.CHECKMATE);

      // Assert
      expect(notation).toBe('Ra8#');
    });
  });

});
