import { Color, getOpponentColor } from "../enums/Color";
import { GameStatus } from "../enums/GameStatus";
import { PieceType } from "../enums/PieceType";
import { Board } from "./Board";
import { Position } from "./Position";
import { Piece } from "./Piece";
import { Move } from "./Move";
import { CastleMove } from "./moves/CastleMove";
import { MoveRecord } from "./MoveRecord";
import { CastlingRights } from "./CastlingRights";
import { BaseAggregateRoot } from "../core/BaseAggregateRoot";
import { GameOverError, InvalidTurnError } from "../errors";
import {
  PieceMovedEvent,
  PieceCapturedEvent,
  GameStatusChangedEvent,
  PawnPromotedEvent,
  CastledEvent,
} from "../events/ChessEvents";

interface GameProps {
  board: Board;
  turn: Color;
  history: MoveRecord[];
  captured: Record<Color, Piece[]>;
  status: GameStatus;
  enPassantTarget: Position | null;
  castlingRights: CastlingRights;
  halfMoveClock: number;
}

export class Game extends BaseAggregateRoot {
  private _board: Board;
  private _turn: Color;
  private _history: MoveRecord[];
  private _captured: Record<Color, Piece[]>;
  private _status: GameStatus;
  private _enPassantTarget: Position | null;
  private _castlingRights: CastlingRights;
  private _halfMoveClock: number;

  private constructor(props: GameProps) {
    super();
    this._board = props.board;
    this._turn = props.turn;
    this._history = props.history;
    this._captured = props.captured;
    this._status = props.status;
    this._enPassantTarget = props.enPassantTarget;
    this._castlingRights = props.castlingRights;
    this._halfMoveClock = props.halfMoveClock;
  }

  get board(): Board { return this._board; }
  get turn(): Color { return this._turn; }
  get history(): readonly MoveRecord[] { return this._history; }
  get captured(): Readonly<Record<Color, readonly Piece[]>> { return this._captured; }
  get status(): GameStatus { return this._status; }
  get enPassantTarget(): Position | null { return this._enPassantTarget; }
  get castlingRights(): CastlingRights { return this._castlingRights; }
  get halfMoveClock(): number { return this._halfMoveClock; }

  /** Returns true when the piece at the given position belongs to the player whose turn it is. */
  public isOwnPiece(position: Position): boolean {
    const piece = this._board.getPieceAt(position);
    return piece !== undefined && piece.color === this._turn;
  }

  public static create(props: {
    board: Board;
    turn?: Color;
    history?: MoveRecord[];
    captured?: Record<Color, Piece[]>;
    status?: GameStatus;
    enPassantTarget?: Position | null;
    castlingRights?: CastlingRights;
    halfMoveClock?: number;
  }): Game {
    return new Game({
      board: props.board,
      turn: props.turn ?? Color.WHITE,
      history: props.history ?? [],
      captured: props.captured ?? { [Color.WHITE]: [], [Color.BLACK]: [] },
      status: props.status ?? GameStatus.ACTIVE,
      enPassantTarget: props.enPassantTarget ?? null,
      castlingRights: props.castlingRights ?? CastlingRights.initial(),
      halfMoveClock: props.halfMoveClock ?? 0,
    });
  }

  public applyMove(move: Move): void {
    if (
      this._status === GameStatus.CHECKMATE ||
      this._status === GameStatus.STALEMATE ||
      this._status === GameStatus.DRAW
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

    this._halfMoveClock =
      move.piece.type === PieceType.PAWN || capturedData
        ? 0
        : this._halfMoveClock + 1;

    this._castlingRights = this.updatedCastlingRights(move, capturedData);
    this._board = newBoard;
    this._enPassantTarget = newEnPassant;
    this._history.push({
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: capturedData?.piece,
      promotedTo:
        move.piece.type === PieceType.PAWN && movedPiece.type !== PieceType.PAWN
          ? movedPiece.type
          : undefined,
    });
    this._turn = getOpponentColor(this._turn);

    if (move instanceof CastleMove) {
      const side = move.rookFrom.x === 7 ? 'kingside' : 'queenside';
      this.addDomainEvent(new CastledEvent(side, move.from, move.to, move.rookFrom, move.rookTo));
    }

    if (move.piece.type === PieceType.PAWN && movedPiece.type !== PieceType.PAWN) {
      this.addDomainEvent(new PawnPromotedEvent(move.from, move.to, movedPiece.type));
    }

    this.addDomainEvent(new PieceMovedEvent(move.from, move.to, movedPiece));
  }

  /** Called by the application service after evaluating the new status via IGameRules. */
  public updateStatus(newStatus: GameStatus): void {
    if (this._status === newStatus) return;
    this._status = newStatus;
    this.addDomainEvent(new GameStatusChangedEvent(newStatus));
  }

  private updatedCastlingRights(
    move: Move,
    capturedData?: { piece: Piece; position: Position },
  ): CastlingRights {
    let rights = this._castlingRights;
    const color = move.piece.color;
    const backRank = color === Color.WHITE ? 7 : 0;

    if (move.piece.type === PieceType.KING) {
      rights = rights.revokeAll(color);
    } else if (move.piece.type === PieceType.ROOK) {
      if (move.from.x === 7 && move.from.y === backRank) rights = rights.revokeKingSide(color);
      if (move.from.x === 0 && move.from.y === backRank) rights = rights.revokeQueenSide(color);
    }

    // Revoking rights if an opponent's rook is captured on its starting square
    if (capturedData && capturedData.piece.type === PieceType.ROOK) {
      const opponent = getOpponentColor(color);
      const opponentBackRank = opponent === Color.WHITE ? 7 : 0;
      if (capturedData.position.x === 7 && capturedData.position.y === opponentBackRank) {
        rights = rights.revokeKingSide(opponent);
      }
      if (capturedData.position.x === 0 && capturedData.position.y === opponentBackRank) {
        rights = rights.revokeQueenSide(opponent);
      }
    }

    return rights;
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
      castlingRights: this._castlingRights,
      halfMoveClock: this._halfMoveClock,
    });
    this.domainEvents.forEach((e) => newGame.addDomainEvent(e));
    return newGame;
  }
}
