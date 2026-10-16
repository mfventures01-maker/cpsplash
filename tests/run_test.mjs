var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/types/database.types.ts
var CP_SPLASH_TENANT_ID;
var init_database_types = __esm({
  "src/types/database.types.ts"() {
    CP_SPLASH_TENANT_ID = "42d36cee-4cd6-43d1-af5d-334e5a07e37c";
  }
});

// src/lib/supabase.ts
var supabase_exports = {};
__export(supabase_exports, {
  TENANT_ID: () => TENANT_ID,
  checkSupabaseConnection: () => checkSupabaseConnection,
  getLiveSupabase: () => getLiveSupabase,
  getStoredConfig: () => getStoredConfig,
  notifySyncEvent: () => notifySyncEvent,
  saveStoredConfig: () => saveStoredConfig,
  subscribeToSync: () => subscribeToSync,
  supabase: () => supabase
});
import { createClient } from "@supabase/supabase-js";
function getLiveSupabase() {
  return supabase;
}
function getStoredConfig() {
  return {
    url: ENV_SUPABASE_URL,
    anonKey: ENV_SUPABASE_ANON_KEY
  };
}
function saveStoredConfig(_url, _anonKey) {
  notifySyncEvent("config_updated", { url: ENV_SUPABASE_URL });
}
function subscribeToSync(listener) {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}
function notifySyncEvent(table, payload, action = "UPDATE") {
  syncListeners.forEach((listener) => {
    try {
      listener({ table, action, payload });
    } catch (e) {
      console.error("Error in sync listener:", e);
    }
  });
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel("cp_splash_sync");
      bc.postMessage({ table, action, payload, timestamp: Date.now() });
      bc.close();
    }
  } catch {
  }
}
async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from("products").select("id").limit(1);
    if (error) {
      return {
        url: ENV_SUPABASE_URL,
        anonKey: ENV_SUPABASE_ANON_KEY,
        isLive: false,
        status: "disconnected",
        error: error.message
      };
    }
    return {
      url: ENV_SUPABASE_URL,
      anonKey: ENV_SUPABASE_ANON_KEY,
      isLive: true,
      status: "connected",
      error: null
    };
  } catch (err) {
    return {
      url: ENV_SUPABASE_URL,
      anonKey: ENV_SUPABASE_ANON_KEY,
      isLive: false,
      status: "disconnected",
      error: err instanceof Error ? err.message : "Unknown connection error"
    };
  }
}
var getEnvVar, ENV_SUPABASE_URL, ENV_SUPABASE_ANON_KEY, TENANT_ID, supabase, syncListeners;
var init_supabase = __esm({
  "src/lib/supabase.ts"() {
    init_database_types();
    getEnvVar = (key) => {
      if (typeof import.meta !== "undefined" && process.env?.[key]) {
        return String(process.env[key]);
      }
      if (typeof process !== "undefined" && process?.env?.[key]) {
        return String(process.env[key]);
      }
      return "";
    };
    ENV_SUPABASE_URL = getEnvVar("VITE_SUPABASE_URL").trim();
    ENV_SUPABASE_ANON_KEY = getEnvVar("VITE_SUPABASE_ANON_KEY").trim();
    TENANT_ID = (getEnvVar("VITE_CP_SPLASH_TENANT_ID") || CP_SPLASH_TENANT_ID).trim();
    if (!ENV_SUPABASE_URL || !ENV_SUPABASE_ANON_KEY) {
      console.warn("[HOEOS CONFIG] Supabase environment variables missing or incomplete. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment.");
    }
    supabase = createClient(ENV_SUPABASE_URL, ENV_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    syncListeners = /* @__PURE__ */ new Set();
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const rxBc = new BroadcastChannel("cp_splash_sync");
        rxBc.onmessage = (ev) => {
          if (ev.data && ev.data.table) {
            syncListeners.forEach((listener) => {
              try {
                listener({ table: ev.data.table, action: ev.data.action, payload: ev.data.payload });
              } catch (e) {
                console.error("Error in rx sync listener:", e);
              }
            });
          }
        };
      } catch {
      }
    }
  }
});

// src/services/mediaService.ts
var mediaService_exports = {};
__export(mediaService_exports, {
  ALLOWED_MIMES: () => ALLOWED_MIMES,
  BUCKET_NAME: () => BUCKET_NAME,
  CANONICAL_MIME_BY_EXT: () => CANONICAL_MIME_BY_EXT,
  EXT_BY_MIME: () => EXT_BY_MIME,
  MAX_FILE_SIZE_BYTES: () => MAX_FILE_SIZE_BYTES,
  isValidUuid: () => isValidUuid,
  mediaService: () => mediaService,
  validateAndClassifyMedia: () => validateAndClassifyMedia
});
function isValidUuid(id) {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}
function validateAndClassifyMedia(file, _declaredCategory) {
  if (!file || typeof file !== "object") {
    return { isValid: false, error: "No file provided" };
  }
  const size = typeof file.size === "number" ? file.size : 0;
  if (size <= 0) {
    return { isValid: false, error: "File is empty (0 bytes)" };
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, error: `File size exceeds bucket limit of 30 MB (${size} bytes)` };
  }
  const rawFileName = file instanceof File || "name" in file && typeof file.name === "string" ? file.name.trim() : "";
  const declaredMime = typeof file.type === "string" ? file.type.trim().toLowerCase() : "";
  let finalMime = "";
  let finalExt = "";
  if (rawFileName) {
    const parts = rawFileName.split(".");
    const ext = parts.length > 1 ? parts.pop().toLowerCase().trim() : "";
    if (!ext) {
      if (!declaredMime) {
        return { isValid: false, error: "File has no extension and no MIME type" };
      }
      if (!ALLOWED_MIMES.has(declaredMime)) {
        return { isValid: false, error: `Unsupported MIME type: ${declaredMime}` };
      }
      finalMime = declaredMime;
      finalExt = EXT_BY_MIME[declaredMime];
    } else {
      const canonicalMime = CANONICAL_MIME_BY_EXT[ext];
      if (!canonicalMime) {
        return {
          isValid: false,
          error: `Unsupported file extension .${ext}. Allowed: .jpg, .jpeg, .png, .webp, .gif, .mp4, .webm`
        };
      }
      if (declaredMime && declaredMime !== canonicalMime) {
        const isJpegMatch = (ext === "jpg" || ext === "jpeg") && declaredMime === "image/jpeg";
        if (!isJpegMatch) {
          return {
            isValid: false,
            error: `Contradictory file extension (.${ext}) and declared MIME type (${declaredMime})`
          };
        }
      }
      finalMime = canonicalMime;
      finalExt = ext;
    }
  } else {
    if (!declaredMime) {
      return { isValid: false, error: "MIME type is required for Blob uploads without a filename" };
    }
    if (!ALLOWED_MIMES.has(declaredMime)) {
      return { isValid: false, error: `Unsupported MIME type: ${declaredMime}` };
    }
    finalMime = declaredMime;
    finalExt = EXT_BY_MIME[declaredMime];
  }
  const cleanFileName = rawFileName ? rawFileName.replace(/[^a-zA-Z0-9._-]/g, "_") : `upload.${finalExt}`;
  let mediaType = "image";
  let editorCategory = "image";
  if (finalMime.startsWith("video/")) {
    mediaType = "video";
    editorCategory = "video";
  } else if (finalMime === "image/gif") {
    mediaType = "image";
    editorCategory = "animation";
  } else {
    mediaType = "image";
    editorCategory = "image";
  }
  return {
    isValid: true,
    mimeType: finalMime,
    mediaType,
    editorCategory,
    extension: finalExt,
    cleanFileName,
    sizeBytes: size
  };
}
async function safeCleanupUnreferencedAsset(assetId, storagePath) {
  try {
    const { data: refs, error: refErr } = await supabase.from("product_media").select("product_id").eq("media_id", assetId);
    if (refErr || !Array.isArray(refs)) {
      console.error(
        "[HOEOS RECOVERY] Reference status unknown; preserving asset and Storage object.",
        refErr ?? "Invalid reference query result"
      );
      return false;
    }
    if (refs.length > 0) {
      console.warn(
        "[HOEOS RECOVERY] Asset is referenced; preserving asset and Storage object.",
        { assetId, referenceCount: refs.length }
      );
      return false;
    }
    const { data: deletedRows, error: deleteErr } = await supabase.from("media_assets").delete().eq("id", assetId).select("id");
    if (deleteErr) {
      console.error(
        "[HOEOS RECOVERY] Asset-row deletion failed; preserving Storage object.",
        deleteErr
      );
      return false;
    }
    if (!Array.isArray(deletedRows) || deletedRows.length !== 1 || deletedRows[0]?.id !== assetId) {
      console.error(
        "[HOEOS RECOVERY] Asset-row deletion was not confirmed; preserving Storage object.",
        { assetId, deletedRows }
      );
      return false;
    }
    const { data: removedObjects, error: storageErr } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    if (storageErr || !Array.isArray(removedObjects) || removedObjects.length !== 1) {
      console.error(
        "[HOEOS RECOVERY] Asset row deleted, but Storage removal was not confirmed.",
        { assetId, storagePath, storageErr, removedObjects }
      );
      return false;
    }
    return true;
  } catch (cleanupErr) {
    console.error(
      "[HOEOS RECOVERY] Cleanup state is uncertain; stopping further destructive actions.",
      cleanupErr
    );
    return false;
  }
}
var BUCKET_NAME, MAX_FILE_SIZE_BYTES, CANONICAL_MIME_BY_EXT, EXT_BY_MIME, ALLOWED_MIMES, UUID_REGEX, getErrMsg, mediaService;
var init_mediaService = __esm({
  "src/services/mediaService.ts"() {
    init_supabase();
    BUCKET_NAME = "cp-public";
    MAX_FILE_SIZE_BYTES = 31457280;
    CANONICAL_MIME_BY_EXT = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      mp4: "video/mp4",
      webm: "video/webm"
    };
    EXT_BY_MIME = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "video/mp4": "mp4",
      "video/webm": "webm"
    };
    ALLOWED_MIMES = /* @__PURE__ */ new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm"
    ]);
    UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    getErrMsg = (err, fallback) => {
      if (err && typeof err === "object" && "message" in err) {
        return String(err.message);
      }
      return err ? String(err) : fallback;
    };
    mediaService = {
      /**
      
         * Upload file to Supabase Storage (cp-public) and link via media_assets & product_media
      
         */
      async uploadMedia(productId, file, mediaType = "image", altText = "", isPrimary = false) {
        try {
          if (!isValidUuid(productId)) {
            return { data: null, error: "Invalid product ID: must be a valid UUID" };
          }
          const validation = validateAndClassifyMedia(file, mediaType);
          if (!validation.isValid || !validation.mimeType || !validation.mediaType || !validation.cleanFileName) {
            return { data: null, error: validation.error || "Invalid media file" };
          }
          const { data: product, error: productErr } = await supabase.from("products").select("id, tenant_id").eq("id", productId).single();
          if (productErr || !product) {
            return {
              data: null,
              error: productErr ? getErrMsg(productErr, "Product lookup failed or access denied") : "Product not found"
            };
          }
          if (product.tenant_id !== TENANT_ID) {
            return {
              data: null,
              error: `Product belongs to tenant ${product.tenant_id}, not current tenant ${TENANT_ID}`
            };
          }
          const cleanFileName = validation.cleanFileName;
          const timestamp = Date.now();
          const nonce = Math.random().toString(36).substring(2, 8);
          const storagePath = `products/${productId}/${timestamp}_${nonce}_${cleanFileName}`;
          const contentType = validation.mimeType;
          const { data: storageData, error: uploadErr } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, file, {
            contentType,
            upsert: true
          });
          if (uploadErr || !storageData) {
            return { data: null, error: uploadErr ? getErrMsg(uploadErr, "Storage upload failed") : "Storage upload failed" };
          }
          const assetRecord = {
            tenant_id: TENANT_ID,
            bucket: BUCKET_NAME,
            path: storagePath,
            media_type: validation.mediaType,
            mime_type: contentType,
            filename: cleanFileName,
            size_bytes: validation.sizeBytes || file.size || 0,
            alt_text: altText || cleanFileName,
            status: "active"
          };
          const { data: assetCreated, error: assetErr } = await supabase.from("media_assets").insert(assetRecord).select("*").single();
          if (assetErr || !assetCreated) {
            console.error(
              "[HOEOS RECOVERY] Asset insert was not confirmed; preserving Storage object for reconciliation.",
              { storagePath, assetErr: assetErr ?? null }
            );
            return {
              data: null,
              error: assetErr ? getErrMsg(assetErr, "Failed to create media asset record; uploaded object preserved for reconciliation") : "Failed to create media asset; uploaded object preserved for reconciliation"
            };
          }
          const mediaAsset = assetCreated;
          const { data: existingMedia, error: sortErr } = await supabase.from("product_media").select("sort_order").eq("product_id", productId).order("sort_order", { ascending: false });
          if (sortErr) {
            await safeCleanupUnreferencedAsset(mediaAsset.id, storagePath);
            return {
              data: null,
              error: getErrMsg(sortErr, "Failed to query existing product media sort order")
            };
          }
          const mediaArr = Array.isArray(existingMedia) ? existingMedia : [];
          const nextOrder = mediaArr.length > 0 ? Number(mediaArr[0].sort_order || 0) + 1 : 1;
          if (isPrimary) {
            const { error: clearPrimaryErr } = await supabase.from("product_media").update({ is_primary: false }).eq("product_id", productId);
            if (clearPrimaryErr) {
              await safeCleanupUnreferencedAsset(mediaAsset.id, storagePath);
              return {
                data: null,
                error: getErrMsg(clearPrimaryErr, "Failed to update existing primary media")
              };
            }
          }
          const productMediaRecord = {
            product_id: productId,
            media_id: mediaAsset.id,
            sort_order: nextOrder,
            is_primary: isPrimary
          };
          const { data: linkCreated, error: linkErr } = await supabase.from("product_media").insert(productMediaRecord).select("*, media_assets(*)").single();
          if (linkErr || !linkCreated) {
            await safeCleanupUnreferencedAsset(mediaAsset.id, storagePath);
            return {
              data: null,
              error: linkErr ? getErrMsg(linkErr, "Failed to link product media") : "Failed to link media"
            };
          }
          notifySyncEvent("product_media", { productId, mediaId: mediaAsset.id }, "INSERT");
          return { data: linkCreated, error: null };
        } catch (err) {
          console.error("Exception in uploadMedia:", err);
          return { data: null, error: err instanceof Error ? err.message : "Media upload error" };
        }
      },
      /**
      
         * Reorder media assets for a product
      
         */
      async reorderMedia(productId, orderedMediaIds) {
        try {
          if (!isValidUuid(productId)) {
            return { success: false, error: "Invalid product ID: must be a valid UUID" };
          }
          for (let i = 0; i < orderedMediaIds.length; i++) {
            const { error } = await supabase.from("product_media").update({ sort_order: i + 1 }).eq("product_id", productId).eq("media_id", orderedMediaIds[i]);
            if (error) {
              return { success: false, error: getErrMsg(error, "Reorder media error") };
            }
          }
          notifySyncEvent("product_media", { productId }, "UPDATE");
          return { success: true, error: null };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : "Reorder media error" };
        }
      },
      /**
      
         * Delete media link
      
         */
      async deleteMedia(productId, mediaId) {
        try {
          if (!isValidUuid(productId)) {
            return { success: false, error: "Invalid product ID: must be a valid UUID" };
          }
          const { error } = await supabase.from("product_media").delete().eq("product_id", productId).eq("media_id", mediaId);
          if (error) {
            return { success: false, error: getErrMsg(error, "Delete media error") };
          }
          notifySyncEvent("product_media", { productId, mediaId }, "DELETE");
          return { success: true, error: null };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : "Delete media error" };
        }
      },
      /**
      
         * Set primary media for a product
      
         */
      async setPrimaryMedia(productId, mediaId) {
        try {
          if (!isValidUuid(productId)) {
            return { success: false, error: "Invalid product ID: must be a valid UUID" };
          }
          const { error: clearErr } = await supabase.from("product_media").update({ is_primary: false }).eq("product_id", productId);
          if (clearErr) {
            return { success: false, error: getErrMsg(clearErr, "Failed to clear primary media") };
          }
          const { error } = await supabase.from("product_media").update({ is_primary: true }).eq("product_id", productId).eq("media_id", mediaId);
          if (error) {
            return { success: false, error: getErrMsg(error, "Failed to set primary media") };
          }
          notifySyncEvent("product_media", { productId, mediaId }, "UPDATE");
          return { success: true, error: null };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : "Failed to set primary" };
        }
      },
      /**
      
         * Get all media for a product
      
         */
      async getProductMedia(productId) {
        try {
          if (!isValidUuid(productId)) {
            return [];
          }
          const { data, error } = await supabase.from("product_media").select("*, media_assets(*)").eq("product_id", productId).order("sort_order", { ascending: true });
          if (error || !data) {
            return [];
          }
          return data;
        } catch {
          return [];
        }
      },
      /**
      
         * Get public URL directly from path
      
         */
      getPublicUrl(path, bucket = BUCKET_NAME) {
        if (!path) return "";
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
      },
      /**
      
         * Get public URL for a media asset
      
         */
      getMediaAssetUrl(asset) {
        if (!asset) return "";
        if (asset.public_url) return asset.public_url;
        if (asset.bucket && asset.path) {
          const { data } = supabase.storage.from(asset.bucket).getPublicUrl(asset.path);
          return data.publicUrl;
        }
        return "";
      }
    };
  }
});

// tests/media_service_contract.test.ts
import assert from "node:assert/strict";
import fs from "node:fs";
var envContent = fs.readFileSync("C:/Projects/cp-splash/.env", "utf-8");
var envVars = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    envVars[match[1]] = val.trim();
  }
});
Object.assign(process.env, envVars);
process.env = {
  VITE_SUPABASE_URL: envVars.VITE_SUPABASE_URL || "https://efvvczmopacoroudzfnl.supabase.co",
  VITE_SUPABASE_ANON_KEY: envVars.VITE_SUPABASE_ANON_KEY || "",
  VITE_CP_SPLASH_TENANT_ID: envVars.VITE_CP_SPLASH_TENANT_ID || "42d36cee-4cd6-43d1-af5d-334e5a07e37c"
};
var {
  mediaService: mediaService2,
  validateAndClassifyMedia: validateAndClassifyMedia2,
  isValidUuid: isValidUuid2,
  BUCKET_NAME: BUCKET_NAME2,
  MAX_FILE_SIZE_BYTES: MAX_FILE_SIZE_BYTES2
} = await Promise.resolve().then(() => (init_mediaService(), mediaService_exports));
var { supabase: supabase2, TENANT_ID: TENANT_ID2 } = await Promise.resolve().then(() => (init_supabase(), supabase_exports));
var MockFile = class {
  constructor(name, size, type) {
    this.name = name;
    this.size = size;
    this.type = type;
  }
};
var MockBlob = class {
  constructor(size, type) {
    this.size = size;
    this.type = type;
  }
};
console.log("======================================================================");
console.log("HOEOS TEST SUITE: MEDIA CONTRACT, UPLOAD INTEGRITY & FAILURE RECOVERY");
console.log("======================================================================\n");
var totalTests = 0;
var passedTests = 0;
function runTest(name, fn) {
  totalTests++;
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.then(
        () => {
          passedTests++;
          console.log(`  [PASS] ${name}`);
        },
        (err) => {
          console.error(`  [FAIL] ${name}:`, err.message);
          throw err;
        }
      );
    } else {
      passedTests++;
      console.log(`  [PASS] ${name}`);
    }
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err instanceof Error ? err.message : err);
    throw err;
  }
}
console.log("--- SECTION A: PURE CLASSIFICATION TESTS ---");
runTest("Format 1: JPEG (.jpg, .jpeg)", () => {
  const file1 = new MockFile("bottle.jpg", 1024, "image/jpeg");
  const res1 = validateAndClassifyMedia2(file1);
  assert.equal(res1.isValid, true);
  assert.equal(res1.mimeType, "image/jpeg");
  assert.equal(res1.mediaType, "image");
  assert.equal(res1.editorCategory, "image");
  const file2 = new MockFile("bottle.jpeg", 1024, "image/jpeg");
  const res2 = validateAndClassifyMedia2(file2);
  assert.equal(res2.isValid, true);
  assert.equal(res2.mimeType, "image/jpeg");
  assert.equal(res2.mediaType, "image");
});
runTest("Format 2: PNG (.png)", () => {
  const file = new MockFile("splash.png", 2048, "image/png");
  const res = validateAndClassifyMedia2(file);
  assert.equal(res.isValid, true);
  assert.equal(res.mimeType, "image/png");
  assert.equal(res.mediaType, "image");
  assert.equal(res.editorCategory, "image");
});
runTest("Format 3: WebP (.webp)", () => {
  const file = new MockFile("hero.webp", 1500, "image/webp");
  const res = validateAndClassifyMedia2(file);
  assert.equal(res.isValid, true);
  assert.equal(res.mimeType, "image/webp");
  assert.equal(res.mediaType, "image");
  assert.equal(res.editorCategory, "image");
});
runTest("Format 4: GIF (.gif) preserves image media_type while classifying as animation", () => {
  const file = new MockFile("orbit.gif", 3e3, "image/gif");
  const res = validateAndClassifyMedia2(file);
  assert.equal(res.isValid, true);
  assert.equal(res.mimeType, "image/gif");
  assert.equal(res.mediaType, "image", "GIF must be stored as image so HTML <img> renders it");
  assert.equal(res.editorCategory, "animation", "GIF editor category must be animation");
});
runTest("Format 5: MP4 (.mp4)", () => {
  const file = new MockFile("flow.mp4", 5e3, "video/mp4");
  const res = validateAndClassifyMedia2(file);
  assert.equal(res.isValid, true);
  assert.equal(res.mimeType, "video/mp4");
  assert.equal(res.mediaType, "video");
  assert.equal(res.editorCategory, "video");
});
runTest("Format 6: WebM (.webm)", () => {
  const file = new MockFile("pour.webm", 4500, "video/webm");
  const res = validateAndClassifyMedia2(file);
  assert.equal(res.isValid, true);
  assert.equal(res.mimeType, "video/webm");
  assert.equal(res.mediaType, "video");
  assert.equal(res.editorCategory, "video");
});
runTest("Uppercase extensions (.JPG, .PNG, .MP4)", () => {
  const f1 = new MockFile("HERO.JPG", 1e3, "image/jpeg");
  const r1 = validateAndClassifyMedia2(f1);
  assert.equal(r1.isValid, true);
  assert.equal(r1.mimeType, "image/jpeg");
  const f2 = new MockFile("ANIMATION.GIF", 1e3, "image/gif");
  const r2 = validateAndClassifyMedia2(f2);
  assert.equal(r2.isValid, true);
  assert.equal(r2.mimeType, "image/gif");
  const f3 = new MockFile("LOOP.MP4", 1e3, "video/mp4");
  const r3 = validateAndClassifyMedia2(f3);
  assert.equal(r3.isValid, true);
  assert.equal(r3.mediaType, "video");
});
runTest("Missing MIME type on File infers canonical MIME from supported extension", () => {
  const f1 = new MockFile("product_photo.jpg", 1e3, "");
  const r1 = validateAndClassifyMedia2(f1);
  assert.equal(r1.isValid, true);
  assert.equal(r1.mimeType, "image/jpeg");
  const f2 = new MockFile("animation.gif", 1e3, "");
  const r2 = validateAndClassifyMedia2(f2);
  assert.equal(r2.isValid, true);
  assert.equal(r2.mimeType, "image/gif");
});
runTest("Contradictory extension and MIME type is rejected", () => {
  const f1 = new MockFile("spoof.png", 1e3, "image/jpeg");
  const r1 = validateAndClassifyMedia2(f1);
  assert.equal(r1.isValid, false);
  assert.match(r1.error || "", /Contradictory/i);
  const f2 = new MockFile("bad.gif", 1e3, "video/mp4");
  const r2 = validateAndClassifyMedia2(f2);
  assert.equal(r2.isValid, false);
  assert.match(r2.error || "", /Contradictory/i);
});
runTest("Unsupported file extensions and MIME types are rejected", () => {
  const f1 = new MockFile("malicious.exe", 1e3, "application/x-msdownload");
  const r1 = validateAndClassifyMedia2(f1);
  assert.equal(r1.isValid, false);
  assert.match(r1.error || "", /Unsupported/i);
  const f2 = new MockFile("vector.svg", 1e3, "image/svg+xml");
  const r2 = validateAndClassifyMedia2(f2);
  assert.equal(r2.isValid, false);
  assert.match(r2.error || "", /Unsupported/i);
});
runTest("Empty files (0 bytes) are rejected", () => {
  const f1 = new MockFile("empty.jpg", 0, "image/jpeg");
  const r1 = validateAndClassifyMedia2(f1);
  assert.equal(r1.isValid, false);
  assert.match(r1.error || "", /empty/i);
});
runTest("File size boundary checks (below, at, and above 30 MB)", () => {
  const justBelow = new MockFile("big.mp4", MAX_FILE_SIZE_BYTES2 - 1, "video/mp4");
  const r1 = validateAndClassifyMedia2(justBelow);
  assert.equal(r1.isValid, true);
  const exactlyAt = new MockFile("exact.mp4", MAX_FILE_SIZE_BYTES2, "video/mp4");
  const r2 = validateAndClassifyMedia2(exactlyAt);
  assert.equal(r2.isValid, true);
  const justAbove = new MockFile("too_big.mp4", MAX_FILE_SIZE_BYTES2 + 1, "video/mp4");
  const r3 = validateAndClassifyMedia2(justAbove);
  assert.equal(r3.isValid, false);
  assert.match(r3.error || "", /exceeds bucket limit/i);
});
runTest("Blob inputs with explicit supported MIME types are handled cleanly", () => {
  const blobJpg = new MockBlob(500, "image/jpeg");
  const r1 = validateAndClassifyMedia2(blobJpg);
  assert.equal(r1.isValid, true);
  assert.equal(r1.mimeType, "image/jpeg");
  assert.equal(r1.cleanFileName, "upload.jpg");
  const blobGif = new MockBlob(800, "image/gif");
  const r2 = validateAndClassifyMedia2(blobGif);
  assert.equal(r2.isValid, true);
  assert.equal(r2.editorCategory, "animation");
  assert.equal(r2.mediaType, "image");
  const blobEmptyMime = new MockBlob(500, "");
  const r3 = validateAndClassifyMedia2(blobEmptyMime);
  assert.equal(r3.isValid, false);
  assert.match(r3.error || "", /MIME type is required/i);
});
runTest("UUID syntax validation helper", () => {
  assert.equal(isValidUuid2("d3b07384-d113-4045-812e-1317e0892095"), true);
  assert.equal(isValidUuid2("not-a-uuid"), false);
  assert.equal(isValidUuid2(""), false);
  assert.equal(isValidUuid2("12345"), false);
});
console.log("\n--- SECTION B: UPLOAD METADATA TESTS ---");
var VALID_PRODUCT_ID = "11111111-2222-3333-4444-555555555555";
function createSupabaseMock(options) {
  const calls = {
    storageUploads: [],
    storageRemovals: [],
    dbInserts: [],
    dbUpdates: [],
    dbDeletes: []
  };
  const mockClient = {
    storage: {
      from: (bucketName) => ({
        upload: async (path, _file, opts) => {
          calls.storageUploads.push({ bucket: bucketName, path, options: opts });
          if (options.storageUploadError) {
            return { data: null, error: options.storageUploadError };
          }
          return { data: { path }, error: null };
        },
        remove: async (paths) => {
          calls.storageRemovals.push(...paths);
          if (options.storageRemoveError) {
            return { data: null, error: options.storageRemoveError };
          }
          const data = options.storageRemoveData !== void 0 ? options.storageRemoveData : paths.map((path) => ({ name: path }));
          return { data, error: null };
        },
        getPublicUrl: (path) => ({
          data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/${bucketName}/${path}` }
        })
      })
    },
    from: (table) => {
      const queryState = {};
      const builder = {
        select: (_cols) => builder,
        eq: (col, val) => {
          queryState[col] = val;
          return builder;
        },
        order: (_col, _opts) => builder,
        single: async () => {
          if (table === "products") {
            if (options.productResult !== void 0) return options.productResult;
            return { data: { id: VALID_PRODUCT_ID, tenant_id: TENANT_ID2 }, error: null };
          }
          if (table === "media_assets") {
            if (options.assetInsertError) {
              return { data: null, error: options.assetInsertError };
            }
            return {
              data: {
                id: "asset-uuid-999",
                ...queryState.insertedRecord || {}
              },
              error: null
            };
          }
          if (table === "product_media") {
            if (options.linkInsertError) return { data: null, error: options.linkInsertError };
            return {
              data: {
                id: "link-uuid-888",
                ...queryState.insertedRecord || {},
                media_assets: queryState.insertedRecord
              },
              error: null
            };
          }
          return { data: null, error: null };
        },
        insert: (record) => {
          calls.dbInserts.push({ table, record });
          queryState.insertedRecord = record;
          return builder;
        },
        update: (values) => {
          calls.dbUpdates.push({ table, values });
          if (table === "product_media" && values.is_primary === false && options.clearPrimaryError) {
            return { eq: () => Promise.resolve({ error: options.clearPrimaryError }) };
          }
          return { eq: () => Promise.resolve({ error: null }) };
        },
        delete: () => {
          queryState.isDelete = true;
          return builder;
        },
        then: (resolve) => {
          if (queryState.isDelete === true) {
            const id = String(queryState.id ?? "");
            calls.dbDeletes.push({ table, id });
            if (table === "media_assets") {
              if (options.assetDeleteError) {
                resolve({ data: null, error: options.assetDeleteError });
                return;
              }
              const rows = options.assetDeleteRows !== void 0 ? options.assetDeleteRows : [{ id }];
              resolve({ data: rows, error: null });
              return;
            }
            resolve({ data: [], error: null });
            return;
          }
          if (table === "product_media") {
            if (queryState.media_id) {
              resolve({
                data: options.existingRefs !== void 0 ? options.existingRefs : [],
                error: options.referenceQueryError ?? null
              });
              return;
            }
            if (options.sortOrderResult) {
              resolve(options.sortOrderResult);
              return;
            }
            resolve({ data: [{ sort_order: 2 }], error: null });
            return;
          }
          resolve({ data: [], error: null });
        }
      };
      return builder;
    }
  };
  return { mockClient, calls };
}
var originalFrom = supabase2.from.bind(supabase2);
var originalStorage = supabase2.storage;
async function withMockedSupabase(mock, fn) {
  supabase2.from = mock.from;
  supabase2.storage = mock.storage;
  try {
    await fn();
  } finally {
    supabase2.from = originalFrom;
    supabase2.storage = originalStorage;
  }
}
await runTest("Metadata test: Upload WebP creates exact canonical metadata", async () => {
  const { mockClient, calls } = createSupabaseMock({});
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile("hero_specimen.webp", 2048, "image/webp");
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, file, "image", "Artisanal Hero", true);
    assert.equal(res.error, null);
    assert.ok(res.data);
    assert.equal(calls.storageUploads.length, 1);
    assert.equal(calls.storageUploads[0].bucket, BUCKET_NAME2);
    assert.ok(calls.storageUploads[0].path.startsWith(`products/${VALID_PRODUCT_ID}/`));
    assert.equal(calls.storageUploads[0].options?.contentType, "image/webp");
    const assetCall = calls.dbInserts.find((c) => c.table === "media_assets");
    assert.ok(assetCall);
    assert.equal(assetCall.record.tenant_id, TENANT_ID2);
    assert.equal(assetCall.record.bucket, BUCKET_NAME2);
    assert.equal(assetCall.record.media_type, "image");
    assert.equal(assetCall.record.mime_type, "image/webp");
    assert.equal(assetCall.record.filename, "hero_specimen.webp");
    assert.equal(assetCall.record.size_bytes, 2048);
    assert.equal(assetCall.record.status, "active");
    const linkCall = calls.dbInserts.find((c) => c.table === "product_media");
    assert.ok(linkCall);
    assert.equal(linkCall.record.product_id, VALID_PRODUCT_ID);
    assert.equal(linkCall.record.is_primary, true);
    assert.equal(linkCall.record.sort_order, 3);
  });
});
await runTest("Metadata test: Upload GIF preserves image media_type with image/gif MIME", async () => {
  const { mockClient, calls } = createSupabaseMock({});
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile("animation.gif", 4096, "image/gif");
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, file, "animation", "Orbit Animation", false);
    assert.equal(res.error, null);
    const assetCall = calls.dbInserts.find((c) => c.table === "media_assets");
    assert.ok(assetCall);
    assert.equal(assetCall.record.media_type, "image", "GIF must be stored as image");
    assert.equal(assetCall.record.mime_type, "image/gif");
  });
});
await runTest("Metadata test: Upload MP4 sets media_type to video", async () => {
  const { mockClient, calls } = createSupabaseMock({});
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile("pour_loop.mp4", 8192, "video/mp4");
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, file, "video", "Serving Loop", false);
    assert.equal(res.error, null);
    const assetCall = calls.dbInserts.find((c) => c.table === "media_assets");
    assert.ok(assetCall);
    assert.equal(assetCall.record.media_type, "video");
    assert.equal(assetCall.record.mime_type, "video/mp4");
  });
});
console.log("\n--- SECTION C: FAILURE & COMPENSATION TESTS ---");
await runTest("Failure 1: Product lookup fails -> no storage or DB insert", async () => {
  const { mockClient, calls } = createSupabaseMock({
    productResult: { data: null, error: { message: "Database unreachable" } }
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile("test.jpg", 1e3, "image/jpeg");
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.match(res.error || "", /Database unreachable|Product lookup failed/i);
    assert.equal(calls.storageUploads.length, 0);
    assert.equal(calls.dbInserts.length, 0);
  });
});
await runTest("Failure 2: Product belongs to different tenant -> rejected before upload", async () => {
  const { mockClient, calls } = createSupabaseMock({
    productResult: { data: { id: VALID_PRODUCT_ID, tenant_id: "FOREIGN-TENANT-UUID" }, error: null }
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile("test.jpg", 1e3, "image/jpeg");
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.match(res.error || "", /belongs to tenant/i);
    assert.equal(calls.storageUploads.length, 0);
  });
});
await runTest("Failure 3: Storage upload fails -> no media_assets record created", async () => {
  const { mockClient, calls } = createSupabaseMock({
    storageUploadError: { message: "Storage bucket quota exceeded" }
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile("test.jpg", 1e3, "image/jpeg");
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.match(res.error || "", /Storage bucket quota exceeded|Storage upload failed/i);
    assert.equal(calls.dbInserts.length, 0);
  });
});
await runTest("Failure 4: media_assets insert fails -> preserve Storage when persistence is unconfirmed", async () => {
  const { mockClient, calls } = createSupabaseMock({
    assetInsertError: { message: "Unique constraint violation on media_assets" }
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile("test.jpg", 1e3, "image/jpeg");
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.match(res.error || "", /Unique constraint violation|Failed to create media asset/i);
    assert.equal(calls.storageUploads.length, 1);
    assert.equal(calls.storageRemovals.length, 0, "Storage must be preserved when asset-row persistence is unconfirmed");
  });
});
await runTest("Failure 5: product_media link insert fails -> cleans unreferenced asset & storage", async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: "Foreign key error linking product_media" },
    existingRefs: []
    // No other product references this asset
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile("test.jpg", 1e3, "image/jpeg");
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.match(res.error || "", /Foreign key error|Failed to link/i);
    assert.equal(calls.storageRemovals.length, 1);
    const assetDelete = calls.dbDeletes.find((d) => d.table === "media_assets");
    assert.ok(assetDelete, "media_assets row must be cleaned up when unreferenced");
  });
});
await runTest("Failure 6: Preservation rule -> if asset is referenced elsewhere, it is NEVER deleted", async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: "Insert conflict" },
    existingRefs: [{ product_id: "another-product-id" }]
    // Asset IS referenced elsewhere!
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile("test.jpg", 1e3, "image/jpeg");
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 0, "Must NOT delete asset referenced by another product");
    assert.equal(calls.storageRemovals.length, 0, "Must NOT delete storage object referenced by another product");
  });
});
await runTest("Failure 7: Clear primary fails -> aborts and cleans up new asset safely", async () => {
  const { mockClient, calls } = createSupabaseMock({
    clearPrimaryError: { message: "RLS update denied on product_media" },
    existingRefs: []
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile("test.jpg", 1e3, "image/jpeg");
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, file, "image", "", true);
    assert.equal(res.data, null);
    assert.match(res.error || "", /RLS update denied|Failed to update existing primary media/i);
    assert.equal(calls.storageRemovals.length, 1);
  });
});
console.log("\n--- SECTION C2: CLEANUP INTEGRITY FAILURE PATHS ---");
await runTest("Cleanup: reference query error preserves asset row and Storage", async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: "Simulated link failure" },
    referenceQueryError: { message: "Reference query unavailable" },
    existingRefs: null
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, new MockFile("ref-error.jpg", 1e3, "image/jpeg"));
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 0, "Must not delete asset when reference status is unknown");
    assert.equal(calls.storageRemovals.length, 0, "Must preserve Storage when reference status is unknown");
  });
});
await runTest("Cleanup: asset-row deletion error preserves Storage", async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: "Simulated link failure" },
    existingRefs: [],
    assetDeleteError: { message: "Simulated asset delete failure" }
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, new MockFile("delete-error.jpg", 1e3, "image/jpeg"));
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 1);
    assert.equal(calls.storageRemovals.length, 0, "Must not remove Storage after database deletion error");
  });
});
await runTest("Cleanup: unconfirmed asset-row deletion preserves Storage", async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: "Simulated link failure" },
    existingRefs: [],
    assetDeleteRows: []
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, new MockFile("delete-unconfirmed.jpg", 1e3, "image/jpeg"));
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 1);
    assert.equal(calls.storageRemovals.length, 0, "Must preserve Storage unless exactly one matching asset row was confirmed deleted");
  });
});
await runTest("Cleanup: Storage removal error is captured after confirmed asset deletion", async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: "Simulated link failure" },
    existingRefs: [],
    storageRemoveError: { message: "Simulated Storage removal failure" }
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, new MockFile("storage-error.jpg", 1e3, "image/jpeg"));
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 1, "Asset row deletion should be confirmed first");
    assert.equal(calls.storageRemovals.length, 1, "Storage removal should be attempted only after confirmed row deletion");
  });
});
await runTest("Cleanup: successful compensation confirms asset deletion before Storage removal", async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: "Simulated link failure" },
    existingRefs: []
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, new MockFile("cleanup-success.jpg", 1e3, "image/jpeg"));
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 1);
    assert.equal(calls.dbDeletes[0].table, "media_assets");
    assert.equal(calls.storageRemovals.length, 1);
  });
});
await runTest("Cleanup: empty or invalid reference result preserves asset and Storage", async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: "Simulated link failure" },
    existingRefs: null
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService2.uploadMedia(VALID_PRODUCT_ID, new MockFile("refs-null.jpg", 1e3, "image/jpeg"));
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 0);
    assert.equal(calls.storageRemovals.length, 0);
  });
});
if (process.env.HOEOS_MOCK_ONLY !== "1") {
  console.log("\n--- SECTION D: AUTHENTICATED TENANT BOUNDARY TESTS ---");
  await runTest("Tenant Boundary: Unauthenticated user cannot insert into media_assets", async () => {
    const { data, error } = await supabase2.from("media_assets").insert({
      tenant_id: TENANT_ID2,
      bucket: BUCKET_NAME2,
      path: "unauth.png",
      media_type: "image",
      mime_type: "image/png",
      filename: "unauth.png",
      status: "active"
    }).select("*");
    assert.equal(data, null);
    assert.ok(error);
    assert.match(error.message, /permission denied/i);
  });
  await runTest("Tenant Boundary: Unauthenticated user cannot upload to cp-public bucket", async () => {
    const dummyBuffer = Buffer.from("TEST_DATA");
    const { data, error } = await supabase2.storage.from(BUCKET_NAME2).upload(`probe_unauth_${Date.now()}.png`, dummyBuffer, { contentType: "image/png" });
    assert.equal(data, null);
    assert.ok(error);
    assert.match(error.message, /violates row-level security policy/i);
  });
} else {
  console.log("HOEOS_MOCK_ONLY=1: skipped live Supabase database and Storage tests.");
}
console.log("\n======================================================================");
console.log(`HOEOS TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log("======================================================================\n");
try {
  supabase2.auth.stopAutoRefresh();
  await supabase2.removeAllChannels();
  supabase2.realtime.disconnect();
} catch {
}
await new Promise((resolve) => setTimeout(resolve, 200));
process.exit(passedTests === totalTests ? 0 : 1);
