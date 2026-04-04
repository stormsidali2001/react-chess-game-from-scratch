import { Game } from '../models/Game';
import { BoardSetup } from './BoardSetup';

export class GameFactory {
    /**
     * Creates a standard chess game with the board in its initial position.
     */
    static createStandardGame(): Game {
        const initialBoard = BoardSetup.standard();
        return Game.create({ board: initialBoard });
    }

    /**
     * You can add custom game variations here later, 
     * e.g., createFischerRandomGame(), createHandicapGame(), etc.
     */
}
