import { IGameRepository } from "../ports/IGameRepository";
import { Position } from "../../domain/models/Position";
import { CastleMove } from "../../domain/models/Move";
import { RulesEngine } from "../../domain/services/RulesEngine";

export class GetLegalMovesQuery {
  constructor(
    private readonly repository: IGameRepository,
    private readonly rules: RulesEngine,
  ) {}

  execute(position: Position): Position[] {
    const game = this.repository.getGame();

    if (!game.isOwnPiece(position)) return [];

    const seen = new Set<string>();
    const targets: Position[] = [];

    for (const move of this.rules.getLegalMoves(
      game.board,
      position,
      game.enPassantTarget,
      game.castlingRights,
    )) {
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
