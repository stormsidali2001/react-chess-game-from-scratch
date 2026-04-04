import { IGameRepository } from "../ports/IGameRepository";
import { DomainEventDispatcher } from "../DomainEventDispatcher";
import { Position } from "../../domain/models/Position";
import { PieceType } from "../../domain/enums/PieceType";
import { RulesEngine } from "../../domain/services/RulesEngine";
import { IllegalMoveError } from "../../domain/errors";

export class MakeMoveUseCase {
  constructor(
    private readonly repository: IGameRepository,
    private readonly dispatcher: DomainEventDispatcher,
    private readonly rules: RulesEngine,
  ) {}

  execute(
    from: Position,
    to: Position,
    promotionType: PieceType = PieceType.QUEEN,
  ): void {
    const game = this.repository.getGame();

    const legalMoves = this.rules.getLegalMoves(
      game.board,
      from,
      game.enPassantTarget,
      game.castlingRights,
    );

    const move = legalMoves.find((m) => m.matches(to, promotionType));

    if (!move) throw new IllegalMoveError();

    game.applyMove(move);

    const newStatus = this.rules.evaluateStatus(
      game.board,
      game.turn,
      game.enPassantTarget,
      game.castlingRights,
      game.halfMoveClock,
    );
    game.updateStatus(newStatus);

    this.repository.save(game);
    this.dispatcher.dispatchMany(game.domainEvents);
    game.clearDomainEvents();
  }
}
