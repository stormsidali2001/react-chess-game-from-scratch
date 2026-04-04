import { Color } from '../enums/Color';
import { PieceType } from '../enums/PieceType';
import { Piece } from '../models/Piece';
import { Position } from '../models/Position';
import { Board } from '../models/Board';

export class BoardSetup {
  static standard(): Board {
    let pieces = new Map<string, Piece>();

    // Setup Row mapping: y is row, i is col
    // Setup Pawns
    for (let i = 0; i < 8; i++) {
      // (col, row)
      pieces.set(new Position(i, 1).toString(), new Piece(PieceType.PAWN, Color.BLACK));
      pieces.set(new Position(i, 6).toString(), new Piece(PieceType.PAWN, Color.WHITE));
    }

    // Setup Main Pieces
    const setupRow = (row: number, color: Color) => {
      const types = [
        PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
        PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK
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
