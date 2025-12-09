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
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when messages change or chat opens
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isOpen]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (validFiles.length === 0) {
      alert("Зөвхөн зураг сонгох боломжтой");
      return;
    }

    const newImages = validFiles.slice(0, 5 - selectedImages.length); // Хамгийн ихдээ 5 зураг
    setSelectedImages([...selectedImages, ...newImages]);

    // Preview үүсгэх
    newImages.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!message.trim() && selectedImages.length === 0) || loading) return;

    // Зургуудыг base64 болгох
    const imageBase64s = await Promise.all(
      selectedImages.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      })
    );

    await onSend(orderId, message.trim(), imageBase64s);

    // Clear form
    setMessage("");
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const toggleImageZoom = (imageUrl) => {
    if (zoomedImage === imageUrl) {
      setZoomedImage(null);
    } else {
      setZoomedImage(imageUrl);
    }
  };

  const commentCount = comments.length;
  const otherRoleCount = comments.filter(
    (c) => c.senderRole !== currentRole
  ).length;

  return (
    <>
      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
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
                    {c.message && (
                      <p className="text-secondary whitespace-pre-wrap mb-1">{c.message}</p>
                    )}
                    {/* Attachments */}
                    {c.attachments && Array.isArray(c.attachments) && c.attachments.length > 0 && (
                      <div className={`flex flex-wrap gap-1 ${c.senderRole === currentRole ? "justify-end" : "justify-start"} mt-1`}>
                        {c.attachments.map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="relative group">
                            <img
                              src={imgUrl}
                              alt={`Attachment ${imgIdx + 1}`}
                              className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => toggleImageZoom(imgUrl)}
                            />
                            {zoomedImage === imgUrl && (
                              <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                                ⛶
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Мессеж бичих..."
                  rows={2}
                  className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 resize-none"
                  disabled={loading}
                />
                <div className="flex flex-col gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={loading || selectedImages.length >= 5}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || selectedImages.length >= 5}
                    className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={selectedImages.length >= 5 ? "Хамгийн ихдээ 5 зураг" : "Зураг нэмэх"}
                  >
                    📷
                  </button>
                  <Button
                    type="submit"
                    size="sm"
                    loading={loading}
                    disabled={(!message.trim() && selectedImages.length === 0)}
                  >
                    ➤
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
