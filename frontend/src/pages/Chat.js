import { useEffect, useState, useRef } from "react";
import axios from "axios";
import BASE_URL from "../api";
import { createSocket } from "../socket";
import Navbar from "../components/Navbar";

export default function Chat() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUserId, setTypingUserId] = useState(null);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const roomRef = useRef(null);
  const bottomRef = useRef(null);

  const token = localStorage.getItem("token");

  const currentUserId = token
    ? JSON.parse(atob(token.split(".")[1])).userId
    : null;

  const room = selectedGroup
    ? `group_${selectedGroup._id}`
    : selectedUser
    ? [currentUserId, selectedUser._id].sort().join("_")
    : null;

  // keep room reference
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // fetch groups
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${BASE_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setGroups(res.data));
  }, [token]);

  // fetch users
  useEffect(() => {
    if (!token || !currentUserId) return;

    axios
      .get(`${BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUsers(res.data.filter((u) => u._id !== currentUserId));
      });
  }, [token, currentUserId]);

  // socket setup
  useEffect(() => {
    if (!token) return;

    socketRef.current = createSocket(token);

    socketRef.current.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);

      socketRef.current.emit("message_delivered", {
        messageId: msg._id,
        room: msg.room,
      });

      if (msg.room === roomRef.current) {
        socketRef.current.emit("message_seen", {
          messageId: msg._id,
        });
      }
    });

    socketRef.current.on("message_status", ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status } : m
        )
      );
    });

    socketRef.current.on("online_users", setOnlineUsers);

    socketRef.current.on("typing", ({ userId }) => {
      if (userId !== currentUserId) setTypingUserId(userId);
    });

    socketRef.current.on("stop_typing", () => {
      setTypingUserId(null);
    });

    return () => socketRef.current.disconnect();
  }, [token, currentUserId]);

  // room change
  useEffect(() => {
    if (!room || !token) return;

    setMessages([]);
    setTypingUserId(null);

    socketRef.current.emit("join_room", room);

    axios
      .get(`${BASE_URL}/api/messages/${room}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMessages(res.data);

        res.data.forEach((msg) => {
          if (msg.status !== "seen" && msg.sender?._id !== currentUserId) {
            socketRef.current.emit("message_seen", {
              messageId: msg._id,
            });
          }
        });
      });
  }, [room, token, currentUserId]);

  // send message
  const sendMessage = () => {
    if (!text.trim() || !room) return;

    socketRef.current.emit("send_message", { room, text });
    socketRef.current.emit("stop_typing", room);
    setText("");
  };

  // typing
  const handleTyping = (e) => {
    setText(e.target.value);

    if (!room) return;

    socketRef.current.emit("typing", room);

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stop_typing", room);
    }, 1000);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-black via-gray-900 to-purple-900 text-white">
      
      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <div className="w-1/4 bg-white/5 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col">
          
          <h2 className="text-xl font-semibold mb-4 text-purple-400">
            Chats
          </h2>

          <div className="flex-1 overflow-y-auto">

            <p className="text-xs text-gray-400 mb-2">Users</p>

            {users.map((user) => {
              const isOnline = onlineUsers.includes(user._id);
              const isActive = selectedUser?._id === user._id;

              return (
                <div
                  key={user._id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSelectedGroup(null);
                  }}
                  className={`flex justify-between px-4 py-3 rounded-xl mb-2 cursor-pointer ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "hover:bg-white/10"
                  }`}
                >
                  {user.username}
                  <span className={isOnline ? "text-green-500" : "text-gray-500"}>
                    ●
                  </span>
                </div>
              );
            })}

            <p className="text-xs text-gray-400 mt-6 mb-2">Groups</p>

            {groups.map((group) => {
              const isActive = selectedGroup?._id === group._id;

              return (
                <div
                  key={group._id}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedUser(null);
                  }}
                  className={`px-4 py-3 rounded-xl mb-2 cursor-pointer ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "hover:bg-white/10"
                  }`}
                >
                  {group.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex flex-col flex-1">

          {/* HEADER */}
          <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
            <h2 className="text-purple-300">
              {selectedUser?.username || selectedGroup?.name || "Select chat"}
            </h2>

            {typingUserId && (
              <span className="text-purple-400 text-sm">
                Typing...
              </span>
            )}
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {messages.map((m, i) => {
              const isMe = m.sender?._id === currentUserId;

              return (
                <div
                  key={i}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-sm px-4 py-2 rounded-2xl ${
                      isMe
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-white/10 text-gray-200 backdrop-blur-md rounded-bl-none"
                    }`}
                  >
                    {m.text}

                    <div className="text-[10px] opacity-60 text-right mt-1">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </div>

                    {isMe && (
                      <div className="text-xs text-right">
                        {m.status === "sent" && "✔"}
                        {m.status === "delivered" && "✔✔"}
                        {m.status === "seen" && "✔✔ 💜"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          {(selectedUser || selectedGroup) && (
            <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
              <input
                value={text}
                onChange={handleTyping}
                className="flex-1 px-4 py-2 rounded-full bg-black/40 border border-white/10 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Type message..."
              />

              <button
                onClick={sendMessage}
                className="bg-purple-500 hover:bg-purple-600 px-6 py-2 rounded-full"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}