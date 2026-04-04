import { MoveRecord } from "../models/MoveRecord";
import { GameStatus } from "../enums/GameStatus";
import { PieceType } from "../enums/PieceType";

export class MoveNotationService {

  static toAlgebraic(record: MoveRecord, resultStatus: GameStatus): string {
    const suffix = this.statusSuffix(resultStatus);

    // Castling: king moved two squares horizontally
    if (record.piece.type === PieceType.KING && Math.abs(record.from.x - record.to.x) === 2) {
      return record.to.x > record.from.x ? `O-O${suffix}` : `O-O-O${suffix}`;
    }

    let notation = '';

    if (record.piece.type === PieceType.PAWN) {
      if (record.captured) {
        notation += this.file(record.from.x) + 'x';
      }
    } else {
      notation += this.pieceChar(record.piece.type);
      if (record.captured) notation += 'x';
    }

    notation += this.file(record.to.x) + this.rank(record.to.y);

    if (record.promotedTo !== undefined) {
      notation += `=${this.pieceChar(record.promotedTo)}`;
    }

    return notation + suffix;
  }

  private static pieceChar(type: PieceType): string {
    switch (type) {
      case PieceType.KNIGHT: return 'N';
      case PieceType.BISHOP: return 'B';
      case PieceType.ROOK:   return 'R';
      case PieceType.QUEEN:  return 'Q';
      case PieceType.KING:   return 'K';
      default: return '';
    }
  }

  private static file(x: number): string {
    return String.fromCharCode(97 + x);
  }

  private static rank(y: number): string {
    return (8 - y).toString();
  }

  private static statusSuffix(status: GameStatus): string {
    if (status === GameStatus.CHECKMATE) return '#';
    if (status === GameStatus.CHECK) return '+';
    return '';
  }
}
