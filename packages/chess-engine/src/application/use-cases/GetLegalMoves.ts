import { IGameRepository } from '../ports/IGameRepository';
import { Position } from '../../domain/models/Position';
import { RulesEngine } from '../../domain/services/RulesEngine';

export class GetLegalMovesQuery {
  constructor(
    private readonly repository: IGameRepository,
    private readonly rules: RulesEngine,
  ) {}

  execute(position: Position): Position[] {
    const game = this.repository.getGame();
    const piece = game.board.getPieceAt(position);

    if (!piece || piece.color !== game.turn) return [];

    return this.rules
      .getLegalMoves(game.board, position, game.enPassantTarget)
      .map(m => m.to);
  }
}
