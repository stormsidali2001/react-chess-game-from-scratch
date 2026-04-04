import { MoveRecord, Game, GameStatus } from "../models/Game";
import { PieceType } from "../enums/PieceType";
import { Color } from "../enums/Color";

export class MoveNotationService {
  private static getPieceChar(type: PieceType): string {
    switch (type) {
      case PieceType.KNIGHT: return 'N';
      case PieceType.BISHOP: return 'B';
      case PieceType.ROOK: return 'R';
      case PieceType.QUEEN: return 'Q';
      case PieceType.KING: return 'K';
      default: return ''; 
    }
  }

  private static getFile(x: number): string {
    return String.fromCharCode(97 + x);
  }

  private static getRank(y: number): string {
    return (8 - y).toString();
  }

  /**
   * Converts a move to Standard Algebraic Notation (SAN)
   * @param record The move that was made
   * @param resultStatus The status of the game AFTER the move
   */
  public static toAlgebraic(record: MoveRecord, resultStatus: GameStatus): string {
    let notation = '';
    
    // 1. Piece Character
    const pieceChar = this.getPieceChar(record.piece.type);
    
    // 2. Capture indicator
    const isCapture = !!record.captured;
    
    if (record.piece.type === PieceType.PAWN) {
      if (isCapture) {
        notation += `${this.getFile(record.from.x)}x`;
      }
    } else {
      notation += pieceChar;
      if (isCapture) notation += 'x';
    }

    // 3. Target Square
    notation += `${this.getFile(record.to.x)}${this.getRank(record.to.y)}`;

    // 4. Promotion (Check if the piece type changed after move - e.g. Pawn to Queen)
    // In our domain, makeMove handles the promotion internally.
    // We check if the piece type in record (Pawn) reached the end.
    const lastRank = record.piece.color === Color.WHITE ? 0 : 7;
    if (record.piece.type === PieceType.PAWN && record.to.y === lastRank) {
      notation += "=Q"; // Standard notation for promotion
    }

    // 5. Check/Checkmate indicators
    if (resultStatus === GameStatus.CHECKMATE) {
      notation += '#';
    } else if (resultStatus === GameStatus.CHECK) {
      notation += '+';
    }

    return notation;
  }
}
