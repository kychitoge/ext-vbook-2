/**
 * INSTALL COMMAND — Install extension to the VBook device
 */
const path = require('path');
const fs = require('fs');
const { sendRequest } = require('../utils');
const { getPluginInfo } = require('../lib/plugin-info');
const { buildRequestHeaders } = require('../lib/server');
const c = require('../lib/colors');

function register(program) {
    program.command('install')
        .description('Install the extension on the device')
        .option('-i, --ip <ip>', 'Device IP address')
        .option('-p, --port <port>', 'Device Port', '8080')
        .option('-v, --verbose', 'Verbose output')
        .action(async (options) => {
            try {
                const info = getPluginInfo();
                const ip = options.ip || process.env.VBOOK_IP;
                const port = parseInt(options.port || process.env.VBOOK_PORT || '8080');
                const verbose = options.verbose || process.env.VERBOSE === 'true';

                const iconPath = path.join(info.root, 'icon.png');
                if (!fs.existsSync(iconPath)) throw new Error("icon.png not found");

                console.log(c.step('INSTALL', `${c.bold(info.name)} → ${ip}:${port}`));

                const metadata = { ...info.json.metadata };
                if (metadata.encrypt) delete metadata.encrypt;

                const data = {
                    ...metadata,
                    ...info.json.script,
                    id: "debug-" + metadata.source,
                    icon: `data:image/*;base64,${fs.readFileSync(iconPath).toString('base64')}`,
                    enabled: true,
                    debug: true,
                    data: {}
                };

                const srcDir = path.join(info.root, 'src');
                const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
                for (const file of files) {
                    data.data[file] = fs.readFileSync(path.join(srcDir, file), 'utf8');
                }
                data.data = JSON.stringify(data.data);

                const base64Data = Buffer.from(JSON.stringify(data)).toString('base64');
                const headers = buildRequestHeaders({
                    ip, port, endpoint: 'install', base64Data, connection: 'close'
                });

                const result = await sendRequest(ip, port, headers, verbose);
                if (result.status === 0) {
                    console.log(c.success('Extension installed successfully!'));
                } else {
                    console.log(c.error(result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error(c.error(error.message));
            }
        });
}

module.exports = { register };
