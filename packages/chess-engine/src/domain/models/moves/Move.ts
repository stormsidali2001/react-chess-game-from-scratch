import { Board } from '../Board';
import { Position } from '../Position';
import { Piece } from '../Piece';

export interface MoveExecutionResult {
    board: Board;
    movedPiece: Piece;
    capturedData?: { piece: Piece; position: Position };
    enPassantTarget: Position | null;
}

export abstract class Move {
    constructor(
        public readonly from: Position,
        public readonly to: Position,
        public readonly piece: Piece
    ) { }

    abstract execute(board: Board): MoveExecutionResult;
}
