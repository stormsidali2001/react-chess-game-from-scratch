import { RulesEngine } from '../../domain/services/RulesEngine';
import { Game, GameStatus } from '../../domain/models/Game';
import { getOpponentColor } from '../../domain/enums/Color';
import { Position } from '../../domain/models/Position';

export class MakeMoveUseCase {
  execute(game: Game, from: Position, to: Position): Game {
    // 1. Validate if the move is legal
    const legalMoves = RulesEngine.getLegalMoves(game.board, from);
    if (!legalMoves.some(m => m.equals(to))) {
      throw new Error('Illegal move');
    }

    // 2. Perform the move in the domain
    let nextGame = game.makeMove(from, to);

    // 3. Update game status (Check, Checkmate, etc.)
    const opponentColor = getOpponentColor(game.turn);
    if (RulesEngine.isCheckmate(nextGame.board, opponentColor)) {
      nextGame = new Game({
        board: nextGame.board,
        turn: nextGame.turn,
        history: nextGame.history,
        captured: nextGame.captured,
        status: GameStatus.CHECKMATE
      });
    } else if (RulesEngine.isKingInCheck(nextGame.board, opponentColor)) {
      nextGame = new Game({
        board: nextGame.board,
        turn: nextGame.turn,
        history: nextGame.history,
        captured: nextGame.captured,
        status: GameStatus.CHECK
      });
    }

    return nextGame;
  }
}
