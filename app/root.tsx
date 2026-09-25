import type { ReactNode } from "react";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import { PortfolioShell } from "./PortfolioShell";
import "./styles.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function meta() {
  return [{ title: "talvnn.me — portfolio" }, { name: "description", content: "A portfolio presented as a read-only project workspace." }];
}

export default function App() {
  return <PortfolioShell />;
}
