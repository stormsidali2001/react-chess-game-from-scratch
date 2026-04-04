import { PieceType } from '../enums/PieceType';
import { Color } from '../enums/Color';
import { ValueObject } from '../core/ValueObject';

interface PieceProps {
  type: PieceType;
  color: Color;
}

export class Piece extends ValueObject<PieceProps> {
  constructor(type: PieceType, color: Color) {
    super({ type, color });
  }

  get type(): PieceType {
    return this.props.type;
  }

  get color(): Color {
    return this.props.color;
  }

  cloneWithMove(): Piece {
    return new Piece(this.type, this.color);
  }
}
