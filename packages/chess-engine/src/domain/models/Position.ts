import { ValueObject } from '../core/ValueObject';
import { InvalidPositionError } from '../errors';

type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type AlgebraicNotation = `${File}${Rank}`;

interface PositionProps {
  x: number;
  y: number;
}

/**
 * x = Column (0-7, horizontal)
 * y = Row (0-7, vertical)
 */
export class Position extends ValueObject<PositionProps> {
  constructor(x: number, y: number) {
    if (!Position.isValid(x, y)) {
      throw new InvalidPositionError(x, y);
    }
    super({ x, y });
  }

  get x(): number { return this.props.x; }
  get y(): number { return this.props.y; }

  static isValid(x: number, y: number): boolean {
    return x >= 0 && x <= 7 && y >= 0 && y <= 7;
  }

  // Override equals to use props comparison from base class
  public equals(other?: Position): boolean {
    return super.equals(other);
  }

  toAlgebraic(): AlgebraicNotation {
    return `${String.fromCharCode(97 + this.x)}${8 - this.y}` as AlgebraicNotation;
  }

  static fromAlgebraic(notation: AlgebraicNotation): Position {
    const file = notation.charCodeAt(0) - 97;  // 'a' → 0
    const rank = 8 - parseInt(notation[1], 10); // '4' → y=4
    return new Position(file, rank);
  }

  toString(): AlgebraicNotation {
    return this.toAlgebraic();
  }

  static fromString(str: AlgebraicNotation): Position {
    return Position.fromAlgebraic(str);
  }
}
