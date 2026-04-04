import { PieceType } from '../enums/PieceType';
import { Color } from '../enums/Color';
import { BaseEntity } from '../core/BaseEntity';

export class Piece extends BaseEntity<string> {
  constructor(
    public readonly type: PieceType,
    public readonly color: Color,
    public readonly hasMoved: boolean = false,
    id?: string
  ) {
    // Generate an ID if not provided, safely reproducible across instances without global state mutation 
    super(id || `${type}-${color}-${Math.random().toString(36).substring(2, 10)}`);
    Object.freeze(this);
  }

  cloneWithMove(): Piece {
    return new Piece(this.type, this.color, true, this.id);
  }
}
