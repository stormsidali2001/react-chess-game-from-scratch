import React from "react";
import { Piece } from "../src/domain/models/Piece";

interface TileProps {
  piece?: Piece;
  color: 'white' | 'black';
  highlighted?: boolean;
  hidden?: boolean;
}

const Tile: React.FC<TileProps> = ({ piece, color, highlighted, hidden }) => {
  const bgColor = color === 'white' ? 'bg-slate-200' : 'bg-slate-500';
  const highlightOverlay = highlighted ? 'bg-yellow-200/50 border-2 border-yellow-400' : '';

  return (
    <div className={`tile relative flex items-center justify-center w-full h-full ${bgColor} ${highlightOverlay}`}>
      {piece && !hidden && (
        <img
          src={`/chessPieces/${piece.color}/${piece.type}.png`}
          alt={`${piece.color} ${piece.type}`}
          className="piece w-[80%] h-[80%] object-contain pointer-events-none"
        />
      )}
    </div>
  );
};

export default Tile;
