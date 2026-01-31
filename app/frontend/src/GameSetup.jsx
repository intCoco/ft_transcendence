import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { gameConfig } from "./game/pong/modifiers/modifiers";
import "./i18n";

function formatKey(key) {
  if (key === "ArrowUp") return "🠕";
  if (key === "ArrowDown") return "🠗";
  if (key === "ArrowLeft") return "🠔";
  if (key === "ArrowRight") return "🠖";
  if (key === " ") return "␣";
  return key.length > 4 ? key.slice(0, 4) + "…" : key.toUpperCase();
}

export default function GameSetup({ onStart, onClose }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("2p");
  const [animateExtras, setAnimateExtras] = useState(false);
  const [show4pLayout, setShow4pLayout] = useState(false);

  const [players, setPlayers] = useState({
    left: { type: "Player", up: "w", down: "s", aiDifficulty: "Normal" },
    right: { type: "Player", up: "ArrowUp", down: "ArrowDown", aiDifficulty: "Normal" },

    top: null,
    bot: null,
  });

  const [modifiers, setModifiers] = useState({ ...gameConfig.modifiers });
  const [listeningKey, setListeningKey] = useState(null);
  const [modifiersHover, setModifiersHover] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!listeningKey) return;
      const [side, dir] = listeningKey.split("-");
      const newPlayers = { ...players };
      newPlayers[side][dir] = e.key;
      setPlayers(newPlayers);
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
    increaseSpeed: t("increaseSpeedDescription"),
    spin: t("spinDescription"),
    arena: t("arenaDescription"),
    paddleBounceAngle: t("paddleBounceAngleDescription"),
  };

  useEffect(() => {
    if (mode === "4p") {
      setShow4pLayout(true);
      const id = setTimeout(() => setAnimateExtras(true), 100);
      return () => clearTimeout(id);
    } else {
      setAnimateExtras(false);
      const id = setTimeout(() => {
        setShow4pLayout(false);
        setPlayers((prev) => ({
          ...prev,
          top: null,
          bot: null,
        }));
      }, 100);
      return () => clearTimeout(id);
    }
  }, [mode]);






  const renderPlayer = (id, label) => {
    const p = players[id];

    return (
      <div key={id} className="flex flex-col gap-3 items-center w-32 min-w-[7rem] flex-shrink-0 min-h-[162px]">
        <h2 className="text-xl text-cyan-300 text-center whitespace-nowrap">{label}</h2>

        <select
          value={p.type}
          onChange={(e) => {
            const newPlayers = { ...players };
            newPlayers[id].type = e.target.value;
            setPlayers(newPlayers);
          }}
          className="px-2 py-1 rounded bg-gray-900/80 text-cyan-300 small-border w-full"
        >
          <option value="Player">{t("player")}</option>
          <option value="AI">{t("ai")}</option>
        </select>

        {p.type === "Player" ? (
          <div className="flex flex-col gap-3 mt-2 w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm text-cyan-300">{t("up")}:</span>
              <button
                onClick={() => setListeningKey(`${id}-up`)}
                className="key-box bg-gray-900/80 small-border text-cyan-300 rounded hover:bg-gray-700 transition"
              >
                {formatKey(p.up)}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-cyan-300">{t("down")}:</span>
              <button
                onClick={() => setListeningKey(`${id}-down`)}
                className="key-box bg-gray-900/80 small-border text-cyan-300 rounded hover:bg-gray-700 transition"
              >
                {formatKey(p.down)}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-2 w-full">
            <span className="text-sm text-cyan-300">{t("diff")}:</span>
            <select
              value={players[id].aiDifficulty}
              onChange={(e) => {
                const newPlayers = { ...players };
                newPlayers[id].aiDifficulty = e.target.value;
                setPlayers(newPlayers);
              }}
              className="px-1 py-1 rounded bg-gray-900/80 text-cyan-300 small-border w-20 text-center"
            >
              <option value="Easy">{t("easy")}</option>
              <option value="Normal">{t("normal")}</option>
              <option value="Hard">{t("hard")}</option>
            </select>
          </div>
        )}
      </div>
    );
  };


  



  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
      <div
        className={`bg-[#0a0446]/60 neon-border rounded-xl px-8 py-6 text-white max-h-[80vh] overflow-y-auto transition-all duration-200 ${
          show4pLayout ? "w-[900px]" : "w-[600px]"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl neon-glitch neon-glitch--always tracking-widest">
            {t("gameSetup")}
          </h1>

          <div className="flex border-b border-cyan-300/40">
            <button
              onClick={() => setMode("2p")}
              className={`px-4 py-1 text-sm ${
                mode === "2p"
                  ? "text-cyan-300 border-b-2 border-cyan-300"
                  : "text-gray-400"
              }`}
            >
              {t("2p")}
            </button>
            <button
              onClick={() => {
                setMode("4p");

                setPlayers((prev) => ({
                  ...prev,
                  top: { type: "Player", up: "z", down: "x", aiDifficulty: "Normal" },
                  bot: { type: "Player", up: "ArrowLeft", down: "ArrowRight", aiDifficulty: "Normal" },
                }));
              }}
              className={`px-4 py-1 text-sm ${
                mode === "4p"
                  ? "text-cyan-300 border-b-2 border-cyan-300"
                  : "text-gray-400"
              }`}
            >
              {t("4p")}
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-10 mb-8">
          {show4pLayout && (
            <div
              className={`flex flex-row items-start gap-10 transform transition-all duration-500 ease-out ${
                animateExtras
                  ? "-translate-x-0 opacity-100"
                  : "translate-x-6 opacity-0 pointer-events-none"
              }`}
            >
              {renderPlayer("top", t("topPlayer"))}
              <div className="w-px h-full bg-cyan-300/40" />
            </div>
          )}

          {renderPlayer("left", t("leftPlayer"))}

          <div className="w-px bg-cyan-300/40" />

          {renderPlayer("right", t("rightPlayer"))}

          {show4pLayout && (
            <div
              className={`flex flex-row items-start gap-10 transform transition-all duration-500 ease-out ${
                animateExtras
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-6 opacity-0 pointer-events-none"
              }`}
            >
              <div className="w-px h-full bg-cyan-300/40" />
              {renderPlayer("bot", t("bottomPlayer"))}
            </div>
          )}
        </div>

        <div className="mb-12">
          <h2 className="text-xl text-cyan-300 mb-4 text-center">
            {t("modifiers")}
          </h2>

          <div className="flex justify-center gap-4 relative">
            {Object.keys(modifiers).map((key) => (
              <button
                key={key}
                onClick={() =>
                  setModifiers((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                onMouseEnter={() => setModifiersHover(key)}
                onMouseLeave={() => setModifiersHover(null)}
                className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-150 bg-black
                  ${modifiers[key]
                    ? "border-2 border-cyan-300 shadow-lg shadow-cyan-400/50 scale-105"
                    : "border-2 border-gray-700 opacity-70 hover:bg-black-900 hover:opacity-100"}
                `}
              >
                <img
                  src={`/icons/${key}.png`}
                  alt={key}
                  className={`w-12 h-12 transition-all duration-150 ${modifiers[key] ? "filter-none" : "grayscale opacity-60"}`}
                />
              </button>
            ))}
            <div className="absolute -bottom-6 text-xs w-full text-center">
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
              data-text={t("play")}
              className="neon-glitch neon-glitch--hover inline-block"
            >
              {t("play")}
            </span>
          </button>
          <button
            onClick={onClose}
            className="neon-glitch-parent px-6 py-2 neon-border rounded hover:bg-gray-700 transition"
          >
            <span
              data-text={t("cancel")}
              className="neon-glitch neon-glitch--hover inline-block"
            >
              {t("cancel")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
