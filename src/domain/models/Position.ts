/**
 * x = Column (0-7, horizontal)
 * y = Row (0-7, vertical)
 */
export class Position {
  constructor(public readonly x: number, public readonly y: number) {
    if (!Position.isValid(x, y)) {
      throw new Error(`Invalid position: (${x}, ${y})`);
    }
    Object.freeze(this);
  }

  static isValid(x: number, y: number): boolean {
    return x >= 0 && x <= 7 && y >= 0 && y <= 7;
  }

  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  toString(): string {
    return `${this.x}-${this.y}`;
  }

  static fromString(str: string): Position {
    const [x, y] = str.split('-').map(Number);
    return new Position(x, y);
  }
}
