# Portfolio architecture

## Purpose

A read-only portfolio presented as a small IDE. Visitors navigate files; only the site owner changes Markdown and assets in Git. The public routes are short (`/about`, `/projects`, and so on), while the title bar shows a fictional project path such as `talvnn.me / portfolio / About / introduction.md`.

## Source tree

```text
README.md                    Home page title, opening statement and section links
About/introduction.md        Personal introduction
Projects/README.md           Projects index
Projects/<slug>.md           One project per file; URL /projects/<slug>
Experience/timeline.md       Experience
Education/education.md       Education
Skills/stack.md              Skills
public/media/                Project images (add when content is ready)
public/favicon.svg           Site icon
public/icons/                Material file/folder icons and contact icons
art/hero.txt                  Owner-supplied complete ASCII shown on the README page
app/content/catalog.ts       File registry and public URL mapping
app/content/navigation.ts    Quick open search and backlinks
app/asciiArt.ts               Crops blank ASCII margins at render time
app/MarkdownEditor.tsx       Read-only CodeMirror, line numbers, syntax, links, images
app/PortfolioShell.tsx       Explorer, movable tabs, layout controls, virtual path, README, settings, status
app/settings.ts              Validated, locally persisted appearance and layout preferences
app/profile.ts               Email, GitHub and LinkedIn configuration
app/styles.css               Original and Catppuccin themes, responsive layout
react-router.config.ts       Static prerender routes, including project files
.github/workflows/deploy.yml Manual GitHub Pages build and deploy
```

`art/hero.txt` is the owner-supplied complete 400-column ASCII artwork, with its characters and spacing unchanged. `app/asciiArt.ts` removes only its empty outer rows and columns in memory. The home page renders the result in a `<pre>`: desktop sizing follows the occupied artwork width and lets its lower part continue beyond the README window, while mobile sizing keeps it above the statement. `ResizeObserver` updates the fit when panels resize. The README hero uses the same dark background and text colors in every appearance theme; the surrounding editor chrome still follows the selected theme. Earlier art sources, generators and visual references remain local and are ignored by Git.

## Editing content

1. Update `app/profile.ts` when your email, GitHub, or LinkedIn changes. The configured links appear in the explorer, README and About.
2. Edit the five section Markdown files to update facts you choose to publish. `Projects/README.md` currently keeps project details private. The heading and first prose paragraph in the root `README.md` become the designed home hero; the five section links are represented by navigation cards.
3. Add each project as `Projects/<slug>.md` with a first-level heading. Use lowercase URL-friendly slugs (letters, digits and hyphens). The file is discovered automatically, added to the Projects folder and prerendered at `/projects/<slug>`.
4. Link between files with relative Markdown paths, for example `[Skills](../Skills/stack.md)` from a project file or `[My project](../Projects/my-project.md)` from Experience. The viewer converts these to public URLs; matching incoming links appear under “Referenced in.”
5. Put screenshots in `public/media/` and place a line like `![Short description](/media/my-project-screen.webp)` in a Markdown file. The viewer shows the image below that source line with its description as a caption. Use a meaningful description for accessibility and explain the image in surrounding text.

The site never accepts edits from visitors. Appearance choices are local to each visitor's browser and do not change the Markdown files. The layout menu can be dragged by its title or moved with Alt plus arrow keys; sidebars and the lower panel animate between positions. File tabs reorder as they are dragged, with neighboring tabs animated. Reduced-motion preferences disable these animations. The CV control remains disabled until a real document is available.

## Routes and hosting

`react-router.config.ts` prerenders `/`, `/about`, `/projects`, `/experience`, `/education`, `/skills` and each project detail URL. The static output is `build/client/`. That directory is the GitHub Pages artifact; direct visits to the known URLs use their own generated `index.html` files. Client navigation shows `/about`, while static hosts such as GitHub Pages may add a trailing slash to a direct visit because the page is stored as `about/index.html`. If an exact slash-free URL is essential, use a host with rewrite rules. `talvnn.me` must be configured as the Pages custom domain in the repository settings and DNS. The workflow publishes only when manually started with Run workflow after setting the repository Pages source to GitHub Actions. This checkout tracks the existing `origin/main` history. That branch currently contains the old placeholder `index.html` and a `CNAME` file with `talvnn.me`. The placeholder is intentionally removed by the prepared change. GitHub Actions publishing ignores a repository `CNAME` file; configure or verify `talvnn.me` in the repository's Pages settings. The apex domain currently resolves to the four GitHub Pages IPv4 addresses (verified 2026-09-25), so DNS need not be changed unless that stops being true.

## Publishing safely

1. In the repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. Confirm **Custom domain** is `talvnn.me`.
2. Inspect the staged file list with `git diff --cached --name-status` and review `git diff --cached`. Only application source, Markdown content, required icon licenses, `art/hero.txt`, build configuration, and the workflow should be included. The old `index.html` should be deleted. Local `design/`, superseded ASCII sources, generators, `output/`, `node_modules/`, `build/`, and `.env*` should not be present.
3. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Inspect `build/client/`; it is the only deployed artifact.
4. Commit the reviewed staged change and push `main` to `origin`. In **Actions → Deploy portfolio**, choose **Run workflow** on `main`. Check the deployment URL and test `/`, `/about/`, `/projects/`, `/experience/`, `/education/`, and `/skills/` directly.
5. After GitHub offers it, enable **Enforce HTTPS** in **Settings → Pages**.

Publishing is manual so a push alone cannot replace the live site. No local build output or development files are sent by the workflow.

## Local commands

```powershell
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

The editor uses React, TypeScript, React Router static prerendering, CodeMirror 6 with Markdown syntax parsing, local JetBrains Mono and IBM Plex Mono fonts, and CSS themes. File and folder icons come from Material Icon Theme; GitHub and LinkedIn icons come from Font Awesome Free brands. There is no server, database or visitor account.
