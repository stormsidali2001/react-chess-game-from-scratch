import { Color } from '../enums/Color';
import { ValueObject } from '../core/ValueObject';

interface CastlingRightsProps {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export class CastlingRights extends ValueObject<CastlingRightsProps> {

  static initial(): CastlingRights {
    return new CastlingRights({
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    });
  }

  static fromFlags(
    whiteKingSide: boolean,
    whiteQueenSide: boolean,
    blackKingSide: boolean,
    blackQueenSide: boolean,
  ): CastlingRights {
    return new CastlingRights({ whiteKingSide, whiteQueenSide, blackKingSide, blackQueenSide });
  }

  canCastleKingSide(color: Color): boolean {
    return color === Color.WHITE ? this.props.whiteKingSide : this.props.blackKingSide;
  }

  canCastleQueenSide(color: Color): boolean {
    return color === Color.WHITE ? this.props.whiteQueenSide : this.props.blackQueenSide;
  }

  revokeAll(color: Color): CastlingRights {
    if (color === Color.WHITE) {
      return new CastlingRights({ ...this.props, whiteKingSide: false, whiteQueenSide: false });
    }
    return new CastlingRights({ ...this.props, blackKingSide: false, blackQueenSide: false });
  }

  revokeKingSide(color: Color): CastlingRights {
    if (color === Color.WHITE) {
      return new CastlingRights({ ...this.props, whiteKingSide: false });
    }
    return new CastlingRights({ ...this.props, blackKingSide: false });
  }

  revokeQueenSide(color: Color): CastlingRights {
    if (color === Color.WHITE) {
      return new CastlingRights({ ...this.props, whiteQueenSide: false });
    }
    return new CastlingRights({ ...this.props, blackQueenSide: false });
  }
}
