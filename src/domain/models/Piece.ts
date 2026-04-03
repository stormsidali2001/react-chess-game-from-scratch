import { PieceType } from '../enums/PieceType';
import { Color } from '../enums/Color';

export class Piece {
  constructor(
    public readonly type: PieceType,
    public readonly color: Color,
    public readonly hasMoved: boolean = false
  ) {
    Object.freeze(this);
  }

  cloneWithMove(): Piece {
    return new Piece(this.type, this.color, true);
  }
}
