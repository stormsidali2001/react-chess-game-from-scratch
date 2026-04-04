import { describe, it, expect } from 'vitest';
import { Position } from '../domain/models/Position';
import type { AlgebraicNotation } from '../domain/models/Position';
import { Piece } from '../domain/models/Piece';
import { GameFactory } from '../domain/services/GameFactory';
import { GameStatus } from '../domain/enums/GameStatus';
import { PieceType } from '../domain/enums/PieceType';
import { Color } from '../domain/enums/Color';

const pos = (square: AlgebraicNotation) => Position.fromAlgebraic(square);

describe('GameFactory', () => {

  describe('createStandardGame', () => {
    it('happy path – should initialise with correct starting state', () => {
      const game = GameFactory.createStandardGame();

      expect(game.turn).toBe(Color.WHITE);
      expect(game.status).toBe(GameStatus.ACTIVE);
      expect(game.history).toHaveLength(0);
      expect(game.halfMoveClock).toBe(0);
      expect(game.enPassantTarget).toBeNull();
      expect(game.domainEvents).toHaveLength(0);
    });

    it('happy path – should initialise with all castling rights intact', () => {
      const game = GameFactory.createStandardGame();

      expect(game.castlingRights.canCastleKingSide(Color.WHITE)).toBe(true);
      expect(game.castlingRights.canCastleQueenSide(Color.WHITE)).toBe(true);
      expect(game.castlingRights.canCastleKingSide(Color.BLACK)).toBe(true);
      expect(game.castlingRights.canCastleQueenSide(Color.BLACK)).toBe(true);
    });

    it('happy path – should place the correct pieces on the board', () => {
      const game = GameFactory.createStandardGame();

      expect(game.board.getPieceAt(pos('e1'))).toEqual(new Piece(PieceType.KING,  Color.WHITE));
      expect(game.board.getPieceAt(pos('d1'))).toEqual(new Piece(PieceType.QUEEN, Color.WHITE));
      expect(game.board.getPieceAt(pos('e8'))).toEqual(new Piece(PieceType.KING,  Color.BLACK));
      expect(game.board.getPieceAt(pos('a2'))).toEqual(new Piece(PieceType.PAWN,  Color.WHITE));
    });

    it('happy path – should place all 32 pieces on the board', () => {
      const game = GameFactory.createStandardGame();

      expect(game.board.pieces.size).toBe(32);
    });

    it('happy path – should place white pieces on ranks 1 and 2', () => {
      const game = GameFactory.createStandardGame();
      const whitePieces = Array.from(game.board.pieces.entries())
        .filter(([, p]) => p.color === Color.WHITE);

      expect(whitePieces).toHaveLength(16);
      expect(whitePieces.every(([sq]) => sq.endsWith('1') || sq.endsWith('2'))).toBe(true);
    });

    it('happy path – should place black pieces on ranks 7 and 8', () => {
      const game = GameFactory.createStandardGame();
      const blackPieces = Array.from(game.board.pieces.entries())
        .filter(([, p]) => p.color === Color.BLACK);

      expect(blackPieces).toHaveLength(16);
      expect(blackPieces.every(([sq]) => sq.endsWith('7') || sq.endsWith('8'))).toBe(true);
    });
  });

});
