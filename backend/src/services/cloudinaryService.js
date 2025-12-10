const crypto = require("crypto");

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
const DEFAULT_FOLDER = process.env.CLOUDINARY_FOLDER || "agentbuy";

const hasSignedConfig = Boolean(CLOUD_NAME && API_KEY && API_SECRET);
const hasUnsignedConfig = Boolean(CLOUD_NAME && UPLOAD_PRESET);
const ENABLED = hasSignedConfig || hasUnsignedConfig;

const DATA_URI_REGEX = /^data:image\/[a-zA-Z]+;base64,/;

function shouldUpload(value) {
  return typeof value === "string" && DATA_URI_REGEX.test(value);
}

function signParams(params) {
  const sorted = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${sorted}${API_SECRET}`).digest("hex");
}

async function performUpload(file, options = {}) {
  if (!ENABLED) {
    console.warn("[Cloudinary] Cloudinary is not configured. Skipping upload.");
    return null; // Cloudinary тохируулагдаагүй бол null буцаана
  }
  const folder = options.folder || DEFAULT_FOLDER;
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const payload = new URLSearchParams();
  payload.append("file", file);
  if (folder) payload.append("folder", folder);

  if (hasUnsignedConfig && UPLOAD_PRESET) {
    payload.append("upload_preset", UPLOAD_PRESET);
  } else if (hasSignedConfig) {
    const timestamp = Math.round(Date.now() / 1000);
    payload.append("timestamp", timestamp);
    payload.append("api_key", API_KEY);
    const toSign = { timestamp };
    if (folder) toSign.folder = folder;
    payload.append("signature", signParams(toSign));
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      body: payload,
    });
    const bodyText = await response.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = { raw: bodyText };
    }
    if (!response.ok) {
      console.error("[Cloudinary] Upload failed - Status:", response.status);
      console.error("[Cloudinary] Response body:", bodyText);
      throw new Error(body?.error?.message || body?.raw || `Cloudinary upload failed (${response.status})`);
    }
    const cloudinaryUrl = body?.secure_url || body?.url;
    if (!cloudinaryUrl || (!cloudinaryUrl.startsWith("http://") && !cloudinaryUrl.startsWith("https://"))) {
      console.error("[Cloudinary] Invalid URL returned:", cloudinaryUrl);
      throw new Error("Cloudinary URL буруу формат");
    }
    return cloudinaryUrl;
  } catch (err) {
    console.error("[Cloudinary] performUpload error:", err.message);
    throw err;
  }
}

async function uploadImage(value, options = {}) {
  if (!shouldUpload(value)) {
    // Base64 биш, аль хэдийн URL эсвэл бусад format байвал буцаах
    return value;
  }
  if (!ENABLED) {
    console.warn("[Cloudinary] Cloudinary is not configured. Returning raw image payload.");
    return value;
  }
  try {
    console.log("[Cloudinary] Uploading image... (base64 length:", value.length, ")");
    const result = await performUpload(value, options);
    if (result && result.startsWith("http")) {
      console.log("[Cloudinary] ✅ Upload successful, URL:", result);
      return result;
    } else {
      console.error("[Cloudinary] ❌ Invalid URL returned:", result);
      throw new Error("Cloudinary URL буруу формат");
    }
  } catch (err) {
    console.error("[Cloudinary] ❌ Upload error:", err.message);
    // Алдаа гарвал base64 string буцаахгүй, алдаа throw хийх (эсвэл fallback хийх)
    throw err; // Алдааг throw хийх, тиймээс frontend дээр алдаа мэдэгдэх
  }
}

async function uploadImages(values = [], options = {}) {
  if (!Array.isArray(values) || !values.length) return values || [];
  const uploaded = await Promise.all(
    values.map(async (img) => {
      try {
        // Base64 эсвэл URL эсэхийг шалгах
        if (typeof img === "string" && !shouldUpload(img) && (img.startsWith("http://") || img.startsWith("https://"))) {
          // Аль хэдийн URL байвал буцаах
          return img;
        }
        // Base64 байвал Cloudinary-д upload хийх
        if (shouldUpload(img)) {
          return await uploadImage(img, options);
        }
        // Бусад тохиолдолд null буцаах
        return null;
      } catch (err) {
        console.error("[Cloudinary] Failed to upload image in batch:", err.message);
        // Алдаа гарвал null буцаах, base64 string хадгалахгүй
        return null;
      }
    })
  );
  // Null-уудыг шүүх, мөн base64 string-уудыг шүүх (зөвхөн URL үлдээх)
  return uploaded.filter((url) => url && typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://")));
}

async function normalizeItemImages(items = [], options = {}) {
  if (!Array.isArray(items)) return [];
  console.log("[Cloudinary] Normalizing", items.length, "items...");
  const result = await Promise.all(
    items.map(async (item) => {
      if (!item) return item;
      const next = { ...item };
      if (Array.isArray(item.images) && item.images.length) {
        console.log("[Cloudinary] Uploading", item.images.length, "images for item:", item.title);
        next.images = await uploadImages(item.images, options);
        console.log("[Cloudinary] ✅ Images uploaded:", next.images.length, "successful");
        // Base64 string байвал алдаа гарсан гэсэн үг, хоосон массив үлдээх
        if (next.images.length === 0 && item.images.length > 0) {
          console.warn("[Cloudinary] ⚠️ No images uploaded successfully for item:", item.title);
        }
      }
      if (typeof item.imageUrl === "string" && item.imageUrl) {
        // Аль хэдийн URL байвал өөрчлөхгүй
        if (item.imageUrl.startsWith("http://") || item.imageUrl.startsWith("https://")) {
          next.imageUrl = item.imageUrl;
        } else if (shouldUpload(item.imageUrl)) {
          // Base64 байвал upload хийх
          try {
            console.log("[Cloudinary] Uploading imageUrl for item:", item.title);
            next.imageUrl = await uploadImage(item.imageUrl, options);
            console.log("[Cloudinary] ✅ ImageUrl uploaded:", next.imageUrl);
          } catch (err) {
            console.error("[Cloudinary] ❌ Failed to upload imageUrl:", err.message);
            // Алдаа гарвал imageUrl-ийг устгах, base64 хадгалахгүй
            delete next.imageUrl;
          }
        }
      }
      return next;
    })
  );
  console.log("[Cloudinary] ✅ All items normalized");
  return result;
}

module.exports = {
  uploadImage,
  uploadImages,
  normalizeItemImages,
  isCloudinaryEnabled: () => ENABLED,
};
