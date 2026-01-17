/*  useState : manage the local state (auth, UI, données)
    useEffect : side effects (fetch, websocket, timers)
    useRef : persistent references (WebSocket, canvas)  */
import React, { useEffect, useRef, useState } from "react";
/*  Routes / Route : routing
    useNavigate : programmatic navigation */
import { Routes, Route, useNavigate, Link, useLocation, useParams } from "react-router-dom";

// /*  useLocation : know the current URL */
// import { useLocation } from "react-router-dom";

/* Centralized keys for localStorage */
const LOGIN_KEY = "auth_login";
const AUTH_KEY = "auth_token";
const USER_ID_KEY = "auth_user_id";

/* ================================================================================= */
/* ================================================================================= */
/* ================================= HANDLE AUTH =================================== */
/* ================================================================================= */
/* ================================================================================= */

function useAuth() {
  
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
  };
  
  /* clean localstorage + reset state */
  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(LOGIN_KEY);
    localStorage.removeItem(USER_ID_KEY);

    setIsAuthed(false);
    setLogin("");
  };

  return { isAuthed, login, signIn, signOut };
}

function Loading() {
  return <div className="text-white">Loading...</div>;
}

/* ================================================================================= */
/* ================================================================================= */
/* ====================================== APP ====================================== */
/* ================================================================================= */
/* ================================================================================= */

export default function App() {

  /* UI states / interaction :
        context menu management, side chat, tabs, notifications*/
  const [selectedUser, setSelectedUser] = useState(null);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
  const [showChat, setShowChat] = useState(false);
  const [userTab, setUserTab] = useState("users");
  const notify = (message) => {setNotification(message);};
  
  /* maintains the same WS connection between renders */
  const wsRef = useRef(null);

  /* Authentication state and helpers */
  const { isAuthed, login, signIn, signOut } = useAuth();

  /* List of all users */
  const [users, setUsers] = useState([]);

  /* Controlled inputs for authentication forms */
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  /*  Authenticated user ID (persisted in localStorage)
      Used for user-specific data (background, avatar, social actions) */
  const [authUserId, setAuthUserId] = useState(localStorage.getItem(USER_ID_KEY));

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

  const isBlockedUser = (id) =>
  blockedUsers.some(u => u.id === id);

/* ================================================================================= */
/* ================================================================================= */
/* ============================ HANDLE BACKGROUND ================================== */
/* ================================================================================= */
/* ================================================================================= */

  const [avatar, setAvatar] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const DEFAULT_BG = "/images/abstract.png";
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
    if (isAuthed) {
      fetchUserSettings();
    } else {
      setBgSrc(DEFAULT_BG);
    }
  }, [isAuthed]);

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
        
        notify("Compte créé, vous pouvez vous connecter");
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

    fetch("/api/user/me/avatar", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setAvatar(data.avatar || null);
      });
  }, [isAuthed]);

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
      .then(res => res.json())
      .then(data => {
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
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH_KEY)}`,
      },
    })
    .then(res => res.json())
    .then(setUsers)
    .catch(() => setUsers([]));

    const ws = new WebSocket(
      `wss://${window.location.host}/api/ws?token=${token}`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {

        case "USERS_STATUS":
          setUsers(prev => {
            const map = new Map(prev.map(u => [u.id, u]));

            msg.onlineUsers.forEach(id => {
              if (map.has(id)) {
                map.set(id, { ...map.get(id), online: true });
              } else {
                map.set(id, { id, nickname: `user_${id}`, online: true });
              }
            });

            return Array.from(map.values()).map(u => ({
              ...u,
              online: msg.onlineUsers.includes(u.id),
            }));
          });
          break;

        case "FRIEND_REQUEST":
          setFriendRequests(prev => {
            if (prev.some(u => u.id === msg.from.id)) return prev;
            return [...prev, msg.from];
          });
          break;

        case "FRIEND_ADDED":
          setFriends(prev => {
            if (prev.some(f => f.id === msg.user.id)) return prev;
            return [...prev, msg.user];
          });
          setFriendRequests(prev =>
            prev.filter(u => u.id !== msg.user.id)
          );
          break;

        case "FRIEND_REFUSED":
          setFriendRequests(prev =>
            prev.filter(u => u.id !== msg.userId)
          );
          break;

        case "FRIEND_REMOVED":
          setFriends(prev =>
            prev.filter(f => f.id !== msg.userId)
          );
          setUsers(prev =>
            prev.map(u =>
              u.id === msg.userId ? { ...u, online: false } : u
            )
          );
          setActiveChatUser(prev =>
            prev?.id === msg.userId ? null : prev
          );
          break;
        
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
  }, [isAuthed, authUserId]);

  //
  //
  //
  useEffect(() => {
    if (!showChat || userTab !== "requests") return;

    fetch("/api/friends/requests", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setFriendRequests(prev => {
          const fetched = Array.isArray(data) ? data : [];
          const merged = [...prev];

          fetched.forEach(u => {
            if (!merged.some(p => p.id === u.id)) {
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
      .then(res => res.json())
      .then(data => {
        setBlockedUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setBlockedUsers([]));
  }, [showChat]);
//
//
//

  const isFriend = (id) => friends.some(f => f.id === id);
  const isPending = (id) => friendRequests.some(r => r.id === id);

  const openUserMenu = (e, user) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setContextPos({ x: rect.right + 8, y: rect.top });
    setSelectedUser(user);
  };

  const closeUserMenu = () => setSelectedUser(null);

  const handleDM = () => {
    setActiveChatUser(selectedUser);
    closeUserMenu();
  };

  const handleInvite = () => {
    console.log("Invite:", selectedUser.nickname);
    closeUserMenu();
  };

  const handleSendFriendRequest = async () => {
    await fetch(`/api/friends/request/${selectedUser.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    notify("Friend request sent");
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
    setFriendRequests(prev =>
      prev.filter(req => req.id !== userId)
    );

    // // refresh friends
    // fetch("https://localhost:3000/friends", {
    //   headers: {
    //     Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    //   },
    // })
    //   .then(res => res.json())
    //   .then(data => {
    //     setFriends(Array.isArray(data) ? data : []);
    //   });
  };

  const handleRefuseFriend = async (userId) => {
    await fetch(`/api/friends/refuse/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    setFriendRequests(prev =>
      prev.filter(u => u.id !== userId)
    );
  };

  const handleRemoveFriend = async () => {
    await fetch(`/api/friends/${selectedUser.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    // fetch("https://localhost:3000/friends", {
    //   headers: {
    //     Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    //   },
    // })
      // .then(res => res.json())
      // .then(data => {
      //   setFriends(Array.isArray(data) ? data : []);
      // });

    closeUserMenu();
  };

  // const refreshFriends = () => {
  //   fetch("https://localhost:3000/friends", {
  //     headers: {
  //       Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
  //     },
  //   })
  //     .then(res => res.json())
  //     .then(data => {
  //       setFriends(Array.isArray(data) ? data : []);
  //     });
  // };

  const handleBlock = async () => {
    await fetch(`/api/user/${selectedUser.id}/block`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });
    closeUserMenu();
  };

  // useEffect(() => {
  //   if (showChat && userTab === "friends") {
  //     refreshFriends();
  //   }
  // }, [showChat, userTab]);

function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const [user, setUser] = useState(undefined);
  const isMe = String(id) === String(localStorage.getItem(USER_ID_KEY));

  // FETCH PROFIL UNIQUEMENT SI PAS MOI
  useEffect(() => {
    if (isMe) {
      setUser(null);
      return;
    }

    fetch(`/api/users/${id}/profile`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("PROFILE_NOT_FOUND");
        return res.json();
      })
      .then(setUser)
      .catch(() => setUser(null));
  }, [id, isMe]);

  // SYNC ONLINE STATUS
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || isMe) return;

    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "USERS_STATUS") {
        setUser(u =>
          u ? { ...u, online: msg.onlineUsers.includes(u.id) } : u
        );
      }
    };

    ws.addEventListener("message", handler);
    return () => ws.removeEventListener("message", handler);
  }, [isMe]);

  // ===== RENDER =====

  if (isMe) {
    return (
      <div className="w-full h-full flex flex-col items-center text-white">
        <button
          className="absolute top-4 left-4 neon-border px-2 py-1"
          onClick={() => navigate("/dashboard")}
        >
          ← 𝔹𝔸ℂ𝕂
        </button>

        <p className="mt-[20vh] text-cyan-300">
          This is your own profile
        </p>
      </div>
    );
  }

  if (user === undefined) {
    return <div className="text-white">Loading...</div>;
  }

  if (user === null) {
    return <div className="text-red-400">Profile not found</div>;
  }

  return (
    <div className="w-full h-full flex flex-col items-center text-white">
      <button
        className="absolute top-4 left-4 neon-border px-2 py-1"
        onClick={() => navigate(from)}
      >
        ← 𝔹𝔸ℂ𝕂
      </button>

      <img
        src={user.avatar || "/images/default-avatar.png"}
        className="w-32 h-32 rounded-full neon-border mt-[15vh]"
      />

      <h1 className="neon-glitch text-3xl mt-6">
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
    </div>
  );
}

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
        ctx.fillStyle = "rgb(0, 0, 0)";
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
    <div id="app" className="relative min-h-screen flex flex-col">

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


      <img
        src={bgSrc}
        className="absolute inset-0 w-full h-full object-cover -z-10 pointer-events-none"
        alt=""
      />

        {showConnectedUI && (
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
          <div className="fixed top-0 left-0 h-full w-[300px]
                          bg-black/80 z-[10] neon-border flex flex-col">

            {/* =============================================
                ================= LIST MODE =================
                ============================================= */}

            {!activeChatUser && (<>
                <div className="flex gap-2 mb-4 p-2">
                  <button
                    onClick={() => setUserTab("users")}
                    className={`flex-1 py-1 neon-border ${
                      userTab === "users" ? "text-cyan-300" : "text-gray-400"
                    }`}
                  >
                    𝕌𝕊𝔼ℝ𝕊
                  </button>

                  <button
                    onClick={() => setUserTab("friends")}
                    className={`flex-1 py-1 neon-border ${
                      userTab === "friends" ? "text-cyan-300" : "text-gray-400"
                    }`}
                  >
                    𝔽ℝ𝕀𝔼ℕ𝔻𝕊
                  </button>

                  <button
                    onClick={() => setUserTab("requests")}
                    className={`flex-1 py-1 neon-border ${
                      userTab === "requests" ? "text-cyan-300" : "text-gray-400"
                    }`}
                  >
                    ℝ𝔼ℚ𝕌𝔼𝕊𝕋
                    {friendRequests.length > 0 && <span className="ml-1 text-red-400">●</span>}
                  </button>
                </div>

            {/* =============================================
                ================= USER LIST =================
                ============================================= */}

                <ul className="flex-1 overflow-y-auto space-y-2 px-2">
                  {userTab === "users" &&
                    users.map(u => (
                      <li key={u.id}>
                        <button
                          onClick={(e) => openUserMenu(e, u)}
                          className="w-full flex items-center gap-2 px-2 py-1
                                    rounded hover:bg-cyan-500/10 text-left"
                        >
                          {u.online && <span className="w-2 h-2 rounded-full bg-green-400" />}
                          <span className="text-white">{u.nickname}</span>
                        </button>
                      </li>
                    ))}

            {/* =============================================
                ================ FRIEND LIST ================
                ============================================= */}

                  {userTab === "friends" &&
                    friends.map(u => (
                      <li key={u.id}>
                        <button
                          onClick={(e) => openUserMenu(e, u)}
                          className="w-full flex items-center gap-2 px-2 py-1
                                    rounded hover:bg-cyan-500/10 text-left"
                        >
                          {u.online && <span className="w-2 h-2 rounded-full bg-green-400" />}
                          <span className="text-white">
                            {u.nickname}
                          </span>
                        </button>
                      </li>
                    ))}

            {/* =============================================
                =============== REQUEST LIST ================
                ============================================= */}

                  {userTab === "requests" &&
                    friendRequests.map(u => (
                      <li key={u.id} className="flex justify-between px-2 py-1">
                        <span className="text-white">
                            {u.nickname}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => handleAcceptFriend(u.id)}
                            className="text-green-400">
                              ✓
                          </button>
                          <button onClick={() => handleRefuseFriend(u.id)}
                            className="text-red-400">
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

            {activeChatUser && (<>
                <div className="flex items-center gap-2 p-3 border-b border-cyan-500/30">
                  <button
                    className="text-cyan-300 text-sm"
                    onClick={() => setActiveChatUser(null)}
                  >
                    ← 𝔹𝔸ℂ𝕂
                  </button>
                  <span className="text-white font-mono">
                    {activeChatUser.nickname}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {(messages[activeChatUser.id] || []).map((msg, i) => (
                    <div
                      key={i}
                      className={`max-w-[80%] px-3 py-1 rounded
                          whitespace-pre-wrap break-words
                        ${msg.from === "me"
                          ? "ml-auto bg-cyan-600/30"
                          : "mr-auto bg-gray-700/40"}`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>
                
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
                    setMessages(prev => ({
                      ...prev,
                      [activeChatUser.id]: [
                        ...(prev[activeChatUser.id] || []),
                        { from: "me", text: chatInput }
                      ]
                    }));
                    setChatInput("");
                  }}
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-black/60 text-white px-2 py-1 rounded neon-border"
                  />
                  <button className="text-cyan-300">➤</button>
                </form>
              </>
            )}
          </div>
        )}

{/*=====================================================================================
  ======================================================================================
  ================================== SELECTED USER =====================================
  ======================================================================================
  ======================================================================================*/}

        {selectedUser && (
          <div
            className="fixed bg-black/90 neon-border rounded p-2
                      text-sm z-[1000]"
            style={{ top: contextPos.y, left: contextPos.x }}
            onMouseLeave={closeUserMenu}
          >
            <div className="text-cyan-300 px-2 mb-1">
              {selectedUser.nickname}
            </div>

            {!isBlockedUser(selectedUser.id) && (
              <>
                <button
                  onClick={handleDM}
                  className="block w-full px-2 py-1 hover:bg-cyan-500/20 text-left text-white"
                >
                  Private message ⌨︎
                </button>

                <button
                  onClick={handleInvite}
                  className="block w-full px-2 py-1 hover:bg-cyan-500/20 text-left text-white"
                >
                  Invite to play ♨
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
                Send friend +
              </button>
            )}

            {userTab === "friends" && (
              <button
                onClick={handleRemoveFriend}
                className="block w-full px-2 py-1
                          hover:bg-red-500/30 text-left text-red-400"
              >
                Remove friend ✘
              </button>
            )}

            {/* =============================================
                ================ VIEW PROFILE ===============
                ============================================= */}

            <button
              onClick={() => {
                navigate(`/profile/${selectedUser.id}`, {
                  state: { from: location.pathname }
                });
                closeUserMenu();
              }}
              className="block w-full px-2 py-1 hover:bg-cyan-500/20 text-left text-white"
            >
              View profile 👁
            </button>

            {/* =============================================
                ================ HANDLE BLOCK ===============
                ============================================= */}

            {!isBlockedUser(selectedUser.id) ? (
              <button
                onClick={async () => {
                  await fetch(
                    `/api/user/${selectedUser.id}/block`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                      },
                    }
                  );
                  setBlockedUsers(prev => [...prev, selectedUser]);
                  closeUserMenu();
                }}
                className="block w-full px-2 py-1 hover:bg-red-700/40 text-left text-red-500"
              >
                Blacklist ☣
              </button>
            ) : (
              <button
                onClick={async () => {
                  await fetch(
                    `/api/user/${selectedUser.id}/unblock`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                      },
                    }
                  );
                  setBlockedUsers(prev =>
                    prev.filter(u => u.id !== selectedUser.id)
                  );
                  closeUserMenu();
                }}
                className="block w-full px-2 py-1 hover:bg-green-600/30 text-left text-green-400"
              >
                Unblock ✔
              </button>
            )}
          </div>
        )}

{/*=====================================================================================
  ======================================================================================
  ===================================== MAIN MENU ======================================
  ====================================================================================== 
  ======================================================================================*/}

        {/* <main className="flex-1 flex flex-col"> */}
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
              data-text="ℂℍ𝕆𝕆𝕊𝔼 𝔾𝔸𝕄𝔼"
            >
              ℂℍ𝕆𝕆𝕊𝔼 𝔾𝔸𝕄𝔼
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
              ← 𝔹𝔸ℂ𝕂
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
              ← 𝔹𝔸ℂ𝕂
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
              ← 𝔹𝔸ℂ𝕂
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

        <Route
          path="/profile/:id"
          element={
            <div className="relative w-full h-full z-30">
              <PublicProfile />
            </div>
          }
        />

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
                data-text="← 𝔹𝔸ℂ𝕂">
                ← 𝔹𝔸ℂ𝕂
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
              ← 𝔹𝔸ℂ𝕂
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
              ← 𝔹𝔸ℂ𝕂
            </button>
          </div>
        } />

      </Routes>
      {/* </main>
      <footer className="mt-auto w-full py-4 flex justify-center text-xs sm:text-sm text-cyan-300">
        <div className="flex gap-2 neon-glitch text-center">
          <Link to="/privacy">Privacy Policy</Link>
          <span>|</span>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </footer> */}
    </div>
  );
}
