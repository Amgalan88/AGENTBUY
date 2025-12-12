"use client";

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import Button from "@/components/ui/Button";
import type { OrderComment } from "@/types/order";

interface OrderChatProps {
  orderId: string;
  comments?: OrderComment[];
  currentRole: "user" | "agent";
  onSend: (orderId: string, message: string, attachments?: string[]) => Promise<void>;
  loading?: boolean;
}

const formatTime = (date: string | Date | undefined): string => {
  if (!date) return "";
  return new Intl.DateTimeFormat("mn", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export default function OrderChat({
  orderId,
  comments = [],
  currentRole,
  onSend,
  loading = false,
}: OrderChatProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom only when new messages arrive (not when typing)
  const prevCommentsLengthRef = useRef<number>(comments.length);
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      // Зөвхөн шинэ мессеж нэмэгдсэн үед л scroll хийх
      if (comments.length > prevCommentsLengthRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
      prevCommentsLengthRef.current = comments.length;
    }
  }, [comments.length, isOpen]);

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
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
        if (reader.result && typeof reader.result === "string") {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number): void => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if ((!message.trim() && selectedImages.length === 0) || loading) return;

    // Preview-ийн base64-г ашиглах (давхардсан conversion-г зайлсхийх)
    const imageBase64s: string[] = [];
    if (selectedImages.length > 0) {
      // Preview аль хэдийн байвал тэр утгыг ашиглах, үгүй бол шинээр convert хийх
      if (imagePreviews.length === selectedImages.length) {
        imageBase64s.push(...imagePreviews);
      } else {
        // Preview байхгүй бол convert хийх
        const converted = await Promise.all(
          selectedImages.map((file) => {
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (reader.result && typeof reader.result === "string") {
                  resolve(reader.result);
                } else {
                  resolve("");
                }
              };
              reader.readAsDataURL(file);
            });
          })
        );
        imageBase64s.push(...converted.filter(Boolean));
      }
    }

    try {
      await onSend(orderId, message.trim() || "", imageBase64s);
      
      // Clear form
      setMessage("");
      setSelectedImages([]);
      setImagePreviews([]);
      
      // Шинэ мессеж илгээсний дараа scroll хийх
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const toggleImageZoom = (imageUrl: string): void => {
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
            onError={(e) => {
              console.error("Zoomed image load error:", zoomedImage);
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EЗураг ачаалахгүй байна%3C/text%3E%3C/svg%3E";
            }}
            {...(zoomedImage.includes("cloudinary.com") && !zoomedImage.startsWith("data:") ? { crossOrigin: "anonymous" } : {})}
          />
        </div>
      )}

      <div className="border-t border-surface-card-border mt-3 pt-3">
        {/* Toggle Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-sm hover:opacity-80 transition-opacity py-1"
        >
          <span className="flex items-center gap-2">
            <span className="text-muted">💬</span>
            <span className="text-secondary font-medium">Чат</span>
            {commentCount > 0 && (
              <span className="bg-surface-muted text-secondary px-2 py-0.5 rounded-full text-xs font-medium">
                {commentCount}
              </span>
            )}
            {otherRoleCount > 0 && (
              <span className="bg-accent-primary text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
                +{otherRoleCount} шинэ
              </span>
            )}
          </span>
          <span className="text-muted text-sm">{isOpen ? "▲" : "▼"}</span>
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
                        ? "bg-accent-primary/10 ml-4 text-right"
                        : "bg-surface-muted mr-4"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <span
                        className={`font-medium ${
                          c.senderRole === "user"
                            ? "text-accent-primary"
                            : "text-accent-secondary"
                        }`}
                      >
                        {c.senderRole === "user" ? "👤" : "💼"}
                      </span>
                      <span className="text-muted text-[10px]">
                        {formatTime(c.createdAt)}
                      </span>
                    </div>
                    {c.message && (
                      <p className="text-primary whitespace-pre-wrap mb-1">{c.message}</p>
                    )}
                    {/* Attachments */}
                    {c.attachments && Array.isArray(c.attachments) && c.attachments.length > 0 && (
                      <div className={`flex flex-wrap gap-1 ${c.senderRole === currentRole ? "justify-end" : "justify-start"} mt-1`}>
                        {c.attachments
                          .filter((imgUrl) => {
                            if (!imgUrl || typeof imgUrl !== "string" || imgUrl.trim() === "") {
                              console.warn("Invalid attachment URL:", imgUrl);
                              return false;
                            }
                            return true;
                          })
                          .map((imgUrl, imgIdx) => {
                            // Debug: Log attachment URLs in development
                            if (process.env.NODE_ENV === "development") {
                              console.log("Displaying attachment:", imgUrl.substring(0, 50) + "...");
                            }
                            // Check if URL is base64 or external (Cloudinary)
                            const isBase64 = imgUrl.startsWith("data:image");
                            const isCloudinary = imgUrl.includes("cloudinary.com") || imgUrl.includes("res.cloudinary.com");
                            
                            return (
                            <div key={imgIdx} className="relative group">
                              <img
                                src={imgUrl}
                                alt={`Attachment ${imgIdx + 1}`}
                                className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-surface-card-border"
                                onClick={() => toggleImageZoom(imgUrl)}
                                onError={(e) => {
                                  console.error("Image load error:", imgUrl);
                                  e.currentTarget.style.display = "none";
                                }}
                                loading="lazy"
                                {...(isCloudinary && !isBase64 ? { crossOrigin: "anonymous" } : {})}
                              />
                              {zoomedImage === imgUrl && (
                                <span className="absolute -top-1 -right-1 bg-accent-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                                  ⛶
                                </span>
                              )}
                            </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-surface-muted rounded-lg">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-surface-card-border"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 bg-accent-danger text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:opacity-90"
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
                  className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-surface-card-border bg-surface-card text-primary resize-none"
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
                    className="px-2 py-1.5 rounded-lg border border-surface-card-border bg-surface-card hover:bg-surface-muted text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

