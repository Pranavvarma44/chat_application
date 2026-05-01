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

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // fetch users
  useEffect(() => {
    if (!token || !currentUserId) return;

    axios
      .get(`${BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) =>
        setUsers(res.data.filter((u) => u._id !== currentUserId))
      );
  }, [token, currentUserId]);

  // fetch groups
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${BASE_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setGroups(res.data));
  }, [token]);

  // socket
  useEffect(() => {
    if (!token) return;

    socketRef.current = createSocket(token);

    // RECEIVE MESSAGE
    socketRef.current.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);

      socketRef.current.emit("message_delivered", {
        messageId: msg._id,
        room: msg.room,
      });

      if (msg.room === room) {
        socketRef.current.emit("message_seen", {
          messageId: msg._id,
        });
      }

      // move group to top
      if (msg.room.startsWith("group_")) {
        const groupId = msg.room.replace("group_", "");

        setGroups((prev) => {
          const updated = [...prev];
          const index = updated.findIndex((g) => g._id === groupId);

          if (index !== -1) {
            const [group] = updated.splice(index, 1);
            return [group, ...updated];
          }

          return prev;
        });
      }
    });

    // ✅ MESSAGE STATUS FIX
    socketRef.current.on("message_status", ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status } : m
        )
      );
    });

    socketRef.current.on("online_users", setOnlineUsers);

    // TYPING
    socketRef.current.on("typing", ({ userId }) => {
      if (userId === currentUserId) return;

      setTypingUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    });

    socketRef.current.on("stop_typing", ({ userId }) => {
      setTypingUsers((prev) =>
        prev.filter((id) => id !== userId)
      );
    });

    return () => socketRef.current.disconnect();
  }, [token, currentUserId, room]);

  // room change
  useEffect(() => {
    if (!room || !token) return;

    setMessages([]);
    setTypingUsers([]);

    socketRef.current.emit("join_room", room);

    axios
      .get(`${BASE_URL}/api/messages/${room}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data));
  }, [room, token]);

  // send message
  const sendMessage = () => {
    if (!text.trim() || !room) return;

    socketRef.current.emit("send_message", { room, text });
    socketRef.current.emit("stop_typing", room);
    setText("");
  };

  const handleTyping = (e) => {
    setText(e.target.value);

    if (!room) return;

    socketRef.current.emit("typing", room);

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stop_typing", room);
    }, 1000);
  };

  // ✅ SHOW TYPING NAMES
  const typingNames = users
    .filter((u) => typingUsers.includes(u._id))
    .map((u) => u.username);

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">

      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <div className="w-1/4 bg-black/60 border-r border-gray-800 p-4 overflow-y-auto">

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
                className={`flex justify-between px-4 py-3 rounded-lg mb-2 cursor-pointer ${
                  isActive ? "bg-purple-600" : "hover:bg-gray-800"
                }`}
              >
                {user.username}
                <span className={isOnline ? "text-green-500" : "text-gray-500"}>
                  ●
                </span>
              </div>
            );
          })}

          <p className="text-xs text-gray-400 mt-4 mb-2">Groups</p>

          {groups.map((group) => {
            const isActive = selectedGroup?._id === group._id;

            return (
              <div
                key={group._id}
                onClick={() => {
                  setSelectedGroup(group);
                  setSelectedUser(null);
                }}
                className={`px-4 py-3 rounded-lg mb-2 cursor-pointer ${
                  isActive ? "bg-purple-600" : "hover:bg-gray-800"
                }`}
              >
                {group.name}
              </div>
            );
          })}
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
                <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
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
                className="flex-1 bg-gray-800 px-4 py-2 rounded"
                placeholder="Type a message..."
              />
              <button onClick={sendMessage} className="bg-purple-600 px-4 rounded">
                Send
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
