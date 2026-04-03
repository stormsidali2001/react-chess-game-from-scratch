export enum Color {
  WHITE = 'white',
  BLACK = 'black',
}

export const getOpponentColor = (color: Color): Color =>
  color === Color.WHITE ? Color.BLACK : Color.WHITE;
