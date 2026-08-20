const ASPECT_RATIOS: Record<string, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

/** Center-crops the source image to the given aspect ratio. */
export function cropToAspect(aspectKey: string) {
  const ratio = ASPECT_RATIOS[aspectKey] ?? 1;
  return (img: HTMLImageElement, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const srcRatio = img.width / img.height;
    let cropWidth = img.width;
    let cropHeight = img.height;

    if (srcRatio > ratio) {
      cropWidth = img.height * ratio;
    } else {
      cropHeight = img.width / ratio;
    }

    const sx = (img.width - cropWidth) / 2;
    const sy = (img.height - cropHeight) / 2;

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  };
}

/** Resizes the source image to the given target dimensions. */
export function resizeTo(width: number, height: number) {
  return (img: HTMLImageElement, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
  };
}
