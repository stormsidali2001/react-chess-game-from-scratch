import { Game } from '../../domain/models/Game';

export interface IGameRepository {
    getGame(): Game;
    save(game: Game): void;
}
