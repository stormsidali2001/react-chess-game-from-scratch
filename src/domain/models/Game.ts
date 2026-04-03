import { Color, getOpponentColor } from '../enums/Color';
import { Board } from './Board';
import { Position } from './Position';
import { Piece } from './Piece';
import { PieceType } from '../enums/PieceType';

export enum GameStatus {
  ACTIVE = 'active',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  STALEMATE = 'stalemate',
  DRAW = 'draw',
}

export interface MoveRecord {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
}

export interface GameProps {
  board?: Board;
  turn?: Color;
  history?: MoveRecord[];
  captured?: Record<Color, Piece[]>;
  status?: GameStatus;
}

export class Game {
  public readonly board: Board;
  public readonly turn: Color;
  public readonly history: MoveRecord[];
  public readonly captured: Record<Color, Piece[]>;
  public readonly status: GameStatus;

  constructor({
    board = Board.initial(),
    turn = Color.WHITE,
    history = [],
    captured = { [Color.WHITE]: [], [Color.BLACK]: [] },
    status = GameStatus.ACTIVE,
  }: GameProps = {}) {
    this.board = board;
    this.turn = turn;
    this.history = history;
    this.captured = captured;
    this.status = status;
    Object.freeze(this);
  }

  makeMove(from: Position, to: Position): Game {
    if (this.status === GameStatus.CHECKMATE || this.status === GameStatus.STALEMATE) {
      throw new Error('Game is over');
    }

    const piece = this.board.getPieceAt(from);
    if (!piece || piece.color !== this.turn) {
      throw new Error('Invalid turn or no piece at source');
    }

    // Capture logic
    const targetPiece = this.board.getPieceAt(to);
    const newCaptured = { 
      [Color.WHITE]: [...this.captured[Color.WHITE]],
      [Color.BLACK]: [...this.captured[Color.BLACK]]
    };
    if (targetPiece) {
      newCaptured[targetPiece.color].push(targetPiece);
    }

    // Move Piece logic including promotion
    let movedPiece = piece.cloneWithMove();
    const lastRank = piece.color === Color.WHITE ? 0 : 7;
    if (piece.type === PieceType.PAWN && to.y === lastRank) {
      movedPiece = new Piece(PieceType.QUEEN, piece.color, true);
    }

    const newBoard = this.board.movePiece(from, to, movedPiece);
    const newHistory = [...this.history, { from, to, piece, captured: targetPiece }];

    return new Game({
      board: newBoard,
      turn: getOpponentColor(this.turn),
      history: newHistory,
      captured: newCaptured,
      status: GameStatus.ACTIVE,
    });
  }
}
