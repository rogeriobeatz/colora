export type PreprocessImageOptions = {
  maxDimension?: number; // maior lado (largura ou altura)
  mimeType?: "image/jpeg" | "image/webp";
  quality?: number; // 0..1
  background?: string; // usado ao converter PNG->JPG (remove alpha)
};

function readBlobAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Falha ao comprimir a imagem (canvas.toBlob retornou null)"));
        else resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

export async function preprocessImageFile(file: File, opts: PreprocessImageOptions = {}): Promise<string> {
  const {
    maxDimension = 1600,
    mimeType = "image/jpeg",
    quality = 0.82,
    background = "#ffffff",
  } = opts;

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const targetW = Math.max(1, Math.round(bitmap.width * scale));
  const targetH = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível inicializar o canvas");

  // Se for JPEG, garante fundo sólido (remove transparência)
  if (mimeType === "image/jpeg") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const blob = await canvasToBlob(canvas, mimeType, quality);
  const dataUrl = await readBlobAsDataURL(blob);

  return dataUrl;
}