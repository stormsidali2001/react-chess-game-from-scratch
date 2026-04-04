export abstract class DomainError extends Error {
    public readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class GameOverError extends DomainError {
    constructor(message: string = "Cannot make move: The game is already over.") {
        super(message, "GAME_OVER");
    }
}

export class InvalidTurnError extends DomainError {
    constructor(message: string = "Invalid turn or no piece at source.") {
        super(message, "INVALID_TURN");
    }
}

export class IllegalMoveError extends DomainError {
    constructor(message: string = "This move is illegal according to the rules of chess.") {
        super(message, "ILLEGAL_MOVE");
    }
}

export class InvalidPositionError extends DomainError {
    constructor(x: number, y: number) {
        super(`Invalid board position: (${x}, ${y}). Coordinates must be between 0 and 7.`, "INVALID_POSITION");
    }
}
