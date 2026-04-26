# VBOOK MCP UPGRADE PLAN
## Nâng cấp MCP Server thành Smart Enforcement Layer

> **Mục tiêu:** AI không còn có thể quên rules, skip bước, hoặc dùng placeholder — vì server tự động block.

---

## Tổng quan kiến trúc

### Trước khi nâng cấp
```
.cursorrules (rules)
    ↓ AI đọc một lần → drift sau đó
context/*.md (docs)
    ↓ AI phải chủ động nhớ
MCP tools (actions)
    ↓ Không có gate — AI gọi bất cứ lúc nào
```

### Sau khi nâng cấp
```
vbook-mcp-server.js
├── lib/session-state.js       ← Nhớ session đang ở bước nào
├── lib/violation-detector.js  ← Scan code trước khi ghi
├── lib/gate.js                ← Block tool nếu skip bước
└── lib/response-wrapper.js    ← Inject hint vào mọi response
```

---

## Cấu trúc file sau khi xong

```
vbook-tool/
├── vbook-mcp-server.js     ← Sửa (tích hợp 4 lib mới)
├── lib/
│   ├── session-state.js    ← TẠO MỚI
│   ├── violation-detector.js ← TẠO MỚI
│   ├── gate.js             ← TẠO MỚI
│   ├── response-wrapper.js ← TẠO MỚI
│   ├── colors.js           ← GIỮ NGUYÊN
│   ├── plugin-info.js      ← GIỮ NGUYÊN
│   ├── plugin-list.js      ← GIỮ NGUYÊN
│   ├── server.js           ← GIỮ NGUYÊN
│   └── wizard.js           ← GIỮ NGUYÊN
└── .cursorrules            ← VIẾT LẠI (ngắn gọn)
```

---

## BƯỚC 1 — Tạo `lib/session-state.js`

**Mục đích:** Thay AI phải tự nhớ — server nhớ thay.

### State flow
```
init → env_checked → urls_provided → inspected → code_written → validated → debugged → tested → published
```

### Cần implement

**1.1 — Định nghĩa SESSION_STEPS**
```javascript
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
```

**1.2 — Object state**
```javascript
let state = {
    step: 'init',
    env_ok: false,
    extension_name: null,
    inspected_urls: {},      // { url: { timestamp, selectors } }
    debugged_scripts: [],    // ['detail.js', 'toc.js', ...]
    required_scripts: [],    // set khi biết extension type
    violations_log: []       // log mọi vi phạm trong session
};
```

**1.3 — Các hàm cần viết**

| Hàm | Input | Output | Mô tả |
|-----|-------|--------|-------|
| `advanceTo(step)` | step string | void | Cập nhật step nếu hợp lệ |
| `canProceedTo(step)` | step string | boolean | Kiểm tra điều kiện |
| `getStatus()` | — | object | Snapshot toàn bộ state |
| `addInspectedUrl(url, data)` | url, data | void | Lưu kết quả inspect |
| `hasMinimumInspected()` | — | boolean | Đã inspect đủ URLs chưa |
| `markDebuggedScript(file)` | filename | void | Đánh dấu script đã debug |
| `allScriptsDebugged()` | — | boolean | Tất cả scripts đã debug chưa |
| `setRequiredScripts(list)` | array | void | Set danh sách scripts cần debug |
| `reset(extensionName)` | name | void | Reset toàn bộ khi bắt đầu mới |
| `logViolation(v)` | string | void | Ghi log vi phạm |

**1.4 — Điều kiện advance cho từng bước**

| Bước | Điều kiện |
|------|-----------|
| `env_checked` | `check_env` trả về `ok: true` |
| `urls_provided` | User đã cung cấp đủ 4 URLs |
| `inspected` | Đã inspect ít nhất URL detail + URL chap |
| `code_written` | `write_extension_script` không có violation |
| `validated` | `validate` trả về `errors: 0` |
| `debugged` | Tất cả scripts trong `required_scripts` đã pass |
| `tested` | `test_all` trả về `success: true` |
| `published` | `publish` trả về `success: true` |

**1.5 — Export**
```javascript
module.exports = {
    advanceTo, canProceedTo, getStatus,
    addInspectedUrl, hasMinimumInspected,
    markDebuggedScript, allScriptsDebugged,
    setRequiredScripts, reset, logViolation
};
```

---

## BƯỚC 2 — Tạo `lib/violation-detector.js`

**Mục đích:** Scan code JS trước khi ghi file, từ chối nếu có vi phạm.

### Cần implement

**2.1 — `detectRhinoViolations(code)`**

Duyệt từng dòng, skip comment (`//`, `*`, `/*`), check các pattern:

| Pattern | Regex | Message | Fix gợi ý |
|---------|-------|---------|-----------|
| async/await | `/\basync\s+function\|\bawait\s+/` | async/await không dùng được trong Rhino | Dùng synchronous call |
| Optional chaining | `/\w+\?\.\w+/` | `?.` không dùng được | Dùng `obj && obj.prop` |
| Nullish coalescing | `/\?\?/` | `??` không dùng được | Dùng `a != null ? a : b` |
| Spread in call | `/\w+\(\s*\.\.\./` | Spread trong function call | Dùng `.apply(null, arr)` |
| Spread in array | `/\[\s*\.\.\./` | Spread trong array | Dùng `.slice()` hoặc `.concat()` |
| Default params | `/function\s+\w+\s*\([^)]*=\s*/` | Default parameter | Gán thủ công trong thân hàm |

Trả về: `[{ line, col, pattern, message, fix }]`

**2.2 — `detectPlaceholders(code)`**

Check danh sách cứng:

```
// Generic placeholders từ template
'SELECTOR_ITEM', 'SELECTOR_TITLE', 'SELECTOR_COVER_IMG',
'SELECTOR_AUTHOR', 'SELECTOR_STATUS', 'SELECTOR_DESCRIPTION',
'SELECTOR_GENRE_LINKS', 'SELECTOR_CHAPTER_LINKS',
'SELECTOR_NEXT_PAGE', 'SELECTOR_TOC_PAGINATION',
'SELECTOR_CONTENT', 'SELECTOR_IMAGE_CONTAINER',
'TODO_DOMAIN', 'TODO_AUTHOR', 'PATH_MOI', 'PATH_HOT',
'PATH_HOAN', 'PATH_SEARCH', 'PATH_THELOAI',
'PARAM_KEYWORD', 'PARAM_PAGE',

// Generic selectors mà AI hay tự đặt
'.book-item', '.story-item', '.list-item', '.truyen-item',
'h3 a', '.title a', '#content', '#chapter-content',
'.chapter-c', '.chapter-content'
```

Trả về: `[{ placeholder, message }]`

**2.3 — `detectMissingExecute(code)`**

Check `/function\s+execute\s*\(/` có tồn tại không.

Trả về: `boolean`

**2.4 — `runAll(code)`**

Gọi cả 3 hàm, gộp kết quả:

```javascript
// Trả về:
{
    ok: boolean,                    // true nếu không có gì
    rhino_violations: [...],        // từ detectRhinoViolations
    placeholder_violations: [...],  // từ detectPlaceholders
    missing_execute: boolean,       // từ detectMissingExecute
    total_violations: number,
    summary: "X lỗi tìm thấy"
}
```

**2.5 — Export**
```javascript
module.exports = { detectRhinoViolations, detectPlaceholders, detectMissingExecute, runAll };
```

---

## BƯỚC 3 — Tạo `lib/gate.js`

**Mục đích:** Map tool → step cần thiết, block nếu chưa đủ điều kiện.

### Cần implement

**3.1 — `GATE_MAP` object**

```javascript
const GATE_MAP = {
    // Không cần gate (luôn cho qua)
    'check_env':            null,
    'get_session_state':    null,
    'reset_session':        null,
    'read_context':         null,
    'list_extensions':      null,
    'get_plugin_info':      null,

    // Cần env_checked
    'analyze':              'env_checked',
    'inspect':              'env_checked',
    'get_dom_tree':         'env_checked',
    'create':               'env_checked',
    'copy_demo':            'env_checked',
    'update_plugin_json':   'env_checked',
    'list_extension_files': 'env_checked',
    'read_extension':       'env_checked',

    // Cần inspected (có real selectors rồi mới được viết code)
    'write_extension_script': 'inspected',

    // Cần code_written
    'validate':             'code_written',

    // Cần validated
    'debug':                'validated',

    // Cần debugged
    'test_all':             'debugged',

    // Cần tested
    'build':                'tested',
    'publish':              'tested',
    'install':              'tested',
};
```

**3.2 — `checkGate(toolName, currentState)`**

```javascript
// Trả về nếu không bị block:
{ blocked: false }

// Trả về nếu bị block:
{
    blocked: true,
    tool: toolName,
    reason: "🚫 TOOL BLOCKED: ...",
    current_step: "...",
    required_step: "...",
    hint: "..."      // hướng dẫn cụ thể phải làm gì tiếp
}
```

**3.3 — `getHint(requiredStep)`**

| Step | Hint |
|------|------|
| `env_checked` | "Gọi check_env trước. Nếu fail → báo user cập nhật VBOOK_IP." |
| `urls_provided` | "Cần user cung cấp: URL listing, URL detail, URL toc, URL chap." |
| `inspected` | "Gọi inspect() cho ít nhất URL detail và URL chap. Dùng kết quả thực — không đoán selector." |
| `code_written` | "Viết code với real selectors từ inspect. Gọi write_extension_script." |
| `validated` | "Gọi validate. Phải đạt 0 errors trước khi debug." |
| `debugged` | "Gọi debug cho từng script (detail.js, toc.js, chap.js). Tất cả phải pass." |
| `tested` | "Gọi test_all. Phải success trước khi publish." |

**3.4 — Export**
```javascript
module.exports = { checkGate, GATE_MAP };
```

---

## BƯỚC 4 — Tạo `lib/response-wrapper.js`

**Mục đích:** Inject `_next` và `_step` vào mọi response — AI luôn biết bước tiếp.

### Cần implement

**4.1 — Logic xác định hint**

```javascript
function getNextHint(toolName, result) {
    switch(toolName) {
        case 'check_env':
            return result.ok
                ? "✅ Env OK. Tiếp theo: inspect các URLs (listing, detail, toc, chap)."
                : "❌ DỪNG. Cập nhật VBOOK_IP trong vbook-tool/.env rồi báo user.";

        case 'inspect':
            return result.success
                ? "✅ Inspect xong. Dùng selectors thực từ kết quả này. Gọi write_extension_script — KHÔNG dùng placeholder."
                : "❌ Inspect thất bại. Kiểm tra URL và kết nối device.";

        case 'write_extension_script':
            return "✅ Script đã ghi. Tiếp theo: gọi validate.";

        case 'validate':
            if (result.errors === 0)
                return "✅ Validate pass. Tiếp theo: debug từng script (detail, toc, chap).";
            return `❌ DỪNG. Fix ${result.errors} error(s) trước. Đọc output để biết lỗi cụ thể.`;

        case 'debug':
            return result.success
                ? "✅ Script pass. Tiếp theo: debug script tiếp theo, hoặc gọi test_all nếu tất cả đã xong."
                : "❌ DỪNG. Fix exception trước. Đọc log từ device.";

        case 'test_all':
            return result.success
                ? "✅ Test-all pass. Tiếp theo: gọi publish."
                : "❌ DỪNG. Fix bước thất bại trước khi publish.";

        case 'publish':
            return result.success
                ? "🎉 HOÀN THÀNH. Extension đã publish thành công."
                : "❌ Publish thất bại. Kiểm tra lỗi.";

        default:
            return null;
    }
}
```

**4.2 — `wrap(toolName, result, sessionStatus)`**

```javascript
function wrap(toolName, result, sessionStatus) {
    const hint = getNextHint(toolName, result);
    if (hint) result._next = hint;
    if (sessionStatus) result._step = sessionStatus.step;
    return result;
}
```

**4.3 — Export**
```javascript
module.exports = { wrap };
```

---

## BƯỚC 5 — Sửa `vbook-mcp-server.js`

**Không xóa code cũ — chỉ thêm và sửa các điểm sau.**

### 5.1 — Thêm imports (đầu file, sau các require hiện có)

```javascript
const sessionState    = require('./lib/session-state');
const gate            = require('./lib/gate');
const detector        = require('./lib/violation-detector');
const responseWrapper = require('./lib/response-wrapper');
```

### 5.2 — Thêm 2 tool mới vào mảng TOOLS

Thêm vào cuối mảng TOOLS, trước dấu `]`:

```javascript
{
    name: 'get_session_state',
    description: 'Xem session đang ở bước nào, đã inspect URL nào, extension đang làm. GỌI ĐẦU MỖI SESSION.',
    inputSchema: { type: 'object', properties: {}, required: [] }
},
{
    name: 'reset_session',
    description: 'Reset state khi bắt đầu làm extension mới hoàn toàn.',
    inputSchema: {
        type: 'object',
        properties: {
            extension_name: { type: 'string', description: 'Tên extension sắp làm' }
        },
        required: []
    }
}
```

### 5.3 — Thêm 2 case mới vào switch trong `executeTool`

Thêm vào trước `default:`:

```javascript
case 'get_session_state':
    return sessionState.getStatus();

case 'reset_session':
    sessionState.reset(args.extension_name);
    return {
        success: true,
        message: `Session reset. Extension: ${args.extension_name || 'chưa đặt tên'}`,
        state: sessionState.getStatus()
    };
```

### 5.4 — Thêm hàm `updateStateAfterTool`

Thêm hàm này vào file, trước `handleMessage`:

```javascript
function updateStateAfterTool(name, args, result) {
    switch(name) {
        case 'check_env':
            if (result.ok) sessionState.advanceTo('env_checked');
            break;
        case 'inspect':
        case 'get_dom_tree':
            if (result.success !== false) {
                sessionState.addInspectedUrl(args.url, result.data || {});
                if (sessionState.hasMinimumInspected()) {
                    sessionState.advanceTo('inspected');
                }
            }
            break;
        case 'write_extension_script':
            // Chỉ advance nếu không bị block (violation đã check trước rồi)
            if (!result.blocked) sessionState.advanceTo('code_written');
            break;
        case 'validate':
            if (result.errors === 0) sessionState.advanceTo('validated');
            break;
        case 'debug':
            if (result.success) {
                const scriptName = require('path').basename(args.file || '');
                sessionState.markDebuggedScript(scriptName);
                if (sessionState.allScriptsDebugged()) {
                    sessionState.advanceTo('debugged');
                }
            }
            break;
        case 'test_all':
            if (result.success) sessionState.advanceTo('tested');
            break;
        case 'publish':
            if (result.success) sessionState.advanceTo('published');
            break;
    }
}
```

### 5.5 — Thêm hàm `executeToolSafe` (wrapper)

Thêm hàm này ngay trước `handleMessage`:

```javascript
async function executeToolSafe(name, args) {
    // 1. Check gate
    const gateResult = gate.checkGate(name, sessionState.getStatus());
    if (gateResult.blocked) return gateResult;

    // 2. Special pre-check: reject code có violation trước khi ghi file
    if (name === 'write_extension_script') {
        const content = args.content || '';
        const check = detector.runAll(content);
        if (!check.ok) {
            sessionState.logViolation(`write_extension_script rejected: ${check.summary}`);
            return {
                blocked: true,
                reason: '🚫 CODE REJECTED — phát hiện vi phạm trước khi ghi file.',
                rhino_violations: check.rhino_violations,
                placeholder_violations: check.placeholder_violations,
                missing_execute: check.missing_execute,
                total_violations: check.total_violations,
                fix_required: true
            };
        }
    }

    // 3. Execute tool gốc
    const result = await executeTool(name, args);

    // 4. Update state dựa trên kết quả
    updateStateAfterTool(name, args, result);

    // 5. Wrap response với hints
    return responseWrapper.wrap(name, result, sessionState.getStatus());
}
```

### 5.6 — Đổi `executeTool` → `executeToolSafe` trong handleMessage

Tìm đoạn này trong `handleMessage`:
```javascript
executeTool(toolName, toolArgs)
    .then((result) => {
```

Đổi thành:
```javascript
executeToolSafe(toolName, toolArgs)
    .then((result) => {
```

**Chỉ đổi 1 chỗ này — không đổi chỗ nào khác.**

---

## BƯỚC 6 — Viết lại `.cursorrules`

**Xóa toàn bộ nội dung cũ, thay bằng:**

```markdown
# VBOOK AI AGENT — MANDATORY PROTOCOL

## BẮT ĐẦU MỌI SESSION (không có ngoại lệ)
1. Gọi `get_session_state` — xem đang ở bước nào
2. Nếu step = 'init' → gọi `check_env` ngay lập tức
3. Nếu `check_env` fail → BÁO USER CẬP NHẬT IP, DỪNG HOÀN TOÀN

## KHI BỊ BLOCK
- Đọc `reason` và `hint` trong response
- Làm đúng theo hint
- KHÔNG tìm cách bypass gate
- KHÔNG "thử cách khác"

## KHI BỊ REJECT (write_extension_script)
- Đọc `rhino_violations` và `placeholder_violations`
- Fix TẤT CẢ trước khi gọi lại
- KHÔNG bỏ qua bất kỳ violation nào

## QUY TẮC TUYỆT ĐỐI
- KHÔNG viết code trước khi có kết quả inspect thực tế
- KHÔNG dùng placeholder — tool sẽ reject tự động
- KHÔNG dùng async/await/?./?? — tool sẽ reject tự động
- KHÔNG skip bước — gate sẽ block tự động

## RUNTIME REFERENCE
- API Rhino: đọc context/01_runtime.md
- Workflow: đọc context/02_workflow.md
- Code mẫu: đọc context/04_demo.md

## MỌI THỨ KHÁC do MCP server tự enforce.
AI chỉ cần đọc `_next` trong mỗi response để biết bước tiếp theo.
```

---

## Thứ tự triển khai

```
NGÀY 1 (~2 giờ)
  □ Tạo lib/session-state.js
  □ Tạo lib/violation-detector.js
  □ Test thủ công: node -e "const d = require('./lib/violation-detector'); console.log(d.runAll('async function x() {}'))"

NGÀY 2 (~2 giờ)
  □ Tạo lib/gate.js
  □ Tạo lib/response-wrapper.js
  □ Sửa vbook-mcp-server.js (5 thay đổi ở mục 5)

NGÀY 3 (~1 giờ)
  □ Viết lại .cursorrules
  □ Test flow end-to-end với Claude Desktop
  □ Điều chỉnh hints nếu cần
```

---

## Tiêu chí kiểm tra hoàn thành

| Test case | Kết quả mong đợi |
|-----------|-----------------|
| Gọi `debug` khi step = 'init' | Bị block, hint: "Gọi check_env trước" |
| Gọi `write_extension_script` với `?.` | Bị reject, liệt kê dòng vi phạm |
| Gọi `write_extension_script` với `.book-item` | Bị reject, liệt kê placeholder |
| Gọi `write_extension_script` không có `function execute(` | Bị reject, missing_execute: true |
| Gọi `get_session_state` | Trả về step hiện tại, inspected_urls, debugged_scripts |
| Flow đúng thứ tự hoàn chỉnh | Tất cả pass, `_next` luôn có hint, publish thành công |
| Gọi `reset_session` | State về init, sẵn sàng extension mới |

---

## Lưu ý quan trọng

**Không cần sửa gì trong:**
- Tất cả file trong `commands/`
- `lib/colors.js`, `lib/plugin-info.js`, `lib/plugin-list.js`, `lib/server.js`, `lib/wizard.js`
- `utils.js`, `index.js`
- Các file context (`context/*.md`) — giữ nguyên để AI đọc khi cần

**Gate mềm vs cứng:**
- Gate hiện tại là **cứng** — blocked hoàn toàn
- Nếu muốn **mềm hơn** (warn thay vì block), sửa `checkGate` trả về `{ blocked: false, warning: "..." }` thay vì `{ blocked: true }`
- Khuyến nghị: giữ cứng cho `write_extension_script`, mềm hơn cho các tool khác nếu cần

**Session state là in-memory:**
- Reset mỗi khi restart MCP server
- Đây là ý muốn — mỗi session Claude mới = state mới = buộc AI check lại từ đầu
