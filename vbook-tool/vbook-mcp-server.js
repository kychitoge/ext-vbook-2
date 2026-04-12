#!/usr/bin/env node
/**
 * VBook MCP Server
 * Exposes vbook CLI commands as MCP tools so AI agents can call them directly
 * without needing user approval for each command.
 *
 * Usage (stdio transport):
 *   node vbook-mcp-server.js
 *
 * Register in your MCP client config (e.g. Claude Desktop, Antigravity):
 *   {
 *     "mcpServers": {
 *       "vbook": {
 *         "command": "node",
 *         "args": ["d:/Github/ext-vbook-bi/vbook-tool/vbook-mcp-server.js"]
 *       }
 *     }
 *   }
 */

const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const execFileAsync = promisify(execFile);
const CLI = path.join(__dirname, 'index.js');
const PROJECT_ROOT = path.dirname(__dirname);
const GITHUB_REPO = process.env.GITHUB_REPO || 'dat-bi/ext-vbook';

// ─── MCP stdio protocol helpers ───────────────────────────────────────────────

process.stdin.setEncoding('utf8');
let inputBuffer = '';

process.stdin.on('data', (chunk) => {
    inputBuffer += chunk;
    const lines = inputBuffer.split('\n');
    inputBuffer = lines.pop(); // keep incomplete last line
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
            const msg = JSON.parse(trimmed);
            handleMessage(msg);
        } catch (e) {
            // ignore non-JSON lines
        }
    }
});

function sendJson(obj) {
    process.stdout.write(JSON.stringify(obj) + '\n');
}

function sendResult(id, result) {
    sendJson({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message) {
    sendJson({ jsonrpc: '2.0', id, error: { code, message } });
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
    {
        name: 'check_env',
        description: 'Check environment config (VBOOK_IP, VBOOK_PORT) and device connectivity. Run this FIRST before any other tool.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'analyze',
        description: 'Analyze a website DOM structure using the VBook Browser API. Returns CSS selectors for book lists, names, covers, and pagination. Also detects Cloudflare, Next.js, GBK encoding.',
        inputSchema: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to analyze (e.g. https://example.com)' },
                extension_dir: { type: 'string', description: 'Path to an extension dir to run from (any valid extension, used for context). Defaults to first found.' }
            },
            required: ['url']
        }
    },
    {
        name: 'create',
        description: 'Scaffold a new VBook extension with templates. Creates plugin.json, src/*.js files, and downloads favicon.',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Extension directory name (no spaces, e.g. truyenfull)' },
                source: { type: 'string', description: 'Source website URL (e.g. https://truyenfull.io)' },
                type: { type: 'string', enum: ['novel', 'comic', 'chinese_novel', 'translate', 'tts'], description: 'Extension type' },
                locale: { type: 'string', description: 'Locale code (vi_VN, zh_CN, en_US)', default: 'vi_VN' },
                tag: { type: 'string', description: 'Optional tag (e.g. nsfw)' },
                minimal: { type: 'boolean', description: 'Only create required files (detail, toc, chap)' }
            },
            required: ['name', 'source', 'type']
        }
    },
    {
        name: 'validate',
        description: 'Validate extension structure, plugin.json fields, and Rhino (ES6 subset) compatibility. Fix all errors before debugging.',
        inputSchema: {
            type: 'object',
            properties: {
                extension_path: { type: 'string', description: 'Path to extension directory. Defaults to current dir.' }
            },
            required: []
        }
    },
    {
        name: 'debug',
        description: 'Send a single script to the VBook device for testing via Modern HTTP API. Returns structured JSON with success, data, log, exception, and time.',
        inputSchema: {
            type: 'object',
            properties: {
                file: { type: 'string', description: 'Path to script file (e.g. extensions/ntruyen/src/detail.js)' },
                input: { type: 'string', description: 'Test input string (e.g. URL for detail.js)' }
            },
            required: ['file']
        }
    },
    {
        name: 'test_all',
        description: 'Run the full extension test chain: home → gen → detail → [page] → toc → chap via Modern HTTP API. Returns JSON with success/failure per step.',
        inputSchema: {
            type: 'object',
            properties: {
                extension_path: { type: 'string', description: 'Path to extension directory.' },
                from_step: { type: 'string', enum: ['home', 'gen', 'detail', 'page', 'toc', 'chap'], description: 'Start from this step (skips earlier steps)' },
                skip: { type: 'string', description: 'Comma-separated steps to skip (e.g. home,gen)' }
            },
            required: []
        }
    },
    {
        name: 'build',
        description: 'Package extension into plugin.zip. Use --bump to auto-increment version.',
        inputSchema: {
            type: 'object',
            properties: {
                extension_path: { type: 'string', description: 'Path to extension directory.' },
                bump: { type: 'boolean', description: 'Auto-increment version number in plugin.json' },
                skip_validate: { type: 'boolean', description: 'Skip validation before build' }
            },
            required: []
        }
    },
    {
        name: 'publish',
        description: 'Build extension + update root plugin.json registry. This is the final step after testing passes. Automatically bumps version, builds plugin.zip, and updates the extension list.',
        inputSchema: {
            type: 'object',
            properties: {
                extension_path: { type: 'string', description: 'Path to extension directory.' },
                skip_validate: { type: 'boolean', description: 'Skip validation step' }
            },
            required: []
        }
    },
    {
        name: 'list_extensions',
        description: 'List all extensions in the project with their name, version, type, and status (has zip, has icon).',
        inputSchema: {
            type: 'object',
            properties: {
                filter_type: { type: 'string', description: 'Filter by type (novel, comic, chinese_novel)' }
            },
            required: []
        }
    },
    {
        name: 'read_extension',
        description: 'Read the source code of a specific extension script file. Useful for diagnosing bugs.',
        inputSchema: {
            type: 'object',
            properties: {
                extension_name: { type: 'string', description: 'Extension directory name (e.g. ntruyen)' },
                script: { type: 'string', description: 'Script filename (e.g. detail.js, toc.js, plugin.json)' }
            },
            required: ['extension_name', 'script']
        }
    },
    {
        name: 'write_extension_script',
        description: 'Write or overwrite a script file in an extension\'s src/ directory. Used to implement or fix scripts.',
        inputSchema: {
            type: 'object',
            properties: {
                extension_name: { type: 'string', description: 'Extension directory name (e.g. ntruyen)' },
                script: { type: 'string', description: 'Script filename (e.g. detail.js)' },
                content: { type: 'string', description: 'Full file content to write' }
            },
            required: ['extension_name', 'script', 'content']
        }
    },
    {
        name: 'update_plugin_json',
        description: 'Update fields in an extension\'s plugin.json (e.g. source URL, regexp, description after a domain change).',
        inputSchema: {
            type: 'object',
            properties: {
                extension_name: { type: 'string', description: 'Extension directory name' },
                metadata_patch: { type: 'object', description: 'Key-value pairs to merge into metadata (e.g. { "source": "https://new.com", "regexp": "new\\\\.com/..." })' }
            },
            required: ['extension_name', 'metadata_patch']
        }
    }
];

// ─── Tool implementations ─────────────────────────────────────────────────────

async function runCLI(args, cwd) {
    try {
        const { stdout, stderr } = await execFileAsync(
            process.execPath, [CLI, ...args],
            { cwd: cwd || PROJECT_ROOT, timeout: 60000 }
        );
        return { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (err) {
        return {
            stdout: (err.stdout || '').trim(),
            stderr: (err.stderr || err.message || '').trim(),
            exitCode: err.code
        };
    }
}

function parseJsonOutput(raw) {
    const text = typeof raw === 'string' ? raw : (raw.stdout || '');
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
            return JSON.parse(text.substring(jsonStart, jsonEnd + 1));
        } catch (e) {}
    }
    // Try array
    const arrStart = text.indexOf('[');
    const arrEnd = text.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) {
        try {
            return JSON.parse(text.substring(arrStart, arrEnd + 1));
        } catch (e) {}
    }
    return null;
}

function resolveExtPath(extension_path) {
    if (!extension_path) return PROJECT_ROOT;
    if (path.isAbsolute(extension_path)) return extension_path;
    return path.join(PROJECT_ROOT, extension_path);
}

function resolveExtDir(extension_name) {
    return path.join(PROJECT_ROOT, 'extensions', extension_name);
}

async function executeTool(name, args) {
    switch (name) {

        case 'check_env': {
            const out = await runCLI(['check-env', '--json']);
            const parsed = parseJsonOutput(out.stdout);
            return parsed || { raw: out.stdout, error: out.stderr };
        }

        case 'analyze': {
            const cwd = args.extension_dir
                ? resolveExtPath(args.extension_dir)
                : path.join(PROJECT_ROOT, 'extensions', fs.readdirSync(path.join(PROJECT_ROOT, 'extensions')).filter(d => {
                    return fs.existsSync(path.join(PROJECT_ROOT, 'extensions', d, 'plugin.json'));
                })[0] || '');
            const out = await runCLI(['analyze', args.url, '--json'], cwd);
            const parsed = parseJsonOutput(out.stdout);
            if (!parsed) return { error: out.stderr || out.stdout };
            return parsed;
        }

        case 'create': {
            const cliArgs = ['create', args.name, '--source', args.source, '--type', args.type || 'novel'];
            if (args.locale) cliArgs.push('--locale', args.locale);
            if (args.tag) cliArgs.push('--tag', args.tag);
            if (args.minimal) cliArgs.push('--minimal');
            const out = await runCLI(cliArgs, PROJECT_ROOT);
            const created = out.exitCode ? false : true;
            return {
                success: created,
                extension_path: path.join(PROJECT_ROOT, 'extensions', args.name),
                output: out.stdout,
                error: out.stderr || null
            };
        }

        case 'validate': {
            const cwd = resolveExtPath(args.extension_path);
            const out = await runCLI(['validate', '.', '--json'].filter(Boolean), cwd);
            // validate doesn't support --json yet, parse text
            const errors = (out.stdout.match(/❌/g) || []).length;
            const warnings = (out.stdout.match(/⚠️/g) || []).length;
            return {
                success: errors === 0,
                errors,
                warnings,
                output: out.stdout
            };
        }

        case 'debug': {
            const filePath = path.isAbsolute(args.file)
                ? args.file
                : path.join(PROJECT_ROOT, args.file);
            const cliArgs = ['debug', filePath, '--json'];
            if (args.input) cliArgs.push('-in', args.input);
            const extDir = path.dirname(path.dirname(filePath)); // go up from src/
            const out = await runCLI(cliArgs, extDir);
            const parsed = parseJsonOutput(out.stdout);
            if (!parsed) return { success: false, error: out.stderr || out.stdout };
            return parsed;
        }

        case 'test_all': {
            const cwd = resolveExtPath(args.extension_path);
            const cliArgs = ['test-all', '--json'];
            if (args.from_step) cliArgs.push('--from', args.from_step);
            if (args.skip) cliArgs.push('--skip', args.skip);
            const out = await runCLI(cliArgs, cwd);
            const parsed = parseJsonOutput(out.stdout);
            if (!parsed) {
                const failed = out.exitCode !== 0;
                return { success: !failed, error: out.stderr || out.stdout };
            }
            return parsed;
        }

        case 'build': {
            const cwd = resolveExtPath(args.extension_path);
            const cliArgs = ['build'];
            if (args.bump) cliArgs.push('--bump');
            if (args.skip_validate) cliArgs.push('--skip-validate');
            const out = await runCLI(cliArgs, cwd);
            const success = !out.exitCode && out.stdout.includes('Built');
            const sizeMatch = out.stdout.match(/([\d.]+)\s*KB/);
            return {
                success,
                size_kb: sizeMatch ? parseFloat(sizeMatch[1]) : null,
                output: out.stdout,
                error: out.stderr || null
            };
        }

        case 'publish': {
            const cwd = resolveExtPath(args.extension_path);
            const cliArgs = ['publish'];
            if (args.skip_validate) cliArgs.push('--skip-validate');
            const out = await runCLI(cliArgs, cwd);
            const success = !out.exitCode && (out.stdout.includes('Published') || out.stdout.includes('✅'));

            // Parse new version from output
            const versionMatch = out.stdout.match(/Version bumped to (\d+)/);
            const countMatch = out.stdout.match(/(\d+) extensions in registry/);

            return {
                success,
                new_version: versionMatch ? parseInt(versionMatch[1]) : null,
                registry_count: countMatch ? parseInt(countMatch[1]) : null,
                output: out.stdout,
                error: out.stderr || null
            };
        }

        case 'list_extensions': {
            const { scanExtensions } = require('./lib/plugin-list');
            const opts = {};
            if (args.filter_type) opts.filterType = args.filter_type;
            const exts = scanExtensions(opts);
            return {
                count: exts.length,
                extensions: exts.map(e => ({
                    dir: e.dirName,
                    name: e.metadata.name,
                    version: e.metadata.version,
                    type: e.metadata.type,
                    locale: e.metadata.locale,
                    source: e.metadata.source,
                    has_zip: e.hasZip,
                    has_src: e.hasSrc
                }))
            };
        }

        case 'read_extension': {
            const extDir = resolveExtDir(args.extension_name);
            let filePath;
            if (args.script === 'plugin.json') {
                filePath = path.join(extDir, 'plugin.json');
            } else {
                filePath = path.join(extDir, 'src', args.script);
            }
            if (!fs.existsSync(filePath)) {
                return { error: `File not found: ${filePath}` };
            }
            const content = fs.readFileSync(filePath, 'utf8');
            return { extension: args.extension_name, script: args.script, content };
        }

        case 'write_extension_script': {
            const extDir = resolveExtDir(args.extension_name);
            const srcDir = path.join(extDir, 'src');
            if (!fs.existsSync(srcDir)) {
                return { error: `Extension not found: ${args.extension_name}` };
            }
            const filePath = path.join(srcDir, args.script);
            fs.writeFileSync(filePath, args.content, 'utf8');
            return { success: true, path: filePath, bytes: Buffer.byteLength(args.content) };
        }

        case 'update_plugin_json': {
            const extDir = resolveExtDir(args.extension_name);
            const pluginPath = path.join(extDir, 'plugin.json');
            if (!fs.existsSync(pluginPath)) {
                return { error: `plugin.json not found for: ${args.extension_name}` };
            }
            const current = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
            current.metadata = { ...current.metadata, ...args.metadata_patch };
            fs.writeFileSync(pluginPath, JSON.stringify(current, null, 2), 'utf8');
            return { success: true, metadata: current.metadata };
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

// ─── MCP message router ───────────────────────────────────────────────────────

function handleMessage(msg) {
    const { id, method, params } = msg;

    // initialize
    if (method === 'initialize') {
        sendResult(id, {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'vbook-mcp', version: '1.0.0' }
        });
        return;
    }

    // initialized notification (no response needed)
    if (method === 'notifications/initialized' || method === 'initialized') {
        return;
    }

    // list tools
    if (method === 'tools/list') {
        sendResult(id, { tools: TOOLS });
        return;
    }

    // call tool
    if (method === 'tools/call') {
        const toolName = params && params.name;
        const toolArgs = (params && params.arguments) || {};

        if (!toolName) {
            sendError(id, -32602, 'Missing tool name');
            return;
        }

        executeTool(toolName, toolArgs)
            .then((result) => {
                sendResult(id, {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
                });
            })
            .catch((err) => {
                sendResult(id, {
                    content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
                    isError: true
                });
            });
        return;
    }

    // unknown method
    if (id !== undefined && id !== null) {
        sendError(id, -32601, `Method not found: ${method}`);
    }
}

// Keep process alive
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
process.stderr.write('[vbook-mcp] Server started (stdio)\n');
