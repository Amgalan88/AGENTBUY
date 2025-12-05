"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";

const formatTime = (date) =>
  date
    ? new Intl.DateTimeFormat("mn", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date))
    : "";

export default function OrderChat({
  orderId,
  comments = [],
  currentRole, // "user" or "agent"
  onSend,
  loading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change or chat opens
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    await onSend(orderId, message.trim());
    setMessage("");
  };

  const commentCount = comments.length;
  const otherRoleCount = comments.filter(
    (c) => c.senderRole !== currentRole
  ).length;

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 mt-3 pt-3">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-sm hover:opacity-80 transition-opacity py-1"
      >
        <span className="flex items-center gap-2">
          <span className="text-slate-400">💬</span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">Чат</span>
          {commentCount > 0 && (
            <span className="bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 px-2 py-0.5 rounded-full text-xs font-medium">
              {commentCount}
            </span>
          )}
          {otherRoleCount > 0 && (
            <span className="bg-indigo-500 text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
              +{otherRoleCount} шинэ
            </span>
          )}
        </span>
        <span className="text-slate-400 text-sm">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Chat Content */}
      {isOpen && (
        <div className="mt-2 space-y-2">
          {/* Messages */}
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-muted text-center py-2">
                Мессеж байхгүй
              </p>
            ) : (
              comments.map((c, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-2 text-xs ${
                    c.senderRole === currentRole
                      ? "bg-emerald-50 dark:bg-emerald-900/30 ml-4 text-right"
                      : "bg-blue-50 dark:bg-blue-900/30 mr-4"
                  }`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span
                      className={`font-medium ${
                        c.senderRole === "user"
                          ? "text-blue-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {c.senderRole === "user" ? "👤" : "💼"}
                    </span>
                    <span className="text-muted text-[10px]">
                      {formatTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-secondary">{c.message}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Мессеж бичих..."
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
              disabled={loading}
            />
            <Button
              type="submit"
              size="sm"
              loading={loading}
              disabled={!message.trim()}
            >
              ➤
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
