import React, { useState, useEffect } from "react";
import { gameConfig } from "./game/pong/modifiers/modifiers";

function formatKey(key) {
   if (key === "ArrowUp") return "🠕";
  if (key === "ArrowDown") return "🠗";
  if (key === "ArrowLeft") return "🠔";
  if (key === "ArrowRight") return "🠖";
  if (key === " ") return "␣";
  return key.length > 4 ? key.slice(0, 4) + "…" : key.toUpperCase();
}


export default function GameSetup({ onStart, onClose }) {
  const [players, setPlayers] = useState({
    left: { type: "Player", up: "w", down: "s", aiDifficulty: "Normal" },
    right: { type: "Player", up: "ArrowUp", down: "ArrowDown", aiDifficulty: "Normal" },
  });

  const [modifiers, setModifiers] = useState({ ...gameConfig.modifiers });
  const [listeningKey, setListeningKey] = useState(null);
  const [modifiersHover, setModifiersHover] = useState(null);

  // key assignation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!listeningKey) return;
      const [side, dir] = listeningKey.split("-");
      setPlayers((prev) => ({
        ...prev,
        [side]: { ...prev[side], [dir]: e.key },
      }));
      setListeningKey(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [listeningKey]);

  const handleStart = () => {
    for (let key in modifiers) gameConfig.modifiers[key] = modifiers[key];
    onStart(players);
    onClose();
  };

  const modifierDescriptions = {
    increaseSpeed: "Ball speed increases after each paddle bounce.",
    spin: "Hitting the ball while moving applies a spin effect.",
    arena: "Enable delimited goal zones.",
    paddleBounceAngle: "The ball bounce at an angle depending where it hits the paddle."
  };


  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-[#0a0446]/60 neon-border rounded-xl px-8 py-6 w-[600px] max-h-[80vh] overflow-y-auto text-white">
        <h1 className="text-4xl mb-8 neon-glitch neon-glitch--always text-center tracking-widest"
          data-text="𝔾𝔸𝕄𝔼 𝕊𝔼𝕋𝕌ℙ">
          𝔾𝔸𝕄𝔼 𝕊𝔼𝕋𝕌ℙ</h1>

        <div className="flex items-start justify-center gap-8 mb-2">
          <div className="flex gap-10 justify-center mb-6">

            {/* LEFT PLAYER */}
            <div className="flex flex-col gap-3 items-center w-32">
              <h2 className="text-xl text-cyan-300 text-center">Left Player</h2>

              <select
                value={players.left.type}
                onChange={(e) =>
                  setPlayers((prev) => ({
                    ...prev,
                    left: { ...prev.left, type: e.target.value },
                  }))
                }
                className="px-2 py-1 rounded bg-gray-900/80 text-cyan-300 small-border w-full"
              >
                <option value="Player">Player</option>
                <option value="AI">AI</option>
              </select>

              {players.left.type === "Player" ? (
                <div className="flex flex-col gap-3 mt-2 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyan-300">UP:</span>
                    <button
                      onClick={() => setListeningKey("left-up")}
                      className="key-box bg-gray-900/80 small-border text-cyan-300 rounded hover:bg-gray-700 transition"
                    >
                      {formatKey(players.left.up)}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyan-300">DOWN:</span>
                    <button
                      onClick={() => setListeningKey("left-down")}
                      className="key-box bg-gray-900/80 small-border text-cyan-300 rounded hover:bg-gray-700 transition"
                    >
                      {formatKey(players.left.down)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-2 w-full">
                  <span className="text-sm text-cyan-300">{" "}DIFF:</span>
                  <select
                    value={players.left.aiDifficulty}
                    onChange={(e) =>
                      setPlayers((prev) => ({
                        ...prev,
                        left: { ...prev.left, aiDifficulty: e.target.value },
                      }))
                    }
                    className="px-1 py-1 rounded bg-gray-900/80 text-cyan-300 small-border w-20 text-center"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Normal">Normal</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              )}
            </div>

            {/* SEPARATOR */}
            <div className="w-px bg-cyan-300/40"></div>

            {/* RIGHT PLAYER */}
            <div className="flex flex-col gap-3 items-center w-32">
              <h2 className="text-xl text-cyan-300 text-center">Right Player</h2>

              <select
                value={players.right.type}
                onChange={(e) =>
                  setPlayers((prev) => ({
                    ...prev,
                    right: { ...prev.right, type: e.target.value },
                  }))
                }
                className="px-2 py-1 rounded bg-gray-900/80 text-cyan-300 small-border w-full"
              >
                <option value="Player">Player</option>
                <option value="AI">AI</option>
              </select>

              {players.right.type === "Player" ? (
                <div className="flex flex-col gap-3 mt-2 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyan-300">UP:</span>
                    <button
                      onClick={() => setListeningKey("right-up")}
                      className="key-box bg-gray-900/80 small-border text-cyan-300 rounded hover:bg-gray-700 transition"
                    >
                      {formatKey(players.right.up)}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyan-300">DOWN:</span>
                    <button
                      onClick={() => setListeningKey("right-down")}
                      className="key-box bg-gray-900/80 small-border text-cyan-300 rounded hover:bg-gray-700 transition"
                    >
                      {formatKey(players.right.down)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-2 w-full">
                  <span className="text-sm text-cyan-300">DIFF:</span>
                  <select
                    value={players.right.aiDifficulty}
                    onChange={(e) =>
                      setPlayers((prev) => ({
                        ...prev,
                        right: { ...prev.right, aiDifficulty: e.target.value },
                      }))
                    }
                    className="px-1 py-1 rounded bg-gray-900/80 text-cyan-300 small-border w-20 text-center"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Normal">Normal</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              )}
            </div>

          </div>

        </div>

        <div className="mb-16">
          <h2 className="text-xl text-cyan-300 mb-4 text-center">Modifiers</h2>

          <div className="flex justify-center gap-4 relative group">
            {Object.keys(modifiers).map((key) => (
              <button
                key={key}
                onClick={() =>
                  setModifiers((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                onMouseEnter={() => setModifiersHover(key)}
                onMouseLeave={() => setModifiersHover(null)}
                className={`w-12 h-12 flex items-center justify-center small-border rounded transition
                  ${modifiers[key] 
                    ? "bg-cyan-500 scale-90 shadow-lg shadow-cyan-400/50 transform transition-all duration-200" 
                    : "bg-gray-900/80 hover:bg-gray-700"}
                `}
              >
                <img
                  src={`/icons/${key}.png`}
                  alt={key}
                  className="w-10 h-10 pointer-events-none"
                />
              </button>
            ))}

            <div className="absolute -bottom-8 w-full text-center text-xs text-white">
              {modifiersHover && modifierDescriptions[modifiersHover]}
            </div>
          </div>
        </div>




        <div className="flex justify-center gap-4">
          <button
            onClick={handleStart}
            className="neon-glitch-parent px-6 py-2 neon-border rounded hover:bg-gray-700 transition"
          >
            <span
              data-text="ℙ𝕃𝔸𝕐"
              className="neon-glitch neon-glitch--hover inline-block"
            >
              ℙ𝕃𝔸𝕐
            </span>
          </button>
          <button
            onClick={onClose}
            className="neon-glitch-parent px-6 py-2 neon-border rounded hover:bg-gray-700 transition"
          >
            <span
              data-text="ℂ𝔸ℕℂ𝔼𝕃"
              className="neon-glitch neon-glitch--hover inline-block"
            >
              ℂ𝔸ℕℂ𝔼𝕃
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
