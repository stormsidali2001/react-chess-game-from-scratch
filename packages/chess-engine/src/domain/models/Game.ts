import { Color, getOpponentColor } from "../enums/Color";
import { GameStatus } from "../enums/GameStatus";
import { Board } from "./Board";
import { Position } from "./Position";
import { Piece } from "./Piece";
import { Move } from "./Move";
import { MoveRecord } from "./MoveRecord";
import { IGameRules } from "../services/IGameRules";
import { BaseAggregateRoot } from "../core/BaseAggregateRoot";
import { GameOverError, InvalidTurnError } from "../errors";
import {
  PieceMovedEvent,
  PieceCapturedEvent,
  GameStatusChangedEvent,
} from "../events/ChessEvents";

interface GameProps {
  board: Board;
  turn: Color;
  history: MoveRecord[];
  captured: Record<Color, Piece[]>;
  status: GameStatus;
  enPassantTarget: Position | null;
}

export class Game extends BaseAggregateRoot {
  private _board: Board;
  private _turn: Color;
  private _history: MoveRecord[];
  private _captured: Record<Color, Piece[]>;
  private _status: GameStatus;
  private _enPassantTarget: Position | null;

  private constructor(props: GameProps) {
    super();
    this._board = props.board;
    this._turn = props.turn;
    this._history = props.history;
    this._captured = props.captured;
    this._status = props.status;
    this._enPassantTarget = props.enPassantTarget;
  }

  get board(): Board { return this._board; }
  get turn(): Color { return this._turn; }
  get history(): readonly MoveRecord[] { return this._history; }
  get captured(): Readonly<Record<Color, readonly Piece[]>> { return this._captured; }
  get status(): GameStatus { return this._status; }
  get enPassantTarget(): Position | null { return this._enPassantTarget; }

  public static create(props: {
    board: Board;
    turn?: Color;
    history?: MoveRecord[];
    captured?: Record<Color, Piece[]>;
    status?: GameStatus;
    enPassantTarget?: Position | null;
  }): Game {
    return new Game({
      board: props.board,
      turn: props.turn ?? Color.WHITE,
      history: props.history ?? [],
      captured: props.captured ?? { [Color.WHITE]: [], [Color.BLACK]: [] },
      status: props.status ?? GameStatus.ACTIVE,
      enPassantTarget: props.enPassantTarget ?? null,
    });
  }

  public applyMove(move: Move, rules: IGameRules): void {
    if (
      this._status === GameStatus.CHECKMATE ||
      this._status === GameStatus.STALEMATE
    ) {
      throw new GameOverError();
    }

    if (move.piece.color !== this._turn) {
      throw new InvalidTurnError();
    }

    const {
      board: newBoard,
      capturedData,
      enPassantTarget: newEnPassant,
      movedPiece,
    } = move.execute(this._board);

    if (capturedData) {
      this._captured[capturedData.piece.color].push(capturedData.piece);
      this.addDomainEvent(
        new PieceCapturedEvent(capturedData.position, capturedData.piece),
      );
    }

    this._board = newBoard;
    this._enPassantTarget = newEnPassant;
    this._history.push({
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: capturedData?.piece,
    });
    this._turn = getOpponentColor(this._turn);

    this.addDomainEvent(new PieceMovedEvent(move.from, move.to, movedPiece));

    this.evaluateGameStatus(rules);
  }

  private evaluateGameStatus(rules: IGameRules): void {
    let newStatus = GameStatus.ACTIVE;

    if (rules.isCheckmate(this._board, this._turn, this._enPassantTarget)) {
      newStatus = GameStatus.CHECKMATE;
    } else if (rules.isKingInCheck(this._board, this._turn)) {
      newStatus = GameStatus.CHECK;
    }

    if (this._status !== newStatus) {
      this._status = newStatus;
      this.addDomainEvent(new GameStatusChangedEvent(newStatus));
    }
  }

  public clone(): Game {
    const newGame = Game.create({
      board: this._board,
      turn: this._turn,
      history: [...this._history],
      captured: {
        [Color.WHITE]: [...this._captured[Color.WHITE]],
        [Color.BLACK]: [...this._captured[Color.BLACK]],
      },
      status: this._status,
      enPassantTarget: this._enPassantTarget,
    });
    this.domainEvents.forEach((e) => newGame.addDomainEvent(e));
    return newGame;
  }
}
