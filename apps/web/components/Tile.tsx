import React from "react";
import { Piece } from "@chess/engine";

interface TileProps {
  piece?: Piece;
  color: 'white' | 'black';
  highlighted?: boolean;
  hidden?: boolean;
  isFlashing?: boolean;
  rankLabel?: string;
  fileLabel?: string;
}

const Tile: React.FC<TileProps> = ({ piece, color, highlighted, hidden, isFlashing, rankLabel, fileLabel }) => {
  const isWhite = color === 'white';
  const bgColor = isWhite ? 'bg-slate-200' : 'bg-slate-500';
  const highlightOverlay = highlighted ? 'bg-yellow-200/50 border-2 border-yellow-400' : '';
  const labelColor = isWhite ? 'text-slate-500' : 'text-slate-200';

  const flashClass = isFlashing ? 'flash-capture' : '';

  return (
    <div className={`tile relative flex items-center justify-center w-full h-full ${bgColor} ${highlightOverlay} ${flashClass}`}>

      {/* Rank Label (1-8) - Top Left */}
      {rankLabel && (
        <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${labelColor} pointer-events-none`}>
          {rankLabel}
        </span>
      )}

      {/* File Label (a-h) - Bottom Right */}
      {fileLabel && (
        <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${labelColor} pointer-events-none uppercase`}>
          {fileLabel}
        </span>
      )}

      {piece && !hidden && (
        <img
          src={`/chessPieces/${piece.color}/${piece.type}.png`}
          alt={`${piece.color} ${piece.type}`}
          className="piece w-[85%] h-[85%] object-contain pointer-events-none drop-shadow-sm"
        />
      )}
    </div>
  );
};

export default Tile;
