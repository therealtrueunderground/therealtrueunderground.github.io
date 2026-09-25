import { useEffect, useRef } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { markdown } from "@codemirror/lang-markdown";
import { Decoration, EditorView, WidgetType, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import type { DocumentEntry } from "./content/catalog";
import { resolveFileLink } from "./content/catalog";

const markdownColors = HighlightStyle.define([
  { tag: tags.heading, color: "var(--syntax-heading)", fontWeight: "700" },
  { tag: tags.link, color: "var(--syntax-link)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--syntax-url)" },
  { tag: tags.emphasis, color: "var(--syntax-emphasis)", fontStyle: "italic" },
  { tag: tags.strong, color: "var(--syntax-strong)", fontWeight: "700" },
  { tag: tags.quote, color: "var(--syntax-quote)" },
  { tag: tags.monospace, color: "var(--syntax-code)" },
  { tag: tags.processingInstruction, color: "var(--muted)" },
]);

class ImagePreview extends WidgetType {
  constructor(readonly src: string, readonly alt: string) { super(); }

  eq(other: ImagePreview) { return other.src === this.src && other.alt === this.alt; }

  toDOM() {
    const figure = document.createElement("figure");
    figure.className = "editor-image";
    const link = document.createElement("a");
    link.href = this.src;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Open image: ${this.alt}`);
    const image = document.createElement("img");
    image.src = this.src;
    image.alt = this.alt;
    image.loading = "lazy";
    link.append(image);
    const caption = document.createElement("figcaption");
    caption.textContent = this.alt;
    figure.append(link, caption);
    return figure;
  }
}

function imageDecorations(source: string) {
  const widgets = [];
  let offset = 0;
  for (const line of source.split("\n")) {
    const match = /^!\[([^\]]+)\]\((\/media\/[a-zA-Z0-9/_-]+\.(?:avif|webp|png|jpe?g))\)$/.exec(line.trim());
    if (match) {
      widgets.push(Decoration.widget({ widget: new ImagePreview(match[2], match[1]), block: true, side: 1 }).range(offset + line.length));
    }
    offset += line.length + 1;
  }
  return Decoration.set(widgets);
}

type LinkDestination = { kind: "internal" | "external" | "email"; url: string };

function linkDestination(fromPath: string, href: string): LinkDestination | null {
  const internal = resolveFileLink(fromPath, href);
  if (internal) return { kind: "internal", url: internal };
  if (/^https?:\/\//i.test(href)) return { kind: "external", url: href };
  if (/^mailto:/i.test(href)) return { kind: "email", url: href };
  return null;
}

function linksInLine(line: string, fromPath: string) {
  return [...line.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].flatMap((match) => {
    const destination = linkDestination(fromPath, match[1]);
    if (!destination) return [];
    const from = match.index ?? 0;
    return [{ from, to: from + match[0].length, destination }];
  });
}

function linkDecorations(source: string, fromPath: string) {
  const marks = [];
  let offset = 0;
  for (const line of source.split("\n")) {
    for (const link of linksInLine(line, fromPath)) {
      marks.push(Decoration.mark({ class: "cm-navigable-link" }).range(offset + link.from, offset + link.to));
    }
    offset += line.length + 1;
  }
  return Decoration.set(marks);
}

export function MarkdownEditor({ documentEntry, wrap, onOpenLink, onPosition }: {
  documentEntry: DocumentEntry;
  wrap: boolean;
  onOpenLink: (url: string) => void;
  onPosition: (line: number | null, column: number | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const wrapCompartment = useRef(new Compartment());
  const openLinkRef = useRef(onOpenLink);
  const positionRef = useRef(onPosition);
  useEffect(() => { openLinkRef.current = onOpenLink; positionRef.current = onPosition; }, [onOpenLink, onPosition]);

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      doc: documentEntry.source,
      extensions: [
        lineNumbers(),
        markdown({ codeLanguages: languages, addKeymap: false }),
        syntaxHighlighting(markdownColors),
        EditorState.readOnly.of(true),
        EditorView.contentAttributes.of({ tabindex: "0", "aria-label": `${documentEntry.path}, read only`, "aria-readonly": "true" }),
        wrapCompartment.current.of(EditorView.lineWrapping),
        EditorView.decorations.of(imageDecorations(documentEntry.source)),
        EditorView.decorations.of(linkDecorations(documentEntry.source, documentEntry.path)),
        EditorView.updateListener.of((update) => {
          if (!update.selectionSet) return;
          const selection = update.state.selection.main;
          if (selection.empty) { positionRef.current(null, null); return; }
          const position = update.state.doc.lineAt(selection.head);
          positionRef.current(position.number, selection.head - position.from + 1);
        }),
        EditorView.domEventHandlers({
          click(event, currentView) {
            const position = currentView.posAtCoords({ x: event.clientX, y: event.clientY });
            if (position === null) return false;
            const line = currentView.state.doc.lineAt(position);
            const link = linksInLine(line.text, documentEntry.path)
              .find(({ from, to }) => position >= line.from + from && position < line.from + to);
            if (!link) return false;
            if (link.destination.kind === "internal") openLinkRef.current(link.destination.url);
            if (link.destination.kind === "external") window.open(link.destination.url, "_blank", "noopener,noreferrer");
            if (link.destination.kind === "email") window.location.href = link.destination.url;
            event.preventDefault();
            return true;
          },
        }),
      ],
    });
    view.current = editor;
    return () => {
      positionRef.current(null, null);
      editor.destroy();
      view.current = null;
    };
  }, [documentEntry.path, documentEntry.source]);

  useEffect(() => {
    view.current?.dispatch({ effects: wrapCompartment.current.reconfigure(wrap ? EditorView.lineWrapping : []) });
  }, [wrap]);

  return <div className="markdown-editor" ref={host} />;
}
