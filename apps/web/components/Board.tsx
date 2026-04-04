import React, { useRef, useState, useEffect } from "react";
import Tile from "./Tile";
import { useChessGame } from "../src/ui/hooks/useChessGame";
import { Position, Color } from "@chess/engine";

const Board: React.FC = () => {
  const { board, turn, status, selectedPosition, legalMoves, formattedHistory, selectPosition, makeMove } = useChessGame();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'checkmate') {
      alert(`Checkmate! ${turn === Color.WHITE ? 'Black' : 'White'} wins!`);
    }
  }, [status, turn]);

  // Auto-scroll history
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [formattedHistory]);

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

  // Group history into pairs (White move, Black move)
  const movePairs = [];
  for (let i = 0; i < formattedHistory.length; i += 2) {
    movePairs.push({
      white: formattedHistory[i],
      black: formattedHistory[i + 1] || ""
    });
  }

  return (
    <div className="flex flex-row items-center justify-center gap-10 p-10 bg-slate-100 min-h-screen w-full font-sans">

      {/* Main Board Section */}
      <div className="flex flex-col items-center gap-5">
        <div className='text-2xl font-bold text-slate-800 uppercase tracking-widest'>
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
              const rankLabel = x === 0 ? (8 - y).toString() : undefined;
              const fileLabel = y === 7 ? String.fromCharCode(97 + x) : undefined;

              return (
                <Tile
                  key={`${x}-${y}`}
                  color={(x + y) % 2 === 0 ? 'white' : 'black'}
                  piece={board.getPieceAt(pos)}
                  highlighted={legalMoves.some(m => m.x === x && m.y === y)}
                  hidden={selectedPosition?.equals(pos)}
                  rankLabel={rankLabel}
                  fileLabel={fileLabel}
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

      {/* Move History Sidebar */}
      <div className="flex flex-col w-64 h-[600px] bg-white border-2 border-slate-300 rounded-lg shadow-lg overflow-hidden mt-12">
        <div className="bg-slate-800 text-white p-3 font-bold text-center uppercase tracking-wide">
          Move History
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
                <th className="p-2 text-left w-12">#</th>
                <th className="p-2 text-left">White</th>
                <th className="p-2 text-left">Black</th>
              </tr>
            </thead>
            <tbody>
              {movePairs.map((pair, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="p-2 text-slate-400 font-mono">{index + 1}.</td>
                  <td className="p-2 font-semibold text-slate-700">{pair.white}</td>
                  <td className="p-2 font-semibold text-slate-700">{pair.black}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div ref={historyEndRef} />
          {formattedHistory.length === 0 && (
            <div className="text-center text-slate-400 mt-10 italic">No moves yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Board;
