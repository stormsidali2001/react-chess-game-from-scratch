import { IGameRepository } from '../ports/IGameRepository';
import { DomainEventDispatcher } from '../DomainEventDispatcher';
import { Position } from '../../domain/models/Position';
import { RulesEngine } from '../../domain/services/RulesEngine';
import { IllegalMoveError } from '../../domain/errors';

export class MakeMoveUseCase {
  constructor(
    private repository: IGameRepository,
    private dispatcher: DomainEventDispatcher
  ) { }

  execute(from: Position, to: Position): void {
    const game = this.repository.getGame();

    // 1. Validate if the move is legal (Still Domain Logic, but we can do it here or inside Game)
    const legalMoves = RulesEngine.getLegalMoves(game.board, from);
    if (!legalMoves.some(m => m.equals(to))) {
      throw new IllegalMoveError();
    }

    // 2. MUTATE the domain object, injecting the rules engine domain service directly
    game.makeMove(from, to, RulesEngine);

    // 3. Persist the changes
    this.repository.save(game);

    // 4. Dispatch events *after* persistence
    this.dispatcher.dispatchMany(game.domainEvents);
    game.clearDomainEvents();
  }
}
