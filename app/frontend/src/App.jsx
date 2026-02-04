/*  useState : manage the local state (auth, UI, données)
    useEffect : side effects (fetch, websocket, timers)
    useRef : persistent references (WebSocket, canvas)  */
import React, { useEffect, useRef, useState } from "react";
/*  Routes / Route : routing
    useNavigate : programmatic navigation */
import {
  Routes,
  Route,
  useNavigate,
  Link,
  useLocation,
  useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./i18n";
// /*  useLocation : know the current URL */
// import { useLocation } from "react-router-dom";

/* Centralized keys for localStorage */
const LOGIN_KEY = "auth_login";
const AUTH_KEY = "auth_token";
const USER_ID_KEY = "auth_user_id";

import { startGame, startPongGame } from "./game/pong/game";
import { setKey, resetKeys } from "./game/pong/core/input";
import { game } from "./game/pong/core/state";
import GameSetup from "./GameSetup";
import { t } from "i18next";
import LeaderboardPage from "./LeaderboardPage";




const hasToken = () => {
  return Boolean(localStorage.getItem(AUTH_KEY));
};

function ProtectedRoute({ children }) {
  const location = useLocation();

  const token = localStorage.getItem(AUTH_KEY);

  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/* ================================================================================= */
/* ================================================================================= */
/* ================================= HANDLE AUTH =================================== */
/* ================================================================================= */
/* ================================================================================= */

function useAuth(setAuthUserId) {
  /* user is connected ? */
  const [isAuthed, setIsAuthed] = useState(false);
  /* login display */
  const [login, setLogin] = useState("");

  /* Initialisation */
  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    const storedLogin = localStorage.getItem(LOGIN_KEY);
    if (token) {
      setIsAuthed(true);
      setLogin(storedLogin || "player");
    }
  }, []);

  /* save token + login + userid */
  const signIn = (loginValue, token, userId) => {
    localStorage.setItem(AUTH_KEY, token);
    localStorage.setItem(LOGIN_KEY, loginValue);
    localStorage.setItem(USER_ID_KEY, userId);
    setIsAuthed(true);
    setLogin(loginValue);
    setAuthUserId(userId); // Explicitly set authUserId
  };

  /* clean localstorage + reset state */
  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(LOGIN_KEY);
    localStorage.removeItem(USER_ID_KEY);

    setIsAuthed(false);
    setLogin("");
    setAuthUserId(null); // Clear authUserId on sign out
  };

  return { isAuthed, login, signIn, signOut };
}

/* ================================================================================= */
/* ================================================================================= */
/* =================================== GAME CANVAS ================================= */
/* ================================================================================= */
/* ================================================================================= */

function GameCanvas({ setupPlayers }) {
  const canvasRef = useRef(null);
  const stopGameRef = useRef(null);

  const is4Players = !!setupPlayers?.top && !!setupPlayers?.bot;
  const canvasHeight = is4Players ? 920 : 720;
  const BASE_WIDTH = 920;
  const BASE_HEIGHT_2P = 720;
  const BASE_HEIGHT_4P = 920;

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const baseHeight = is4Players ? BASE_HEIGHT_4P : BASE_HEIGHT_2P;

      const maxWidth = window.innerWidth * 0.95;
      const maxHeight = (window.innerHeight - 120) * 0.95;

      const scaleX = maxWidth / BASE_WIDTH;
      const scaleY = maxHeight / baseHeight;

      setScale(Math.min(scaleX, scaleY));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [is4Players]);



  const [, forceUpdate] = useState(0);
  const navigate = useNavigate();

  const restartGame = () => {
    startGame();

    forceUpdate((v) => v + 1);
  };

  const goToMenu = () => {
    stopGameRef.current?.();
    stopGameRef.current = null;

    forceUpdate((v) => v + 1);

    navigate("/dashboard");
  };

  useEffect(() => {
    game.onGameOver = async () => {
      forceUpdate((v) => v + 1);

      const isLeftPlayerHuman = setupPlayers.left.type === "Player";
      const isRightPlayerHuman = setupPlayers.right.type === "Player";
      const isLeftPlayerAI = setupPlayers.left.type === "AI";
      const isRightPlayerAI = setupPlayers.right.type === "AI";

      const isPlayerVsAiMatch =
        (isLeftPlayerHuman && isRightPlayerAI) ||
        (isRightPlayerHuman && isLeftPlayerAI);

      if (isPlayerVsAiMatch) {
        const userId = localStorage.getItem(USER_ID_KEY);
        const token = localStorage.getItem(AUTH_KEY);

        if (userId && token) {
          let didWin = false;

          if (isLeftPlayerHuman && game.scoreLeft > game.scoreRight) {
            didWin = true;
          } else if (isRightPlayerHuman && game.scoreRight > game.scoreLeft) {
            didWin = true;
          }

          try {
            await fetch("/api/game/result", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                didWin: didWin,
                isPlayerVsAi: true,
              }),
            });
          } catch (error) {
            console.error("Failed to record game result:", error);
          }
        }
      }
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e) => {
      setKey(e.key, true);

      if (e.key === "Escape" && !game.isGameOver) {
        game.isPaused = !game.isPaused;
        forceUpdate((v) => v + 1);
      }
    };

    const handleKeyUp = (e) => setKey(e.key, false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    canvas.width = 920;
    canvas.height = canvasHeight;

    stopGameRef.current = startPongGame(canvas, setupPlayers);
    forceUpdate((v) => v + 1);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      resetKeys();
      stopGameRef.current?.();
      stopGameRef.current = null;
      game.onGameOver = undefined;
    };
  }, [setupPlayers]);

  return (
    <div className="w-full flex justify-center">
      <div
        style={{
          width: BASE_WIDTH * scale,
          height: canvasHeight * scale,
        }}
      >
        <canvas
          ref={canvasRef}
          width={BASE_WIDTH}
          height={canvasHeight}
          className="neon-border rounded-xl block"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
        {game.isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
            <div className="bg-[#0a0446]/70 neon-border rounded-xl px-10 py-8 text-white text-center w-[420px]">
              {/* TITLE */}
              <h1
                className="text-4xl mb-8 neon-glitch neon-glitch--always tracking-widest"
                data-text="ℙ𝔸𝕌𝕊𝔼"
              >
                ℙ𝔸𝕌𝕊𝔼
              </h1>

              {/* BUTTONS */}
              <div className="flex flex-col gap-4">
                <button
                  className="neon-glitch-parent px-6 py-3 neon-border rounded transition hover:bg-gray-700"
                  onClick={() => {
                    // setIsPaused(false);
                    game.isPaused = false;
                    forceUpdate((v) => v + 1);
                  }}
                >
                  <span
                    data-text={t("resume")}
                    className="neon-glitch neon-glitch--hover inline-block"
                  >
                    {t("resume")}
                  </span>
                </button>

                <button
                  className="neon-glitch-parent px-6 py-3 neon-border rounded transition hover:bg-gray-700"
                  onClick={restartGame}
                >
                  <span
                    data-text={t("restart")}
                    className="neon-glitch neon-glitch--hover inline-block"
                  >
                    {t("restart")}
                  </span>
                </button>

                <button
                  className="neon-glitch-parent px-6 py-3 neon-border rounded transition hover:bg-red-600/40"
                  onClick={goToMenu}
                >
                  <span
                    data-text="𝕄𝔼ℕ𝕌"
                    className="neon-glitch neon-glitch--hover inline-block"
                  >
                    𝕄𝔼ℕ𝕌
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
        {game.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
            <div className="bg-[#0a0446]/70 neon-border rounded-xl px-10 py-8 text-white text-center w-[420px]">
              <h1
                className="text-4xl mb-6 neon-glitch neon-glitch--always tracking-widest"
                data-text={
                  game.winner === "left"
                    ? t("leftwins")
                    : game.winner === "right"
                      ? t("rightwins")
                      : game.winner === "top"
                        ? t("topwins")
                        : game.winner === "bottom"
                          ? t("bottomwins")
                          : t("draw")
                }
              >
                {game.winner === "left"
                  ? t("leftwins")
                  : game.winner === "right"
                    ? t("rightwins")
                    : game.winner === "top"
                      ? t("topwins")
                      : game.winner === "bottom"
                        ? t("bottomwins")
                        : t("draw")}
              </h1>
              <div className="flex flex-col gap-4">
                <button
                  className="neon-glitch-parent px-6 py-3 neon-border rounded transition hover:bg-gray-700"
                  onClick={restartGame}
                >
                  <span
                    data-text={t("restart")}
                    className="neon-glitch neon-glitch--hover inline-block"
                  >
                    {t("restart")}
                  </span>
                </button>
                <button
                  className="neon-glitch-parent px-6 py-3 neon-border rounded transition hover:bg-red-600/40"
                  onClick={goToMenu}
                >
                  <span
                    data-text="𝕄𝔼ℕ𝕌"
                    className="neon-glitch neon-glitch--hover inline-block"
                  >
                    𝕄𝔼ℕ𝕌
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GameRoute({ setupPlayers }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!setupPlayers) {
      navigate("/dashboard", { replace: true });
    }
  }, [setupPlayers, navigate]);

  if (!setupPlayers) {
    return null;
  }

  return (
    <div className="flex-1 flex items-center justify-center pt-20 px-4">
      <GameCanvas setupPlayers={setupPlayers} />
    </div>
  );
}

function PrivacyModal({ onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    game.isPaused = true;
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-[#0a0446]/60 neon-border rounded-xl px-8 py-6 w-[600px] max-h-[80vh] overflow-y-auto text-white">

        <h1
          className="text-4xl mb-8 neon-glitch neon-glitch--always text-center tracking-widest"
          data-text={t("privacy")}
        >
          {t("privacy")}
        </h1>

        <div className="text-sm leading-relaxed space-y-4 text-cyan-100 text-center">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
          <p>{t("p4")}</p>
          <p>{t("p5")}</p>
          <p>{t("p6")}</p>
          <p>{t("p7")}</p>
          <p>{t("p8")}</p>
        </div>

        <div className="flex justify-center mt-10">
          <button
            onClick={onClose}
            className="neon-glitch-parent px-6 py-2 neon-border rounded hover:bg-gray-700 transition"
          >
            <span
              data-text={t("back")}
              className="neon-glitch neon-glitch--hover inline-block"
            >
              {t("back")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TermsModal({ onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    game.isPaused = true;
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-[#0a0446]/60 neon-border rounded-xl px-8 py-6 w-[600px] max-h-[80vh] overflow-y-auto text-white">

        <h1
          className="text-4xl mb-8 neon-glitch neon-glitch--always text-center tracking-widest"
          data-text={t("terms")}
        >
          {t("terms")}
        </h1>

        <div className="text-sm leading-relaxed space-y-4 text-cyan-100 text-center">
          <p>{t("t1")}</p>
          <p>{t("t2")}</p>
          <p>{t("t3")}</p>
          <p>{t("t4")}</p>
          <p>{t("t5")}</p>
          <p>{t("t6")}</p>
          <p>{t("t7")}</p>
          <p>{t("t8")}</p>
        </div>

        <div className="flex justify-center mt-10">
          <button
            onClick={onClose}
            className="neon-glitch-parent px-6 py-2 neon-border rounded hover:bg-gray-700 transition"
          >
            <span
              data-text={t("back")}
              className="neon-glitch neon-glitch--hover inline-block"
            >
              {t("back")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}



/* ================================================================================= */
/* ================================================================================= */
/* ====================================== APP ====================================== */
/* ================================================================================= */
/* ================================================================================= */

export default function App() {
  const { t, i18n } = useTranslation();

  // Fonction pour changer de langue
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  /* UI states / interaction :
        context menu management, side chat, tabs, notifications*/
  const [selectedUser, setSelectedUser] = useState(null);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
  const [showChat, setShowChat] = useState(false);
  const [userTab, setUserTab] = useState("users");
  const notify = (message) => {
    setNotification(message);
  };

  /* maintains the same WS connection between renders */
  const wsRef = useRef(null);

  /* Controlled inputs for authentication forms */
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  /*  Authenticated user ID (persisted in localStorage)
      Used for user-specific data (background, avatar, social actions) */
  const [authUserId, setAuthUserId] = useState(
    localStorage.getItem(USER_ID_KEY),
  );

  /* Authentication state and helpers */
  const { isAuthed, login, signIn, signOut } = useAuth(setAuthUserId);

  /* Handle login */
  const [editLogin, setEditLogin] = useState(login);
  const [isEditingLogin, setIsEditingLogin] = useState(false);

  useEffect(() => {
    setEditLogin(login);
  }, [login]);

  /* List of all users */
  const [users, setUsers] = useState([]);

  /*  isOnAuthPage: Determines if the user is logged in
      showConnectedUI: Prevents the logged-in UI (chat, web services)
          from appearing on the login page. */
  const navigate = useNavigate();
  const location = useLocation();
  const isOnAuthPage = location.pathname === "/";
  const showConnectedUI = isAuthed && !isOnAuthPage;

  /* Incoming friend requests (received via WebSocket) */
  const [friendRequests, setFriendRequests] = useState([]);
  /* Confirmed friends list */
  const [friends, setFriends] = useState([]);

  /* Display a message/Disappear automatically */
  const [notification, setNotification] = useState(null);
  /* Automatically hide notification after a short delay */
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 2500);
    return () => clearTimeout(t);
  }, [notification]);

  /* Handle chat of user */
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState({});

  /* FOR BLACKLIST */
  const [blockedUsers, setBlockedUsers] = useState([]);

  const isBlockedUser = (id) => blockedUsers.some((u) => u.id === id);

  const [setupPlayers, setSetupPlayers] = useState(null);
  const [showGameSetup, setShowGameSetup] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);


  /* For message unread */
  const [unread, setUnread] = useState({});
  const isChatVisibleRef = useRef(false);
  /* auto scrolling */
  const messagesEndRef = useRef(null);

  /* Current user XP */
  const [currentUserXp, setCurrentUserXp] = useState(0);
  const [currentUserSuccess1, setCurrentUserSuccess1] = useState(false);
  const [currentUserSuccess2, setCurrentUserSuccess2] = useState(false);
  const [currentUserSuccess3, setCurrentUserSuccess3] = useState(false);

  /* Check if this is you */
  const meId = Number(localStorage.getItem(USER_ID_KEY));
  const isMe = selectedUser?.id === meId;

  const DEFAULT_AVATAR = "/images/defaultavatar.png";

  /* is typing... */
  const typingTimeoutRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState({});

  /* GAME COUNTDOWN */
  const [showGameCountdown, setShowGameCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  /* ================================================================================= */
  /* ================================================================================= */
  /* ============================ HANDLE BACKGROUND ================================== */
  /* ================================================================================= */
  /* ================================================================================= */

  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [authMode, setAuthMode] = useState(null);
  const DEFAULT_BG = "/images/manwork.png";
  const [bgSrc, setBgSrc] = useState(DEFAULT_BG);

  const fetchUserSettings = async () => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;

    const res = await fetch("/api/user/me/settings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      setBgSrc(DEFAULT_BG);
      return;
    }

    const data = await res.json();
    setBgSrc(data.background || DEFAULT_BG);
  };

  const updateBackground = async (bg) => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;

    const res = await fetch("/api/user/me/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ background: bg }),
    });

    if (!res.ok) return;

    const data = await res.json();
    setBgSrc(data.background);
  };

  useEffect(() => {
    if (!isAuthed || location.pathname === "/") {
      setBgSrc(DEFAULT_BG);
      return;
    }

    fetchUserSettings();
  }, [isAuthed, location.pathname]);

  const BACKGROUNDS = [
    "/images/enter.jpg",
    "/images/sun.png",
    "/images/japan2.jpg",
    "/images/abstract.png",
    "/images/manwork.png",
    "/images/pacman.png",
    "/images/womanwork.png",
    "/images/roundenter.png",
    "/images/neonbh.png",
    "/images/worldtech.png",
    "/images/abstract2.png",
    "/images/womanview.png",
    "/images/enterdisk.png",
    "/images/manwork2.png",
    "/images/womanwork2.png",
    "/images/enter2.png",
    "/images/entertriangle.png",
    "/images/datacenter.png",
    "/images/abstract3.png",
    "/images/manwork3.png",
    "/images/datacenter2.png",
    "/images/miner.png",
    "/images/arcade.png",
    "/images/purpleplanet.png",
    "/images/vaisseau.png",
  ];

  /* ================================================================================= */
  /* ================================================================================= */
  /* ============================== HANDLE LOGIN ===================================== */
  /* ================================================================================= */
  /* ================================================================================= */

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
        }),
      });

      let data = {};
      if (res.headers.get("content-type")?.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        notify(t("badcreditentials"));
        return;
      }

      signIn(data.nickname, data.token, data.userId);
      setAuthUserId(data.userId);
      setAuthMode(null);
      navigate("/dashboard");
    } catch (err) {
      notify("Error Serv");
    }
  };

  /* ================================================================================= */
  /* ================================================================================= */
  /* ================================ HANDLE SUBSCRIBE =============================== */
  /* ================================================================================= */
  /* ================================================================================= */

  const handleSubmitSub = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput,
          nickname: loginInput,
          password: passwordInput,
        }),
      });

      let data = {};
      if (res.headers.get("content-type")?.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        notify(data?.message || "User already exists");
        return;
      }

      notify("Account created");
      setLoginInput("");
      setEmailInput("");
      setPasswordInput("");
      setAuthMode("login");
    } catch (err) {
      notify("Error Serv");
    }
  };

  /* ================================================================================= */
  /* ================================================================================= */
  /* ================================ HANDLE AVATAR ================================== */
  /* ================================================================================= */
  /* ================================================================================= */

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !authUserId) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarBase64 = reader.result;

      await fetch("/api/user/me/avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ avatar: avatarBase64 }),
      });

      setAvatar(avatarBase64);
    };

    reader.readAsDataURL(file);
  };
  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;

    fetch("/api/user/me/avatar", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setAvatar(data.avatar || DEFAULT_AVATAR);
      });
  }, [isAuthed]);

  /* ================================================================================= */
  /* ================================================================================= */
  /* ================================ HANDLE LOGIN =================================== */
  /* ================================================================================= */
  /* ================================================================================= */

  const handleLoginChange = async () => {
    if (!editLogin.trim() || editLogin === login) {
      setIsEditingLogin(false);
      return;
    }

    const token = localStorage.getItem(AUTH_KEY);

    const res = await fetch("/api/user/me/nickname", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname: editLogin }),
    });

    if (!res.ok) {
      notify("Nickname update failed");
      return;
    }

    const data = await res.json();

    localStorage.setItem(LOGIN_KEY, data.nickname);
    setIsEditingLogin(false);

    signIn(
      data.nickname,
      localStorage.getItem(AUTH_KEY),
      localStorage.getItem(USER_ID_KEY),
    );

    setUsers((prev) =>
      prev.map((u) =>
        u.id === authUserId ? { ...u, nickname: data.nickname } : u,
      ),
    );
  };

  /* ================================================================================= */
  /* ================================================================================= */
  /* ================================ HANDLE LOGOUT ================================== */
  /* ================================================================================= */
  /* ================================================================================= */

  const handleLogout = async () => {
    wsRef.current?.close();
    wsRef.current = null;

    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    setShowChat(false);
    setActiveChatUser(null);
    setSelectedUser(null);
    setAuthUserId(null);
    setBgSrc(DEFAULT_BG);

    signOut();
    navigate("/");
  };

  /* ================================================================================= */
  /* ================================================================================= */
  /* ================================ HANDLE TYPING ================================== */
  /* ================================================================================= */
  /* ================================================================================= */

  const handleTyping = (e) => {
    const value = e.target.value;
    setChatInput(value);

    if (!wsRef.current || !activeChatUser) return;
    if (!value.trim()) return;

    wsRef.current.send(
      JSON.stringify({
        type: "TYPING",
        toUserId: activeChatUser.id,
      })
    );

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      wsRef.current?.send(
        JSON.stringify({
          type: "STOP_TYPING",
          toUserId: activeChatUser.id,
        })
      );
    }, 800);
  };

  //
  //
  useEffect(() => {
    if (!isAuthed) {
      setShowChat(false);
      setActiveChatUser(null);
      setSelectedUser(null);
      setUsers([]);
      setFriends([]);
      setFriendRequests([]);
      setBlockedUsers([]);
      setMessages({});
    }
  }, [isAuthed]);
  //
  //
  /* ================================================================================= */
  /* ================================================================================= */
  /* ================================ GAME COUNTDOWN ================================= */
  /* ================================================================================= */
  /* ================================================================================= */

  const startGameCountdown = () => {
    setCountdown(5);
    setShowGameCountdown(true);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowGameCountdown(false);
          //navigate("/game");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  //
  //
  //
  useEffect(() => {
    const handleUnload = () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, []);
//
//
  //
  useEffect(() => {
    if (!showChat || userTab !== "friends") return;

    fetch("/api/friends", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setFriends(Array.isArray(data) ? data : []);
      })
      .catch(() => setFriends([]));
  }, [showChat, userTab]);
  //
  //
  //

  useEffect(() => {
    if (!isAuthed) return;

    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;

    fetch("/api/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH_KEY)}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const meId = Number(localStorage.getItem(USER_ID_KEY));
        const usersWithMe = [...data];

        if (!usersWithMe.some((u) => u.id === meId)) {
          usersWithMe.push({
            id: meId,
            nickname: login,
            online: true,
          });
        }

        setUsers((prev) => {
          const prevMap = new Map(prev.map((u) => [u.id, u]));

          return usersWithMe.map((u) => ({
            ...u,
            online: prevMap.get(u.id)?.online ?? u.online ?? false,
          }));
        });
      })
      .catch(() => setUsers([]));

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    const ws = new WebSocket(
      `${protocol}://${window.location.host}/api/ws?token=${token}`,
    );
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "WHO_IS_ONLINE" }));

      fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(AUTH_KEY)}`,
        },
      })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => setUsers([]));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {

        case "TYPING":
          setTypingUsers((prev) => ({
            ...prev,
            [msg.fromUserId]: true,
          }));
          break;

        case "STOP_TYPING":
          setTypingUsers((prev) => {
            const copy = { ...prev };
            delete copy[msg.fromUserId];
            return copy;
          });
          break;

          case "USERS_STATUS":
            setUsers((prev) => {
              const map = new Map(prev.map((u) => [u.id, u]));

              msg.onlineUsers.forEach((id) => {
                if (!map.has(id)) {
                  map.set(id, {
                    id,
                    nickname: "Unknown",
                    online: true,
                  });
                }
              });

              return [...map.values()].map((u) => ({
                ...u,
                online: msg.onlineUsers.includes(u.id),
              }));
            });
            break;

        case "FRIEND_REQUEST":
          setFriendRequests((prev) => {
            if (prev.some((u) => u.id === msg.from.id)) return prev;
            return [...prev, msg.from];
          });
          break;

        case "FRIEND_ADDED":
          setFriends((prev) => {
            if (prev.some((f) => f.id === msg.user.id)) return prev;
            return [...prev, msg.user];
          });
          setFriendRequests((prev) => prev.filter((u) => u.id !== msg.user.id));
          break;

        case "FRIEND_REFUSED":
          setFriendRequests((prev) => prev.filter((u) => u.id !== msg.userId));
          break;

        case "FRIEND_REMOVED":
          setFriends((prev) => prev.filter((f) => f.id !== msg.userId));
          setUsers((prev) =>
            prev.map((u) =>
              u.id === msg.userId ? { ...u, online: false } : u,
            ),
          );
          setActiveChatUser((prev) => (prev?.id === msg.userId ? null : prev));
          break;

        case "DM_MESSAGE": {
          const fromId = msg.fromUserId;
          const meId = Number(localStorage.getItem(USER_ID_KEY));

          setMessages((prev) => ({
            ...prev,
            [fromId]: [
              ...(prev[fromId] || []),
              { from: "other", text: msg.text },
            ],
          }));

          if (
            fromId !== meId &&
            !(isChatVisibleRef.current && activeChatUser?.id === fromId)
          ) {
            setUnread((prev) => ({
              ...prev,
              [fromId]: (prev[fromId] || 0) + 1,
            }));
          }
          break;
        }

        default:
          break;
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
    };

    return () => {
      ws.close();
    };
  }, [isAuthed]);

  //
  //
  //
  useEffect(() => {
    isChatVisibleRef.current = Boolean(showChat && activeChatUser);
  }, [showChat, activeChatUser]);

  //
  //
  useEffect(() => {
    if (!showChat || userTab !== "requests") return;

    fetch("/api/friends/requests", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setFriendRequests((prev) => {
          const fetched = Array.isArray(data) ? data : [];
          const merged = [...prev];

          fetched.forEach((u) => {
            if (!merged.some((p) => p.id === u.id)) {
              merged.push(u);
            }
          });

          return merged;
        });
      });
  }, [showChat, userTab]);
  //
  //
  //
  //BLACKLIST
  useEffect(() => {
    if (!showChat) return;

    fetch("/api/user/blocked", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setBlockedUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setBlockedUsers([]));
  }, [showChat]);
  //
  //
  //
  useEffect(() => {
    if (!activeChatUser) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, activeChatUser]);
  //
  //
  //

  useEffect(() => {
    if (!isAuthed || !authUserId) return;

    const fetchCurrentUserProfile = async () => {
      try {
        const token = localStorage.getItem(AUTH_KEY);
        const response = await fetch(`/api/users/${authUserId}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch user profile");
        const data = await response.json();
        setCurrentUserXp(data.xp);
        setCurrentUserSuccess1(data.success1);
        setCurrentUserSuccess2(data.success2);
        setCurrentUserSuccess3(data.success3);
      } catch (error) {
        console.error("Error fetching current user XP:", error);
        setCurrentUserXp(0);
      }
    };

    fetchCurrentUserProfile();
  }, [isAuthed, authUserId, location.pathname]); // Added location.pathname to dependencies

  const isFriend = (id) => friends.some((f) => f.id === id);
  const isPending = (id) => friendRequests.some((r) => r.id === id);

  const openUserMenu = (e, user) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setContextPos({ x: rect.right + 8, y: rect.top });
    setSelectedUser(user);
  };

  const closeUserMenu = () => setSelectedUser(null);

  const handleDM = async () => {
    const token = localStorage.getItem(AUTH_KEY);

    const res = await fetch(`/api/messages/${selectedUser.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const history = await res.json();

    setMessages((prev) => ({
      ...prev,
      [selectedUser.id]: history,
    }));

    setUnread((prev) => {
      const copy = { ...prev };
      delete copy[selectedUser.id];
      return copy;
    });

    setActiveChatUser(selectedUser);
    closeUserMenu();
  };

  const handleInvite = () => {
    if (!wsRef.current || !selectedUser) return;

    wsRef.current.send(
      JSON.stringify({
        type: "DM_SEND",
        toUserId: selectedUser.id,
        text: t("gameInvite", { user: login }),
      })
    );

    // startGameCountdown();
    notify(t("inviteSent", { user: selectedUser.nickname }));
    closeUserMenu();
  };

  const handleSendFriendRequest = async () => {
    await fetch(`/api/friends/request/${selectedUser.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    //notify("Friend request sent");
    closeUserMenu();
  };

  const handleAcceptFriend = async (userId) => {
    await fetch(`/api/friends/accept/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    // enlève la notif localement
    setFriendRequests((prev) => prev.filter((req) => req.id !== userId));
  };

  const handleRefuseFriend = async (userId) => {
    await fetch(`/api/friends/refuse/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    setFriendRequests((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleRemoveFriend = async () => {
    await fetch(`/api/friends/${selectedUser.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    closeUserMenu();
  };

  const handleBlock = async () => {
    await fetch(`/api/user/${selectedUser.id}/block`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });
    closeUserMenu();
  };

  const handleBackFromChat = () => {
    setUnread((prev) => {
      const copy = { ...prev };
      delete copy[activeChatUser.id];
      return copy;
    });
    setActiveChatUser(null);
  };

  function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/dashboard";

    const [user, setUser] = useState(undefined);
    const isMe = String(id) === String(localStorage.getItem(USER_ID_KEY));

    const liveUser = users.find((u) => String(u.id) === String(id));
    const online = isMe || liveUser?.online;

    if (isMe) {
      navigate("/profile", { replace: true });
      return null;
    }

    // FETCH PROFIL UNIQUEMENT SI PAS MOI
    useEffect(() => {
      fetch(`/api/users/${id}/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("PROFILE_NOT_FOUND");
          return res.json();
        })
        .then(setUser)
        .catch(() => setUser(null));
    }, [id, location.pathname]); // Added location.pathname to dependencies

    // ===== RENDER =====

    if (user === undefined) {
      return <div className="text-white">Loading...</div>;
    }

    if (user === null) {
      return <div className="text-red-400">Profile not found</div>;
    }

    return (
      <div className="w-full h-full flex flex-col items-center text-white">
        <button
          className="absolute top-5 left-1/2 -translate-x-1/2 neon-border px-2 py-1"
          onClick={() => navigate(from)}
        >
          {t("back")}
        </button>

        <img
          src={user.avatar || DEFAULT_AVATAR}
          className="w-32 h-32 rounded-full neon-border mt-[15vh]"
        />

        <h1 className="neon-glitch neon-glitch--always text-3xl mt-6">
          {user.nickname}
        </h1>

        <p className="text-cyan-300 mt-2 flex items-center gap-2">
          {user.online ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Online
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Offline
            </>
          )}
        </p>

        {/* XP and Level Display for Public Profile */}
        {user.xp !== undefined && (
          <div className="mt-4 text-white flex flex-col items-center">
            <p className="text-xl">
              {t("level")}: {Math.floor(user.xp / 100)}
            </p>
            <p className="text-sm">
              {t("xp")}: {user.xp % 100} / 100
            </p>
            <div className="w-40 h-3 bg-gray-700 rounded-full mt-2">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${user.xp % 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Achievements Display for Public Profile */}
        <div className="mt-6 text-white flex flex-col items-center">
          <h2
            className="text-2xl mb-4 neon-glitch neon-glitch--always"
            data-text={t("achievements")}
          >
            {t("achievements")}
          </h2>
          <div className="flex flex-col gap-2">
            <p className="text-lg">
              {t("played_ai_game")}:{" "}
              {user.success1 ? (
                <span className="text-green-400">✓</span>
              ) : (
                <span className="text-red-400">✗</span>
              )}
            </p>
            <p className="text-lg">
              {t("won_ai_game")}:{" "}
              {user.success2 ? (
                <span className="text-green-400">✓</span>
              ) : (
                <span className="text-red-400">✗</span>
              )}
            </p>
            <p className="text-lg">
              {t("lost_ai_game")}:{" "}
              {user.success3 ? (
                <span className="text-green-400">✓</span>
              ) : (
                <span className="text-red-400">✗</span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================================= */
  /* ================================================================================= */
  /* =================================== HOME PAGE =================================== */
  /* ================================================================================= */
  /* ================================================================================= */

  return (
    <div id="app" className="relative min-h-screen flex flex-col">
      {notification && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setNotification(null)}
          />

          <div
            className="relative min-w-[300px] px-8 py-6
            rounded-xl bg-black/90 neon-border text-center"
          >
            <p className="font-mono tracking-[-0.03em] text-white">
              {notification}
            </p>

            <button
              onClick={() => setNotification(null)}
              className="neon-glitch neon-glitch--hover mt-5 px-10 py-0 neon-border text-white"
              data-text="𝕆𝕂"
            >
              𝕆𝕂
            </button>
          </div>
        </div>
      )}

      <img
        src={bgSrc}
        className="absolute inset-0 w-full h-full object-cover -z-10 pointer-events-none"
        alt=""
      />

      <div className="fixed top-4 right-4 z-[9999] flex flex-row items-center gap-3">
        <button
          className="neon-glitch neon-glitch--hover text-2xl px-2 py-0 bg-transparent rounded neon-border"
          data-text="🇮🇹"
          onClick={() => i18n.changeLanguage("it")}
        >
          🇮🇹
        </button>

        <button
          className="neon-glitch neon-glitch--hover text-2xl px-2 py-0 bg-transparent rounded neon-border"
          data-text="🇬🇧"
          onClick={() => i18n.changeLanguage("en")}
        >
          🇬🇧
        </button>

        <button
          className="neon-glitch neon-glitch--hover text-2xl px-2 py-0 bg-transparent rounded neon-border"
          data-text="🇫🇷"
          onClick={() => {
            i18n.changeLanguage("fr");
          }}
        >
          🇫🇷
        </button>
        {showConnectedUI && (
          <button
            className="neon-glitch neon-glitch--hover text-2xl px-2 py-0 bg-transparent rounded neon-border"
            data-text="✉"
            onClick={() => setShowChat((v) => !v)}
          >
            ✉
          </button>
        )}
      </div>

      {/*=====================================================================================
  ======================================================================================
  =================================== NOTIFICATION =====================================
  ======================================================================================
  ======================================================================================*/}
      {showChat && (
        <div
          className="fixed top-0 left-0 h-full w-[300px]
                          bg-black/80 z-[10] neon-border flex flex-col"
        >
          {/* =============================================
                ================= LIST MODE =================
                ============================================= */}

          {!activeChatUser && (
            <>
              <div className="flex gap-2 mb-4 p-2">
                <button
                  onClick={() => setUserTab("users")}
                  className={`flex-1 py-1 neon-border ${
                    userTab === "users" ? "text-cyan-300" : "text-gray-400"
                  }`}
                >
                  {t("users")}
                </button>

                <button
                  onClick={() => setUserTab("friends")}
                  className={`flex-1 py-1 neon-border ${
                    userTab === "friends" ? "text-cyan-300" : "text-gray-400"
                  }`}
                >
                  {t("friends")}
                </button>

                <button
                  onClick={() => setUserTab("requests")}
                  className={`flex-1 py-1 neon-border ${
                    userTab === "requests" ? "text-cyan-300" : "text-gray-400"
                  }`}
                >
                  {t("request")}
                  {friendRequests.length > 0 && (
                    <span className="ml-1 text-red-400">●</span>
                  )}
                </button>
              </div>

              {/* =============================================
                ================= USER LIST =================
                ============================================= */}

              <ul className="flex-1 overflow-y-auto space-y-2 px-2">
                {userTab === "users" &&
                  users.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={(e) => openUserMenu(e, u)}
                        className="w-full flex items-center gap-2 px-2 py-1
                                    rounded hover:bg-cyan-500/10 text-left"
                      >
                        {u.online && (
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                        )}
                        <span className="text-white">{u.nickname}</span>
                        {unread[u.id] && (
                          <span className="text-xs px-1 py-0.5 rounded-full bg-cyan-500 text-white">
                            {unread[u.id]}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}

                {/* =============================================
                ================ FRIEND LIST ================
                ============================================= */}

                {userTab === "friends" &&
                  friends.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={(e) => openUserMenu(e, u)}
                        className="w-full flex items-center gap-2 px-2 py-1
                                    rounded hover:bg-cyan-500/10 text-left"
                      >
                        {u.online && (
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                        )}
                        <span className="text-white">{u.nickname}</span>
                        {unread[u.id] && (
                          <span className="text-xs px-1 py-0.5 rounded-full bg-cyan-500 text-white">
                            {unread[u.id]}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}

                {/* =============================================
                =============== REQUEST LIST ================
                ============================================= */}

                {userTab === "requests" &&
                  friendRequests.map((u) => (
                    <li key={u.id} className="flex justify-between px-2 py-1">
                      <span className="text-white">{u.nickname}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptFriend(u.id)}
                          className="text-green-400"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleRefuseFriend(u.id)}
                          className="text-red-400"
                        >
                          ✘
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </>
          )}

          {/* =============================================
                ================= CHAT MODE =================
                ============================================= */}

          {activeChatUser && (
            <>
              <div className="flex items-center gap-2 p-3 border-b border-cyan-500/30">
                <button
                  className="text-cyan-300 text-sm"
                  onClick={handleBackFromChat}
                >
                  {t("back")}
                </button>
                <span className="text-white font-mono">
                  {activeChatUser.nickname}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 chat-scroll">
                {(messages[activeChatUser.id] || []).map((msg, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] px-3 py-1 rounded
                          whitespace-pre-wrap break-words text-white
                          border shadow-[0_0_8px_rgba(34,211,238,0.6)]
                        ${
                          msg.from === "me"
                            ? "ml-auto bg-black/70 border-cyan-400"
                            : "mr-auto bg-black/50 border-purple-400"
                        }`}
                  >
                    {msg.text}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {typingUsers[activeChatUser.id] && (
                <div className="text-2 text-cyan-400 italic px-2">
                  {activeChatUser.nickname} {t("istyping")}
                </div>
              )}

              <form
                //"form" to take advantage of native submit functionality
                className="p-3 border-t border-cyan-500/30 flex gap-2"
                //e = l’événement de soumission du formulaire
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;

                  /*prev = last version of state
                      You copy all existing conversations,
                      Otherwise you'll overwrite everything */
                  setMessages((prev) => ({
                    ...prev,
                    [activeChatUser.id]: [
                      ...(prev[activeChatUser.id] || []),
                      { from: "me", text: chatInput },
                    ],
                  }));
                  wsRef.current?.send(
                    JSON.stringify({
                      type: "DM_SEND",
                      toUserId: activeChatUser.id,
                      text: chatInput,
                    }),
                  );
                  wsRef.current?.send(
                    JSON.stringify({
                      type: "STOP_TYPING",
                      toUserId: activeChatUser.id,
                    })
                  ); 
                  setChatInput("");
                }}
              >
                <input
                  value={chatInput}
                  onChange={handleTyping}
                  className="flex-1 bg-black/60 text-white px-2 py-1 rounded neon-border"
                />
                <button className="text-cyan-300">➤</button>
              </form>
            </>
          )}

          {/* =============================================
                ============== GAME COUNTDOWN =============
                ============================================= */}

          {showGameCountdown && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80">
              <div className="text-center">
                <div
                  className="text-[5rem] font-extrabold neon-glitch neon-glitch--always text-cyan-300"
                  data-text={countdown}
                >
                  {countdown}
                </div>

                <div className="mt-2 text-sm text-white opacity-80">
                  {t("gameStarting")}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/*=====================================================================================
  ======================================================================================
  ================================== SELECTED USER =====================================
  ======================================================================================
  ======================================================================================*/}

      {showChat && selectedUser && !isMe && (
        <div
          className="fixed bg-black/90 neon-border rounded p-2
                      text-sm z-[1000]"
          style={{ top: contextPos.y, left: contextPos.x }}
          onMouseLeave={closeUserMenu}
        >
          <div className="text-cyan-300 px-2 mb-1">{selectedUser.nickname}</div>

          {!isBlockedUser(selectedUser.id) && (
            <>
              <button
                onClick={handleDM}
                className="block w-full px-2 py-1 hover:bg-cyan-500/20 text-left text-white"
              >
                {t("privatemsg")}
              </button>

              <button
                onClick={handleInvite}
                className="block w-full px-2 py-1 hover:bg-cyan-500/20 text-left text-white"
              >
                {t("invitetoplay")}
              </button>
            </>
          )}

          {userTab === "users" &&
            !isFriend(selectedUser.id) &&
            !isPending(selectedUser.id) &&
            !isBlockedUser(selectedUser.id) && (
              <button
                onClick={handleSendFriendRequest}
                className="block w-full px-2 py-1 hover:bg-green-500/20 text-left text-green-400"
              >
                {t("sendfriend")}
              </button>
            )}

          {userTab === "friends" && (
            <button
              onClick={handleRemoveFriend}
              className="block w-full px-2 py-1
                          hover:bg-red-500/30 text-left text-red-400"
            >
              {t("removefriend")}
            </button>
          )}

          {/* =============================================
                ================ VIEW PROFILE ===============
                ============================================= */}

          <button
            onClick={() => {
              navigate(`/profile/${selectedUser.id}`, {
                state: { from: location.pathname },
              });
              closeUserMenu();
            }}
            className="block w-full px-2 py-1 hover:bg-cyan-500/20 text-left text-white"
          >
            {t("viewprofile")}
          </button>

          {/* =============================================
                ================ HANDLE BLOCK ===============
                ============================================= */}

          {!isBlockedUser(selectedUser.id) ? (
            <button
              onClick={async () => {
                await fetch(`/api/user/${selectedUser.id}/block`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                  },
                });
                setBlockedUsers((prev) => [...prev, selectedUser]);
                closeUserMenu();
              }}
              className="block w-full px-2 py-1 hover:bg-red-700/40 text-left text-red-500"
            >
              {t("blacklist")}
            </button>
          ) : (
            <button
              onClick={async () => {
                await fetch(`/api/user/${selectedUser.id}/unblock`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                  },
                });
                setBlockedUsers((prev) =>
                  prev.filter((u) => u.id !== selectedUser.id),
                );
                closeUserMenu();
              }}
              className="block w-full px-2 py-1 hover:bg-green-600/30 text-left text-green-400"
            >
              {t("unblock")}
            </button>
          )}
        </div>
      )}

      {/*=====================================================================================
  ======================================================================================
  ===================================== MAIN MENU ======================================
  ======================================================================================
  ======================================================================================*/}

      <main className="flex-1 flex flex-col">
        <Routes>
          <Route
            path="/"
            element={
              <div className="w-full h-full flex flex-col items-center">
                <div className="mt-[3vh]">
                  <h1
                    className="neon-glitch neon-glitch--always absolute left-1/2 -translate-x-1/2 bg-transparent
                  border-0 text-7xl"
                    data-text="𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔼ℕℂ𝔼"
                  >
                    𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔼ℕℂ𝔼
                  </h1>
                </div>
                <div className="mt-[12vh] flex justify-center w-full">
                  <button
                    className="neon-glitch neon-glitch--hover relative inline-block text-4xl bg-transparent border-0"
                    data-text={t("connection")}
                    onClick={() => setAuthMode("login")}
                  >
                    {t("connection")}
                  </button>
                </div>
                <div className="mt-[1vh] flex justify-center w-full">
                  <button
                    className="neon-glitch neon-glitch--hover relative inline-block text-4xl bg-transparent border-0"
                    data-text={t("subscribe")}
                    onClick={() => setAuthMode("register")}
                  >
                    {t("subscribe")}
                  </button>
                </div>

                {/*=====================================================================================
  ======================================================================================
  ======================================== LOGIN =======================================
  ======================================================================================
  ======================================================================================*/}

                {authMode === "login" && (
                  <div className="mt-[2vh] bg-black/60 p-6 rounded-xl backdrop-blur-xl neon-border">
                    <form
                      className="flex flex-col gap-4"
                      onSubmit={handleSubmitLogin}
                    >
                      <h1
                        className="neon-glitch neon-glitch--always absolute left-1/2 -translate-x-1/2 px-0 py-0 text-xl text-cyan-300"
                        data-text={t("welcomeback")}
                      >
                        {t("welcomeback")}
                      </h1>
                      <input
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="𝔼𝕄𝔸𝕀𝕃"
                        type="email"
                        className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                      />
                      <input
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        type="password"
                        placeholder={t("password")}
                        className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                        autoComplete="current-password"
                      />
                      <button
                        type="submit"
                        className="neon-glitch neon-glitch--always px-0 py-0 bg-gray-900/80
                    text-cyan-300 rounded neon-border"
                        data-text="⇧ 𝔾𝕆 ⇧"
                      >
                        ⇧ 𝔾𝕆 ⇧
                      </button>
                    </form>
                  </div>
                )}

                {/*=====================================================================================
  ======================================================================================
  ======================================= REGISTER =====================================
  ======================================================================================
  ======================================================================================*/}

                {authMode === "register" && (
                  <div className="mt-[2vh] bg-black/60 p-6 rounded-xl backdrop-blur-xl neon-border">
                    <form
                      className="flex flex-col gap-4"
                      onSubmit={handleSubmitSub}
                    >
                      <h1
                        className="neon-glitch neon-glitch--always absolute left-1/2 -translate-x-1/2 px-0 py-0 text-xl text-cyan-300"
                        data-text={t("welcome")}
                      >
                        {t("welcome")}
                      </h1>

                      <input
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        placeholder={t("login")}
                        className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                      />

                      <input
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="𝔼𝕄𝔸𝕀𝕃"
                        type="email"
                        className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                      />

                      <input
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        type="password"
                        placeholder={t("password")}
                        className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                      />

                      <button
                        type="submit"
                        className="neon-glitch neon-glitch--hover px-0 py-0 text-xl
                    bg-gray-900/80 text-cyan-300 rounded neon-border"
                        data-text="⇧ 𝔾𝕆 ⇧"
                      >
                        ⇧ 𝔾𝕆 ⇧
                      </button>
                    </form>
                  </div>
                )}
              </div>
              }
          />

          {/*=====================================================================================
  ======================================================================================
  ======================================== MENU ========================================
  ======================================================================================
  ======================================================================================*/}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
              <div className="w-full h-full flex flex-col items-center">
                <div className="mt-[5vh]">
                  <h1
                    className="neon-glitch neon-glitch--always absolute left-1/2 -translate-x-1/2 bg-transparent
                  border-0 text-7xl"
                    data-text="𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔼ℕℂ𝔼"
                  >
                    𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔼ℕℂ𝔼
                  </h1>
                </div>

                <div className="text-3xl mt-[10vh] text-white z-30">
                  <span className="font-mono tracking-[-0.035em] text-cyan-300">
                    {login}
                  </span>
                </div>

                <div className="text-white mt-[2vh]">
                  <button
                    className="neon-glitch neon-glitch--hover ml-1 px-3 py-0 neon-border bg-gray-900/60"
                    onClick={() => {
                      handleLogout();
                    }}
                    data-text={t("logout")}
                  >
                    {t("logout")}
                  </button>
                </div>

                <div className="mt-[5vh] flex flex-col gap-6 items-center">
                  <button
                    className="neon-glitch neon-glitch--hover text-5xl bg-transparent border-0"
                    data-text={t("play")}
                    onClick={() => setShowGameSetup(true)}
                  >
                    {t("play")}
                  </button>
                  <button
                    className="neon-glitch neon-glitch--hover text-5xl bg-transparent border-0"
                    data-text={t("profile")}
                    onClick={() => navigate("/profile")}
                  >
                    {t("profile")}
                  </button>
                  <button
                    className="neon-glitch neon-glitch--hover text-5xl bg-transparent border-0"
                    data-text={t("customize")}
                    onClick={() => navigate("/customize")}
                  >
                    {t("customize")}
                  </button>
                  {/* New Leaderboard Button */}
                  <button
                    className="neon-glitch neon-glitch--hover text-5xl bg-transparent border-0"
                    data-text={t("leaderboard")}
                    onClick={() => navigate("/leaderboard")}
                  >
                    {t("leaderboard")}
                  </button>
                </div>
              </div>
            </ProtectedRoute>}
          />


          {/*=====================================================================================
  ======================================================================================
  ====================================== CUSTOM BG =====================================
  ======================================================================================
  ======================================================================================*/}

          <Route
            path="/customize"
            element={
              <ProtectedRoute>
              <div className="fixed inset-0 bg-black/80 z-30 flex flex-col items-center p-8">
                <h1
                  className="neon-glitch neon-glitch--always text-5xl mb-[4vh] mt-[8vh]"
                  data-text={t("background")}
                >
                  {t("background")}
                </h1>

                <div className="grid grid-cols-6 gap-6 mt-[8vh]">
                  {BACKGROUNDS.map((bg) => (
                    <button
                      key={bg}
                      onClick={() => updateBackground(bg)}
                      className={`relative w-[110px] h-[60px] rounded-lg overflow-hidden neon-border
                    ${bgSrc === bg ? "ring-2 ring-cyan-400" : ""}`}
                    >
                      <img
                        src={bg}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </button>
                  ))}
                </div>

                <button
                  className="mt-10 px-2 py-1 neon-border bg-gray-900/60 text-cyan-300"
                  onClick={() => navigate(-1)}
                >
                  {t("back")}
                </button>
              </div>
            </ProtectedRoute>}
          />

          {/*=====================================================================================
  ======================================================================================
  ====================================== GAME CANVA ====================================
  ======================================================================================
  ======================================================================================*/}

          <Route
            path="/game"
            element={
            <ProtectedRoute>
              <GameRoute setupPlayers={setupPlayers} />
            </ProtectedRoute>}
          />

          {/*=====================================================================================
  ======================================================================================
  ======================================== PROFIL ======================================
  ======================================================================================
  ======================================================================================*/}

          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
              <div className="relative w-full h-full z-30">
                <PublicProfile />
              </div>
            </ProtectedRoute>}
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
              <div className="w-full h-full relative overflow-hidden">
                <div className="mt-[2vh] w-full h-full flex flex-col items-center">
                  <h1
                    className="neon-glitch neon-glitch--always relative inline-block text-7xl"
                    data-text={t("profile")}
                  >
                    {t("profile")}
                  </h1>

                  <button
                    className="neon-glitch neon-glitch--hover mt-6 px-3 py-0 neon-border bg-gray-900/60"
                    onClick={() => navigate("/dashboard")}
                    data-text={t("back")}
                  >
                    {t("back")}
                  </button>

                  {/* MAIN PROFILE LAYOUT */}
                  <div className="mt-14 w-full max-w-5xl px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* LEFT — ACHIEVEMENTS */}
                      <div className="bg-black/50 neon-border rounded-xl p-6 text-white">
                        <h2
                          className="text-2xl mb-4 neon-glitch neon-glitch--always"
                          data-text={t("achievements")}
                        >
                          {t("achievements")}
                        </h2>

                        <div className="flex flex-col gap-3 text-lg">
                          <p>
                            {t("played_ai_game")}:{" "}
                            {currentUserSuccess1 ? (
                              <span className="text-green-400">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </p>

                          <p>
                            {t("won_ai_game")}:{" "}
                            {currentUserSuccess2 ? (
                              <span className="text-green-400">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </p>

                          <p>
                            {t("lost_ai_game")}:{" "}
                            {currentUserSuccess3 ? (
                              <span className="text-green-400">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT — AVATAR + XP */}
                      <div className="flex flex-col gap-6">
                        {/* AVATAR / IDENTITY */}
                        <div className="bg-black/50 neon-border rounded-xl p-6 text-white">
                          <div className="flex items-center gap-6">
                            <img
                              src={avatar || DEFAULT_AVATAR}
                              className="w-28 h-28 rounded-full object-cover neon-border"
                            />

                            <div className="flex flex-col">

                              {isEditingLogin ? (
                                <div className="flex flex-col gap-2">
                                  <input
                                    value={editLogin}
                                    onChange={(e) => setEditLogin(e.target.value)}
                                    className="px-2 py-1 rounded bg-black/60 neon-border text-cyan-300"
                                  />

                                  <div className="flex gap-2 text-sm">
                                    <button
                                      onClick={handleLoginChange}
                                      className="px-2 py-1 neon-border text-green-400"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditLogin(login);
                                        setIsEditingLogin(false);
                                      }}
                                      className="px-2 py-1 neon-border text-red-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {/* LOGIN DISPLAY */}
                                  <div
                                    className="neon-glitch neon-glitch--always text-2xl"
                                    data-text={login}
                                  >
                                    {login}
                                  </div>

                                  {/* EDIT BUTTON */}
                                  <button
                                    onClick={() => setIsEditingLogin(true)}
                                    title="Edit nickname"
                                    className="ml-1 cursor-pointer neon-border px-1 py-0.5"
                                  >
                                    ✎
                                  </button>
                                </div>
                              )}

                              <label className="mt-2 inline-block cursor-pointer neon-border px-2 py-1 text-sm hover:underline">
                                {t("changeavatar")}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAvatarChange}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* XP / LEVEL */}
                        <div className="bg-black/50 neon-border rounded-xl p-6 text-white">
                          <p className="text-xl">
                            {t("level")}: {Math.floor(currentUserXp / 100)}
                          </p>
                          <p className="text-sm opacity-80">
                            {t("xp")}: {currentUserXp % 100} / 100
                          </p>

                          <div className="mt-3 w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400"
                              style={{ width: `${currentUserXp % 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ProtectedRoute>}
          />

          {/*=====================================================================================
  ======================================================================================
  ===================================== LEADERBOARD ====================================
  ======================================================================================
  ======================================================================================*/}

          <Route path="/leaderboard" element={
            <ProtectedRoute>
            <LeaderboardPage />
            </ProtectedRoute>} />


        </Routes>
      </main>
      <footer className="mt-auto w-full py-4 flex justify-center text-xs sm:text-sm text-cyan-300">
        <div className="flex gap-2 neon-glitch text-center">
          <button onClick={() => setShowPrivacy(true)}>
            {t("privacy")}
          </button>

          <span> | </span>

          <button onClick={() => setShowTerms(true)}>
            {t("terms")}
          </button>
        </div>
      </footer>


      {showGameSetup && (
        <GameSetup
          onStart={(playersConfig) => {
            setSetupPlayers(playersConfig);
            setShowGameSetup(false);
            navigate("/game");
            startGameCountdown();
          }}
          onClose={() => setShowGameSetup(false)}
        />
      )}


      {showPrivacy && (
        <PrivacyModal onClose={() => setShowPrivacy(false)} />
      )}

      {showTerms && (
        <TermsModal onClose={() => setShowTerms(false)} />
      )}

    </div>
  );
}
