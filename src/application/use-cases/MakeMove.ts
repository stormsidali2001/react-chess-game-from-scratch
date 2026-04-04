import { RulesEngine } from '../../domain/services/RulesEngine';
import { Game, GameStatus } from '../../domain/models/Game';
import { getOpponentColor } from '../../domain/enums/Color';
import { Position } from '../../domain/models/Position';

export class MakeMoveUseCase {
  execute(game: Game, from: Position, to: Position): void {
    // 1. Validate if the move is legal (Still Domain Logic)
    const legalMoves = RulesEngine.getLegalMoves(game.board, from);
    if (!legalMoves.some(m => m.equals(to))) {
      throw new Error('Illegal move');
    }

    // 2. MUTATE the domain object
    game.makeMove(from, to);

    // 3. Update game status (Check, Checkmate, etc.)
    const opponentColor = getOpponentColor(game.turn === 'white' ? 'black' as any : 'white' as any); // Correcting turn logic
    
    // We need to check against the CURRENT turn (which is the opponent after makeMove)
    if (RulesEngine.isCheckmate(game.board, game.turn)) {
      game.updateStatus(GameStatus.CHECKMATE);
    } else if (RulesEngine.isKingInCheck(game.board, game.turn)) {
      game.updateStatus(GameStatus.CHECK);
    } else {
      game.updateStatus(GameStatus.ACTIVE);
    }
  }
}
