import * as THREE from 'three';

/**
 * Small canvas-generated textures — no image downloads, no large files. Each is
 * built once (call from a `useMemo`) at a modest resolution, which is plenty for
 * how close the camera actually gets to any of these surfaces.
 */

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

export function createWoodGrainTexture(baseColor = '#4a2f1d'): THREE.CanvasTexture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 70; i++) {
    const y = Math.random() * size;
    const shade = 15 + Math.random() * 45;
    ctx.strokeStyle = `rgba(${shade + 35}, ${shade + 15}, ${shade}, ${0.12 + Math.random() * 0.18})`;
    ctx.lineWidth = 0.6 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 14) {
      ctx.lineTo(x, y + (Math.random() - 0.5) * 9);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 4; i++) {
    const kx = Math.random() * size;
    const ky = Math.random() * size;
    const r = 5 + Math.random() * 9;
    const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, r);
    grad.addColorStop(0, 'rgba(20,12,6,0.55)');
    grad.addColorStop(1, 'rgba(20,12,6,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(kx, ky, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFabricTexture(baseColor: string): THREE.CanvasTexture {
  const size = 128;
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.07;
  for (let i = 0; i < size; i += 3) {
    ctx.strokeStyle = i % 6 === 0 ? '#000000' : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + n));
    imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + n));
    imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A number printed on a transparent background, meant to sit as a decal on one
 * side of a cup. Canvas-drawn text — no font file to fetch. */
export function createNumberTexture(n: number): THREE.CanvasTexture {
  const size = 128;
  const { canvas, ctx } = makeCanvas(size);
  ctx.clearRect(0, 0, size, size);
  ctx.font = 'bold 84px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(240, 230, 210, 0.92)';
  ctx.fillText(String(n), size / 2, size / 2 + 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Subtle roughness variation so plastic doesn't look perfectly, uniformly smooth. */
export function createRoughnessNoiseTexture(size = 64): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(size);
  const imgData = ctx.createImageData(size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = 150 + Math.random() * 55;
    imgData.data[i] = v;
    imgData.data[i + 1] = v;
    imgData.data[i + 2] = v;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}
