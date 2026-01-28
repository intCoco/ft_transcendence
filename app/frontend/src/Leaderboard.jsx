import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function Leaderboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data);
      });
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center text-white">
      <h1
        className="neon-glitch neon-glitch--always text-5xl mt-16 mb-8"
        data-text={t("leaderboard")}
      >
        {t("leaderboard")}
      </h1>
      <button
        className="absolute top-4 left-4 px-2 py-1 neon-border bg-gray-900/60 text-cyan-300"
        onClick={() => navigate(-1)}
      >
        {t("back")}
      </button>
      <table className="w-full max-w-lg mt-4 text-center">
        <thead>
          <tr className="text-cyan-300">
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">{t("nickname")}</th>
            <th className="px-4 py-2">{t("wins")}</th>
            <th className="px-4 py-2">{t("losses")}</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((user, index) => (
            <tr key={user.id} className="border-t border-cyan-500/30">
              <td className="px-4 py-2">{index + 1}</td>
              <td className="px-4 py-2">{user.nickname}</td>
              <td className="px-4 py-2">{user.wins}</td>
              <td className="px-4 py-2">{user.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
