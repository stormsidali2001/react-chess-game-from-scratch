import { Color, getOpponentColor } from "../enums/Color";
import { Board } from "./Board";
import { Position } from "./Position";
import { Piece } from "./Piece";
import { Move } from "./Move";
import { PieceType } from "../enums/PieceType";
import { BaseAggregateRoot } from "../core/BaseAggregateRoot";
import { GameOverError, InvalidTurnError } from "../errors";
import {
  PieceMovedEvent,
  PieceCapturedEvent,
  GameStatusChangedEvent,
} from "../events/ChessEvents";

export enum GameStatus {
  ACTIVE = "active",
  CHECK = "check",
  CHECKMATE = "checkmate",
  STALEMATE = "stalemate",
  DRAW = "draw",
}

export interface IGameRules {
  isCheckmate(board: Board, turn: Color, enPassantTarget: Position | null): boolean;
  isKingInCheck(board: Board, turn: Color): boolean;
}

export interface MoveRecord {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
}

export interface GameProps {
  board: Board;
  turn: Color;
  history: MoveRecord[];
  captured: Record<Color, Piece[]>;
  status: GameStatus;
  enPassantTarget: Position | null;
}

export class Game extends BaseAggregateRoot {
  public board: Board;
  public turn: Color;
  public history: MoveRecord[];
  public captured: Record<Color, Piece[]>;
  public status: GameStatus;
  public enPassantTarget: Position | null;

  private constructor(props: GameProps) {
    super();
    this.board = props.board;
    this.turn = props.turn;
    this.history = props.history;
    this.captured = props.captured;
    this.status = props.status;
    this.enPassantTarget = props.enPassantTarget;
  }

  public static create(props: { board: Board, turn?: Color, history?: MoveRecord[], captured?: Record<Color, Piece[]>, status?: GameStatus, enPassantTarget?: Position | null }): Game {
    return new Game({
      board: props.board,
      turn: props.turn ?? Color.WHITE,
      history: props.history ?? [],
      captured: props.captured ?? { [Color.WHITE]: [], [Color.BLACK]: [] },
      status: props.status ?? GameStatus.ACTIVE,
      enPassantTarget: props.enPassantTarget ?? null
    });
  }

  /**
   * MUTABLE Domain Logic using Value Objects (Path 2)
   */
  public applyMove(move: Move, rules: IGameRules): void {
    if (this.status === GameStatus.CHECKMATE || this.status === GameStatus.STALEMATE) {
      throw new GameOverError();
    }

    if (move.piece.color !== this.turn) {
      throw new InvalidTurnError();
    }

    const { board: newBoard, capturedData, enPassantTarget: newEnPassant, movedPiece } = move.execute(this.board);

    if (capturedData) {
      this.captured[capturedData.piece.color].push(capturedData.piece);
      this.addDomainEvent(new PieceCapturedEvent(capturedData.position, capturedData.piece));
    }

    // Update State
    this.board = newBoard;
    this.enPassantTarget = newEnPassant;
    this.history.push({ from: move.from, to: move.to, piece: move.piece, captured: capturedData?.piece });
    this.turn = getOpponentColor(this.turn);

    // Record Move Event
    this.addDomainEvent(new PieceMovedEvent(move.from, move.to, movedPiece));

    // Evaluate Invariants
    this.evaluateGameStatus(rules);
  }

  private evaluateGameStatus(rules: IGameRules): void {
    let newStatus = GameStatus.ACTIVE;

    if (rules.isCheckmate(this.board, this.turn, this.enPassantTarget)) {
      newStatus = GameStatus.CHECKMATE;
    } else if (rules.isKingInCheck(this.board, this.turn)) {
      newStatus = GameStatus.CHECK;
    }

    if (this.status !== newStatus) {
      this.status = newStatus;
      this.addDomainEvent(new GameStatusChangedEvent(newStatus));
    }
  }

  // Status is now completely managed internally via evaluateGameStatus.

  /**
   * Helper to create a deep clone for the Application Layer's snapshotting
   */
  public clone(): Game {
    const newGame = Game.create({
      board: this.board,
      turn: this.turn,
      history: [...this.history],
      captured: {
        [Color.WHITE]: [...this.captured[Color.WHITE]],
        [Color.BLACK]: [...this.captured[Color.BLACK]],
      },
      status: this.status,
      enPassantTarget: this.enPassantTarget
    });
    // Copy events if they haven't been dispatched
    this.domainEvents.forEach(e => newGame.addDomainEvent(e));
    return newGame;
  }
}
