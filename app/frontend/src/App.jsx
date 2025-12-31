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
  const { isAuthed, login, signIn, signOut } = useAuth();
  
  const navigate = useNavigate();
  // const [page, setPage] = useState("home");

  const [users, setUsers] = useState([]);
  const [showChat, setShowChat] = useState(false);
  
  const [privacy, setPrivacy] = useState("privacy");
  const [terms, setTerms] = useState("terms");
  
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [authUserId, setAuthUserId] = useState(
    localStorage.getItem(USER_ID_KEY));
    
  const [authMode, setAuthMode] = useState(null);
  const bgSrc = useMemo(() => "/images/enter.jpg", []);
  const [avatar, setAvatar] = useState(null);

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
          alert(data.error || "Erreur de connexion");
          return;
        }

        signIn(data.nickname, data.token, data.userId);
        setAuthUserId(data.userId);
        setAuthMode(null);
        navigate("/dashboard");

      } catch (err) {
        alert("Impossible de contacter le serveur");
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
          alert(data.error || "Erreur d'inscription");
          return;
        }
        
        alert("Compte créé, vous pouvez vous connecter");
        setLoginInput("");
        setEmailInput("");
        setPasswordInput("");
        setAuthMode("login");

        } catch (err) {
          alert("Impossible de contacter le serveur");
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

      <footer className="absolute top-[890px] left-1/2 -translate-x-1/2 text-xs text-cyan-300 neon-glitch z-50">
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
          <button
          className="neon-glitch fixed top-0 left-0 text-2xl px-1 py-1 z-[9999] bg-transparent neon-border"
          data-text="|||"
            onClick={() => setShowChat(v => !v)}
            >
            |||
          </button>
        )}
        {showChat && (
          <div className="fixed top-0 left-0 h-full w-[300px] bg-black/80 z-[9998] neon-border p-4">
            <h2 className="mb-4 text-cyan-300">Users</h2>

            <ul className="space-y-2">
              {users.map(u => (
                <li key={u.id} className="flex items-center gap-2">
                  {u.online && (
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  )}
                  <span className="text-white">{u.nickname}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            <div className="w-full h-full flex flex-col items-center">
              <div className="mt-[5vh]">
                <h1 className="neon-glitch absolute left-1/2 -translate-x-1/2 bg-transparent border-0 text-7xl" 
                    data-text="𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔸ℕℂ𝔼">
                  𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔸ℕℂ𝔼
                </h1>
              </div>
              <div className="mt-[12vh] flex justify-center w-full">
                <button
                  className="neon-glitch relative inline-block text-4xl bg-transparent border-0"
                  data-text="ℂ𝕆ℕℕ𝔼ℂ𝕋𝕀𝕆ℕ⮩"
                  onClick={() => setAuthMode("login")}
                >
                  ℂ𝕆ℕℕ𝔼ℂ𝕋𝕀𝕆ℕ⮩
                </button>
              </div>
              <div className="mt-[1vh] flex justify-center w-full">
                <button
                  className="neon-glitch relative inline-block text-4xl bg-transparent border-0"
                  data-text="𝕊𝕌𝔹𝕊ℂℝ𝕀𝔹𝔼+"
                  onClick={() => setAuthMode("register")}
                >
                  𝕊𝕌𝔹𝕊ℂℝ𝕀𝔹𝔼+
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
                  <h1 className="neon-glitch absolute left-[40px] px-0 py-0 text-xl text-cyan-300" data-text="𝕎𝔼𝕃ℂ𝕆𝕄𝔼 𝔹𝔸ℂ𝕂!">
                    𝕎𝔼𝕃ℂ𝕆𝕄𝔼 𝔹𝔸ℂ𝕂!
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
                  <button type="submit" className="neon-glitch px-4 py-2 bg-gray-900/80 text-cyan-300 rounded neon-border">
                    👾 𝔾𝕆 👾
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
                  <h1 className="neon-glitch absolute left-[70px] px-0 py-0 text-xl text-cyan-300" data-text="𝕎𝔼𝕃ℂ𝕆𝕄𝔼 !">
                    𝕎𝔼𝕃ℂ𝕆𝕄𝔼 !
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
                  <button type="submit" className="neon-glitch px-4 py-2 bg-gray-900/80 text-cyan-300 rounded neon-border">
                    👾 𝔾𝕆 👾
                  </button>
                </form>
              </div>
            )}
          </div>
/* === HOME END === */
        } />

{/*=====================================================================================
  ======================================================================================
  ======================================== HOME ========================================
  ====================================================================================== 
  ======================================================================================*/}

        <Route path="/dashboard" element={
          <div className="w-full h-full flex flex-col items-center">

            <div className="mt-[5vh]">
              <h1 className="neon-glitch absolute left-1/2 -translate-x-1/2 bg-transparent border-0 text-7xl" 
                  data-text="𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔸ℕℂ𝔼"
                >
                𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔸ℕℂ𝔼
              </h1>
            </div>

            <div className="text-3xl mt-[9vh] text-white">
              <span className="text-cyan-300">{login}</span>
            </div>

            <div className="mt-[2vh] text-white">
              <button
                className="neon-glitch ml-4 px-3 py-0 neon-border bg-gray-0/0"
                onClick={() => {
                  signOut();
                  setAuthUserId(null);
                  setAvatar(null);
                  navigate("/");
                }}
                data-text="𝕃𝕠𝕘𝕠𝕦𝕥">
                𝕃𝕠𝕘𝕠𝕦𝕥
              </button>
            </div>

            <div className="mt-[7vh] flex flex-col gap-6 items-center">
              <button className="neon-glitch text-5xl bg-transparent border-0" 
                data-text="ℙ𝕃𝔸𝕐"
                onClick={() => navigate("/game")}>
                ℙ𝕃𝔸𝕐
              </button>
              <button className="neon-glitch text-5xl bg-transparent border-0"
                data-text="ℙℝ𝕆𝔽𝕀𝕃𝔼"
                onClick={() => navigate("/profile")}>
                ℙℝ𝕆𝔽𝕀𝕃𝔼
              </button>
              <button className="neon-glitch text-5xl bg-transparent border-0"
                data-text="𝕆ℙ𝕋𝕀𝕆ℕ𝕊">
                𝕆ℙ𝕋𝕀𝕆ℕ𝕊
              </button>
            </div>
          </div>
        } />

{/*=====================================================================================
  ======================================================================================
  ====================================== GAME CANVA ====================================
  ====================================================================================== 
  ======================================================================================*/}

        <Route path="/game" element={
          <div className="w-full h-full relative">
            <button
              className="absolute top-4 left-4 px-4 py-2 neon-border bg-gray-900/60 text-white"
              onClick={() => navigate("/dashboard")}
            >
              𝔹𝕒𝕔𝕜
            </button>

            <div className="absolute inset-x-0 top-[10%] mx-auto w-[90vw] h-[80vh]">
              <GameCanvas />
            </div>
          </div>
        } />

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
                className="neon-glitch absolute text-2xl top-[50px] px-3 py-0 neon-border bg-gray-900/60"
                onClick={() => navigate("/dashboard")}
                data-text="𝔹𝕒𝕔𝕜">
                𝔹𝕒𝕔𝕜
              </button>

              <label
                className="
                  absolute
                  top-[230px]
                  text-xs
                  cursor-pointer
                  neon-border
                  neon-glitch
                  px-2
                  py-1
                  font-mono
                  text-cyan-300
                  hover:underline
                "
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
                className="w-32 h-32 absolute top-[200px] rounded-full object-cover neon-border"
              />

              <h1 className="neon-glitch absolute text-2xl top-[290px]"
                    data-text="Login">
                    Login
              </h1>

              <h1 className="neon-glitch absolute font-bold font-mono text-3xl top-[300px]">
                <span className="text-cyan-300">{login}</span>
              </h1>
            </div>
          </div>
        } />

{/*=====================================================================================
  ======================================================================================
  ==================================== PRIVACY POLICY ==================================
  ====================================================================================== 
  ======================================================================================*/}
        <Route path="/privacy" element={
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 p-8 text-cyan-300">
            <h1 className="text-3xl mb-4 neon-glitch">Privacy Policy</h1>
            <p className="max-w-3xl text-sm leading-relaxed">
              This application is a student project developed as part of the 42 curriculum.
              <br /><br />
              We collect user data such as username, encrypted password, avatar, and game-related
              information in order to provide authentication and gameplay features.
              <br /><br />
              Data is stored securely and never shared with third parties.
            </p>
            <button className="mt-6 neon-border px-4 py-1" onClick={() => navigate("/")}>
              Back
            </button>
          </div>
        }/>
{/*=====================================================================================
  ======================================================================================
  =================================== TERMS OF SERVICE =================================
  ====================================================================================== 
  ======================================================================================*/}
        <Route path="/terms" element={
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 p-8 text-cyan-300">
            <h1 className="text-3xl mb-4 neon-glitch">Terms of Service</h1>
            <p className="max-w-3xl text-sm leading-relaxed">
              This application is part of an educational project within the 42 curriculum.
              <br /><br />
              Users must not abuse the platform, cheat, or disrupt the service.
              <br /><br />
              The service is provided as is, without guarantees.
            </p>
            <button className="mt-6 neon-border px-4 py-1" onClick={() => navigate("/")}>
              Back
            </button>
          </div>
        } />
      </Routes>
    </div>
  );
}
