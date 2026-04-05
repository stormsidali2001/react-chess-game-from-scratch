import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetLegalMovesQuery } from '../../application/use-cases/GetLegalMoves';
import { IGameRepository } from '../../application/ports/IGameRepository';
import { RulesEngine } from '../../domain/services/RulesEngine';
import { GameFactory } from '../../domain/services/GameFactory';
import { PieceType } from '../../domain/enums/PieceType';
import { Color } from '../../domain/enums/Color';
import { Position } from '../../domain/models/Position';
import type { AlgebraicNotation } from '../../domain/models/Position';
import { Piece } from '../../domain/models/Piece';
import { StandardMove, DoublePawnPushMove, PromotionMove, CastleMove } from '../../domain/models/Move';
import { CastlingRights } from '../../domain/models/CastlingRights';
import { buildGame } from '../helpers/buildGame';
import type { Game } from '../../domain/models/Game';

const pos = (sq: AlgebraicNotation) => Position.fromAlgebraic(sq);

// ── Mock ports ────────────────────────────────────────────────────────────────
const mockRepo: IGameRepository = { getGame: vi.fn(), save: vi.fn() };
const mockRules = { getLegalMoves: vi.fn() } as unknown as RulesEngine;

// ─────────────────────────────────────────────────────────────────────────────

describe('GetLegalMovesQuery', () => {
  let game: Game;
  let query: GetLegalMovesQuery;

  beforeEach(() => {
    vi.resetAllMocks();

    game = GameFactory.createStandardGame();
    vi.mocked(mockRepo.getGame).mockReturnValue(game);

    query = new GetLegalMovesQuery(mockRepo, mockRules);
  });

  // ── happy paths ─────────────────────────────────────────────────────────────
  describe('happy paths', () => {
    it('returns the target squares for all legal moves of the selected piece', () => {
      // Arrange
      const pawn = game.board.getPieceAt(pos('e2'))!;
      vi.mocked(mockRules.getLegalMoves).mockReturnValue([
        new StandardMove(pos('e2'), pos('e3'), pawn),
        new DoublePawnPushMove(pos('e2'), pos('e4'), pawn),
      ]);

      // Act
      const result = query.execute(pos('e2'));

      // Assert
      expect(vi.mocked(mockRepo.getGame)).toHaveBeenCalledOnce();
      expect(vi.mocked(mockRules.getLegalMoves)).toHaveBeenCalledWith(
        game.board,
        pos('e2'),
        game.enPassantTarget,
        game.castlingRights,
      );
      const squares = result.map(p => p.toAlgebraic()).sort();
      expect(squares).toEqual(['e3', 'e4']);
    });

    it('includes the rook\'s square in addition to the king destination for a castling move', () => {
      // Arrange: game with clear castling path
      game = buildGame({
        0: 'a b c d e f g h',
        8: 'k . . . . . . .',
        7: '. . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: 'R . . . K . . R',
      }, { castlingRights: CastlingRights.fromFlags(true, false, false, false) });
      vi.mocked(mockRepo.getGame).mockReturnValue(game);

      const king = game.board.getPieceAt(pos('e1'))!;
      const rook = game.board.getPieceAt(pos('h1'))!;
      const castleMove = new CastleMove(
        pos('e1'), pos('g1'), king, pos('h1'), pos('f1'), rook, pos('f1'),
      );
      vi.mocked(mockRules.getLegalMoves).mockReturnValue([castleMove]);

      // Act
      const result = query.execute(pos('e1'));

      // Assert: both the king's destination (g1) and rook's square (h1) are highlighted
      const squares = result.map(p => p.toAlgebraic()).sort();
      expect(squares).toContain('g1');
      expect(squares).toContain('h1');
      expect(result).toHaveLength(2);
    });

    it('deduplicates target squares when multiple moves share the same destination', () => {
      // Arrange: four promotion moves all targeting the same square (e8)
      const pawn = new Piece(PieceType.PAWN, Color.WHITE);
      vi.mocked(mockRules.getLegalMoves).mockReturnValue([
        new PromotionMove(pos('e7'), pos('e8'), pawn, undefined, PieceType.QUEEN),
        new PromotionMove(pos('e7'), pos('e8'), pawn, undefined, PieceType.ROOK),
        new PromotionMove(pos('e7'), pos('e8'), pawn, undefined, PieceType.BISHOP),
        new PromotionMove(pos('e7'), pos('e8'), pawn, undefined, PieceType.KNIGHT),
      ]);

      // Swap game to black so the e7 "piece" is considered the right turn
      game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . k . . . .',
        7: '. . . . P . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });
      vi.mocked(mockRepo.getGame).mockReturnValue(game);

      // Act
      const result = query.execute(pos('e7'));

      // Assert: four moves but only one unique destination square
      expect(result).toHaveLength(1);
      expect(result[0].toAlgebraic()).toBe('e8');
    });
  });

  // ── failure paths ────────────────────────────────────────────────────────────
  describe('failure paths', () => {
    it('returns an empty array and skips legal-move lookup when the square has no piece', () => {
      // Act: e4 is empty in the starting position
      const result = query.execute(pos('e4'));

      // Assert
      expect(result).toHaveLength(0);
      expect(vi.mocked(mockRules.getLegalMoves)).not.toHaveBeenCalled();
    });

    it("returns an empty array and skips legal-move lookup when it is not the piece owner's turn", () => {
      // Arrange: standard game = white to move; e7 holds a black pawn
      // Act
      const result = query.execute(pos('e7'));

      // Assert
      expect(result).toHaveLength(0);
      expect(vi.mocked(mockRules.getLegalMoves)).not.toHaveBeenCalled();
    });
  });

});
