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
  const [typingUsers, setTypingUsers] = useState([]);

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

  // keep room ref
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================
  // FETCH USERS
  // =========================
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

  // =========================
  // FETCH GROUPS
  // =========================
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${BASE_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setGroups(res.data));
  }, [token]);

  // =========================
  // SOCKET INIT
  // =========================
  useEffect(() => {
    if (!token) return;

    socketRef.current = createSocket(token);

    // receive message
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

    // message status
    socketRef.current.on("message_status", ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status } : m
        )
      );
    });

    // online users
    socketRef.current.on("online_users", setOnlineUsers);

    // typing
    socketRef.current.on("typing", ({ userId }) => {
      if (userId === currentUserId) return;

      setTypingUsers((prev) => {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      });
    });

    socketRef.current.on("stop_typing", ({ userId }) => {
      setTypingUsers((prev) =>
        prev.filter((id) => id !== userId)
      );
    });

    return () => socketRef.current.disconnect();
  }, [token, currentUserId]);

  // =========================
  // ROOM CHANGE
  // =========================
  useEffect(() => {
    if (!room || !token) return;

    setMessages([]);
    setTypingUsers([]);

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

  // typing handler
  const handleTyping = (e) => {
    setText(e.target.value);

    if (!room) return;

    socketRef.current.emit("typing", room);

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stop_typing", room);
    }, 1000);
  };

  // typing names
  const typingNames = users
    .filter((u) => typingUsers.includes(u._id))
    .map((u) => u.username);

  return (
    <div className="h-screen flex flex-col bg-black text-white">

      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <div className="w-1/4 bg-black/60 backdrop-blur-lg border-r border-gray-800 p-4">

          <h2 className="text-xl mb-4">Chats</h2>

          <div className="overflow-y-auto">

            <p className="text-xs text-gray-400 mb-2">Users</p>

            {users.map((user) => {
              const isOnline = onlineUsers.includes(user._id);

              return (
                <div
                  key={user._id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSelectedGroup(null);
                  }}
                  className={`flex justify-between items-center p-3 rounded-lg cursor-pointer mb-2 ${
                    selectedUser?._id === user._id
                      ? "bg-purple-600"
                      : "hover:bg-gray-800"
                  }`}
                >
                  <span>{user.username}</span>

                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOnline ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                </div>
              );
            })}

            <p className="text-xs text-gray-400 mt-4 mb-2">Groups</p>

            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => {
                  setSelectedGroup(group);
                  setSelectedUser(null);
                }}
                className={`p-3 rounded-lg cursor-pointer mb-2 ${
                  selectedGroup?._id === group._id
                    ? "bg-purple-600"
                    : "hover:bg-gray-800"
                }`}
              >
                {group.name}
              </div>
            ))}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex flex-col flex-1">

          {/* HEADER */}
          <div className="p-4 border-b border-gray-800 flex justify-between">
            <h2>
              {selectedUser?.username || selectedGroup?.name || "Select Chat"}
            </h2>

            {typingUsers.length > 0 && (
              <span className="text-purple-400 text-sm italic">
                {typingNames.length === 1
                  ? `${typingNames[0]} is typing...`
                  : `${typingNames.join(", ")} are typing...`}
              </span>
            )}
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => {
              const isMe = m.sender?._id === currentUserId;

              return (
                <div
                  key={i}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 rounded-xl ${
                      isMe
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    {m.text}

                    <div className="text-xs opacity-60 text-right">
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
            <div className="p-4 border-t border-gray-800 flex gap-2">
              <input
                value={text}
                onChange={handleTyping}
                className="flex-1 px-4 py-2 rounded-full bg-gray-800"
                placeholder="Type a message..."
              />

              <button
                onClick={sendMessage}
                className="bg-purple-600 px-4 rounded-full"
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