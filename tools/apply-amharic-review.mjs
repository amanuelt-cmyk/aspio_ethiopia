import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const reviewPath = process.argv[2];

if (!reviewPath) {
  throw new Error("Usage: node tools/apply-amharic-review.mjs <reviewed-json-file>");
}

const rawReview = JSON.parse(await fs.readFile(path.resolve(reviewPath), "utf8"));
const reviewed = Array.isArray(rawReview.translation_items)
  ? rawReview
  : Object.values(rawReview).find((value) => value && typeof value === "object" && Array.isArray(value.translation_items));
const reviewItems = reviewed?.translation_items;
if (!Array.isArray(reviewItems) || reviewItems.length === 0) {
  throw new Error("The reviewed file has no translation_items.");
}

const containsAmharic = (value) => /[\u1200-\u137f]/u.test(value);

function extractCandidates(file, source) {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const candidates = [];

  const add = (node, start, end, kind, quote = "") => {
    const current = source.slice(start, end);
    if (!containsAmharic(current) || !current.trim()) return;
    candidates.push({
      id: `${file}#${candidates.length + 1}`,
      file,
      start,
      end,
      kind,
      quote,
      current,
    });
  };

  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      add(node, node.getStart(sourceFile) + 1, node.getEnd() - 1, "literal", source[node.getStart(sourceFile)]);
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node)) {
      add(node, node.getStart(sourceFile) + 1, node.getEnd() - 2, "literal", "`");
    } else if (ts.isTemplateTail(node)) {
      add(node, node.getStart(sourceFile) + 1, node.getEnd() - 1, "literal", "`");
    } else if (ts.isJsxText(node)) {
      const raw = node.getText(sourceFile);
      const leading = raw.match(/^\s*/u)?.[0].length ?? 0;
      const trailing = raw.match(/\s*$/u)?.[0].length ?? 0;
      add(node, node.getStart(sourceFile) + leading, node.getEnd() - trailing, "jsx");
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return candidates;
}

function escapeLiteral(value, quote) {
  let escaped = value.replaceAll("\\", "\\\\").replaceAll("\r", "\\r").replaceAll("\n", "\\n");
  if (quote === '"') escaped = escaped.replaceAll('"', '\\"');
  if (quote === "'") escaped = escaped.replaceAll("'", "\\'");
  if (quote === "`") escaped = escaped.replaceAll("`", "\\`").replaceAll("${", "\\${");
  return escaped;
}

const reviewIds = new Set();
for (const item of reviewItems) {
  if (!item.id || reviewIds.has(item.id)) throw new Error(`Missing or duplicate review ID: ${item.id || "(blank)"}`);
  reviewIds.add(item.id);
  if (typeof item.revised_amharic !== "string" || !item.revised_amharic.trim()) {
    throw new Error(`Blank revised_amharic for ${item.id}`);
  }
  if (/[<>]/u.test(item.revised_amharic)) throw new Error(`Markup is not allowed in ${item.id}`);
}

const files = [...new Set(reviewItems.map((item) => item.source_file))];
let changedCount = 0;

for (const file of files) {
  const absoluteFile = path.join(root, file);
  let source = await fs.readFile(absoluteFile, "utf8");
  const candidateMap = new Map(extractCandidates(file, source).map((candidate) => [candidate.id, candidate]));
  const changes = reviewItems
    .filter((item) => item.source_file === file)
    .map((item) => {
      const candidate = candidateMap.get(item.id);
      if (!candidate) throw new Error(`Unknown or moved source ID: ${item.id}`);
      if (candidate.current !== item.current_amharic) throw new Error(`Original text no longer matches for ${item.id}`);
      return { ...candidate, revised: item.revised_amharic };
    })
    .sort((a, b) => b.start - a.start);

  for (const change of changes) {
    const replacement = change.kind === "literal" ? escapeLiteral(change.revised, change.quote) : change.revised;
    source = source.slice(0, change.start) + replacement + source.slice(change.end);
    if (change.revised !== change.current) changedCount += 1;
  }

  const parsed = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  if (parsed.parseDiagnostics.length) {
    throw new Error(`Reviewed copy produced invalid syntax in ${file}: ${parsed.parseDiagnostics[0].messageText}`);
  }

  await fs.writeFile(absoluteFile, source, "utf8");
}

console.log(`Applied ${changedCount} revised strings from ${reviewItems.length} reviewed entries across ${files.length} file(s).`);
