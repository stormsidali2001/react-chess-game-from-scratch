import { Board } from '../Board';
import { Position } from '../Position';
import { Piece } from '../Piece';
import { PieceType } from '../../enums/PieceType';

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

    matches(to: Position, _promotionType?: PieceType): boolean {
        return this.to.equals(to);
    }

    abstract execute(board: Board): MoveExecutionResult;
}
