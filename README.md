# opencode-cx-agents

Opinionated OpenCode plugin with three `cx-` agents:

- `cx-explore` — read-first exploration
- `cx-local` — workspace-first writing (external file-tool access = `ask`)
- `cx-global` — high-privilege writing across any local directories (external file-tool access = `allow`)

## Included agents

| Agent | Mode | Best for | External file-tool access | Edit / write / apply_patch | Network tools | Bash default |
| --- | --- | --- | --- | --- | --- | --- |
| `cx-explore` | `all` | Codebase mapping, architecture tracing, web/external research | `allow` | `deny` | `allow` | `allow` + risky patterns `deny` |
| `cx-local` | `primary` | Normal implementation in current workspace, with guarded external file access | `ask` | `allow` | `allow` | `allow` + data-loss patterns `ask` |
| `cx-global` | `primary` | High-privilege local implementation across workspace + external dirs | `allow` | `allow` | `allow` | `allow` + data-loss patterns `ask` |

## Naming policy

- Canonical agent names are: `cx-explore`, `cx-local`, `cx-global`.
- No backward-compatible aliases are provided.

`cx-local` and `cx-global` use the **same write profile**; the **only permission difference** is:

- `cx-local`: `external_directory: "ask"`
- `cx-global`: `external_directory: "allow"`

## Permission model summary

### `cx-explore`

- Top-level default is `"*": "allow"`.
- Non-research/high-risk capabilities are explicitly denied (`task`, `edit`, `apply_patch`, `planpilot`, `workbench`, etc.).
- Bash is blacklist style: default allow, explicit risky patterns are denied.
- No `ask` entries: risky operations are denied directly.

### `cx-local` / `cx-global`

- Top-level default is `"*": "allow"`.
- Edit tools are enabled.
- Bash is blacklist style with targeted `ask` prompts.
- Design goal: downloads/creation flows run directly; operations likely to cause deletion/data loss require approval.

Ask categories for both write agents include:

- file deletion/overwrite/data-loss-prone forms (`rm`, `rmdir`, `mv`, `cp`, `sed -i`, `perl -i*`, `truncate`, `dd`, `tee`, shell redirection)
- ownership/permission escalation (`chmod`, `chown`, `chgrp`, `sudo`)
- destructive git/history rewrite/deletion forms (`reset`, `clean`, `checkout/switch/restore`, `rebase`, stash pop/drop/clear, branch/tag/worktree deletions, force/delete push variants)
- package/system uninstall/remove forms
- explicit remote deletion forms (`gh ... delete`, `gh api ... DELETE`, `curl ... DELETE`)

## Installation

### Source of truth

Use the repo `index.js` as the source of truth:

```text
/ABS/PATH/opencode-cx-agents/index.js
```

### Recommended plugin-dir shim

```js
// ~/.config/opencode/plugins/opencode-cx-agents.js
export { default } from "file:///ABS/PATH/opencode-cx-agents/index.js";
```

This avoids stale copied plugin files.

## Quick validation snippet

```js
const cfg = { agent: {} };
const plugin = (await import("file:///ABS/PATH/opencode-cx-agents/index.js")).default;
await (await plugin({})).config(cfg);

console.log(Object.keys(cfg.agent));
console.log("cx-local external_directory:", cfg.agent["cx-local"]?.permission?.external_directory);
console.log("cx-global external_directory:", cfg.agent["cx-global"]?.permission?.external_directory);
```

Expected:

- keys include: `cx-explore`, `cx-local`, `cx-global`
- `cx-local` external directory = `ask`
- `cx-global` external directory = `allow`
