import { IGameRepository } from '../ports/IGameRepository';
import { DomainEventDispatcher } from '../DomainEventDispatcher';
import { Position } from '../../domain/models/Position';
import { RulesEngine } from '../../domain/services/RulesEngine';
import { IllegalMoveError } from '../../domain/errors';

export class MakeMoveUseCase {
  constructor(
    private readonly repository: IGameRepository,
    private readonly dispatcher: DomainEventDispatcher,
    private readonly rules: RulesEngine,
  ) {}

  execute(from: Position, to: Position): void {
    const game = this.repository.getGame();

    const legalMoves = this.rules.getLegalMoves(game.board, from, game.enPassantTarget);
    const move = legalMoves.find(m => m.to.equals(to));

    if (!move) {
      throw new IllegalMoveError();
    }

    game.applyMove(move, this.rules);

    this.repository.save(game);

    this.dispatcher.dispatchMany(game.domainEvents);
    game.clearDomainEvents();
  }
}
