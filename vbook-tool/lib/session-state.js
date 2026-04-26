/**
 * Session State Manager
 * Tracks the current workflow step, inspected URLs, debugged scripts, etc.
 * State is in-memory — resets when MCP server restarts (intentional).
 */

const SESSION_STEPS = [
    'init',
    'env_checked',
    'urls_provided',
    'inspected',
    'code_written',
    'validated',
    'debugged',
    'tested',
    'published'
];

var state = {
    step: 'init',
    env_ok: false,
    extension_name: null,
    inspected_urls: {},      // { url: { timestamp, selectors } }
    debugged_scripts: [],    // ['detail.js', 'toc.js', ...]
    required_scripts: [],    // set when extension type is known
    violations_log: []       // log all violations in session
};

function stepIndex(step) {
    var idx = SESSION_STEPS.indexOf(step);
    return idx >= 0 ? idx : -1;
}

/**
 * Advance to a new step (only if it's the next logical step or later).
 * Won't go backwards.
 */
function advanceTo(step) {
    var currentIdx = stepIndex(state.step);
    var targetIdx = stepIndex(step);
    if (targetIdx < 0) return; // invalid step
    if (targetIdx > currentIdx) {
        state.step = step;
    }
}

/**
 * Check if we can proceed to the given step based on current state.
 */
function canProceedTo(step) {
    var currentIdx = stepIndex(state.step);
    var targetIdx = stepIndex(step);
    if (targetIdx < 0) return false;
    return currentIdx >= targetIdx;
}

/**
 * Get a snapshot of the entire session state.
 */
function getStatus() {
    return {
        step: state.step,
        step_index: stepIndex(state.step),
        total_steps: SESSION_STEPS.length,
        env_ok: state.env_ok,
        extension_name: state.extension_name,
        inspected_urls: Object.keys(state.inspected_urls),
        inspected_count: Object.keys(state.inspected_urls).length,
        debugged_scripts: state.debugged_scripts.slice(),
        required_scripts: state.required_scripts.slice(),
        all_debugged: allScriptsDebugged(),
        violations_count: state.violations_log.length,
        steps: SESSION_STEPS
    };
}

/**
 * Store inspection result for a URL.
 */
function addInspectedUrl(url, data) {
    state.inspected_urls[url] = {
        timestamp: new Date().toISOString(),
        selectors: data || {}
    };
}

/**
 * Check if minimum URLs have been inspected (at least 2: detail + chap).
 */
function hasMinimumInspected() {
    return Object.keys(state.inspected_urls).length >= 2;
}

/**
 * Mark a script as successfully debugged.
 */
function markDebuggedScript(file) {
    if (state.debugged_scripts.indexOf(file) < 0) {
        state.debugged_scripts.push(file);
    }
}

/**
 * Check if all required scripts have been debugged.
 */
function allScriptsDebugged() {
    if (state.required_scripts.length === 0) return true;
    for (var i = 0; i < state.required_scripts.length; i++) {
        if (state.debugged_scripts.indexOf(state.required_scripts[i]) < 0) {
            return false;
        }
    }
    return true;
}

/**
 * Set the list of scripts that must be debugged before test_all.
 */
function setRequiredScripts(list) {
    state.required_scripts = list.slice();
}

/**
 * Reset the entire state for a new extension.
 */
function reset(extensionName) {
    state.step = 'init';
    state.env_ok = false;
    state.extension_name = extensionName || null;
    state.inspected_urls = {};
    state.debugged_scripts = [];
    state.required_scripts = [];
    state.violations_log = [];
}

/**
 * Log a violation event.
 */
function logViolation(v) {
    state.violations_log.push({
        timestamp: new Date().toISOString(),
        message: v
    });
}

/**
 * Set env_ok flag.
 */
function setEnvOk(ok) {
    state.env_ok = !!ok;
}

/**
 * Set extension name.
 */
function setExtensionName(name) {
    state.extension_name = name || null;
}

module.exports = {
    advanceTo,
    canProceedTo,
    getStatus,
    addInspectedUrl,
    hasMinimumInspected,
    markDebuggedScript,
    allScriptsDebugged,
    setRequiredScripts,
    reset,
    logViolation,
    setEnvOk,
    setExtensionName,
    SESSION_STEPS
};
