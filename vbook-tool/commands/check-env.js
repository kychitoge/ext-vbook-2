/**
 * CHECK-ENV COMMAND — Verify environment setup and device connectivity
 */
const { getPluginInfo, getProjectRoot, getExtensionsDir } = require('../lib/plugin-info');
const { sendModernRequest } = require('../utils');
const { scanExtensions } = require('../lib/plugin-list');
const c = require('../lib/colors');
const fs = require('fs');
const path = require('path');

function register(program) {
    program.command('check-env')
        .description('Check environment config and device connectivity')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
            const json = options.json || false;
            const report = { ok: true, issues: [], env: {}, device: {}, workspace: {} };

            const pass  = (msg)  => { if (!json) console.log(c.green(`  ✅ ${msg}`)); };
            const fail  = (msg)  => { report.ok = false; report.issues.push(msg); if (!json) console.log(c.red(`  ❌ ${msg}`)); };
            const warn  = (msg)  => { report.issues.push(`[WARN] ${msg}`); if (!json) console.log(c.yellow(`  ⚠️  ${msg}`)); };
            const step  = (msg)  => { if (!json) console.log(c.dim(`\n  ${msg}`)); };

            if (!json) console.log(c.bold('\n🔍 VBook Environment Check\n'));

            // ─── ENV variables ─────────────────────────────────────────────────
            step('Environment variables:');

            const ip = process.env.VBOOK_IP;
            const port = parseInt(process.env.VBOOK_PORT || '8080');
            const author = process.env.author;

            report.env = { VBOOK_IP: ip || null, VBOOK_PORT: port, author: author || null };

            if (!ip) {
                fail('VBOOK_IP is not set in vbook-tool/.env');
            } else {
                pass(`VBOOK_IP = ${ip}`);
            }
            pass(`VBOOK_PORT = ${port}`);
            if (!author) {
                warn('author not set in .env — extensions will use default author');
            } else {
                pass(`author = ${author}`);
            }

            // ─── Workspace scan ────────────────────────────────────────────────
            step('Workspace:');
            try {
                const extDir = getExtensionsDir();
                const exts = scanExtensions();
                report.workspace = {
                    extensionsDir: extDir,
                    count: exts.length,
                    extensions: exts.map(e => ({ name: e.metadata.name, version: e.metadata.version, hasZip: e.hasZip }))
                };
                pass(`Extensions directory: ${extDir}`);
                pass(`${exts.length} extension(s) found`);
            } catch (e) {
                warn(`Could not scan extensions: ${e.message}`);
            }

            // ─── Device connectivity ───────────────────────────────────────────
            step('Device connectivity:');
            if (ip) {
                try {
                    const http = require('http');
                    const pingStart = Date.now();
                    await new Promise((resolve, reject) => {
                        const req = http.get({
                            hostname: ip, port, path: '/connect', timeout: 5000
                        }, (res) => {
                            let data = '';
                            res.on('data', chunk => data += chunk);
                            res.on('end', () => {
                                const elapsed = Date.now() - pingStart;
                                report.device = { ip, port, status: res.statusCode, latency: `${elapsed}ms`, response: data.substring(0, 200) };
                                if (res.statusCode === 200) {
                                    pass(`Device reachable at http://${ip}:${port} (${elapsed}ms)`);
                                } else {
                                    warn(`Device responded with status ${res.statusCode}`);
                                }
                                resolve();
                            });
                        });
                        req.on('error', reject);
                        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
                    });
                } catch (e) {
                    fail(`Cannot reach device at http://${ip}:${port} — ${e.message}`);
                    fail(`Update VBOOK_IP in vbook-tool/.env with the device's current IP`);
                    report.device = { ip, port, status: 'unreachable', error: e.message };
                }
            } else {
                warn('Skipping device ping — VBOOK_IP not set');
            }

            // ─── Output ────────────────────────────────────────────────────────
            if (json) {
                console.log(JSON.stringify(report, null, 2));
            } else {
                console.log('');
                if (report.ok && report.issues.filter(i => !i.startsWith('[WARN]')).length === 0) {
                    console.log(c.bold(c.green('✅ Environment is ready!')));
                } else {
                    const errors = report.issues.filter(i => !i.startsWith('[WARN]'));
                    const warnings = report.issues.filter(i => i.startsWith('[WARN]'));
                    if (errors.length) console.log(c.bold(c.red(`❌ ${errors.length} issue(s) need fixing`)));
                    if (warnings.length) console.log(c.bold(c.yellow(`⚠️  ${warnings.length} warning(s)`)));
                }
                console.log('');
            }

            if (!report.ok) process.exit(1);
        });
}

module.exports = { register };
