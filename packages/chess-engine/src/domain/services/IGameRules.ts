import { Board } from '../models/Board';
import { Color } from '../enums/Color';
import { Position } from '../models/Position';

export interface IGameRules {
  isCheckmate(board: Board, turn: Color, enPassantTarget: Position | null): boolean;
  isKingInCheck(board: Board, turn: Color): boolean;
}
