import { ValueObject } from '../core/ValueObject';

interface PositionProps {
  x: number;
  y: number;
}

import { InvalidPositionError } from '../errors';

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

  toString(): string {
    return `${this.x}-${this.y}`;
  }

  static fromString(str: string): Position {
    const [x, y] = str.split('-').map(Number);
    return new Position(x, y);
  }
}
