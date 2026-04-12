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
| `vbook create` | Scaffold a new extension | `vbook create metruyencv -s https://metruyencv.com -t novel` |
| `vbook validate` | Check Rhino compatibility | `vbook validate` |
| `vbook list` | List all extensions | `vbook list --type novel` |
| `vbook debug` | Debug script on device | `vbook debug src/home.js` |
| `vbook test-all` | Full flow test | `vbook test-all` |
| `vbook install` | Install to device | `vbook install` |
| `vbook build` | Package into plugin.zip | `vbook build --bump` |
| `vbook publish` | Build + update registry | `vbook publish` |

---

## 🏗️ `vbook create` — Scaffold Extension

Creates a new extension directory with template files that have TODO markers.

```bash
vbook create <name> --source <url> [options]

# Required:
#   -s, --source <url>    Website URL

# Optional:
#   -t, --type <type>     novel|comic|chinese_novel (default: novel)
#   -l, --locale <locale> vi_VN|zh_CN|en_US (default: vi_VN)
#   --tag <tag>           Tag (e.g. nsfw)
#   --minimal             Only create required files (detail, toc, chap)
```

Example:
```bash
vbook create metruyencv --source https://metruyencv.com --type novel --locale vi_VN
```

---

## 🔍 `vbook validate` — Rhino Compatibility Checker

Validates extension structure and checks for Rhino-incompatible syntax:
- No `async/await`
- No optional chaining (`?.`)
- No nullish coalescing (`??`)
- No spread in calls (`...args`)
- No default parameters
- Checks `function execute()` in every script

```bash
vbook validate              # Current directory
vbook validate ./khotruyenchu  # Specific extension
```

---

## 📦 `vbook list` — List Extensions

```bash
vbook list                  # All extensions
vbook list --type novel     # Filter by type
vbook list --locale zh_CN   # Filter by locale
vbook list --json           # JSON output for scripting
```

---

## 🐛 `vbook debug` — Debug Script

Send a single script to the VBook device.

```bash
vbook debug <file> [options]

#   -i, --ip <ip>        Device IP (or VBOOK_IP in .env)
#   -in, --input <input> Test input
#   -v, --verbose        Show network details
```

Example:
```bash
vbook debug src/detail.js -in "https://truyenfull.com/tao-tac/"
```

---

## 🧪 `vbook test-all` — Full Flow Test

Runs: home → gen → detail → toc → chap

```bash
vbook test-all              # Full test
vbook test-all --skip home,gen  # Skip specific steps
```

---

## 📥 `vbook install` — Install on Device

```bash
vbook install               # Install current extension
```

---

## 📦 `vbook build` — Package Extension

```bash
vbook build                 # Build with validation
vbook build --bump          # Auto-increment version
vbook build --skip-validate # Skip validation
```

---

## 🚀 `vbook publish` — Build + Update Plugin List

Replaces the old `update_plugin_list.js` workflow.

```bash
vbook publish               # Build current + update plugin.json
vbook publish --all         # Rebuild ALL extensions
vbook publish --list-only   # Only regenerate root plugin.json
```

---

## ⚙️ Configuration (.env)

```env
author=B                    # Default author for new extensions
VBOOK_IP=192.168.1.10      # Device IP
VBOOK_PORT=8080             # Device port
LOCAL_PORT=8080             # Local file server port
VERBOSE=true                # Verbose output
GITHUB_REPO=dat-bi/ext-vbook  # GitHub repo for plugin URLs
```

---

## 🔍 Output Guide

- `[LOG FROM DEVICE]` — `Console.log()` output from Rhino
- `[RESULT]` — Return value of `execute()` (auto-prettified)
- `[EXCEPTION FROM DEVICE]` — Runtime errors on device
