import fs from "node:fs";

const SRC = "src/data/spbOutline.ts";

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function parsePathD(d) {
  const tokens = d.trim().split(/[\s,]+/).filter(Boolean);
  /** @type {{ points: Array<[number, number]> }[]} */
  const subpaths = [];

  /** @type {Array<[number, number]> | null} */
  let current = null;

  const isNum = (s) => !Number.isNaN(Number(s));

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === "M" || t === "m") {
      const x = Number(tokens[i + 1]);
      const y = Number(tokens[i + 2]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) fail(`Bad M at token ${i}`);
      current = [[x, y]];
      subpaths.push({ points: current });
      i += 2;
      continue;
    }

    if (t === "L" || t === "l") {
      if (!current) fail(`L before M at token ${i}`);
      const x = Number(tokens[i + 1]);
      const y = Number(tokens[i + 2]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) fail(`Bad L at token ${i}`);
      current.push([x, y]);
      i += 2;
      continue;
    }

    // На всякий случай: если в данных внезапно встретились числа без команды — игнорируем
    if (isNum(t)) continue;
  }

  return subpaths.filter((p) => p.points.length >= 3);
}

function polygonArea(points) {
  // points may be closed or open
  const n = points.length;
  if (n < 3) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

function sqrDist(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function sqrSegDist(p, a, b) {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

function simplifyDPStep(points, first, last, sqEps, kept) {
  let maxSqDist = sqEps;
  let index = -1;

  for (let i = first + 1; i < last; i++) {
    const sqDist = sqrSegDist(points[i], points[first], points[last]);
    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (index !== -1) {
    if (index - first > 1) simplifyDPStep(points, first, index, sqEps, kept);
    kept[index] = true;
    if (last - index > 1) simplifyDPStep(points, index, last, sqEps, kept);
  }
}

function simplifyDP(points, epsilon) {
  if (points.length <= 2) return points.slice();
  const sqEps = epsilon * epsilon;

  const kept = new Array(points.length).fill(false);
  kept[0] = true;
  kept[points.length - 1] = true;
  simplifyDPStep(points, 0, points.length - 1, sqEps, kept);

  /** @type {Array<[number, number]>} */
  const out = [];
  for (let i = 0; i < points.length; i++) if (kept[i]) out.push(points[i]);
  return out;
}

function simplifyClosedRing(points, epsilon) {
  // remove duplicate last if closed
  const closed = points.length >= 2 && sqrDist(points[0], points[points.length - 1]) < 1e-12;
  const ring = closed ? points.slice(0, -1) : points.slice();
  // DP on open polyline by anchoring at an arbitrary point; we anchor at 0 and append 0 at end
  const open = ring.concat([ring[0]]);
  const simplifiedOpen = simplifyDP(open, epsilon);
  const simplified = simplifiedOpen.slice(0, -1);
  // re-close with Z later
  return simplified;
}

function formatNumber(n) {
  // достаточно для SVG, сильно сокращает строку
  return Number(n.toFixed(3)).toString();
}

function toPathD(points) {
  if (points.length < 3) fail("Not enough points after simplify");
  const [x0, y0] = points[0];
  let out = `M ${formatNumber(x0)} ${formatNumber(y0)}`;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    out += ` L ${formatNumber(x)} ${formatNumber(y)}`;
  }
  out += " Z";
  return out;
}

const args = process.argv.slice(2);
const epsIdx = args.indexOf("--epsilon");
const epsilon = epsIdx !== -1 ? Number(args[epsIdx + 1]) : 2.5;
const shouldWrite = args.includes("--write");

if (!Number.isFinite(epsilon) || epsilon <= 0) fail("epsilon must be > 0");
if (!fs.existsSync(SRC)) fail(`Не найден файл: ${SRC}`);

const src = fs.readFileSync(SRC, "utf8");
const match = src.match(/export const SPB_OUTLINE_D = `([\s\S]*?)` as const;/);
if (!match) fail("Не удалось найти SPB_OUTLINE_D в spbOutline.ts");

const d = match[1];
const subpaths = parsePathD(d);
if (!subpaths.length) fail("Не удалось распарсить path d");

// Берём крупнейший по площади (убирает мелкие фрагменты/островки)
subpaths.sort((a, b) => Math.abs(polygonArea(b.points)) - Math.abs(polygonArea(a.points)));
const main = subpaths[0].points;

const simplified = simplifyClosedRing(main, epsilon);
const newD = toPathD(simplified);

if (!shouldWrite) {
  console.log(newD);
  console.log(`points: ${main.length} -> ${simplified.length}, epsilon=${epsilon}`);
  process.exit(0);
}

const replaced = src.replace(
  /export const SPB_OUTLINE_D = `([\s\S]*?)` as const;/,
  `// Контур упрощён вручную под визуальную карту (см. public/images/map1.webp)\nexport const SPB_OUTLINE_D = \`${newD}\` as const;`
);

fs.writeFileSync(SRC, replaced, "utf8");
console.log(`OK: points ${main.length} -> ${simplified.length}, epsilon=${epsilon}`);

