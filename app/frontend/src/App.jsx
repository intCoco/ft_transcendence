import React, { useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";

const LOGIN_KEY = "auth_login";
const AUTH_KEY = "auth_token";
const USER_ID_KEY = "auth_user_id";

/* ================================================================================= */
/* ================================================================================= */
/* =================================== AUTH ======================================== */
/* ================================================================================= */
/* ================================================================================= */
function useAuth() {
  
  const [isAuthed, setIsAuthed] = useState(false);
  const [login, setLogin] = useState("");
  
  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    const storedLogin = localStorage.getItem(LOGIN_KEY);
    if (token) {
      setIsAuthed(true);
      setLogin(storedLogin || "player");
    }
  }, []);

  const signIn = (loginValue, token, userId) => {
    localStorage.setItem(AUTH_KEY, token);
    localStorage.setItem(LOGIN_KEY, loginValue);
    localStorage.setItem(USER_ID_KEY, userId);
    setIsAuthed(true);
    setLogin(loginValue);
  };
  
  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(LOGIN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    setIsAuthed(false);
    setLogin("");
  };

  return { isAuthed, login, signIn, signOut };
}
/* ================================================================================= */
/* ================================================================================= */
/* ====================================== APP ====================================== */
/* ================================================================================= */
/* ================================================================================= */

export default function App() {

  const [selectedUser, setSelectedUser] = useState(null);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });

  const { isAuthed, login, signIn, signOut } = useAuth();
  
  const navigate = useNavigate();

  const [notification, setNotification] = useState(null);
  const notify = (message) => {
    setNotification(message);
  };

  useEffect(() => {
    if (!notification) return;

    const t = setTimeout(() => setNotification(null), 2500);
    return () => clearTimeout(t);
  }, [notification]);

  const [users, setUsers] = useState([]);
  const [showChat, setShowChat] = useState(false);
  
  const [privacy, setPrivacy] = useState("privacy");
  const [terms, setTerms] = useState("terms");
  
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [authUserId, setAuthUserId] = useState(
    localStorage.getItem(USER_ID_KEY));
  
/* ================================================================================= */
/* ================================================================================= */
/* ============================ HANDLE BACKGROUND ================================== */
/* ================================================================================= */
/* ================================================================================= */

  const [avatar, setAvatar] = useState(null);

  const [authMode, setAuthMode] = useState(null);

  const DEFAULT_BG = "/images/abstract.png";

  const [bgSrc, setBgSrc] = useState(DEFAULT_BG);

  const changeBackground = (src) => {
    if (!authUserId) return;

    setBgSrc(src);
    localStorage.setItem(`bg_${authUserId}`, src);
  };

  useEffect(() => {
    if (!authUserId) {
      setBgSrc(DEFAULT_BG);
      return;
    }

    const savedBg = localStorage.getItem(`bg_${authUserId}`);
    setBgSrc(savedBg || DEFAULT_BG);

  }, [authUserId]);

  const BACKGROUNDS = [
  "/images/enter.jpg",
  "/images/sun.png",
  "/images/round.jpg",
  "/images/cybersun.jpg",
  "/images/black.webp",
  "/images/mountain.jpg",
  "/images/japan.jpg",
  "/images/japan2.jpg",
  "/images/car.jpg",
  "/images/car2.jpg",
  "/images/night.jpg",
  "/images/rocket.jpg",
  "/images/abstract.png",
  "/images/dom.jpg",
  "/images/setup.jpg",
  "/images/setup2.jpg",
  "/images/girlwork.jpg",
  "/images/boywork.jpg",
  "/images/vicecity.jpg",
  ];

/* ================================================================================= */
/* ================================================================================= */
/* ============================== HANDLE LOGIN ===================================== */
/* ================================================================================= */
/* ================================================================================= */

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
      try {
        const res = await fetch("https://localhost:3000/auth/login", {
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
          notify("Bad credentials");
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
        const res = await fetch("https://localhost:3000/auth/register", {
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
          notify("User already exist");
          return;
        }
        
        notify("Compte créé, vous pouvez vous connecter");
        setLoginInput("");
        setEmailInput("");
        setPasswordInput("");
        setAuthMode("login");

        } catch (err) {
            notify("Error Serv");
        }
    };

    //
    const openUserMenu = (e, user) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setContextPos({ x: rect.right + 8, y: rect.top });
      setSelectedUser(user);
    };

    const closeUserMenu = () => setSelectedUser(null);

    const handleDM = () => {
      console.log("DM to", selectedUser.nickname);
      closeUserMenu();
    };

    const handleInvite = () => {
      console.log("Invite to game", selectedUser.nickname);
      closeUserMenu();
    };

    const handleBlock = async () => {
      await fetch(`https://localhost:3000/user/${selectedUser.id}/block`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      closeUserMenu();
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

      await fetch("https://localhost:3000/user/me/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({avatar: avatarBase64,}),
      });

      setAvatar(avatarBase64);
    };

    reader.readAsDataURL(file);
  };
  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;

    fetch("https://localhost:3000/user/me/avatar", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setAvatar(data.avatar || null);
      });
  }, [isAuthed]);

  //
  //
  //
  useEffect(() => {
  if (!showChat) return;

  fetch("https://localhost:3000/users", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    },
  })
    .then(res => res.json())
    .then(setUsers);
  }, [showChat]);
  //
  //
  //
  const handleLogout = async () => {
    await fetch("https://localhost:3000/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });
    setAuthUserId(null);
    setBgSrc(DEFAULT_BG);
    signOut();
    navigate("/");
  };
  //
  //
  //

/* ================================================================================= */
/* ================================================================================= */
/* ===================================== CANVAS ==================================== */
/* ================================================================================= */
/* ================================================================================= */

  function GameCanvas() {
    const canvasRef = useRef(null);
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize);
      let t = 0;
      const loop = () => {
        t += 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        ctx.fillStyle = "rgba(10, 4, 70, 1)";
        ctx.fillRect(0, 0, w, h);
      };
      loop();
      return () => window.removeEventListener("resize", resize);
    }, []);
    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full neon-border rounded-xl"
      />
    );
  }

/* ================================================================================= */
/* ================================================================================= */
/* =================================== HOME PAGE =================================== */
/* ================================================================================= */
/* ================================================================================= */

  return (
    <div id="app" className="w-screen h-screen">
      
      {notification && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">

          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setNotification(null)}
          />

          <div className="relative min-w-[300px] px-8 py-6
            rounded-xl bg-black/90 neon-border text-center">

            <p className="font-mono tracking-[-0.03em] text-white">
              {notification}
            </p>

            <button
              onClick={() => setNotification(null)}
              className="neon-glitch mt-5 px-10 py-0 neon-border text-white"
              data-text="𝕆𝕂">
              𝕆𝕂
            </button>
          </div>
        </div>
      )}

      <footer className="absolute top-[880px] left-1/2 -translate-x-1/2
        text-xs text-cyan-300 neon-glitch z-50">
        <Link to="/privacy">Privacy Policy</Link>
          {" | "}
        <Link to="/terms">Terms of Service</Link>
      </footer>

      <img
        src={bgSrc}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        alt=""
      />

        {isAuthed && (
          <div className="fixed top-4 right-4 z-[9999]">
            <button
              className="neon-glitch text-2xl px-2 py-0 bg-transparent rounded neon-border"
              data-text="✉"
              onClick={() => setShowChat(v => !v)}
            >
              ✉
            </button>
          </div>
        )}

{/*=====================================================================================
  ======================================================================================
  =================================== NOTIFICATION =====================================
  ======================================================================================
  ======================================================================================*/}

        {showChat && (
          <div className="fixed top-0 left-0 h-full w-[300px] bg-black/80 z-[10] neon-border p-4">
            <h2 className="neon-glitch mb-6 text-cyan-300"
              data-text="𝕌𝕊𝔼ℝ𝕊">
              𝕌𝕊𝔼ℝ𝕊
            </h2>

            <ul className="space-y-2">
              {users.map(u => (
                <li key={u.id}>
                  <button
                    onClick={(e) => openUserMenu(e, u)}
                    className="w-full flex items-center gap-2 px-2 py-1
                              rounded hover:bg-cyan-500/10 text-left"
                  >
                    {u.online && (
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    )}
                    <span className="text-white">{u.nickname}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

{/*=====================================================================================
  ======================================================================================
  ================================== SELECTED USER =====================================
  ======================================================================================
  ======================================================================================*/}

        {selectedUser && (
          <div
            className="fixed bg-black/90 neon-border rounded p-2 text-sm z-[1000]"
            style={{ top: contextPos.y, left: contextPos.x }}
            onMouseLeave={closeUserMenu}
          >

            <div className="text-cyan mb-1 px-2">
              {selectedUser.nickname}
            </div>

            <button
              onClick={handleDM}
              className="block w-full px-2 py-1 hover:bg-cyan-500/20 text-left text-white"
            >
              ℙ𝕣𝕚𝕧𝕒𝕥𝕖 𝕞𝕖𝕤𝕤𝕒𝕘𝕖 ⌨︎
            </button>

            <button
              onClick={handleInvite}
              className="block w-full px-2 py-1 hover:bg-cyan-500/20 text-left text-white"
            >
              𝕀𝕟𝕧𝕚𝕥𝕖 𝕥𝕠 𝕡𝕝𝕒𝕪 ♨
            </button>

            <button
              onClick={handleBlock}
              className="block w-full px-2 py-1 hover:bg-red-500/30 text-left text-red-400"
            >
              𝔹𝕝𝕒𝕔𝕜 𝕝𝕚𝕤𝕥 ☣
            </button>
          </div>
        )}

{/*=====================================================================================
  ======================================================================================
  ===================================== MAIN MENU ======================================
  ====================================================================================== 
  ======================================================================================*/}

        <Routes>
          <Route path="/" element={
            <div className="w-full h-full flex flex-col items-center">
              <div className="mt-[3vh]">
                <h1 className="neon-glitch absolute left-1/2 -translate-x-1/2 bg-transparent
                  border-0 text-7xl" 
                    data-text="𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔼ℕℂ𝔼">
                  𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔼ℕℂ𝔼
                </h1>
              </div>
              <div className="mt-[12vh] flex justify-center w-full">
                <button
                  className="neon-glitch relative inline-block text-4xl bg-transparent border-0"
                  data-text="ℂ𝕆ℕℕ𝔼ℂ𝕋𝕀𝕆ℕ➣"
                  onClick={() => setAuthMode("login")}
                >
                  ℂ𝕆ℕℕ𝔼ℂ𝕋𝕀𝕆ℕ➣
                </button>
              </div>
              <div className="mt-[1vh] flex justify-center w-full">
                <button
                  className="neon-glitch relative inline-block text-4xl bg-transparent border-0"
                  data-text="𝕊𝕌𝔹𝕊ℂℝ𝕀𝔹𝔼➢"
                  onClick={() => setAuthMode("register")}
                >
                  𝕊𝕌𝔹𝕊ℂℝ𝕀𝔹𝔼➢
                </button>
              </div>

{/*=====================================================================================
  ======================================================================================
  ======================================== LOGIN =======================================
  ====================================================================================== 
  ======================================================================================*/}

            {authMode === "login" && (
              <div className="mt-[2vh] bg-black/60 p-6 rounded-xl backdrop-blur-xl neon-border">
                <form className="flex flex-col gap-4" onSubmit={handleSubmitLogin}>
                  <h1 className="neon-glitch absolute left-[14px] px-0 py-0 text-xl text-cyan-300"
                  data-text="⫷ 𝕎𝔼𝕃ℂ𝕆𝕄𝔼 𝔹𝔸ℂ𝕂 ⫸">
                    ⫷ 𝕎𝔼𝕃ℂ𝕆𝕄𝔼 𝔹𝔸ℂ𝕂 ⫸
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
                    placeholder="ℙ𝔸𝕊𝕊𝕎𝕆ℝ𝔻"
                    className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                    autoComplete="current-password"
                  />
                  <button type="submit" className="neon-glitch px-0 py-0 bg-gray-900/80
                    text-cyan-300 rounded neon-border"
                  data-text="⇧ 𝔾𝕆 ⇧">
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
                <form className="flex flex-col gap-4" onSubmit={handleSubmitSub}>

                  <h1 className="neon-glitch absolute left-[95px] px-0 py-0 text-xl text-cyan-300"
                    data-text="⫷ 𝕎𝔼𝕃ℂ𝕆𝕄𝔼 ⫸">
                    ⫷ 𝕎𝔼𝕃ℂ𝕆𝕄𝔼 ⫸
                  </h1>

                  <input
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="𝕃𝕆𝔾𝕀ℕ"
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
                    placeholder="ℙ𝔸𝕊𝕊𝕎𝕆ℝ𝔻"
                    className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                  />

{/*=====================================================================================
  ======================================================================================
  =============================== CHOOSE YOUR GENDER ===================================
  ====================================================================================== 
  ======================================================================================*/}

                  <h1 className="neon-glitch absolute px-0 py-0 left-[2px] text-xl text-cyan-300"
                    data-text="⚤ ℂℍ𝕆𝕆𝕊𝔼 𝕐𝕆𝕌ℝ 𝔾𝔼ℕ𝔻𝔼ℝ ⚤">
                    ⚤ ℂℍ𝕆𝕆𝕊𝔼 𝕐𝕆𝕌ℝ 𝔾𝔼ℕ𝔻𝔼ℝ ⚤
                  </h1>

                  <div className="flex gap-4 justify-center">
                    <button
                      type="button"
                      className="neon-glitch px-9 py-0 text-1xl bg-gray-900/80 text-black-300
                        rounded neon-border"
                        data-text="♂ 𝕄𝔸𝕃𝔼 ♂">
                      ♂ 𝕄𝔸𝕃𝔼 ♂
                    </button>

                    <button
                      type="button"
                      className="neon-glitch px-7 py-0 text-1xl bg-gray-900/80 text-black-300
                      rounded neon-border"
                      data-text="♀ 𝔽𝔼𝕄𝔸𝕃𝔼 ♀">
                      ♀ 𝔽𝔼𝕄𝔸𝕃𝔼 ♀
                    </button>
                  </div>

                  <button type="submit" className="neon-glitch px-0 py-0 text-xl
                    bg-gray-900/80 text-cyan-300 rounded neon-border"
                    data-text="⇧ 𝔾𝕆 ⇧">
                      ⇧ 𝔾𝕆 ⇧
                  </button>
                </form>

              </div>
            )}
          </div>
        } />

{/*=====================================================================================
  ======================================================================================
  ======================================== MENU ========================================
  ====================================================================================== 
  ======================================================================================*/}

        <Route path="/dashboard" element={
          <div className="w-full h-full flex flex-col items-center">

            <div className="mt-[5vh]">
              <h1 className="neon-glitch absolute left-1/2 -translate-x-1/2 bg-transparent
                  border-0 text-7xl" 
                  data-text="𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔼ℕℂ𝔼"
                >
                𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔼ℕℂ𝔼
              </h1>
            </div>

            <div className="text-3xl mt-[10vh] text-white z-30">
              <span className="font-mono tracking-[-0.035em] text-cyan-300"
              >{login}</span>
            </div>

            <div className="text-white mt-[2vh]">
              <button
                className="neon-glitch ml-1 px-3 py-0 neon-border bg-gray-900/60"
                onClick={() => {handleLogout()}}
                data-text="𝕃𝕆𝔾𝕆𝕌𝕋">
                𝕃𝕆𝔾𝕆𝕌𝕋
              </button>
            </div>

            <div className="mt-[5vh] flex flex-col gap-6 items-center">
              <button className="neon-glitch text-5xl bg-transparent border-0"
                data-text="ℙ𝕃𝔸𝕐"
                onClick={() => navigate("/play")}>
                ℙ𝕃𝔸𝕐
              </button>
              <button className="neon-glitch text-5xl bg-transparent border-0"
                data-text="ℙℝ𝕆𝔽𝕀𝕃𝔼"
                onClick={() => navigate("/profile")}>
                ℙℝ𝕆𝔽𝕀𝕃𝔼
              </button>
              <button className="neon-glitch text-5xl bg-transparent border-0"
                data-text="ℂ𝕌𝕊𝕋𝕆𝕄𝕀ℤ𝔼"
                onClick={() => navigate("/customize")}>
                ℂ𝕌𝕊𝕋𝕆𝕄𝕀ℤ𝔼
              </button>
            </div>
          </div>
        }/>

{/*=====================================================================================
  ======================================================================================
  ===================================== CHOOSE GAME ====================================
  ====================================================================================== 
  ======================================================================================*/}

        <Route path="/play" element={
          <div className="relative w-screen h-screen">

            <h1
              className="absolute top-[60px] left-1/2 -translate-x-1/2 neon-glitch text-5xl"
              data-text="⊱ ℂℍ𝕆𝕆𝕊𝔼 𝔾𝔸𝕄𝔼 ⊰"
            >
              ⊱ ℂℍ𝕆𝕆𝕊𝔼 𝔾𝔸𝕄𝔼 ⊰
            </h1>

            <div className="absolute left-1/2 top-[260px] -translate-x-1/2">
              <button
                className="neon-glitch text-4xl"
                onClick={() => navigate("/game/pong")}
                data-text="◐ ℙ𝕆ℕ𝔾 ◑"
              >
                ◐ ℙ𝕆ℕ𝔾 ◑
              </button>
            </div>

            <div className="absolute left-1/2 top-[400px] -translate-x-1/2">
              <button
                className="neon-glitch text-4xl"
                onClick={() => navigate("/game/bonus")}
                data-text="◐ 𝔹𝕆ℕ𝕌𝕊 ◑"
              >
                ◐ 𝔹𝕆ℕ𝕌𝕊 ◑
              </button>
            </div>

            <button
              className="absolute left-4 px-1 py-1 neon-border bg-gray-900/60 text-cyan-300"
              onClick={() => navigate(-1)}
            >
              𝔹𝔸ℂ𝕂
            </button>

          </div>
        }/>

{/*=====================================================================================
  ======================================================================================
  ====================================== CUSTOM BG =====================================
  ====================================================================================== 
  ======================================================================================*/}

        <Route path="/customize" element={
          <div className="fixed inset-0 bg-black/80 z-30 flex flex-col items-center p-8">

            <h1 className="neon-glitch text-5xl mb-[4vh] mt-[8vh]"
              data-text="𝔹𝔸ℂ𝕂𝔾ℝ𝕆𝕌ℕ𝔻">
              𝔹𝔸ℂ𝕂𝔾ℝ𝕆𝕌ℕ𝔻
            </h1>

            <div className="grid grid-cols-6 gap-6 mt-[8vh]">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => changeBackground(bg)}
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
              𝔹𝔸ℂ𝕂
            </button>

          </div>
        }/>

{/*=====================================================================================
  ======================================================================================
  ====================================== GAME CANVA ====================================
  ====================================================================================== 
  ======================================================================================*/}

        <Route path="/game/pong" element={
          <div className="w-full h-full relative">
            <button
              className="absolute top-4 left-4 px-4 py-2 neon-border bg-gray-900/60 text-white"
              onClick={() => navigate(-1)}
            >
              𝔹𝔸ℂ𝕂
            </button>

            <div className="absolute inset-x-0 top-[10%] mx-auto w-[90vw] h-[80vh]">
              <GameCanvas />
            </div>
          </div>
        }/>

{/*=====================================================================================
  ======================================================================================
  ======================================== PROFIL ======================================
  ====================================================================================== 
  ======================================================================================*/}

        <Route path="/profile" element={
          <div className="w-full h-full relative overflow-hidden">
            <div className="mt-[1vh] w-full h-full flex flex-col items-center">
              <h1 className="neon-glitch relative inline-block text-7xl"
                data-text="ℙℝ𝕆𝔽𝕀𝕃𝔼">
                ℙℝ𝕆𝔽𝕀𝕃𝔼
              </h1>

              <button
                className="neon-glitch absolute text-xl top-[125px] px-3 py-0
                neon-border bg-gray-900/60"
                onClick={() => navigate(-1)}
                data-text="𝔹𝔸ℂ𝕂">
                𝔹𝔸ℂ𝕂
              </button>

              <label
                className="
                  absolute top-[310px] text-xs cursor-pointer neon-border neon-glitch
                  px-2 py-1 font-mono text-cyan-300 hover:underline"
              >
                change avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>

              <img
                src={avatar || "/images/default-avatar.png"}
                className="w-32 h-32 absolute top-[270px] rounded-full object-cover neon-border"
              />

              <h1 className="neon-glitch absolute text-2xl top-[340px]"
                    data-text="Login">
                    Login
              </h1>

              <h1 className="neon-glitch absolute z-30 font-bold font-mono text-3xl top-[370px]">
                <span className="text-cyan-300">{login}</span>
              </h1>

            </div>
          </div>
        }/>

{/*=====================================================================================
  ======================================================================================
  ==================================== PRIVACY POLICY ==================================
  ====================================================================================== 
  ======================================================================================*/}

        <Route path="/privacy" element={
          <div className="fixed inset-0 flex flex-col items-center bg-black/80 p-8 pt-[200px]
            text-cyan-300 z-30">
            <h1 className="text-3xl mb-4 neon-glitch">Privacy Policy</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-center">
              This application is part of an educational project
              <br /><br />
              within the 42 curriculum.
              <br /><br />
              We collect only the information necessary
              <br /><br />
              to provide authentication and gameplay
              <br /><br />
              features, such as username, encrypted password,
              <br /><br />
              avatar, and game-related data.
              <br /><br />
              All data is stored securely and is not shared with third parties.
              <br /><br />
              This project is not intended for commercial use.
            </p>
            <button className="mt-6 neon-border px-4 py-1"
              onClick={() => navigate(-1)}
              >
              𝔹𝔸ℂ𝕂
            </button>
          </div>
        }/>

{/*=====================================================================================
  ======================================================================================
  =================================== TERMS OF SERVICE =================================
  ====================================================================================== 
  ======================================================================================*/}

        <Route path="/terms" element={
          <div className="fixed inset-0 flex flex-col items-center bg-black/80 p-8 pt-[200px]
            text-cyan-300 z-30">
            <h1 className="text-3xl mb-4 neon-glitch">Terms of Service</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-center">
              This application is provided as part of an educational project
              <br /><br />
              within the 42 curriculum.
              <br /><br />
              Users agree to use the platform respectfully
              <br /><br />
              and must not attempt to abuse, disrupt,
              <br /><br />
              or exploit the service.
              <br /><br />
              The application is provided “as is”,
              <br /><br />
              without any guarantees of availability,
              <br /><br />
              security, or performance.
            </p>
            <button className="mt-6 neon-border px-4 py-1 relative z-[1001]"
              onClick={() => navigate(-1)}
              >
              𝔹𝔸ℂ𝕂
            </button>
          </div>
        } />
      </Routes>
    </div>
  );
}
