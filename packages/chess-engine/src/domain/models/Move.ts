import { Board } from './Board';
import { Position } from './Position';
import { Piece } from './Piece';
import { PieceType } from '../enums/PieceType';

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

export class PromotionMove extends Move {
    constructor(from: Position, to: Position, piece: Piece, public readonly targetPiece?: Piece, public readonly promotionType: PieceType = PieceType.QUEEN) {
        super(from, to, piece);
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
