import { IGameRepository } from '../ports/IGameRepository';
import { Position } from '../../domain/models/Position';
import { CastleMove } from '../../domain/models/Move';
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

    const seen = new Set<string>();
    const targets: Position[] = [];

    for (const move of this.rules.getLegalMoves(
      game.board,
      position,
      game.enPassantTarget,
      game.castlingRights,
    )) {
      // For castling moves, also highlight the rook's square so the user can
      // drag the king onto the rook (standard chess UI convention).
      if (move instanceof CastleMove) {
        const rookKey = move.rookFrom.toString();
        if (!seen.has(rookKey)) {
          seen.add(rookKey);
          targets.push(move.rookFrom);
        }
      }

      const key = move.to.toString();
      if (!seen.has(key)) {
        seen.add(key);
        targets.push(move.to);
      }
    }

    return targets;
  }
}
