import { Color, getOpponentColor } from "../enums/Color";
import { Board } from "./Board";
import { Position } from "./Position";
import { Piece } from "./Piece";
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
  isCheckmate(board: Board, turn: Color): boolean;
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
}

export class Game extends BaseAggregateRoot {
  public board: Board;
  public turn: Color;
  public history: MoveRecord[];
  public captured: Record<Color, Piece[]>;
  public status: GameStatus;

  private constructor(props: GameProps) {
    super();
    this.board = props.board;
    this.turn = props.turn;
    this.history = props.history;
    this.captured = props.captured;
    this.status = props.status;
  }

  public static create(props: { board: Board, turn?: Color, history?: MoveRecord[], captured?: Record<Color, Piece[]>, status?: GameStatus }): Game {
    return new Game({
      board: props.board,
      turn: props.turn ?? Color.WHITE,
      history: props.history ?? [],
      captured: props.captured ?? { [Color.WHITE]: [], [Color.BLACK]: [] },
      status: props.status ?? GameStatus.ACTIVE,
    });
  }

  /**
   * MUTABLE Domain Logic using Double Dispatch for Domain Services
   */
  public makeMove(from: Position, to: Position, rules: IGameRules): void {
    if (this.status === GameStatus.CHECKMATE || this.status === GameStatus.STALEMATE) {
      throw new GameOverError();
    }

    const piece = this.board.getPieceAt(from);
    if (!piece || piece.color !== this.turn) {
      throw new InvalidTurnError();
    }

    const targetPiece = this.board.getPieceAt(to);

    // 1. Handle Captures
    if (targetPiece) {
      this.captured[targetPiece.color].push(targetPiece);
      this.addDomainEvent(new PieceCapturedEvent(to, targetPiece));
    }

    // 2. Handle Promotion Logic
    let movedPiece = piece.cloneWithMove();
    const lastRank = piece.color === Color.WHITE ? 0 : 7;
    if (piece.type === PieceType.PAWN && to.y === lastRank) {
      movedPiece = new Piece(PieceType.QUEEN, piece.color);
    }

    // 3. Update State
    this.board = this.board.movePiece(from, to, movedPiece);
    this.history.push({ from, to, piece, captured: targetPiece });
    this.turn = getOpponentColor(this.turn);

    // 4. Record Move Event
    this.addDomainEvent(new PieceMovedEvent(from, to, movedPiece));

    // 5. Evaluate Invariants via injected Domain Service (Double Dispatch)
    this.evaluateGameStatus(rules);
  }

  private evaluateGameStatus(rules: IGameRules): void {
    let newStatus = GameStatus.ACTIVE;

    if (rules.isCheckmate(this.board, this.turn)) {
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
      status: this.status
    });
    // Copy events if they haven't been dispatched
    this.domainEvents.forEach(e => newGame.addDomainEvent(e));
    return newGame;
  }
}
