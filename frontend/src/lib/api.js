export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * API хүсэлт илгээх утилит функц
 * @param {string} path - API path (жишээ: "/api/auth/login")
 * @param {object} options - Fetch options (method, body, headers гэх мэт)
 * @returns {Promise<any>} API хариу
 */
export async function api(path, options = {}) {
  // Client-side дээр байгаа эсэхийг шалгах
  const isClient = typeof window !== "undefined";
  
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch (err) {
      // ignore parse errors
    }
    
    // 401 алдаа гарвал (нэвтрээгүй), auth хуудас биш бол login руу чиглүүлэх
    if (res.status === 401 && isClient) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith("/auth/") || currentPath.startsWith("/admin/login");
      
      if (!isAuthPage) {
        // Auth хуудас биш бол login руу чиглүүлэх
        window.location.href = "/auth/login";
        // Redirect хийгдэх хүртэл wait хийхгүй
        throw new Error("Нэвтрэх шаардлагатай");
      }
    }
    
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}
