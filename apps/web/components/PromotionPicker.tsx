import React, { useEffect } from "react";
import { PieceType, Color } from "@chess/engine";

const PROMOTION_PIECES: PieceType[] = [
  PieceType.QUEEN,
  PieceType.ROOK,
  PieceType.BISHOP,
  PieceType.KNIGHT,
];

interface PromotionPickerProps {
  color: Color;
  onConfirm: (pieceType: PieceType) => void;
  onCancel: () => void;
}

const PromotionPicker: React.FC<PromotionPickerProps> = ({ color, onConfirm, onCancel }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={(e) => { e.stopPropagation(); onCancel(); }}
    >
      <div
        className="flex flex-col items-center gap-3 bg-white rounded-2xl shadow-2xl p-6 border-4 border-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="text-slate-700 font-bold text-lg uppercase tracking-widest">
          Promote to
        </p>
        <div className="flex gap-3">
          {PROMOTION_PIECES.map((pt) => (
            <button
              key={pt}
              onClick={() => onConfirm(pt)}
              className="w-16 h-16 flex items-center justify-center rounded-xl border-2 border-slate-300 hover:border-slate-600 hover:bg-slate-100 transition-all"
              title={pt}
            >
              <img
                src={`/chessPieces/${color}/${pt}.png`}
                alt={`${color} ${pt}`}
                className="w-[80%] h-[80%] object-contain drop-shadow-sm"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionPicker;
