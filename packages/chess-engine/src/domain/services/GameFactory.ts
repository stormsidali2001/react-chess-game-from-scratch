import { Color } from '../enums/Color';
import { PieceType } from '../enums/PieceType';
import { Board } from '../models/Board';
import { Game } from '../models/Game';
import { Piece } from '../models/Piece';
import { Position } from '../models/Position';

export class GameFactory {
  static createStandardGame(): Game {
    return Game.create({ board: GameFactory.buildStandardBoard() });
  }

  private static buildStandardBoard(): Board {
    const pieces = new Map<string, Piece>();

    for (let i = 0; i < 8; i++) {
      pieces.set(new Position(i, 1).toString(), new Piece(PieceType.PAWN, Color.BLACK));
      pieces.set(new Position(i, 6).toString(), new Piece(PieceType.PAWN, Color.WHITE));
    }

    const setupRow = (row: number, color: Color) => {
      const types = [
        PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
        PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK,
      ];
      types.forEach((type, col) => {
        pieces.set(new Position(col, row).toString(), new Piece(type, color));
      });
    };

    setupRow(0, Color.BLACK);
    setupRow(7, Color.WHITE);

    return new Board(pieces);
  }
}
