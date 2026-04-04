import { describe, it, expect } from 'vitest';
import { Position } from '../domain/models/Position';
import type { AlgebraicNotation } from '../domain/models/Position';
import { Piece } from '../domain/models/Piece';
import {
  StandardMove,
  DoublePawnPushMove,
  EnPassantMove,
  PromotionMove,
  CastleMove,
} from '../domain/models/Move';
import { CastlingRights } from '../domain/models/CastlingRights';
import { GameFactory } from '../domain/services/GameFactory';
import { GameStatus } from '../domain/enums/GameStatus';
import { PieceType } from '../domain/enums/PieceType';
import { Color } from '../domain/enums/Color';
import { GameOverError, InvalidTurnError } from '../domain/errors';
import {
  PieceMovedEvent,
  PieceCapturedEvent,
  GameStatusChangedEvent,
} from '../domain/events/ChessEvents';
import { buildGame } from './helpers/buildGame';

// ── Move factory helpers ──────────────────────────────────────────────────────
// Construct concrete Move objects directly — no RulesEngine involved.

function at(game: ReturnType<typeof buildGame>, square: AlgebraicNotation): Piece {
  const position = pos(square);
  const piece = game.board.getPieceAt(position);
  if (!piece) throw new Error(`No piece at ${square}`);
  return piece;
}

const pos = (square: AlgebraicNotation) => Position.fromAlgebraic(square);

// ─────────────────────────────────────────────────────────────────────────────

describe('Game (Aggregate Root)', () => {

  // ── applyMove – turn & history ──────────────────────────────────────────────
  describe('applyMove – turn and history', () => {
    it('happy path – should switch turn from WHITE to BLACK after a move', () => {
      // Arrange
      const game = GameFactory.createStandardGame();
      const move = new DoublePawnPushMove(pos('e2'), pos('e4'), at(game, 'e2')); // 1.e4

      // Act
      game.applyMove(move);

      // Assert
      expect(game.turn).toBe(Color.BLACK);
    });

    it('happy path – should switch turn back to WHITE after both sides move', () => {
      const game = GameFactory.createStandardGame();
      game.applyMove(new DoublePawnPushMove(pos('e2'), pos('e4'), at(game, 'e2'))); // 1.e4
      game.applyMove(new DoublePawnPushMove(pos('e7'), pos('e5'), at(game, 'e7'))); // 1...e5

      expect(game.turn).toBe(Color.WHITE);
    });

    it('happy path – should append a MoveRecord to history after each move', () => {
      // Arrange
      const game = GameFactory.createStandardGame();
      const pawn = at(game, 'e2');
      const move = new DoublePawnPushMove(pos('e2'), pos('e4'), pawn); // 1.e4

      // Act
      game.applyMove(move);

      // Assert
      expect(game.history).toHaveLength(1);
      expect(game.history[0].from).toEqual(pos('e2'));
      expect(game.history[0].to).toEqual(  pos('e4'));
      expect(game.history[0].piece).toEqual(new Piece(PieceType.PAWN, Color.WHITE));
      expect(game.history[0].captured).toBeUndefined();
    });
  });

  // ── applyMove – domain events ───────────────────────────────────────────────
  describe('applyMove – domain events', () => {
    it('happy path – should emit PieceMovedEvent with correct from/to/piece', () => {
      // Arrange
      const game = GameFactory.createStandardGame();
      const pawn = at(game, 'e2');
      const move = new DoublePawnPushMove(pos('e2'), pos('e4'), pawn); // 1.e4

      // Act
      game.applyMove(move);

      // Assert
      expect(game.domainEvents).toHaveLength(1);
      const event = game.domainEvents[0] as PieceMovedEvent;
      expect(event).toBeInstanceOf(PieceMovedEvent);
      expect(event.from).toEqual(pos('e2'));
      expect(event.to).toEqual(  pos('e4'));
      expect(event.piece).toEqual(new Piece(PieceType.PAWN, Color.WHITE));
    });

    it('happy path – should emit PieceCapturedEvent alongside PieceMovedEvent on capture', () => {
      // Arrange: white pawn on e4, black pawn on d5 — exd5
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'r n b q k b n r',
        7: 'p p p . p p p p',
        6: '. . . . . . . .',
        5: '. . . p . . . .',
        4: '. . . . P . . .',
        3: '. . . . . . . .',
        2: 'P P P P . P P P',
        1: 'R N B Q K B N R',
      });
      const whitePawn = at(game, 'e4');
      const blackPawn = at(game, 'd5');
      const move = new StandardMove(pos('e4'), pos('d5'), whitePawn, blackPawn);

      // Act
      game.applyMove(move);

      // Assert
      const captured = game.domainEvents.find(e => e instanceof PieceCapturedEvent) as PieceCapturedEvent;
      expect(captured).toBeDefined();
      expect(captured.piece).toEqual(new Piece(PieceType.PAWN, Color.BLACK));
      expect(captured.at).toEqual(pos('d5'));
      expect(game.history[0].captured).toEqual(new Piece(PieceType.PAWN, Color.BLACK));
    });
  });

  // ── applyMove – half-move clock ─────────────────────────────────────────────
  describe('applyMove – half-move clock', () => {
    it('happy path – should reset half-move clock to 0 on pawn move', () => {
      const game = GameFactory.createStandardGame();
      game.applyMove(new DoublePawnPushMove(pos('e2'), pos('e4'), at(game, 'e2')));

      expect(game.halfMoveClock).toBe(0);
    });

    it('happy path – should increment half-move clock on non-pawn, non-capture move', () => {
      // Arrange: after 1.e4 e5, white plays Nf3 (knight g1→f3)
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'r n b q k b n r',
        7: 'p p p p . p p p',
        6: '. . . . . . . .',
        5: '. . . . p . . .',
        4: '. . . . P . . .',
        3: '. . . . . . . .',
        2: 'P P P P . P P P',
        1: 'R N B Q K B N R',
      });
      const knight = at(game, 'g1');
      const move = new StandardMove(pos('g1'), pos('f3'), knight); // Ng1→f3

      // Act
      game.applyMove(move);

      // Assert
      expect(game.halfMoveClock).toBe(1);
    });

    it('happy path – should reset half-move clock to 0 on capture', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'r n b q k b n r',
        7: 'p p p . p p p p',
        6: '. . . . . . . .',
        5: '. . . p . . . .',
        4: '. . . . P . . .',
        3: '. . . . . . . .',
        2: 'P P P P . P P P',
        1: 'R N B Q K B N R',
      }, { halfMoveClock: 5 });
      const whitePawn = at(game, 'e4');
      const blackPawn = at(game, 'd5');

      game.applyMove(new StandardMove(pos('e4'), pos('d5'), whitePawn, blackPawn)); // exd5

      expect(game.halfMoveClock).toBe(0);
    });
  });

  // ── applyMove – en passant ──────────────────────────────────────────────────
  describe('applyMove – en passant', () => {
    it('happy path – should record en passant target square after a double pawn push', () => {
      const game = GameFactory.createStandardGame();
      game.applyMove(new DoublePawnPushMove(pos('e2'), pos('e4'), at(game, 'e2'))); // 1.e4

      // The en passant target is the square the pawn skipped over (e3)
      expect(game.enPassantTarget).toEqual(pos('e3'));
    });

    it('happy path – should remove the captured pawn and land on the correct square via en passant', () => {
      // Arrange: white pawn on e5, black pawn on d5, en passant target d6
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'r n b q k b n r',
        7: 'p p p . p p p p',
        6: '. . . . . . . .',
        5: '. . . p P . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: 'P P P P . P P P',
        1: 'R N B Q K B N R',
      }, { enPassantTarget: pos('d6') });

      const whitePawn = at(game, 'e5');
      const blackPawn = at(game, 'd5');
      const move = new EnPassantMove(pos('e5'), pos('d6'), whitePawn, blackPawn, pos('d5'));

      // Act
      game.applyMove(move);

      // Assert
      expect(game.board.getPieceAt(pos('d5'))).toBeUndefined();              // d5 cleared
      expect(game.board.getPieceAt(pos('d6'))).toEqual(                      // d6 has white pawn
        new Piece(PieceType.PAWN, Color.WHITE),
      );
      const captured = game.domainEvents.find(e => e instanceof PieceCapturedEvent) as PieceCapturedEvent;
      expect(captured.piece).toEqual(new Piece(PieceType.PAWN, Color.BLACK));
    });
  });

  // ── applyMove – castling ────────────────────────────────────────────────────
  describe('applyMove – castling', () => {
    it('happy path – should move king two squares and rook to the other side on king-side castle', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'r . . . k . . r',
        7: 'p p p p p p p p',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: 'P P P P P P P P',
        1: 'R . . . K . . R',
      }, { castlingRights: CastlingRights.fromFlags(true, true, true, true) });

      const king = at(game, 'e1');
      const rook = at(game, 'h1');
      const move = new CastleMove(pos('e1'), pos('g1'), king, pos('h1'), pos('f1'), rook, pos('f1')); // O-O

      // Act
      game.applyMove(move);

      // Assert
      expect(game.board.getPieceAt(pos('g1'))).toEqual(new Piece(PieceType.KING, Color.WHITE));
      expect(game.board.getPieceAt(pos('f1'))).toEqual(new Piece(PieceType.ROOK, Color.WHITE));
      expect(game.board.getPieceAt(pos('e1'))).toBeUndefined(); // e1 vacated
      expect(game.board.getPieceAt(pos('h1'))).toBeUndefined(); // h1 vacated
    });

    it('happy path – should move king two squares and rook on queen-side castle', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'r . . . k . . r',
        7: 'p p p p p p p p',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: 'P P P P P P P P',
        1: 'R . . . K . . R',
      }, { castlingRights: CastlingRights.fromFlags(true, true, true, true) });

      const king = at(game, 'e1');
      const rook = at(game, 'a1');
      const move = new CastleMove(pos('e1'), pos('c1'), king, pos('a1'), pos('d1'), rook, pos('d1')); // O-O-O

      game.applyMove(move);

      expect(game.board.getPieceAt(pos('c1'))).toEqual(new Piece(PieceType.KING, Color.WHITE));
      expect(game.board.getPieceAt(pos('d1'))).toEqual(new Piece(PieceType.ROOK, Color.WHITE));
      expect(game.board.getPieceAt(pos('e1'))).toBeUndefined(); // e1 vacated
      expect(game.board.getPieceAt(pos('a1'))).toBeUndefined(); // a1 vacated
    });

    it('happy path – should revoke all castling rights for a color after the king moves', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: 'r . . . k . . r',
        7: 'p p p p p p p p',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: 'P P P P P P P P',
        1: 'R . . . K . . R',
      }, { castlingRights: CastlingRights.fromFlags(true, true, true, true) });

      const king = at(game, 'e1');
      const rook = at(game, 'h1');
      game.applyMove(new CastleMove(pos('e1'), pos('g1'), king, pos('h1'), pos('f1'), rook, pos('f1')));

      expect(game.castlingRights.canCastleKingSide(Color.WHITE)).toBe(false);
      expect(game.castlingRights.canCastleQueenSide(Color.WHITE)).toBe(false);
    });
  });

  // ── applyMove – pawn promotion ──────────────────────────────────────────────
  describe('applyMove – pawn promotion', () => {
    it('happy path – should replace the pawn with the chosen piece on promotion', () => {
      // Arrange: white pawn on a7
      const game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . . . . . k',
        7: 'P . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });
      const pawn = at(game, 'a7');
      const move = new PromotionMove(pos('a7'), pos('a8'), pawn, undefined, PieceType.QUEEN); // a7→a8=Q

      // Act
      game.applyMove(move);

      // Assert
      expect(game.board.getPieceAt(pos('a8'))).toEqual(new Piece(PieceType.QUEEN, Color.WHITE));
      expect(game.board.getPieceAt(pos('a7'))).toBeUndefined();
    });

    it('happy path – should support underpromotion to knight', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . . . . . k',
        7: 'P . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });
      const pawn = at(game, 'a7');
      game.applyMove(new PromotionMove(pos('a7'), pos('a8'), pawn, undefined, PieceType.KNIGHT));

      expect(game.board.getPieceAt(pos('a8'))).toEqual(new Piece(PieceType.KNIGHT, Color.WHITE));
    });

    it('happy path – should record the promoted piece type in history', () => {
      const game = buildGame({
        0: 'a b c d e f g h',
        8: '. . . . . . . k',
        7: 'P . . . . . . .',
        6: '. . . . . . . .',
        5: '. . . . . . . .',
        4: '. . . . . . . .',
        3: '. . . . . . . .',
        2: '. . . . . . . .',
        1: '. . . . K . . .',
      });
      const pawn = at(game, 'a7');
      game.applyMove(new PromotionMove(pos('a7'), pos('a8'), pawn, undefined, PieceType.QUEEN));

      expect(game.history[0].promotedTo).toBe(PieceType.QUEEN);
    });
  });

  // ── updateStatus ────────────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('happy path – should set status and emit GameStatusChangedEvent', () => {
      // Arrange
      const game = GameFactory.createStandardGame();

      // Act
      game.updateStatus(GameStatus.CHECK);

      // Assert
      expect(game.status).toBe(GameStatus.CHECK);
      const event = game.domainEvents.find(e => e instanceof GameStatusChangedEvent) as GameStatusChangedEvent;
      expect(event).toBeDefined();
      expect(event.status).toBe(GameStatus.CHECK);
    });

    it('happy path – should be idempotent when status has not changed', () => {
      const game = GameFactory.createStandardGame(); // status = ACTIVE

      game.updateStatus(GameStatus.ACTIVE);

      // No GameStatusChangedEvent should be emitted
      expect(game.domainEvents.find(e => e instanceof GameStatusChangedEvent)).toBeUndefined();
    });

    it('happy path – should transition through multiple statuses correctly', () => {
      const game = GameFactory.createStandardGame();

      game.updateStatus(GameStatus.CHECK);
      game.updateStatus(GameStatus.CHECKMATE);

      expect(game.status).toBe(GameStatus.CHECKMATE);
      const events = game.domainEvents.filter(e => e instanceof GameStatusChangedEvent) as GameStatusChangedEvent[];
      expect(events).toHaveLength(2);
      expect(events[0].status).toBe(GameStatus.CHECK);
      expect(events[1].status).toBe(GameStatus.CHECKMATE);
    });
  });

  // ── applyMove – failure paths ───────────────────────────────────────────────
  describe('applyMove – failure paths', () => {
    it("failure path – should throw InvalidTurnError when moving the opponent's piece", () => {
      // Arrange: standard game, white to move — construct a black pawn move
      const game = GameFactory.createStandardGame();
      const blackPawn = game.board.getPieceAt(pos('e7'))!;
      const illegalMove = new StandardMove(pos('e7'), pos('e6'), blackPawn);

      // Act + Assert
      expect(() => game.applyMove(illegalMove)).toThrow(InvalidTurnError);
    });

    it('failure path – should throw GameOverError when trying to move after checkmate', () => {
      // Arrange: set the game to CHECKMATE via updateStatus, then try to apply any move
      const game = GameFactory.createStandardGame();
      game.updateStatus(GameStatus.CHECKMATE);

      const pawn = game.board.getPieceAt(pos('e2'))!;
      const move = new StandardMove(pos('e2'), pos('e3'), pawn);

      // Act + Assert
      expect(() => game.applyMove(move)).toThrow(GameOverError);
    });

    it('failure path – should throw GameOverError when trying to move after stalemate', () => {
      const game = GameFactory.createStandardGame();
      game.updateStatus(GameStatus.STALEMATE);

      const pawn = game.board.getPieceAt(pos('e2'))!;
      const move = new StandardMove(pos('e2'), pos('e3'), pawn);

      expect(() => game.applyMove(move)).toThrow(GameOverError);
    });

    it('failure path – should throw GameOverError when trying to move after draw', () => {
      const game = GameFactory.createStandardGame();
      game.updateStatus(GameStatus.DRAW);

      const pawn = game.board.getPieceAt(pos('e2'))!;
      const move = new StandardMove(pos('e2'), pos('e3'), pawn);

      expect(() => game.applyMove(move)).toThrow(GameOverError);
    });
  });

});
