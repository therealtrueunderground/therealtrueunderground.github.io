import readme from "../../README.md?raw";
import about from "../../About/introduction.md?raw";
import projectsIndex from "../../Projects/README.md?raw";
import experience from "../../Experience/timeline.md?raw";
import education from "../../Education/education.md?raw";
import skills from "../../Skills/stack.md?raw";

export type DocumentEntry = {
  path: string;
  url: string;
  title: string;
  section: string | null;
  source: string;
};

const projectFiles = import.meta.glob("../../Projects/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const projectDocuments: DocumentEntry[] = Object.entries(projectFiles)
  .filter(([path]) => !path.endsWith("/README.md"))
  .map(([path, source]) => {
    const filename = path.split("/").at(-1) ?? "";
    const slug = filename.replace(/\.md$/, "");
    return {
      path: `Projects/${filename}`,
      url: `/projects/${slug}`,
      title: /^#\s+(.+)$/m.exec(source)?.[1] ?? slug,
      section: "Projects",
      source,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export const documents: DocumentEntry[] = [
  { path: "README.md", url: "/", title: "README", section: null, source: readme },
  { path: "About/introduction.md", url: "/about", title: "Introduction", section: "About", source: about },
  { path: "Projects/README.md", url: "/projects", title: "Projects", section: "Projects", source: projectsIndex },
  ...projectDocuments,
  { path: "Experience/timeline.md", url: "/experience", title: "Timeline", section: "Experience", source: experience },
  { path: "Education/education.md", url: "/education", title: "Education", section: "Education", source: education },
  { path: "Skills/stack.md", url: "/skills", title: "Stack", section: "Skills", source: skills },
];

const pathToDocument = new Map(documents.map((document) => [document.path, document]));
const urlToDocument = new Map(documents.map((document) => [document.url, document]));

export function fileToUrl(path: string): string | null {
  return pathToDocument.get(path)?.url ?? null;
}

export function getDocumentByUrl(url: string): DocumentEntry | undefined {
  const normalized = url === "/" ? "/" : url.replace(/\/$/, "");
  return urlToDocument.get(normalized);
}

export function resolveFileLink(fromPath: string, href: string): string | null {
  if (href.startsWith("#")) return href;
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//")) return null;
  const [target, fragment] = href.split("#", 2);
  const base = target.startsWith("/") ? [] : fromPath.split("/").slice(0, -1);
  for (const part of target.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!base.length) return null;
      base.pop();
    } else {
      base.push(part);
    }
  }
  const url = fileToUrl(base.join("/"));
  return url ? `${url}${fragment ? `#${fragment}` : ""}` : null;
}
