import { Board } from '../Board';
import { Position } from '../Position';
import { Move, MoveExecutionResult } from './Move';

export class DoublePawnPushMove extends Move {
    execute(board: Board): MoveExecutionResult {
        const movedPiece = this.piece.cloneWithMove();
        const newBoard = board.movePiece(this.from, this.to, movedPiece);
        const stepDirection = this.from.y < this.to.y ? -1 : 1;

        return {
            board: newBoard,
            movedPiece,
            enPassantTarget: new Position(this.from.x, this.to.y + stepDirection)
        };
    }
}
