import { documents, fileToUrl, getDocumentByUrl, resolveFileLink, type DocumentEntry } from "./catalog";

export function searchDocuments(query: string): DocumentEntry[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return documents;
  return documents
    .map((document) => {
      const name = document.path.toLocaleLowerCase();
      const heading = /^#\s+(.+)$/m.exec(document.source)?.[1]?.toLocaleLowerCase() ?? "";
      const score = name.split("/").at(-1)?.startsWith(needle) ? 3 : name.includes(needle) ? 2 : heading.includes(needle) ? 1 : 0;
      return { document, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ document }) => document);
}

export function getBacklinks(path: string): DocumentEntry[] {
  const target = fileToUrl(path);
  if (!target) return [];
  return documents.filter((document) => {
    if (document.path === path) return false;
    for (const match of document.source.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)) {
      const resolved = resolveFileLink(document.path, match[1]);
      if (resolved?.split("#", 1)[0] === target) return true;
    }
    return false;
  });
}

export function getOutgoingLinks(path: string): DocumentEntry[] {
  const source = documents.find((document) => document.path === path);
  if (!source) return [];
  const linked: DocumentEntry[] = [];
  const seen = new Set<string>();
  for (const match of source.source.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)) {
    const url = resolveFileLink(path, match[1]);
    const target = url ? getDocumentByUrl(url.split("#", 1)[0]) : undefined;
    if (!target || seen.has(target.path)) continue;
    seen.add(target.path);
    linked.push(target);
  }
  return linked;
}
