import { Board } from '../Board';
import { Position } from '../Position';
import { Piece } from '../Piece';
import { Move, MoveExecutionResult } from './Move';

export class StandardMove extends Move {
    constructor(from: Position, to: Position, piece: Piece, public readonly targetPiece?: Piece) {
        super(from, to, piece);
    }

    execute(board: Board): MoveExecutionResult {
        let capturedData = undefined;
        if (this.targetPiece) {
            capturedData = { piece: this.targetPiece, position: this.to };
        }

        const movedPiece = this.piece.cloneWithMove();
        const newBoard = board.movePiece(this.from, this.to, movedPiece);

        return {
            board: newBoard,
            movedPiece,
            capturedData,
            enPassantTarget: null
        };
    }
}
