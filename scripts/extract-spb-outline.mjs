import fs from "node:fs";
import path from "node:path";

const INPUT = path.resolve("export.svg");
const OUTPUT = path.resolve("src/data/spbOutline.ts");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(INPUT)) fail(`Не найден файл: ${INPUT}`);

const svg = fs.readFileSync(INPUT, "utf8");

const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
if (!viewBoxMatch) fail("Не найден viewBox в export.svg");
const viewBox = viewBoxMatch[1];

// Берём первый <path ... d="..."> внутри группы patch_3 (контур города)
const patchStart = svg.indexOf('<g id="patch_3">');
if (patchStart === -1) fail('Не найден блок <g id="patch_3">');

const pathTagStart = svg.indexOf("<path", patchStart);
if (pathTagStart === -1) fail("Не найден <path> внутри patch_3");

const dAttrStart = svg.indexOf('d="', pathTagStart);
if (dAttrStart === -1) fail('Не найден атрибут d="..." у <path> внутри patch_3');

const dValueStart = dAttrStart + 3;
const dValueEnd = svg.indexOf('"', dValueStart);
if (dValueEnd === -1) fail("Не найдена закрывающая кавычка у атрибута d");

// Нормализуем пробелы, чтобы не таскать 7000 строк в исходниках
const dRaw = svg.slice(dValueStart, dValueEnd).trim();
const d = dRaw.replace(/\s+/g, " ");

const out = `// Автогенерация из export.svg (OSM relation 421007 → GeoJSON → SVG)
// Источник данных: https://www.openstreetmap.org/relation/421007
// Лицензия данных: ODbL (© OpenStreetMap contributors)

export const SPB_VIEWBOX = ${JSON.stringify(viewBox)} as const;

// Контур города Санкт‑Петербург (path d).
export const SPB_OUTLINE_D = \`${d}\` as const;
`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, out, "utf8");

console.log(`OK: viewBox=${viewBox}, d.length=${d.length}`);
console.log(`Written: ${OUTPUT}`);


