import { Board } from '../Board';
import { Position } from '../Position';
import { Piece } from '../Piece';
import { PieceType } from '../../enums/PieceType';
import { Move, MoveExecutionResult } from './Move';

export class PromotionMove extends Move {
    constructor(from: Position, to: Position, piece: Piece, public readonly targetPiece?: Piece, public readonly promotionType: PieceType = PieceType.QUEEN) {
        super(from, to, piece);
    }

    matches(to: Position, promotionType?: PieceType): boolean {
        return this.to.equals(to) && this.promotionType === promotionType;
    }

    execute(board: Board): MoveExecutionResult {
        let capturedData = undefined;
        if (this.targetPiece) {
            capturedData = { piece: this.targetPiece, position: this.to };
        }

        const promotedPiece = new Piece(this.promotionType, this.piece.color);
        const newBoard = board.movePiece(this.from, this.to, promotedPiece);

        return {
            board: newBoard,
            movedPiece: promotedPiece,
            capturedData,
            enPassantTarget: null
        };
    }
}
