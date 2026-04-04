import { Board } from '../Board';
import { Position } from '../Position';
import { Piece } from '../Piece';
import { Move, MoveExecutionResult } from './Move';

export class EnPassantMove extends Move {
    constructor(from: Position, to: Position, piece: Piece, public readonly victimPiece: Piece, public readonly victimPosition: Position) {
        super(from, to, piece);
    }

    execute(board: Board): MoveExecutionResult {
        const movedPiece = this.piece.cloneWithMove();
        const boardWithMove = board.movePiece(this.from, this.to, movedPiece);

        // Specifically remove the victim pawn from the board explicitly without a normal capture square mapping
        const newPiecesMap = new Map(Array.from(boardWithMove.pieces.entries()).filter(([posStr]) => posStr !== this.victimPosition.toString()));

        return {
            board: new Board(newPiecesMap),
            movedPiece,
            capturedData: { piece: this.victimPiece, position: this.victimPosition },
            enPassantTarget: null
        };
    }
}
