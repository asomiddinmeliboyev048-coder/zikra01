// ============================================================
// Cloudinary — client tomonda imzosiz (unsigned) video yuklash
// ============================================================

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  duration?: number;
  thumbnail_url: string;
}

/**
 * Videoni to'g'ridan-to'g'ri Cloudinary'ga yuklaydi (unsigned preset orqali).
 * onProgress — yuklash foizini (0–100) qaytaradi.
 */
export function uploadVideoToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    return Promise.reject(
      new Error(
        "Cloudinary sozlanmagan. .env faylda NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME va NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ni to'ldiring."
      )
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        // Video uchun jpg poster (thumbnail)
        const thumb = res.secure_url.replace(/\.(mp4|mov|webm|mkv|avi)$/i, ".jpg");
        resolve({
          secure_url: res.secure_url,
          public_id: res.public_id,
          duration: res.duration ? Math.round(res.duration) : undefined,
          thumbnail_url: thumb,
        });
      } else {
        reject(new Error("Yuklashda xatolik: " + xhr.status));
      }
    };

    xhr.onerror = () => reject(new Error("Tarmoq xatosi"));
    xhr.send(form);
  });
}

export interface ImageUploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Rasmni (avatar) Cloudinary'ga yuklaydi (unsigned preset).
 * Telefon/galereya yoki kompyuter faylidan ishlaydi.
 */
export function uploadImageToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ImageUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    return Promise.reject(
      new Error(
        "Cloudinary sozlanmagan. .env faylda NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME va NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ni to'ldiring."
      )
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        resolve({ secure_url: res.secure_url, public_id: res.public_id });
      } else {
        reject(new Error("Rasm yuklashda xatolik: " + xhr.status));
      }
    };

    xhr.onerror = () => reject(new Error("Tarmoq xatosi"));
    xhr.send(form);
  });
}
