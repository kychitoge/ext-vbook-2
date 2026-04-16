# 🚀 VBook CLI Tool v2.0

Professional CLI toolkit for creating, testing, and publishing VBook extensions.

## 🛠 Installation

```bash
cd vbook-tool
npm install
npm link     # Makes `vbook` command available globally
```

---

## 📋 Command Reference

| Command | Description | Example |
|---------|------------|---------|
| `vbook check-env` | **MANDATORY** check before start | `vbook check-env` |
| `vbook analyze` | AI Selector Finder (Browser API) | `vbook analyze https://site.com` |
| `vbook create` | Scaffold with AI templates | `vbook create my-ext -s https://site.com` |
| `vbook validate` | Check Rhino ES6 compatibility | `vbook validate` |
| `vbook debug` | Test single script on device | `vbook debug src/detail.js -in "URL"` |
| `vbook test-all` | Run full test chain (Home→Chap) | `vbook test-all` |
| `vbook list` | List extensions with stats | `vbook list` |
| `vbook install` | Push extension to real device | `vbook install` |
| `vbook build` | Package into plugin.zip | `vbook build --bump` |
| `vbook publish` | Build + Update Global Registry | `vbook publish` |

---

## 🔍 `vbook check-env` — Verify Setup

Checks connectivity to the VBook device and validates `.env` settings.
**Run this first.** If it fails, all other device-related commands will fail.

```bash
vbook check-env         # Human readable report
vbook check-env --json  # Machine readable (for AI agents)
```

---

## 🤖 `vbook analyze` — Smart Analysis

Uses the VBook Browser API on the real device to analyze a website. It returns the most likely CSS selectors for book lists, titles, covers, and pagination.

```bash
vbook analyze <url> [options]

#   --json              Raw JSON for AI parsing
#   -v, --verbose       Show network logs
```

---

## 🏗️ `vbook create` — Scaffold Extension

Creates a new extension directory with **AI-optimized templates**. Templates include clear contracts and TODO markers so AI coding assistants know exactly what to implement.

```bash
vbook create <name> --source <url> [options]

# Required:
#   -s, --source <url>    Website URL

# Optional:
#   -t, --type <type>     novel|comic|chinese_novel (default: novel)
#   -l, --locale <locale> vi_VN|zh_CN|en_US (default: vi_VN)
#   --minimal             Skip home.js, gen.js, search.js
```

> [!TIP]
> `page.js` is always created by default. Even if the site has no TOC pagination, `page.js` should return `[url]`.

---

## 🛡️ `vbook validate` — Rhino Compatibility

VBook uses the Rhino JS engine. It supports basic ES6 but has strict limitations. `validate` catches these before they crash the device.

**Forbidden (UNSUPPORTED):**
- ❌ `async/await` (Rhino is synchronous)
- ❌ Optional chaining (`obj?.prop`)
- ❌ Nullish coalescing (`a ?? b`)
- ❌ Spread in calls (`Math.max(...arr)`)
- ❌ Default parameters (`function f(a=1)`)

---

## 🐛 `vbook debug` — Debug Script

Send a single script to the VBook device for immediate execution and feedback.

```bash
vbook debug src/detail.js -in "https://site.com/book/123"
```

---

## 🚀 `vbook publish` — Finalize & Release

Automates the entire release flow:
1. Validates code
2. Bumps version in `plugin.json`
3. Packages `src/` into `plugin.zip`
4. Updates the root `plugin.json` registry so the extension appears in the app.

---

## ⚙️ Configuration (.env)

```env
author=YourName             # Default author for new extensions
VBOOK_IP=192.168.1.10       # Device IP from VBook "Web Server" tab
VBOOK_PORT=8080             # Device port
GITHUB_REPO=user/repo       # GitHub repo for download URLs
```

---

## 💡 Recommended Workflow

1. **Check**: `vbook check-env` (Ensure device is ON)
2. **Inspect**: `vbook analyze <URL>` (Identify selectors)
3. **Scaffold**: `vbook create <name> -s <URL>`
4. **Implement**: Fill in the `src/*.js` files using the `analyze` hints.
5. **Validate**: `vbook validate`
6. **Test**: `vbook debug` (Individual scripts) then `vbook test-all`
7. **Publish**: `vbook publish`

---

## 🔌 MCP Server (for AI Agents)

This tool includes a built-in MCP server that allows AI agents (like Claude or Antigravity) to call CLI commands directly.

To use:
1. Register `vbook-tool/vbook-mcp-server.js` in your AI client.
2. The agent will then have access to all `vbook` commands as native tools.
