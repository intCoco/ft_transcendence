import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./i18n";

const AUTH_KEY = "auth_token";

export default function LeaderboardPage()
{
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [leaderboard, setLeaderboard] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() =>
	{
		const fetchLeaderboard = async () =>
		{
			try
			{
				const token = localStorage.getItem(AUTH_KEY);
				if (!token)
				{
					setError("No authentication token found.");
					setLoading(false);
					return;
				}

				const response = await fetch("/api/leaderboard",
				{
					headers:
					{
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok)
					throw new Error(`Error: ${response.status} ${response.statusText}`);

				const data = await response.json();
				setLeaderboard(data);
			}
			catch (err)
			{
				setError(err.message);
			}
			finally
			{
				setLoading(false);
			}
		};

		fetchLeaderboard();
	}, []);

	if (loading)
	{
		return (
			<div className="text-white text-center mt-10">
				{t("loading")}...
			</div>
		);
	}

	if (error)
	{
		return (
			<div className="text-red-400 text-center mt-10">
				Error: {error}
			</div>
		);
	}

	return (
		<div className="w-full h-full relative flex flex-col items-center p-8">
			<h1
				className="neon-glitch neon-glitch--always text-5xl mb-8"
				data-text={t("leaderboard")}
			>
				{t("leaderboard")}
			</h1>

			<div className="bg-[#0a0446]/60 neon-border rounded-xl px-8 py-6 w-[700px] max-h-[70vh] overflow-y-auto text-white">
				<table className="w-full border-collapse">
					<colgroup>
						<col style={{ width: "12%" }} />
						<col style={{ width: "28%" }} />
						<col style={{ width: "15%" }} />
						<col style={{ width: "15%" }} />
						<col style={{ width: "30%" }} />
					</colgroup>

					<thead>
						<tr className="border-b border-cyan-300/30">
							<th className="px-4 py-2 text-center">
								<span className="neon-glitch neon-glitch--always" data-text={t("rank")}>
									{t("rank")}
								</span>
							</th>
							<th className="px-4 py-2 text-center">
								<span className="neon-glitch neon-glitch--always" data-text={t("nickname")}>
									{t("nickname")}
								</span>
							</th>
							<th className="px-4 py-2 text-center">
								<span className="neon-glitch neon-glitch--always" data-text={t("wins")}>
									{t("wins")}
								</span>
							</th>
							<th className="px-4 py-2 text-center">
								<span className="neon-glitch neon-glitch--always" data-text={t("losses")}>
									{t("losses")}
								</span>
							</th>
							<th className="px-4 py-2 text-center">
								<span className="neon-glitch neon-glitch--always" data-text={t("winrate")}>
									{t("winrate")}
								</span>
							</th>
						</tr>
					</thead>

					<tbody>
						{leaderboard.map((user, index) =>
						(
							<tr key={user.id} className="border-t border-cyan-300/20">
								<td className="px-4 py-2 text-center align-middle">
									{index + 1}
								</td>
								<td className="px-4 py-2 text-center align-middle">
									{user.nickname}
								</td>
								<td className="px-4 py-2 text-center align-middle">
									{user.wins}
								</td>
								<td className="px-4 py-2 text-center align-middle">
									{user.losses}
								</td>
								<td className="px-4 py-2 text-center align-middle">
									{(user.winRate * 100).toFixed(1)}%
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<button
				className="mt-8 px-6 py-2 neon-border rounded hover:bg-gray-700 transition"
				onClick={() => navigate("/dashboard")}
			>
				<span
					data-text={t("back")}
					className="neon-glitch neon-glitch--hover inline-block"
				>
					{t("back")}
				</span>
			</button>
		</div>
	);
}
