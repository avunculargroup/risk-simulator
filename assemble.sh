#!/bin/bash

# ═══════════════════════════════════════════════════════

# BTC Treasury Risk Simulator — Project Assembly Script

# 

# This script takes the source files generated during the

# spec/design phase and assembles them into a proper

# Next.js project structure ready for Claude Code.

# 

# Usage:

# chmod +x scripts/assemble.sh

# ./scripts/assemble.sh /path/to/source/files /path/to/project

# 

# After running, cd into the project and run:

# npm install

# cp .env.local.example .env.local  (then fill in values)

# npm run db:push

# npm run dev

# ═══════════════════════════════════════════════════════

set -e

SOURCE_DIR=”${1:-.}”
PROJECT_DIR=”${2:-./btc-treasury-risk}”

echo “═══════════════════════════════════════════════”
echo “  Assembling BTC Treasury Risk Simulator”
echo “  Source: $SOURCE_DIR”
echo “  Target: $PROJECT_DIR”
echo “═══════════════════════════════════════════════”

# ── Create directory structure ──

echo “→ Creating directory structure…”
mkdir -p “$PROJECT_DIR”/{src/{app/{"(auth)"/{login,register},dashboard,position,alerts,api/{simulation/{run,"[id]",history},position/{lots/"[id]",import,what-if},alerts/{rules,events},price/current,auth/"[…nextauth]"}},components/{ui,dashboard,position},engine,db/queries,hooks,lib,workers},drizzle/migrations,scripts,public}

# ── Copy config files ──

echo “→ Copying config files…”
cp “$SOURCE_DIR/CLAUDE.md”            “$PROJECT_DIR/CLAUDE.md”
cp “$SOURCE_DIR/DESIGN_BRIEF.md”     “$PROJECT_DIR/DESIGN_BRIEF.md”
cp “$SOURCE_DIR/package.json”         “$PROJECT_DIR/package.json”
cp “$SOURCE_DIR/tsconfig.json”        “$PROJECT_DIR/tsconfig.json”
cp “$SOURCE_DIR/tailwind.config.ts”   “$PROJECT_DIR/tailwind.config.ts”
cp “$SOURCE_DIR/drizzle.config.ts”    “$PROJECT_DIR/drizzle.config.ts”
cp “$SOURCE_DIR/.env.local.example”   “$PROJECT_DIR/.env.local.example”

# ── Copy logo ──

echo “→ Copying logo…”
if [ -f “$SOURCE_DIR/logo.svg” ]; then
cp “$SOURCE_DIR/logo.svg” “$PROJECT_DIR/public/logo.svg”
fi

# ── Copy database files ──

echo “→ Copying database layer…”
cp “$SOURCE_DIR/schema.ts”            “$PROJECT_DIR/src/db/schema.ts”
cp “$SOURCE_DIR/db-client.ts”         “$PROJECT_DIR/src/db/client.ts”
cp “$SOURCE_DIR/supabase-setup.sql”   “$PROJECT_DIR/scripts/supabase-setup.sql”

# ── Copy simulation engine ──

echo “→ Copying simulation engine…”
for f in types.ts math.ts risk-metrics.ts monte-carlo.ts historical-replay.ts macro-correlated.ts custom-stress-test.ts narrative.ts utils.ts index.ts worker.ts; do
if [ -f “$SOURCE_DIR/engine/$f” ]; then
cp “$SOURCE_DIR/engine/$f” “$PROJECT_DIR/src/engine/$f”
fi
done

# ── Copy worker entry point ──

echo “→ Setting up worker…”
if [ -f “$PROJECT_DIR/src/engine/worker.ts” ]; then
cp “$PROJECT_DIR/src/engine/worker.ts” “$PROJECT_DIR/src/workers/simulation-worker.ts”
fi

# ── Copy UI components (these need to be split from the monolithic JSX artifacts) ──

echo “→ Copying UI source files…”
if [ -f “$SOURCE_DIR/dashboard-responsive.jsx” ]; then
cp “$SOURCE_DIR/dashboard-responsive.jsx” “$PROJECT_DIR/src/app/dashboard/_dashboard-prototype.jsx”
fi
if [ -f “$SOURCE_DIR/position-manager.jsx” ]; then
cp “$SOURCE_DIR/position-manager.jsx” “$PROJECT_DIR/src/app/position/_position-prototype.jsx”
fi

# ── Create placeholder files for unbuilt components ──

echo “→ Creating placeholder files…”

# next.config.ts

cat > “$PROJECT_DIR/next.config.ts” << ‘NEXTCONFIG’
import type { NextConfig } from “next”;

const nextConfig: NextConfig = {
experimental: {
serverComponentsExternalPackages: [“bullmq”, “ioredis”],
},
// Standalone output for containerized deployment
output: “standalone”,
};

export default nextConfig;
NEXTCONFIG

# postcss.config.js

cat > “$PROJECT_DIR/postcss.config.js” << ‘POSTCSS’
module.exports = {
plugins: {
tailwindcss: {},
autoprefixer: {},
},
};
POSTCSS

# Global CSS with design tokens from DESIGN_BRIEF.md

cat > “$PROJECT_DIR/src/app/globals.css” << ‘GLOBALS’
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url(‘https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap’);

/* ═══════════════════════════════════════════════════════
DESIGN TOKENS — Light Mode (Default)
Source of truth: DESIGN_BRIEF.md
═══════════════════════════════════════════════════════ */

:root {
/* Surfaces */
–color-bg: #FAFAF8;
–color-surface: #FFFFFF;
–color-surface-subtle: #F4F4F1;
–color-border: #E8E6E0;
–color-border-light: #D4D2CC;

/* Text */
–color-text-primary: #1A1915;
–color-text-secondary: #6B6860;
–color-text-tertiary: #9E9C96;

/* Gold accent (derived from logo gradient) */
–color-gold: #C9A84C;
–color-gold-light: #F0E4C0;
–color-gold-dark: #9A7A2E;
–color-gold-glow: rgba(201, 168, 76, 0.15);

/* Semantic — fixed across modes */
–color-gain: #3D7A5E;
–color-gain-dim: rgba(61, 122, 94, 0.10);
–color-loss: #B04040;
–color-loss-dim: rgba(176, 64, 64, 0.10);
–color-warning: #B8860B;
–color-warning-dim: rgba(184, 134, 11, 0.10);
–color-info: #4A7FB5;
–color-info-dim: rgba(74, 127, 181, 0.10);

/* Typography */
–font-display: ‘Playfair Display’, Georgia, serif;
–font-body: ‘DM Sans’, system-ui, sans-serif;
–font-mono: ‘JetBrains Mono’, monospace;

/* Radius */
–radius-sm: 4px;
–radius-md: 6px;
–radius-lg: 8px;
–radius-xl: 12px;

/* Shadows — warm tinted */
–shadow-sm: 0 1px 3px rgba(26, 25, 21, 0.06), 0 1px 2px rgba(26, 25, 21, 0.04);
–shadow-md: 0 4px 12px rgba(26, 25, 21, 0.08), 0 2px 4px rgba(26, 25, 21, 0.04);
–shadow-lg: 0 12px 32px rgba(26, 25, 21, 0.10), 0 4px 8px rgba(26, 25, 21, 0.06);
}

/* ═══════════════════════════════════════════════════════
DARK MODE — toggled via .dark class on <html>
═══════════════════════════════════════════════════════ */

.dark {
–color-bg: #0C0B09;
–color-surface: #171613;
–color-surface-subtle: #1E1D19;
–color-border: #2E2C26;
–color-border-light: #3A382F;

–color-text-primary: #E8E6E0;
–color-text-secondary: #9E9C96;
–color-text-tertiary: #5C5A54;

–color-gold: #D4B35C;
–color-gold-light: rgba(201, 168, 76, 0.15);
–color-gold-dark: #8A6A20;
–color-gold-glow: rgba(212, 179, 92, 0.12);

–shadow-sm: none;
–shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
–shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* ═══════════════════════════════════════════════════════
BASE STYLES
═══════════════════════════════════════════════════════ */

body {
background-color: var(–color-bg);
color: var(–color-text-primary);
font-family: var(–font-body);
font-feature-settings: “cv02”, “cv03”, “cv04”, “cv11”;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
}

/* Scrollbar styling */
::-webkit-scrollbar {
width: 6px;
height: 6px;
}
::-webkit-scrollbar-track {
background: transparent;
}
::-webkit-scrollbar-thumb {
background: var(–color-border);
border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
background: var(–color-border-light);
}

/* Remove number input spinners */
input[type=“number”]::-webkit-inner-spin-button,
input[type=“number”]::-webkit-outer-spin-button {
-webkit-appearance: none;
margin: 0;
}
input[type=“number”] {
-moz-appearance: textfield;
}

/* Focus ring — gold glow */
*:focus-visible {
outline: 2px solid var(–color-gold);
outline-offset: 2px;
box-shadow: 0 0 0 4px var(–color-gold-glow);
}
GLOBALS

# Root layout

cat > “$PROJECT_DIR/src/app/layout.tsx” << ‘LAYOUT’
import type { Metadata } from “next”;
import “./globals.css”;

export const metadata: Metadata = {
title: “BTC Treasury Risk Simulator”,
description: “Real-time simulation platform for corporate Bitcoin treasury risk management”,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
// Theme class is set to “” (light) by default.
// Dark mode is toggled via user preference stored in DB,
// applied client-side by adding “dark” class to <html>.
return (
<html lang="en">
<body>{children}</body>
</html>
);
}
LAYOUT

# Root page (redirect)

cat > “$PROJECT_DIR/src/app/page.tsx” << ‘ROOTPAGE’
import { redirect } from “next/navigation”;

export default function Home() {
redirect(”/dashboard”);
}
ROOTPAGE

# .gitignore

cat > “$PROJECT_DIR/.gitignore” << ‘GITIGNORE’
node_modules/
.next/
.env.local
.env*.local
*.tsbuildinfo
drizzle/migrations/*.sql
GITIGNORE

echo “”
echo “═══════════════════════════════════════════════”
echo “  Assembly complete!”
echo “═══════════════════════════════════════════════”
echo “”
echo “Next steps:”
echo “”
echo “  1. cd $PROJECT_DIR”
echo “  2. npm install”
echo “  3. cp .env.local.example .env.local”
echo “  4. Fill in your Supabase, Redis, and API keys in .env.local”
echo “  5. npm run db:push          # push schema to Supabase”
echo “  6. Run supabase-setup.sql   # in Supabase SQL Editor”
echo “  7. npm run dev              # start dev server”
echo “”
echo “For Claude Code:”
echo “  The CLAUDE.md file in the project root contains all”
echo “  conventions, structure, and implementation guidance.”
echo “  Claude Code will read this automatically.”
echo “”
echo “The _dashboard-prototype.jsx and _position-prototype.jsx”
echo “files in src/app/ are the monolithic prototypes. Claude Code”
echo “should decompose them into the component structure defined”
echo “in CLAUDE.md as part of Phase 1 implementation.”
echo “”