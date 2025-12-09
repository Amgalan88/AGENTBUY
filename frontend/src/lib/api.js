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
  
  // DELETE method-д body байхгүй бол Content-Type header хэрэггүй
  const headers = { ...(options.headers || {}) };
  if (options.method !== "DELETE" || options.body) {
    headers["Content-Type"] = "application/json";
  }
  
  // Fetch options бэлтгэх
  const fetchOptions = {
    headers,
    credentials: "include",
    method: options.method || "GET",
  };
  
  // Body зөвхөн байгаа бол нэмэх
  if (options.body !== undefined && options.body !== null) {
    if (typeof options.body === "string") {
      fetchOptions.body = options.body;
    } else {
      fetchOptions.body = JSON.stringify(options.body);
    }
  }
  
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, fetchOptions);
  } catch (fetchError) {
    // Network error эсвэл fetch алдаа
    console.error("[API] Fetch error:", fetchError);
    throw new Error(`Сүлжээний алдаа: ${fetchError.message || "Холболт амжилтгүй"}`);
  }

  // 204 No Content - амжилттай, body байхгүй
  if (res.status === 204) {
    return null;
  }

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      // Response body байгаа эсэхийг шалгах
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
      const body = await res.json();
      if (body?.message) message = body.message;
      }
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

  // Response body байхгүй бол null буцаах
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null;
  }
  
  try {
    return await res.json();
  } catch (parseError) {
    // JSON parse алдаа - ихэвчлэн 204 status-тай response-д гардаг
    console.warn("[API] JSON parse error (likely empty response):", parseError);
    return null;
  }
}
