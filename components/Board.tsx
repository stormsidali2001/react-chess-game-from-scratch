import React, { useRef, useState, useEffect } from "react";
import Tile from "./Tile";
import { useChessGame } from "../src/ui/hooks/useChessGame";
import { Position } from "../src/domain/models/Position";
import { Color } from "../src/domain/enums/Color";

const Board: React.FC = () => {
  const { board, turn, status, selectedPosition, legalMoves, selectPosition, makeMove } = useChessGame();
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'checkmate') {
      alert(`Checkmate! ${turn === Color.WHITE ? 'Black' : 'White'} wins!`);
    }
  }, [status, turn]);

  const getCoord = (e: React.MouseEvent) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / 8));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / 8));
    return Position.isValid(x, y) ? new Position(x, y) : null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCoord(e);
    if (pos) {
      selectPosition(pos);
      setMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedPosition) setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const pos = getCoord(e);
    if (pos) makeMove(pos);
    else selectPosition(null);
  };

  const draggingPiece = selectedPosition ? board.getPieceAt(selectedPosition) : null;

  return (
    <div className="flex justify-center flex-col text-2xl font-bold gap-5 select-none h-screen items-center bg-slate-100 w-full">
      <div className='text-center text-slate-800 uppercase tracking-widest'>
        {status === 'check' && <span className="text-red-600 animate-pulse">Check! </span>}
        {turn} turn
      </div>

      <div 
        ref={boardRef} 
        className="grid grid-cols-8 grid-rows-8 w-[600px] h-[600px] border-8 border-slate-800 shadow-2xl relative cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {Array.from({ length: 8 }).map((_, y) => 
          Array.from({ length: 8 }).map((_, x) => {
            const pos = new Position(x, y);
            return (
              <Tile
                key={`${x}-${y}`}
                color={(x + y) % 2 === 0 ? 'white' : 'black'}
                piece={board.getPieceAt(pos)}
                highlighted={legalMoves.some(m => m.x === x && m.y === y)}
                hidden={selectedPosition?.equals(pos)}
              />
            );
          })
        )}

        {/* Ghost Piece */}
        {draggingPiece && (
          <div 
            className="fixed pointer-events-none z-50 flex items-center justify-center"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              width: 600 / 8,
              height: 600 / 8,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <img
              src={`/chessPieces/${draggingPiece.color}/${draggingPiece.type}.png`}
              className="w-[85%] h-[85%] object-contain drop-shadow-2xl"
              alt="dragging"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Board;
