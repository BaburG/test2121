// Independent raster effects in a 1672 × 1096 design space. The sampling
// grid stays coarse on high-density displays instead of becoming retina-smooth.
const DESIGN_WIDTH = 1672;
const DESIGN_HEIGHT = 1096;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (a: number, b: number, amount: number) => a + (b - a) * amount;
const smoothstep = (a: number, b: number, value: number) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const gaussian = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  Math.exp(-0.5 * (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));

// Stable noise keeps the composition identical between renders.
function noise(x: number, y: number) {
  let n = Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295 - 0.5;
}

// Sparse color stops describe the charcoal body, curved cobalt ribbon, and
// lavender highlight. They are interpolated as a smooth mesh, not a bitmap.
const BODY_X = [0,150,300,450,550,650,750,850,950];
const BODY_Y = [118,160,250,400,550,625,790,900,1000,1080,1180];
const BODY_COLORS = [
  [[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
  [[136, 136, 146], [201, 203, 239], [247, 245, 251], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
  [[68, 69, 80], [112, 114, 184], [186, 177, 225], [238, 229, 243], [253, 252, 253], [255, 253, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
  [[39, 37, 46], [55, 57, 80], [126, 131, 216], [217, 202, 231], [231, 216, 237], [234, 223, 241], [250, 249, 252], [255, 255, 255], [255, 255, 255]],
  [[18, 17, 23], [25, 26, 36], [68, 71, 165], [177, 169, 221], [201, 181, 222], [190, 187, 232], [220, 222, 246], [255, 255, 255], [255, 255, 255]],
  [[11, 11, 16], [19, 19, 30], [51, 54, 134], [148, 146, 213], [165, 157, 218], [128, 134, 218], [189, 190, 211], [255, 255, 255], [255, 255, 255]],
  [[12, 12, 17], [19, 20, 33], [46, 51, 151], [97, 101, 202], [53, 56, 143], [64, 64, 72], [126, 125, 130], [253, 253, 254], [255, 255, 255]],
  [[21, 23, 32], [47, 49, 109], [77, 82, 197], [66, 72, 196], [33, 34, 62], [42, 41, 49], [111, 110, 116], [245, 244, 248], [255, 255, 255]],
  [[37, 38, 58], [74, 77, 146], [106, 112, 212], [80, 84, 185], [66, 65, 98], [69, 69, 76], [136, 137, 142], [246, 245, 248], [255, 255, 255]],
  [[56, 56, 77], [126, 128, 166], [180, 182, 231], [149, 151, 217], [135, 134, 154], [140, 140, 146], [193, 193, 197], [251, 250, 252], [255, 255, 255]],
  [[156, 156, 166], [191, 192, 211], [218, 219, 243], [202, 203, 236], [195, 195, 205], [198, 198, 201], [224, 224, 226], [253, 253, 254], [255, 255, 255]],
];
const ECHO_X = [850,950,1050,1150,1250,1350,1450,1550,1672,1850];
const ECHO_Y = [850,900,1000,1080,1180];
const ECHO_COLORS = [
  [[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
  [[255, 255, 255], [255, 255, 255], [253, 253, 255], [253, 253, 255], [254, 254, 254], [254, 254, 254], [254, 254, 255], [254, 254, 255], [255, 255, 255], [255, 255, 255]],
  [[255, 255, 255], [247, 242, 250], [243, 239, 248], [229, 230, 246], [210, 211, 230], [207, 206, 209], [217, 217, 219], [229, 229, 231], [248, 248, 248], [248, 248, 248]],
  [[255, 255, 255], [240, 231, 244], [237, 226, 242], [219, 214, 236], [171, 174, 231], [139, 139, 147], [147, 146, 151], [168, 167, 172], [214, 213, 216], [214, 213, 216]],
  [[255, 255, 255], [156, 150, 159], [154, 147, 157], [142, 139, 153], [111, 113, 150], [90, 90, 96], [96, 95, 98], [109, 109, 112], [139, 138, 140], [139, 138, 140]],
];

function interval(stops: number[], value: number) {
  let i = 0;
  while (i < stops.length - 2 && value > stops[i + 1]) i++;
  return { i, t: clamp((value - stops[i]) / (stops[i + 1] - stops[i])) };
}

function cubic(a: number, b: number, c: number, d: number, t: number) {
  return b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
}

function meshRow(stops: number[], colors: number[][][], y: number) {
  const { i, t } = interval(stops, y);
  return colors[i].map((color, x) => color.map((_, channel) => cubic(
    colors[Math.max(0, i - 1)][x][channel], colors[i][x][channel],
    colors[i + 1][x][channel], colors[Math.min(stops.length - 1, i + 2)][x][channel], t,
  )));
}

function meshColor(row: number[][], sample: { i: number; t: number }, channel: number) {
  const { i, t } = sample;
  return Math.max(0, Math.min(255, cubic(
    row[Math.max(0, i - 1)][channel], row[i][channel],
    row[i + 1][channel], row[Math.min(row.length - 1, i + 2)][channel], t,
  )));
}

export function renderAtmosphere(canvas: HTMLCanvasElement, width: number, height: number) {
  const pixelSize = Math.max(1.25, width / 660);
  canvas.width = Math.ceil(width / pixelSize);
  canvas.height = Math.ceil(height / pixelSize);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  const frame = ctx.createImageData(canvas.width, canvas.height);
  const columns = Array.from({ length: canvas.width }, (_, px) => {
    const x = px / canvas.width * DESIGN_WIDTH;
    const bodyX = width <= 600 ? x / 1.65 : x;
    return { body: interval(BODY_X, bodyX), echo: interval(ECHO_X, x) };
  });
  for (let py = 0; py < canvas.height; py++) {
    const y = py / canvas.height * DESIGN_HEIGHT;
    const body = meshRow(BODY_Y, BODY_COLORS, y);
    const echo = meshRow(ECHO_Y, ECHO_COLORS, y);
    for (let px = 0; px < canvas.width; px++) {
      const index = (py * canvas.width + px) * 4;
      const color = [0, 1, 2].map(channel => Math.min(
        meshColor(body, columns[px].body, channel), meshColor(echo, columns[px].echo, channel),
      ));
      // Noise follows pigment, so the empty canvas remains pure white.
      const darkest = Math.min(...color);
      const coverage = smoothstep(0, 55, 255 - darkest);
      const chroma = (Math.max(...color) - darkest) / 255;
      const amplitude = 10 + 96 * chroma;
      const grain = (noise(px, py)
        + noise(Math.floor(px / 2) + 31, Math.floor(py / 2) + 73) * 0.18) * amplitude * coverage;
      for (let c = 0; c < 3; c++) {
        frame.data[index + c] = darkest > 254 ? 255 : Math.round((color[c] + grain) / 2) * 2;
      }
      frame.data[index + 3] = 255;
    }
  }
  ctx.putImageData(frame, 0, 0);
}

export function renderWordmark(canvas: HTMLCanvasElement, image: HTMLImageElement, width: number, height: number, kind: "muse" | "minds") {
  const isMuse = kind === "muse";
  const mobile = width <= 600;
  const size = mobile ? (isMuse ? 2 : 1.5) : 1;
  const logoHeight = width * (isMuse ? 0.0795 : 0.084) * size;
  const logoWidth = width * (isMuse ? 0.082 : 0.084) * size * (image.naturalWidth / image.naturalHeight);
  const padding = logoHeight * 0.35;
  const boxWidth = logoWidth + padding * 2;
  const boxHeight = logoHeight + padding * 2;
  const pixelSize = Math.max(1.25, width / (isMuse ? 836 : 760));
  canvas.width = Math.ceil(boxWidth / pixelSize);
  canvas.height = Math.ceil(boxHeight / pixelSize);
  canvas.style.width = `${boxWidth}px`;
  canvas.style.height = `${boxHeight}px`;
  canvas.style.left = `${width * (isMuse ? (mobile ? -0.22 : -0.09) : (mobile ? 0.55 : 0.6845)) - padding}px`;
  canvas.style.top = `${height * (isMuse ? 0.585 : 0.335) - padding}px`;

  const source = document.createElement("canvas");
  source.width = Math.ceil(logoWidth);
  source.height = Math.ceil(logoHeight);
  const sourceCtx = source.getContext("2d", { willReadFrequently: true });
  const ctx = canvas.getContext("2d");
  if (!sourceCtx || !ctx) return;
  sourceCtx.drawImage(image, 0, 0, source.width, source.height);
  const pixels = sourceCtx.getImageData(0, 0, source.width, source.height).data;
  const frame = ctx.createImageData(canvas.width, canvas.height);
  for (let py = 0; py < canvas.height; py++) {
    for (let px = 0; px < canvas.width; px++) {
      const x = (px / canvas.width) * boxWidth - padding;
      const y = (py / canvas.height) * boxHeight - padding;
      const cx = logoWidth * (isMuse ? 0.4 : 0.24);
      const cy = logoHeight * 0.52;
      const dx = x - cx, dy = y - cy;
      const lens = gaussian(x, y, cx, cy, logoHeight * 1.8, logoHeight * 1.25);
      const strength = isMuse ? 0.035 : 0.045;
      let sx = cx + dx / (1 + strength * lens);
      let sy = cy + dy / (1 + strength * lens);
      if (isMuse) {
        sx -= (y - cy) * 0.25 * lens;
        sy += smoothstep(0.4, 0.66, x / logoWidth) * logoHeight * 0.03;
      } else {
        sx -= (logoHeight - y) * 0.25;
        sy += (x / logoWidth) * logoHeight * 0.025;
      }
      const ix = Math.floor(sx), iy = Math.floor(sy);
      if (ix < 0 || ix >= source.width || iy < 0 || iy >= source.height) continue;
      const sourceIndex = (iy * source.width + ix) * 4;
      const index = (py * canvas.width + px) * 4;
      const tone = isMuse ? mix(203, 255, smoothstep(0.08, 0.69, x / logoWidth)) : mix(37, 3, smoothstep(0, 0.55, x / logoWidth));
      const grain = noise(px, py) * (isMuse ? 2 : 3);
      frame.data[index] = tone + grain;
      frame.data[index + 1] = tone + grain;
      frame.data[index + 2] = tone + grain;
      frame.data[index + 3] = pixels[sourceIndex + 3];
    }
  }
  ctx.putImageData(frame, 0, 0);
  canvas.dataset.rendered = "true";
}
