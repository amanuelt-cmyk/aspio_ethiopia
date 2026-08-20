import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(process.cwd());
const outputFile = "translations/amharic-copy-for-gemini.json";

const targets = [
  "app/ethiopia/page.tsx",
  "app/ethiopia/business/page.tsx",
  "app/ethiopia/discover/page.tsx",
  "app/ethiopia/how-it-works/page.tsx",
  "app/ethiopia/contact/page.tsx",
  "app/ethiopia/register/page.tsx",
  "app/ethiopia/components/LeadForm.tsx",
  "app/ethiopia/components/AddisMap.tsx",
  "app/ethiopia/data.ts",
  "app/ethiopia/mapData.ts",
  "app/ethiopia/layout.tsx",
];

const englishReferences = [
  "app/ethiopia/en/page.tsx",
  "app/ethiopia/en/business/page.tsx",
  "app/ethiopia/en/discover/page.tsx",
  "app/ethiopia/en/how-it-works/page.tsx",
  "app/ethiopia/en/contact/page.tsx",
  "app/ethiopia/en/register/page.tsx",
];

const containsAmharic = (value) => /[\u1200-\u137f]/u.test(value);

function compactContext(value) {
  return value.replace(/\s+/gu, " ").trim();
}

function extractAmharic(file, source) {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const entries = [];

  const add = (node, start, end, kind) => {
    const current = source.slice(start, end);
    if (!containsAmharic(current) || !current.trim()) return;
    const line = sourceFile.getLineAndCharacterOfPosition(start).line + 1;
    entries.push({
      id: `${file}#${entries.length + 1}`,
      source_file: file,
      source_line: line,
      source_kind: kind,
      current_amharic: current,
      nearby_context: compactContext(source.slice(Math.max(0, start - 95), Math.min(source.length, end + 95))),
      revised_amharic: "",
    });
  };

  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      add(node, node.getStart(sourceFile) + 1, node.getEnd() - 1, "code string");
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node)) {
      add(node, node.getStart(sourceFile) + 1, node.getEnd() - 2, "template text");
    } else if (ts.isTemplateTail(node)) {
      add(node, node.getStart(sourceFile) + 1, node.getEnd() - 1, "template text");
    } else if (ts.isJsxText(node)) {
      const raw = node.getText(sourceFile);
      const leading = raw.match(/^\s*/u)?.[0].length ?? 0;
      const trailing = raw.match(/\s*$/u)?.[0].length ?? 0;
      add(node, node.getStart(sourceFile) + leading, node.getEnd() - trailing, "visible page text");
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return entries;
}

const entries = [];
for (const file of targets) {
  const source = await fs.readFile(path.join(root, file), "utf8");
  entries.push(...extractAmharic(file, source));
}

const referenceFiles = {};
for (const file of englishReferences) {
  referenceFiles[file] = await fs.readFile(path.join(root, file), "utf8");
}

const document = {
  document_purpose: "Amharic UX copy review for the Aspio Ethiopia website",
  instructions_for_gemini: [
    "Act as a senior Ethiopian Amharic UX writer and localization editor based in Addis Ababa.",
    "Rewrite every current_amharic value into natural, contemporary, polished Amharic suitable for an Ethiopian technology and beauty marketplace.",
    "Use the matching English reference source to recover the intended meaning. Do not translate literally when a natural Ethiopian expression is clearer.",
    "Keep the language concise enough to fit buttons, cards, navigation, forms, calendars, and mobile screens.",
    "Preserve Aspio, Business Starter, Website, CRM, API, URLs, email addresses, prices, numbers, dates, and time values exactly unless the existing Amharic numeral itself is intentional.",
    "Keep accepted Addis Ababa neighborhood names and Ethiopian personal names correctly spelled.",
    "Never introduce a star character or a star-rating symbol.",
    "Do not edit id, source_file, source_line, source_kind, current_amharic, nearby_context, English reference sources, or the JSON structure.",
    "Fill revised_amharic for every item. Do not leave any item blank, omit IDs, merge items, add commentary, or place markup/code in a translation.",
    "Return the completed JSON as a downloadable file named amharic-copy-reviewed.json. Do not paste a shortened or partial result into chat.",
  ],
  product_context: {
    brand: "Aspio",
    market: "Ethiopia",
    audience: "Salon, barbershop, nail studio, spa owners and their customers in Addis Ababa",
    offer: "Business Starter + Website: online booking, customer records, reminders, reports, and a business website",
    tone: "Clear, warm, trustworthy, modern, locally natural, and professional",
  },
  item_count: entries.length,
  translation_items: entries,
  english_reference_sources: referenceFiles,
};

await fs.mkdir(path.join(root, "translations"), { recursive: true });
await fs.writeFile(path.join(root, outputFile), `${JSON.stringify(document, null, 2)}\n`, "utf8");
console.log(`Exported ${entries.length} Amharic strings to ${outputFile}`);
