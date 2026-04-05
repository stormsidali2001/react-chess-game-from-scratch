import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MakeMoveUseCase } from '../../application/use-cases/MakeMove';
import { IGameRepository } from '../../application/ports/IGameRepository';
import { DomainEventDispatcher } from '../../application/DomainEventDispatcher';
import { RulesEngine } from '../../domain/services/RulesEngine';
import { GameFactory } from '../../domain/services/GameFactory';
import { GameStatus } from '../../domain/enums/GameStatus';
import { PieceType } from '../../domain/enums/PieceType';
import { Position } from '../../domain/models/Position';
import type { AlgebraicNotation } from '../../domain/models/Position';
import { DoublePawnPushMove, PromotionMove } from '../../domain/models/Move';
import { PieceMovedEvent } from '../../domain/events/ChessEvents';
import { IllegalMoveError } from '../../domain/errors';
import type { Game } from '../../domain/models/Game';

const pos = (sq: AlgebraicNotation) => Position.fromAlgebraic(sq);

// ── Mock ports ────────────────────────────────────────────────────────────────
const mockRepo: IGameRepository = { getGame: vi.fn(), save: vi.fn() };
const mockDispatcher = { dispatchMany: vi.fn() } as unknown as DomainEventDispatcher;
const mockRules = { getLegalMoves: vi.fn(), evaluateStatus: vi.fn() } as unknown as RulesEngine;

// ─────────────────────────────────────────────────────────────────────────────

describe('MakeMoveUseCase', () => {
  let game: Game;
  let useCase: MakeMoveUseCase;

  beforeEach(() => {
    vi.resetAllMocks();

    game = GameFactory.createStandardGame();
    vi.mocked(mockRepo.getGame).mockReturnValue(game);
    vi.mocked(mockRules.evaluateStatus).mockReturnValue(GameStatus.ACTIVE);

    useCase = new MakeMoveUseCase(mockRepo, mockDispatcher, mockRules);
  });

  // ── happy paths ─────────────────────────────────────────────────────────────
  describe('happy paths', () => {
    it('fetches the game, applies the move, saves, and dispatches events', () => {
      // Arrange
      const pawn = game.board.getPieceAt(pos('e2'))!;
      const move = new DoublePawnPushMove(pos('e2'), pos('e4'), pawn);
      vi.mocked(mockRules.getLegalMoves).mockReturnValue([move]);

      // Snapshot the pre-move state — the aggregate mutates during execute
      const boardBefore = game.board;
      const castlingBefore = game.castlingRights;

      // Act
      useCase.execute(pos('e2'), pos('e4'));

      // Assert – repository
      expect(vi.mocked(mockRepo.getGame)).toHaveBeenCalledOnce();
      expect(vi.mocked(mockRepo.save)).toHaveBeenCalledOnce();
      expect(vi.mocked(mockRepo.save)).toHaveBeenCalledWith(game);

      // Assert – rules engine called with the pre-move board
      expect(vi.mocked(mockRules.getLegalMoves)).toHaveBeenCalledWith(
        boardBefore,
        pos('e2'),
        null,           // enPassantTarget is null before the move
        castlingBefore,
      );

      // Assert – status evaluated and events dispatched
      expect(vi.mocked(mockRules.evaluateStatus)).toHaveBeenCalledOnce();
      expect(vi.mocked(mockDispatcher.dispatchMany)).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(PieceMovedEvent)]),
      );
    });

    it('clears domain events from the aggregate after dispatching', () => {
      // Arrange
      const pawn = game.board.getPieceAt(pos('e2'))!;
      const move = new DoublePawnPushMove(pos('e2'), pos('e4'), pawn);
      vi.mocked(mockRules.getLegalMoves).mockReturnValue([move]);

      // Act
      useCase.execute(pos('e2'), pos('e4'));

      // Assert – aggregate is clean for future use
      expect(game.domainEvents).toHaveLength(0);
    });

    it('passes the promotion type through to move matching when provided', () => {
      // Arrange: a promotion move that only matches when type = QUEEN
      const pawn = game.board.getPieceAt(pos('e2'))!;
      const queenPromo = new PromotionMove(
        pos('a7'), pos('a8'), pawn, undefined, PieceType.QUEEN,
      );
      vi.mocked(mockRules.getLegalMoves).mockReturnValue([queenPromo]);

      // Act + Assert — does not throw, matching worked
      expect(() => useCase.execute(pos('a7'), pos('a8'), PieceType.QUEEN)).not.toThrow();
      expect(vi.mocked(mockRepo.save)).toHaveBeenCalledOnce();
    });
  });

  // ── failure paths ────────────────────────────────────────────────────────────
  describe('failure paths', () => {
    it('throws IllegalMoveError and does not save when the destination has no matching legal move', () => {
      // Arrange: empty legal-move list
      vi.mocked(mockRules.getLegalMoves).mockReturnValue([]);

      // Act + Assert
      expect(() => useCase.execute(pos('e2'), pos('e5'))).toThrow(IllegalMoveError);
      expect(vi.mocked(mockRepo.save)).not.toHaveBeenCalled();
      expect(vi.mocked(mockDispatcher.dispatchMany)).not.toHaveBeenCalled();
    });

    it('throws IllegalMoveError when the destination does not match any move in the list', () => {
      // Arrange: legal move is e4, but we try e5
      const pawn = game.board.getPieceAt(pos('e2'))!;
      vi.mocked(mockRules.getLegalMoves).mockReturnValue([
        new DoublePawnPushMove(pos('e2'), pos('e4'), pawn),
      ]);

      // Act + Assert
      expect(() => useCase.execute(pos('e2'), pos('e5'))).toThrow(IllegalMoveError);
    });

    it('does not dispatch events when save throws', () => {
      // Arrange
      const pawn = game.board.getPieceAt(pos('e2'))!;
      vi.mocked(mockRules.getLegalMoves).mockReturnValue([
        new DoublePawnPushMove(pos('e2'), pos('e4'), pawn),
      ]);
      vi.mocked(mockRepo.save).mockImplementation(() => { throw new Error('db error'); });

      // Act + Assert
      expect(() => useCase.execute(pos('e2'), pos('e4'))).toThrow('db error');
      expect(vi.mocked(mockDispatcher.dispatchMany)).not.toHaveBeenCalled();
    });

    it('propagates an error thrown by repository.getGame', () => {
      // Arrange
      vi.mocked(mockRepo.getGame).mockImplementation(() => { throw new Error('not found'); });

      // Act + Assert
      expect(() => useCase.execute(pos('e2'), pos('e4'))).toThrow('not found');
      expect(vi.mocked(mockRules.getLegalMoves)).not.toHaveBeenCalled();
    });
  });

});
