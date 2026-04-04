import { Game } from '../domain/models/Game';
import { IGameRepository } from './ports/IGameRepository';

export class InMemoryGameRepository implements IGameRepository {
  private game: Game;

  constructor(initialGame: Game) {
    this.game = initialGame;
  }

  getGame(): Game {
    return this.game.clone();
  }

  save(game: Game): void {
    this.game = game;
  }

  reset(game: Game): void {
    this.game = game;
  }
}
