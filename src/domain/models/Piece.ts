import { PieceType } from '../enums/PieceType';
import { Color } from '../enums/Color';
import { BaseEntity } from '../core/BaseEntity';

let nextId = 0;

export class Piece extends BaseEntity<string> {
  constructor(
    public readonly type: PieceType,
    public readonly color: Color,
    public readonly hasMoved: boolean = false,
    id?: string
  ) {
    // Generate an ID if not provided (important for new pieces)
    super(id || `${type}-${color}-${nextId++}`);
    Object.freeze(this);
  }

  cloneWithMove(): Piece {
    return new Piece(this.type, this.color, true, this.id);
  }
}
