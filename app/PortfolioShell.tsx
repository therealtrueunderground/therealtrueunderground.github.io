import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  ChevronDown, ChevronRight, ExternalLink, FileCode2, FileText,
  LayoutGrid, Mail, Maximize2, Menu, Minus, PanelBottom, PanelLeft, PanelRight,
  RotateCcw, Search, Settings2, X,
} from "lucide-react";
import { documents, getDocumentByUrl } from "./content/catalog";
import { getBacklinks, getOutgoingLinks, searchDocuments } from "./content/navigation";
import { MarkdownEditor } from "./MarkdownEditor";
import { profile } from "./profile";
import { moveTab } from "./workspace";
import { defaultSettings, parseStoredSettings, SETTINGS_KEY, type Settings } from "./settings";
import heroArt from "../art/hero.txt?raw";
import { cropAsciiMargins } from "./asciiArt";

const sectionOrder = ["About", "Projects", "Experience", "Education", "Skills"];
const home = documents[0];
const ascii = cropAsciiMargins(heroArt);

function useAppearance() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setSettings(parseStoredSettings(localStorage.getItem(SETTINGS_KEY))); }
      catch { /* Storage may be blocked. */ }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Keep settings for this visit. */ }
  }, [settings, ready]);
  return [settings, setSettings] as const;
}

function SocialIcon({ name }: { name: "Email" | "GitHub" | "LinkedIn" }) {
  if (name === "Email") return <Mail size={17} aria-hidden="true" />;
  return <span className={`brand-icon ${name.toLowerCase()}`} aria-hidden="true" />;
}

function SocialLinks() {
  const links = [
    { label: "Email" as const, href: `mailto:${profile.email}` },
    { label: "GitHub" as const, href: profile.github },
    { label: "LinkedIn" as const, href: profile.linkedin },
  ];
  return <nav className="social-links" aria-label="Contact links">
    {links.map(({ label, href }) => <a key={label} href={href} target={label === "Email" ? undefined : "_blank"} rel={label === "Email" ? undefined : "noopener noreferrer"}><SocialIcon name={label} /><span>{label}</span></a>)}
  </nav>;
}

function ReadmeAscii() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLPreElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0, scale: 0 });

  useLayoutEffect(() => {
    const scene = sceneRef.current;
    const art = artRef.current;
    if (!scene || !art) return;
    let mounted = true;
    const fit = () => {
      const width = art.scrollWidth;
      const height = art.scrollHeight;
      if (!width || !height) return;
      const scale = window.matchMedia("(max-width: 650px)").matches
        ? Math.min(scene.clientWidth * 0.94 / width, scene.clientHeight * 0.31 / height)
        : Math.min(scene.clientWidth * 0.86 / width, 1);
      const next = { width: width * scale, height: height * scale, scale };
      setSize((current) => Math.abs(current.width - next.width) < 0.25 && Math.abs(current.height - next.height) < 0.25 ? current : next);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(scene);
    fit();
    document.fonts.ready.then(() => { if (mounted) fit(); });
    return () => { mounted = false; observer.disconnect(); };
  }, []);

  return <div className="ascii-scene" ref={sceneRef} aria-hidden="true">
    <div className="ascii-viewport" style={{ width: size.width, height: size.height, visibility: size.scale ? "visible" : "hidden" }}>
      <pre className="ascii-art" ref={artRef} style={{ transform: `scale(${size.scale})` }}>{ascii}</pre>
    </div>
  </div>;
}

function Readme({ onOpen }: { onOpen: (url: string) => void }) {
  const heading = /^#\s+(.+)$/m.exec(home.source)?.[1] ?? "Portfolio";
  const paragraph = home.source.split("\n").find((line) => line && !line.startsWith("#") && !line.startsWith("-")) ?? "";
  return <div className="readme-page" aria-label="README.md">
    <div className="readme-hero">
      <div className="hero-file-marker"><FileCode2 size={15} /> README.md <span>— 001</span></div>
      <ReadmeAscii />
      <div className="hero-statement">
        <span className="eyebrow">SEEK / MAKE / LEARN</span>
        <h1>{heading}</h1>
        <blockquote>{paragraph}</blockquote>
        <SocialLinks />
      </div>
    </div>
    <div className="readme-index">
      <div className="section-kicker"><span>01</span> DIRECTORY</div>
      <h2>Explore the files.</h2>
      <div className="index-grid">
        {sectionOrder.map((section, index) => {
          const entry = documents.find((document) => document.section === section);
          if (!entry) return null;
          return <button type="button" className="index-card" key={section} onClick={() => onOpen(entry.url)}>
            <span className="index-number">0{index + 1} / {section.toUpperCase()}</span>
            <strong>{section}</strong>
            <span className="index-file">{entry.path.split("/").at(-1)} <ExternalLink size={14} /></span>
          </button>;
        })}
      </div>
    </div>
  </div>;
}

function AppearancePanel({ settings, update, close, open }: { settings: Settings; update: (patch: Partial<Settings>) => void; close: () => void; open: boolean }) {
  return <aside className={`settings-panel ${open ? "" : "is-collapsed"}`} aria-label="Appearance settings" aria-hidden={!open} inert={!open}>
    <div className="panel-heading"><span>APPEARANCE</span><button type="button" aria-label="Close settings" onClick={close}><X size={16} /></button></div>
    <div className="settings-scroll">
      <div className="settings-intro"><span>EDITOR / PREFERENCES</span><h2>Make it yours.</h2></div>
      <fieldset className="setting-group"><legend>COLOR THEME</legend><div className="segmented theme-options">
        {(["dark", "light", "mocha", "latte"] as const).map((theme) => <button type="button" key={theme} className={settings.theme === theme ? "selected" : ""} aria-pressed={settings.theme === theme} onClick={() => update({ theme })}>{theme === "mocha" || theme === "latte" ? `Catppuccin ${theme[0].toUpperCase() + theme.slice(1)}` : theme[0].toUpperCase() + theme.slice(1)}</button>)}
      </div></fieldset>
      <label className="setting-group"><span>EDITOR FONT</span><select value={settings.font} onChange={(event) => update({ font: event.target.value as Settings["font"] })}>
        <option value="jetbrains">JetBrains Mono</option><option value="ibm-plex">IBM Plex Mono</option><option value="system">System Mono</option>
      </select></label>
      <label className="setting-group range-setting"><span>FONT SIZE <output>{settings.fontSize}px</output></span><input type="range" min="14" max="22" value={settings.fontSize} onChange={(event) => update({ fontSize: Number(event.target.value) })} /></label>
      <label className="setting-group range-setting"><span>LINE HEIGHT <output>{settings.lineHeight.toFixed(1)}</output></span><input type="range" min="1.3" max="2" step="0.1" value={settings.lineHeight} onChange={(event) => update({ lineHeight: Number(event.target.value) })} /></label>
      <fieldset className="setting-group"><legend>ACCENT COLOR</legend><div className="accent-options">
        {(["ice", "violet", "amber", "mint", "rose"] as const).map((accent) => <button type="button" key={accent} className={`accent-swatch ${accent} ${settings.accent === accent ? "selected" : ""}`} aria-label={`${accent} accent`} aria-pressed={settings.accent === accent} onClick={() => update({ accent })} />)}
      </div></fieldset>
      <label className="setting-group range-setting"><span>READING WIDTH <output>{settings.readingWidth}ch</output></span><input type="range" min="60" max="110" step="2" value={settings.readingWidth} onChange={(event) => update({ readingWidth: Number(event.target.value) })} /></label>
      <label className="setting-group switch-setting"><span>WRAP LONG LINES</span><input type="checkbox" checked={settings.wrap} onChange={(event) => update({ wrap: event.target.checked })} /></label>
      <button className="reset-settings" type="button" onClick={() => update(defaultSettings)}><RotateCcw size={15} /> Reset to defaults</button>
    </div>
  </aside>;
}

export function PortfolioShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = getDocumentByUrl(location.pathname);
  const [settings, setSettings] = useAppearance();
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [layoutReady, setLayoutReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [layoutPosition, setLayoutPosition] = useState<{ x: number; y: number } | null>(null);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const layoutDragRef = useRef<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const moveFromRef = useRef<Record<string, DOMRect> | null>(null);
  const layoutAnimationsRef = useRef<Animation[]>([]);
  const [portfolioCollapsed, setPortfolioCollapsed] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const draggedTabRef = useRef<string | null>(null);
  const dragStartTabsRef = useRef<string[] | null>(null);
  const dragCompletedRef = useRef(false);
  const tabbarRef = useRef<HTMLDivElement>(null);
  const tabFromRef = useRef<Map<string, number> | null>(null);
  const tabAnimationsRef = useRef<Animation[]>([]);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropPlacement, setDropPlacement] = useState<"before" | "after">("after");
  const [tabs, setTabs] = useState<string[]>(active ? [active.path] : [home.path]);
  const [closedAtLocationKey, setClosedAtLocationKey] = useState<string | null>(null);
  const welcome = closedAtLocationKey === location.key;
  const [windowMode, setWindowMode] = useState<"open" | "minimized" | "closed">("open");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState(0);
  const [position, setPosition] = useState<{ line: number; column: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchDocuments(query).slice(0, 8), [query]);
  const displayTabs = active && !welcome && !tabs.includes(active.path) ? [...tabs, active.path] : tabs;


  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setWindowMode("open"); setPaletteOpen(true);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setExplorerOpen((current) => !current);
        if (window.innerWidth <= 650) setSettingsOpen(false);
      } else if (event.key === "Escape") { setPaletteOpen(false); setLayoutOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 850px)");
    const hidePanels = () => {
      if (!compact.matches) return;
      setSettingsOpen(false);
      if (window.matchMedia("(max-width: 650px)").matches) setExplorerOpen(false);
    };
    const frame = requestAnimationFrame(() => {
      hidePanels();
      setLayoutReady(true);
    });
    compact.addEventListener("change", hidePanels);
    return () => {
      cancelAnimationFrame(frame);
      compact.removeEventListener("change", hidePanels);
    };
  }, []);
  useEffect(() => {
    if (!paletteOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    searchRef.current?.focus();
    return () => previous?.focus();
  }, [paletteOpen]);
  useLayoutEffect(() => {
    const from = moveFromRef.current;
    moveFromRef.current = null;
    if (!from) return;
    layoutAnimationsRef.current.forEach((animation) => animation.cancel());
    layoutAnimationsRef.current = [];
    if (window.matchMedia("(max-width: 850px), (prefers-reduced-motion: reduce)").matches) return;
    for (const selector of [".explorer", ".editor-pane", ".settings-panel"]) {
      const element = workspaceRef.current?.querySelector<HTMLElement>(selector);
      const before = from[selector];
      if (!element || !before || before.width < 1) continue;
      const after = element.getBoundingClientRect();
      const distance = before.left - after.left;
      if (Math.abs(distance) < 2) continue;
      const animation = element.animate(
        [{ transform: `translateX(${distance}px)` }, { transform: "translateX(0)" }],
        { duration: 420, easing: "cubic-bezier(.22,.8,.22,1)", fill: "both" },
      );
      animation.onfinish = () => animation.cancel();
      layoutAnimationsRef.current.push(animation);
    }
  }, [settings.sidebarPosition]);
  useLayoutEffect(() => {
    const from = tabFromRef.current;
    tabFromRef.current = null;
    if (!from) return;
    tabAnimationsRef.current.forEach((animation) => animation.cancel());
    tabAnimationsRef.current = [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const tab of tabbarRef.current?.querySelectorAll<HTMLElement>(".editor-tab") ?? []) {
      const path = tab.dataset.path;
      if (!path || path === draggedTabRef.current) continue;
      const before = from.get(path);
      if (before === undefined) continue;
      const distance = before - tab.getBoundingClientRect().left;
      if (Math.abs(distance) < 1) continue;
      const animation = tab.animate(
        [{ transform: `translateX(${distance}px)` }, { transform: "translateX(0)" }],
        { duration: 180, easing: "cubic-bezier(.22,.8,.22,1)", fill: "both" },
      );
      animation.onfinish = () => animation.cancel();
      tabAnimationsRef.current.push(animation);
    }
  }, [tabs]);

  useEffect(() => {
    const resetPosition = () => setLayoutPosition(null);
    window.addEventListener("resize", resetPosition);
    return () => window.removeEventListener("resize", resetPosition);
  }, []);

  const openUrl = (url: string) => { const target = documents.find((entry) => entry.url === url.split("#", 1)[0]); if (target) setTabs((current) => current.includes(target.path) ? current : [...current, target.path]); setClosedAtLocationKey(null); setPaletteOpen(false); setPosition(null); navigate(url); };
  const selectTreeFile = (path: string) => { setTabs((current) => current.includes(path) ? current : [...current, path]); setClosedAtLocationKey(null); setPosition(null); if (window.innerWidth <= 650) setExplorerOpen(false); };
  const keepPaletteFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const items = paletteRef.current?.querySelectorAll<HTMLElement>("input, button");
    if (!items?.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  const updateSettings = (patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch }));
  const movePrimarySideBar = (position: Settings["sidebarPosition"]) => {
    if (position === settings.sidebarPosition) return;
    const root = workspaceRef.current;
    moveFromRef.current = root
      ? Object.fromEntries(
        [".explorer", ".editor-pane", ".settings-panel"].flatMap((selector) => {
          const element = root.querySelector<HTMLElement>(selector);
          return element ? [[selector, element.getBoundingClientRect()]] : [];
        }),
      )
      : null;
    updateSettings({ sidebarPosition: position });
  };
  const clampLayoutPosition = (x: number, y: number) => {
    const menu = layoutMenuRef.current;
    return {
      x: Math.max(8, Math.min(x, window.innerWidth - (menu?.offsetWidth ?? 300) - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - (menu?.offsetHeight ?? 340) - 8)),
    };
  };
  const startLayoutDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    const rect = layoutMenuRef.current?.getBoundingClientRect();
    if (!rect) return;
    layoutDragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const moveLayoutDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = layoutDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setLayoutPosition(clampLayoutPosition(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y));
  };
  const endLayoutDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (layoutDragRef.current?.pointerId !== event.pointerId) return;
    layoutDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const moveLayoutWithKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !event.altKey) return;
    const offsets: Record<string, [number, number]> = {
      ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16],
    };
    const offset = offsets[event.key];
    if (!offset) return;
    const rect = layoutMenuRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    setLayoutPosition(clampLayoutPosition(rect.left + offset[0], rect.top + offset[1]));
  };
  const toggleExplorer = () => {
    setExplorerOpen((current) => !current);
    if (!explorerOpen && window.innerWidth <= 650) setSettingsOpen(false);
  };
  const toggleSettings = () => {
    setSettingsOpen((current) => !current);
    if (!settingsOpen && window.innerWidth <= 650) setExplorerOpen(false);
  };
  const closeTab = (path: string) => {
    const remaining = displayTabs.filter((tab) => tab !== path);
    setTabs(remaining);
    if (active?.path === path) {
      const next = remaining.at(-1);
      if (next) openUrl(documents.find((document) => document.path === next)?.url ?? "/");
      else setClosedAtLocationKey(location.key);
    }
  };
  const toggleFolder = (section: string) => setCollapsed((current) => current.includes(section) ? current.filter((item) => item !== section) : [...current, section]);
  const handleTreeKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.matches(".tree-folder, .tree-file")) return;
    if (event.key === "ArrowLeft" && target.matches(".tree-folder") && target.getAttribute("aria-expanded") === "true") {
      event.preventDefault(); target.click(); return;
    }
    if (event.key === "ArrowRight" && target.matches(".tree-folder") && target.getAttribute("aria-expanded") === "false") {
      event.preventDefault(); target.click(); return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(".tree-folder, .tree-file"));
    const index = items.indexOf(target);
    const next = items[index + (event.key === "ArrowDown" ? 1 : -1)];
    if (next) { event.preventDefault(); next.focus(); }
  };
  const showFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* The browser may decline fullscreen. */ }
  };

  const pageStyle = {
    "--editor-size": `${settings.fontSize}px`,
    "--editor-leading": settings.lineHeight,
    "--reading-width": `${settings.readingWidth}ch`,
  } as CSSProperties;
  const breadcrumb = active?.path.split("/") ?? ["README.md"];

  if (windowMode !== "open") return <div className={`desktop-state theme-${settings.theme} font-${settings.font}`} data-accent={settings.accent}>
    <header className="desktop-title"><span className="brand-glyph">t/</span><span>talvnn.me</span><span className="desktop-title-path">portfolio / read-only</span></header>
    <div className="desktop-body">
      <nav className="desktop-rail" aria-label="Portfolio shortcuts">
        <button type="button" aria-label="Open portfolio" onClick={() => { if (windowMode === "closed") openUrl("/"); setWindowMode("open"); }}><PanelLeft size={21} /></button>
        <button type="button" aria-label="Quick open files" onClick={() => { setWindowMode("open"); setPaletteOpen(true); }}><Search size={21} /></button>
      </nav>
      <main className="desktop-welcome">
        <h1 className="visually-hidden">talvnn.me portfolio</h1>
        <div className="desktop-watermark" aria-hidden="true">t/</div>
        <div className="desktop-actions">
          <button type="button" autoFocus onClick={() => { if (windowMode === "closed") openUrl("/"); setWindowMode("open"); }}>{windowMode === "closed" ? "Open portfolio" : "Restore portfolio"}<kbd>ENTER</kbd></button>
          <button type="button" onClick={() => { setWindowMode("open"); setPaletteOpen(true); }}>Quick open files<kbd>CTRL K</kbd></button>
          <button type="button" onClick={() => { openUrl("/about"); setWindowMode("open"); }}>About<kbd>ABOUT</kbd></button>
        </div>
      </main>
    </div>
    <div className="desktop-status"><span>TALVNN.ME</span><span>Read-only</span></div>
  </div>;

  return <div className={`site-root theme-${settings.theme} font-${settings.font}`} data-accent={settings.accent} data-sidebar-position={settings.sidebarPosition} data-layout-ready={layoutReady} style={pageStyle}>
    <div className="window-frame">
      <header className="titlebar">
        <div className="brand-mark"><span className="brand-glyph">t/</span><span>talvnn.me</span></div>
        <div className="breadcrumb" aria-label="Virtual file path"><span>talvnn.me</span><ChevronRight size={13} /><span>portfolio</span>{breadcrumb.map((piece) => <span className="crumb" key={piece}><ChevronRight size={13} />{piece}</span>)}</div>
        <div className="layout-controls">
          <button type="button" aria-label="Customize layout" aria-expanded={layoutOpen} onClick={() => setLayoutOpen((current) => !current)}><LayoutGrid size={17} /></button>
          <button type="button" aria-label="Toggle primary side bar" aria-pressed={explorerOpen} onClick={toggleExplorer}><PanelLeft size={17} /></button>
          <button type="button" aria-label="Toggle panel" aria-pressed={panelOpen} onClick={() => setPanelOpen((current) => !current)}><PanelBottom size={17} /></button>
          <button type="button" aria-label="Toggle secondary side bar" aria-pressed={settingsOpen} onClick={toggleSettings}><PanelRight size={17} /></button>
        </div>
        <div className="window-controls"><button type="button" aria-label="Minimize portfolio" onClick={() => setWindowMode("minimized")}><Minus size={16} /></button><button type="button" aria-label="Toggle fullscreen" onClick={showFullscreen}><Maximize2 size={14} /></button><button type="button" aria-label="Close portfolio" onClick={() => setWindowMode("closed")}><X size={17} /></button></div>
      </header>
      {layoutOpen && <div className="layout-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setLayoutOpen(false); }}>
        <div className="layout-menu" ref={layoutMenuRef} role="dialog" aria-label="Customize layout" style={layoutPosition ? { left: layoutPosition.x, top: layoutPosition.y, right: "auto" } : undefined}>
          <div className="layout-menu-title" tabIndex={0} aria-label="Drag Customize Layout; Alt and arrow keys move it" onPointerDown={startLayoutDrag} onPointerMove={moveLayoutDrag} onPointerUp={endLayoutDrag} onPointerCancel={endLayoutDrag} onKeyDown={moveLayoutWithKeyboard}><span>Customize Layout</span><button type="button" aria-label="Close customize layout" onClick={() => setLayoutOpen(false)}><X size={15} /></button></div>
          <button type="button" aria-pressed={explorerOpen} onClick={toggleExplorer}><PanelLeft size={16} /> Primary Side Bar <span>{explorerOpen ? "On" : "Off"}</span></button>
          <button type="button" aria-pressed={settingsOpen} onClick={toggleSettings}><PanelRight size={16} /> Secondary Side Bar <span>{settingsOpen ? "On" : "Off"}</span></button>
          <button type="button" aria-pressed={panelOpen} onClick={() => setPanelOpen((current) => !current)}><PanelBottom size={16} /> Panel <span>{panelOpen ? "On" : "Off"}</span></button>
          <div className="layout-menu-label">PRIMARY SIDE BAR POSITION</div>
          <div className="layout-position">
            <button type="button" aria-pressed={settings.sidebarPosition === "left"} onClick={() => movePrimarySideBar("left")}>Left</button>
            <button type="button" aria-pressed={settings.sidebarPosition === "right"} onClick={() => movePrimarySideBar("right")}>Right</button>
          </div>
        </div>
      </div>}
      <div className="workspace" ref={workspaceRef}>
        <nav className="activity-bar" aria-label="Workspace controls">
          <div><button type="button" className={explorerOpen ? "active" : ""} aria-label={explorerOpen ? "Hide explorer" : "Show explorer"} onClick={toggleExplorer}><Menu size={22} /></button><button type="button" aria-label="Quick open files" onClick={() => setPaletteOpen(true)}><Search size={22} /></button></div>
          <button type="button" className={settingsOpen ? "active" : ""} aria-label={settingsOpen ? "Hide settings" : "Show settings"} onClick={toggleSettings}><Settings2 size={21} /></button>
        </nav>
        <aside className={`explorer ${explorerOpen ? "" : "is-collapsed"}`} aria-label="File explorer" aria-hidden={!explorerOpen} inert={!explorerOpen}>
          <div className="panel-heading"><span>EXPLORER</span><span className="panel-dots">•••</span></div>
          <div className="explorer-content" onKeyDown={handleTreeKeys}>
            <div className="explorer-root"><ChevronDown size={14} /> TALVNN.ME</div>
            <button type="button" className="tree-folder portfolio-folder" aria-expanded={!portfolioCollapsed} onClick={() => setPortfolioCollapsed((current) => !current)}>
              {portfolioCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <img className="folder-icon" src="/icons/folder-base.svg" alt="" />portfolio
            </button>
            {!portfolioCollapsed && <div className="portfolio-contents">
              <Link className={`tree-file root-file ${active?.path === home.path && !welcome ? "selected" : ""}`} to="/" onClick={() => selectTreeFile(home.path)}><img className="file-icon" src="/icons/markdown.svg" alt="" /> README.md</Link>
              {sectionOrder.map((section) => <div className="tree-group" key={section}>
                <button type="button" className="tree-folder" aria-expanded={!collapsed.includes(section)} onClick={() => toggleFolder(section)}>{collapsed.includes(section) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}<img className="folder-icon" src={section === "Projects" ? "/icons/folder-project.svg" : section === "Skills" ? "/icons/folder-skills.svg" : "/icons/folder-base.svg"} alt="" />{section}</button>
                {!collapsed.includes(section) && documents.filter((entry) => entry.section === section).map((entry) => <Link key={entry.path} to={entry.url} className={`tree-file ${active?.path === entry.path && !welcome ? "selected" : ""}`} onClick={() => selectTreeFile(entry.path)}><img className="file-icon" src="/icons/markdown.svg" alt="" />{entry.path.split("/").at(-1)}</Link>)}
              </div>)}
            </div>}
          </div>
          <div className="explorer-footer"><SocialLinks /><button type="button" className="cv-placeholder" disabled title="CV will be available later" aria-label="CV, coming soon"><FileText size={17} />CV<small>SOON</small></button></div>
        </aside>
        <main className="editor-pane">
          <div className="tabbar" ref={tabbarRef} role="tablist" aria-label="Open files">{displayTabs.map((path) => {
            const entry = documents.find((document) => document.path === path);
            if (!entry) return null;
            return <div key={path} data-path={path} className={`editor-tab ${active?.path === path && !welcome ? "active" : ""} ${draggedTab === path ? "dragging" : ""} ${dropTarget === path ? `drop-${dropPlacement}` : ""}`} role="tab" aria-selected={active?.path === path && !welcome}
              draggable onDragStart={(event) => {
                draggedTabRef.current = path;
                dragStartTabsRef.current = displayTabs;
                dragCompletedRef.current = false;
                setDraggedTab(path);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", path);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                const source = draggedTabRef.current;
                if (!source || source === path) return;
                const placement = event.clientX < event.currentTarget.getBoundingClientRect().left + event.currentTarget.clientWidth / 2 ? "before" : "after";
                setDropTarget(path);
                setDropPlacement(placement);
                const next = moveTab(displayTabs, source, path, placement);
                if (next.every((tab, index) => tab === displayTabs[index])) return;
                tabAnimationsRef.current.forEach((animation) => animation.cancel());
                tabFromRef.current = new Map(Array.from(tabbarRef.current?.querySelectorAll<HTMLElement>(".editor-tab") ?? [])
                  .map((tab) => [tab.dataset.path ?? "", tab.getBoundingClientRect().left]));
                setTabs(next);
              }}
              onDrop={(event) => { event.preventDefault(); dragCompletedRef.current = true; setDropTarget(null); }}
              onDragEnd={() => {
                if (!dragCompletedRef.current && dragStartTabsRef.current) setTabs(dragStartTabsRef.current);
                draggedTabRef.current = null;
                dragStartTabsRef.current = null;
                setDraggedTab(null);
                setDropTarget(null);
              }}>
              <button type="button" className="tab-name" title="Drag to reorder; Alt+Left/Right to move" onClick={() => openUrl(entry.url)} onKeyDown={(event) => {
                if (!event.altKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
                const direction = event.key === "ArrowLeft" ? -1 : 1;
                const neighbor = displayTabs[displayTabs.indexOf(path) + direction];
                if (neighbor) { event.preventDefault(); setTabs(moveTab(displayTabs, path, neighbor, direction < 0 ? "before" : "after")); }
              }}><img className="file-icon" src="/icons/markdown.svg" alt="" />{path.split("/").at(-1)}</button><button type="button" className="tab-close" aria-label={`Close ${path}`} onClick={() => closeTab(path)}><X size={14} /></button>
            </div>;
          })}</div>
          <div className="editor-content" key={welcome ? "welcome" : active?.path}>
            {welcome ? <div className="welcome-screen"><FileCode2 size={38} /><h1>Open a file.</h1><button type="button" onClick={() => openUrl("/")}>Open README.md</button></div>
              : active?.path === "README.md" ? <Readme onOpen={openUrl} />
              : active ? <div className="document-page"><div className="document-header"><span>{active.section?.toUpperCase()} / {active.path.split("/").at(-1)}</span><span>READ ONLY</span></div><MarkdownEditor documentEntry={active} wrap={settings.wrap} onOpenLink={openUrl} onPosition={(line, column) => setPosition(line === null || column === null ? null : { line, column })} />
                {getOutgoingLinks(active.path).length > 0 && <div className="backlinks"><span>LINKED FILES</span>{getOutgoingLinks(active.path).map((entry) => <button type="button" key={entry.path} onClick={() => openUrl(entry.url)}><FileText size={14} />{entry.path}</button>)}</div>}
                {getBacklinks(active.path).length > 0 && <div className="backlinks"><span>REFERENCED IN</span>{getBacklinks(active.path).map((entry) => <button type="button" key={entry.path} onClick={() => openUrl(entry.url)}><FileText size={14} />{entry.path}</button>)}</div>}
                {active.path === "About/introduction.md" && <div className="about-contact"><span>FIND ME</span><SocialLinks /></div>}</div>
              : <div className="welcome-screen"><h1>File not found.</h1><Link to="/">Open README.md</Link></div>}
          </div>
          <section className={`bottom-panel ${panelOpen ? "" : "is-collapsed"}`} aria-label="Open files panel" aria-hidden={!panelOpen} inert={!panelOpen}>
            <div className="bottom-panel-heading"><span>OPEN FILES</span><button type="button" aria-label="Close panel" onClick={() => setPanelOpen(false)}><X size={15} /></button></div>
            <div className="bottom-panel-files">{documents.map((entry) => <button type="button" key={entry.path} className={active?.path === entry.path && !welcome ? "selected" : ""} onClick={() => openUrl(entry.url)}><img className="file-icon" src="/icons/markdown.svg" alt="" /><span>{entry.path}</span></button>)}</div>
          </section>
          <div className="statusbar"><span className="status-brand">t/ <span>PORTFOLIO</span></span><span className="status-file">{welcome ? "NO FILE OPEN" : active?.path ?? "UNKNOWN FILE"}</span><span className="status-spacer" />{position && !welcome && <span>Ln {position.line}, Col {position.column}</span>}<span>Markdown</span><span>Read-only</span><button type="button" aria-label={settingsOpen ? "Hide appearance settings" : "Show appearance settings"} aria-pressed={settingsOpen} onClick={toggleSettings}><Settings2 size={14} /></button></div>
        </main>
        <AppearancePanel settings={settings} update={updateSettings} close={() => setSettingsOpen(false)} open={settingsOpen} />
      </div>
    </div>
    {paletteOpen && <div className="palette-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false); }}><div className="command-palette" ref={paletteRef} onKeyDown={keepPaletteFocus} role="dialog" aria-modal="true" aria-label="Quick open files">
      <div className="palette-search"><Search size={20} /><input ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); setSelectedResult(0); }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setSelectedResult((current) => Math.min(current + 1, results.length - 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setSelectedResult((current) => Math.max(current - 1, 0)); } if (event.key === "Enter" && results[selectedResult]) openUrl(results[selectedResult].url); }} placeholder="Search files and sections…" aria-label="Search files" /><kbd>ESC</kbd></div>
      <div className="palette-results">{results.length ? results.map((entry, index) => <button type="button" key={entry.path} className={index === selectedResult ? "highlighted" : ""} onMouseEnter={() => setSelectedResult(index)} onClick={() => openUrl(entry.url)}><FileText size={17} /><span><strong>{entry.title}</strong><small>{entry.path}</small></span><ChevronRight size={15} /></button>) : <p>No matching files.</p>}</div>
      <div className="palette-footer"><span className="palette-brand-glyph" aria-hidden="true">t/</span> QUICK OPEN <span>↑ ↓ TO NAVIGATE · ENTER TO OPEN</span></div>
    </div></div>}
  </div>;
}
