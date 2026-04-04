import { Board } from '../Board';
import { Position } from '../Position';
import { Piece } from '../Piece';
import { Move, MoveExecutionResult } from './Move';

export class EnPassantMove extends Move {
    constructor(from: Position, to: Position, piece: Piece, public readonly victimPiece: Piece, public readonly victimPosition: Position) {
        super(from, to, piece);
    }

    execute(board: Board): MoveExecutionResult {
        const movedPiece = this.piece.clone();
        const boardWithMove = board.movePiece(this.from, this.to, movedPiece);
        const boardWithCapture = boardWithMove.removePieceAt(this.victimPosition);

        return {
            board: boardWithCapture,
            movedPiece,
            capturedData: { piece: this.victimPiece, position: this.victimPosition },
            enPassantTarget: null
        };
    }
}
