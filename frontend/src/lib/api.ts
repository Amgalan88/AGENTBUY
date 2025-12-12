import type { ApiRequestOptions } from '@/types/api';
import type { ApiError } from '@/types/common';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * API хүсэлт илгээх утилит функц
 * @param path - API path (жишээ: "/api/auth/login")
 * @param options - Fetch options (method, body, headers гэх мэт)
 * @returns API хариу
 */
export async function api<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T | null> {
  // Client-side дээр байгаа эсэхийг шалгах
  const isClient = typeof window !== "undefined";
  
  // DELETE method-д body байхгүй бол Content-Type header хэрэггүй
  const headers: Record<string, string> = { ...(options.headers || {}) };
  if (options.method !== "DELETE" || options.body) {
    headers["Content-Type"] = "application/json";
  }
  
  // Fetch options бэлтгэх
  const fetchOptions: RequestInit = {
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
  
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, fetchOptions);
  } catch (fetchError) {
    // Network error эсвэл fetch алдаа
    console.error("[API] Fetch error:", fetchError);
    const error = fetchError as Error;
    throw new Error(`Сүлжээний алдаа: ${error.message || "Холболт амжилтгүй"}`);
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
        const body = await res.json() as { message?: string };
        if (body?.message) message = body.message;
      }
    } catch (err) {
      // ignore parse errors
    }
    
    // 401 алдаа гарвал (нэвтрээгүй), auth хуудас биш бол login руу чиглүүлэх
    if (res.status === 401 && isClient) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith("/auth/") || currentPath.startsWith("/admin/login");
      
      if (isAuthPage) {
        // Auth хуудас дээр байгаа бол 401 алдаа хэвийн (нэвтэрээгүй хэрэглэгч)
        // Console дээр алдаа харагдахгүй байлгах - зөвхөн null буцаах
        return null;
      }
      
      // Auth хуудас биш бол login руу чиглүүлэх
      if (currentPath !== "/auth/login") {
        window.location.href = "/auth/login";
      }
      throw new Error("Нэвтрэх шаардлагатай");
    }
    
    const error: ApiError = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }

  // Response body байхгүй бол null буцаах
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null;
  }
  
  try {
    return await res.json() as T;
  } catch (parseError) {
    // JSON parse алдаа - ихэвчлэн 204 status-тай response-д гардаг
    console.warn("[API] JSON parse error (likely empty response):", parseError);
    return null;
  }
}

