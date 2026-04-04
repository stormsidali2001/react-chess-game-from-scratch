import React, { useState } from "react";

interface FenInputProps {
  onLoad: (fen: string) => boolean;
  onReset: () => void;
}

const FenInput: React.FC<FenInputProps> = ({ onLoad, onReset }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const handleLoad = () => {
    const ok = onLoad(value.trim());
    if (ok) {
      setValue("");
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLoad();
    if (error) setError(false);
  };

  return (
    <div className="flex flex-col gap-2 w-64">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          onKeyDown={handleKeyDown}
          placeholder="Paste FEN…"
          className={`flex-1 px-3 py-2 text-xs font-mono rounded-lg border-2 outline-none transition-colors
            ${error
              ? "border-red-400 bg-red-50 text-red-700 placeholder-red-300"
              : "border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:border-slate-600"
            }`}
        />
        <button
          onClick={handleLoad}
          disabled={!value.trim()}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-lg bg-slate-800 text-white
            hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Load
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 font-medium px-1">Invalid FEN string</p>
      )}
      <button
        onClick={onReset}
        className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors text-left"
      >
        Reset to starting position
      </button>
    </div>
  );
};

export default FenInput;
