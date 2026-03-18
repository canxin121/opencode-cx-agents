# opencode-cx-agents

Opinionated OpenCode plugin that injects three `cx-` prefixed agents for different levels of research and implementation work:

- `cx-explore` — read-first explorer
- `cx-work` — workspace-focused implementation agent
- `cx-omni` — dangerous high-privilege local implementation agent

The goal is to separate **exploration**, **normal workspace editing**, and **explicitly dangerous local-system work** instead of forcing one agent to handle all three.

## Included agents

| Agent        | Mode      | Best for                                                                       | External path access via read/edit tools | Network research tools | Edit / write / apply_patch | Task delegation   |
| ------------ | --------- | ------------------------------------------------------------------------------ | ---------------------------------------- | ---------------------- | -------------------------- | ----------------- |
| `cx-explore` | `all`     | Codebase mapping, architecture tracing, external repo inspection, web research | Allowed                                  | Allowed                | Denied                     | Denied            |
| `cx-work`    | `primary` | Normal implementation inside the current workspace                             | Denied                                   | Denied                 | Allowed                    | Only `cx-explore` |
| `cx-omni`    | `primary` | High-privilege local work across workspace + external local directories        | Allowed                                  | Denied                 | Allowed                    | Only `cx-explore` |

## Permission model

### Plugin interoperability

`cx-work` and `cx-omni` intentionally do **not** set a top-level permission of `"*": "deny"`.

Why:

- A blanket `*` deny hides tool IDs registered by other plugins before execution.
- In practice this made tools from plugins like `opencode-planpilot`, `opencode-workbench`, and `opencode-web-preview` disappear.

These two agents still explicitly deny selected built-in capabilities (`webfetch`, `websearch`, `codesearch`, `skill`, etc.) and keep their bash guardrails.

`cx-explore` now uses `"*": "ask"` (instead of blanket deny), then explicitly allows research/search tools and explicitly denies non-research capabilities (`task`, `edit`, `apply_patch`, `planpilot`, `workbench`, `web_preview_helper`, `github-triage`, etc.).

This keeps plugin search tools visible/usable while preserving a read-first posture.

### Permission words

| Word    | Meaning                                                              |
| ------- | -------------------------------------------------------------------- |
| `allow` | The action is allowed without an approval prompt.                    |
| `ask`   | The action is available, but OpenCode should request approval first. |
| `deny`  | The action is blocked.                                               |

### Important OpenCode detail

In OpenCode, `write` and `apply_patch` are governed by the same `edit` permission family.

So when this README says an agent has `edit: allow`, that effectively means:

- `edit` is allowed
- `write` is allowed
- `apply_patch` is allowed

### Capability matrix

| Capability                              | `cx-explore` | `cx-work`         | `cx-omni`         |
| --------------------------------------- | ------------ | ----------------- | ----------------- |
| `read`                                  | `allow`      | `allow`           | `allow`           |
| `glob` / `grep` / `list`                | `allow`      | `allow`           | `allow`           |
| `edit` / `write` / `apply_patch`        | `deny`       | `allow`           | `allow`           |
| `external_directory`                    | `allow`      | `deny`            | `allow`           |
| `webfetch` / `websearch` / `codesearch` | `allow`      | `deny`            | `deny`            |
| `task`                                  | `deny`       | only `cx-explore` | only `cx-explore` |
| `bash` default                          | `allow`      | `ask`             | `allow`           |
| `doom_loop`                             | `ask`        | `ask`             | `ask`             |
| `todoread` / `todowrite`                | `deny`       | `deny`            | `deny`            |
| `plan_enter` / `plan_exit`              | `deny`       | `deny`            | `deny`            |

## Installation and loading

### Source of truth

The plugin source of truth is the repo file:

```text
/ABS/PATH/opencode-cx-agents/index.js
```

### Recommended setup: plugin-dir shim

The safest setup is to keep the repo file as the only real implementation and make the OpenCode plugin directory file a tiny forwarding shim.

Example global plugin shim:

```js
// ~/.config/opencode/plugins/opencode-cx-agents.js
export { default } from "file:///ABS/PATH/opencode-cx-agents/index.js";
```

Benefits:

- one real source of truth
- no stale copied plugin file to maintain
- stable plugin filename in `~/.config/opencode/plugins/`
- easier debugging when agents do not appear

### Optional config-based loading

You can also load the plugin from `opencode.json` directly:

```json
{
  "plugin": ["file:///ABS/PATH/opencode-cx-agents/index.js"]
}
```

### Avoid stale copies and duplicate loading

Be careful not to create two different active plugin copies by accident.

Common bad pattern:

1. copy `index.js` into `~/.config/opencode/plugins/opencode-cx-agents.js`
2. later update the repo file
3. forget to update the copied file
4. OpenCode keeps loading the stale copied plugin

Another easy mistake is mixing:

- a plugin-dir file like `~/.config/opencode/plugins/opencode-cx-agents.js`
- plus a separate config entry like `file:///ABS/PATH/opencode-cx-agents/index.js`

If you use both, make the plugin-dir file a shim. Do **not** keep a second independently edited copy there.

### Runtime note

These agents are injected at runtime. In practice that means:

- start a new session after changes
- sometimes restart the TUI / desktop app / local server
- do not rely only on a static agent list command when debugging plugin loading

## When to use which agent

| If you need to...                                                                           | Use          |
| ------------------------------------------------------------------------------------------- | ------------ |
| map an unfamiliar codebase, inspect external repos, read external files, or do web research | `cx-explore` |
| implement changes inside the current workspace and delegate broader exploration elsewhere   | `cx-work`    |
| modify files both inside the workspace and in other local directories on the same machine   | `cx-omni`    |

## Agent reference

### `cx-explore`

`cx-explore` is the read-first research agent.

Use it when you need to:

- inventory a codebase
- trace architecture or behavior across many files
- inspect files outside the current workspace
- search the web or code search providers
- inspect external repositories or artifacts
- collect evidence for another agent to act on

#### Permission summary

| Area                                    | Setting          | Practical effect                                                                        |
| --------------------------------------- | ---------------- | --------------------------------------------------------------------------------------- |
| Mode                                    | `all`            | Can be used broadly rather than only as a primary implementation agent.                 |
| Top-level `*`                           | `ask`            | Unknown/new plugin tools stay visible and require approval unless explicitly allowed/denied. |
| `external_directory`                    | `allow`          | Can read files and directories outside the current workspace through normal file tools. |
| `read` / `glob` / `grep` / `list`       | `allow`          | Local exploration is fully enabled.                                                     |
| `edit` / `write` / `apply_patch`        | `deny`           | It cannot edit project files through OpenCode edit tools.                               |
| `webfetch` / `websearch` / `codesearch` / `github-pr-search` | `allow`          | Network/PR search research is available when local evidence is insufficient.            |
| `task`                                  | `deny`           | It cannot spawn subagents.                                                              |
| `bash`                                  | `allow` by default | Blacklist-style guardrails: non-risky commands run directly; mutation/deletion/data-loss patterns are denied directly. |

#### Bash highlights

| Category | Allowed without prompt | Denied (no prompt) |
| --- | --- | --- |
| General exploration shell | Most shell commands that do not match explicit risky patterns | — |
| Filesystem mutation / deletion | Read-only inspection commands | `rm`, `rmdir`, `mv`, `cp`, `mkdir`, `touch`, `ln`, `chmod`, `chown`, `chgrp`, `install`, `sudo`, `tee`, `truncate`, `dd`, `patch`, in-place editors like `sed -i`/`perl -i*`, and redirection `*>*` |
| Package / system mutation | Read-only checks like version/help commands | install/update/remove flows such as `npm` / `pnpm` / `yarn` package mutations, `pip`/`pip3` install or uninstall, and system package managers (`apt`, `apt-get`, `brew`, `yum`, `dnf`, `pacman`, `snap`) |
| Git state changes | Read-only git inspection commands (for example `git status`, `git diff`, `git log`, `git show`, `git grep`, `git stash list/show`, `git branch --list/--show-current`, `git tag --list`, `git worktree list`) | `git add`, `git commit`, `git rm`, `git mv`, `git checkout`, `git switch`, `git restore`, `git reset`, `git clean`, `git rebase`, `git merge`, `git cherry-pick`, `git revert`, `git apply`, stash write flows (`push/save/pop/apply/drop/clear/branch/store`), branch/tag/worktree write flows, `git submodule update`, `git clone`, `git fetch`, `git pull`, `git push` |
| GitHub / GH mutation risk | Most read-oriented `gh` commands, including read-only `gh api` GET calls | `gh api` with mutation flags (`-X`/`--method`, `-f`/`-F`/`--field`/`--raw-field`, `--input`), plus `gh repo clone`, `gh release download`, `gh gist clone`, `gh pr create`, `gh pr merge`, `gh issue create`, `gh issue close`, `gh release create`, `gh secret`, `gh variable` |
| Network fetch | `curl` to stdout and `wget` stdout modes (`wget -qO-`, `wget -qO -`, `wget --quiet -O -`) | `curl` with file output/upload/data/custom request options and generic `wget` downloads |
| Archive writes | — | `unzip`, `tar -x*`, `7z x` |

#### Typical prompts

- “Map the auth flow in this repo and point me to the most relevant files.”
- “Compare this local implementation with the upstream GitHub project and summarize differences.”
- “Read `/etc/...` and tell me which config values matter for this issue.”
- “Investigate the bug, gather evidence, and tell `cx-work` what file to change.”

#### Mental model

`cx-explore` is the safest of the three for research because it cannot use edit tools. Its bash policy is blacklist-oriented (`"*": "allow"`), while commands that can modify state, delete content, or risk data loss are denied directly.

---

### `cx-work`

`cx-work` is the normal implementation agent for the current workspace.

Use it when you need to:

- implement code changes in the repo you are currently working in
- keep exploration narrow and context efficient
- delegate broad discovery or external-path reading to `cx-explore`

#### Permission summary

| Area                                    | Setting            | Practical effect                                                                        |
| --------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| Mode                                    | `primary`          | Intended to be selected directly for implementation work.                               |
| `external_directory`                    | `deny`             | Normal file tools cannot read or edit outside the current workspace/worktree.           |
| `read` / `glob` / `grep` / `list`       | `allow`            | Workspace-local exploration is enabled.                                                 |
| `edit` / `write` / `apply_patch`        | `allow`            | Can modify files in the current workspace.                                              |
| `task`                                  | only `cx-explore`  | It can delegate broad exploration, but not arbitrary subagents.                         |
| `webfetch` / `websearch` / `codesearch` | `deny`             | Network research should go through `cx-explore`, not this agent.                        |
| `skill`                                 | `deny`             | Extra skill execution is disabled.                                                      |
| `bash`                                  | `ask` by default | Whitelist mode: only explicitly allowed safe/inspection commands run without approval. |

#### Bash highlights

| Category | Allowed without prompt | Still asks |
| --- | --- | --- |
| General shell | Explicitly whitelisted inspection commands: local/env diagnostics (`pwd`, `whoami`, `ps`, `df`, `du`, `free`, etc.), file read/search, and structured output tools (`jq`, `yq`) | Any unlisted command |
| Package / build / test workflows | Common non-destructive developer workflows: `npm`/`pnpm`/`yarn`/`bun` test-lint-build-check-dev/preview flows, plus common package-manager inspect/install commands and common language checks (`pytest`, `go test`, `cargo check/test`, `tsc`, `mypy`, etc.) | Unlisted workflows and explicitly risky write variants (for example lint autofix flags) |
| Common git workflows | Read-only git commands plus common non-destructive flows like `git add`, `git commit`, `git fetch`, `git pull`, `git push`, `git clone`, and branch-creation conveniences | risky variants such as `git commit --amend`, `git pull --rebase`/`-r`, and `git push` with `--force` / `-f` / `--delete` / `--mirror` / `--prune` / refspec deletions (`:branch`) / forced refspecs (`+branch`), plus other unlisted git mutations |
| GH + network read flows | Read-oriented `gh` commands (issue/pr/release/run/workflow/repo views), `gh api` GET-style usage, and `curl` / `wget` stdout-style reads | `gh api` mutation flags (`-X`/`--method`, `-f`/`-F`/`--field`/`--raw-field`, `--input`), `curl` write/upload/data/custom-method forms, generic `wget` downloads, and other unlisted network mutations |
| Direct mutation helpers | — | `rm`, `rmdir`, `mv`, `cp`, `chmod`, `chown`, `sudo`, `tee`, `truncate`, `dd`, and shell redirection matching `*>*` |

#### Typical prompts

- “Implement the fix in `packages/opencode`, run the package-local checks, and keep the diff minimal.”
- “Refactor this module in the current workspace. If you need broader architecture discovery, delegate to `cx-explore`.”
- “Make the code change here, but do not read external directories directly.”

#### Important limitation

`cx-work` is **not** a hard sandbox.

Why:

- file tools are constrained to the workspace by `external_directory: deny`
- `bash` now uses a whitelist (`"*": "ask"`) so only listed safe commands auto-run

This is safer than broad shell allow, but it is still not a hard sandbox: allowed commands can still have side effects, and user-approved asked commands can still mutate state.

If you need strict containment, use an external sandbox, container, VM, or separate worktree in addition to this plugin.

---

### `cx-omni`

`cx-omni` is the explicitly dangerous local implementation agent.

Use it when you need to:

- edit both the current workspace and other local directories
- patch global config files, dotfiles, sibling repos, or local tooling
- do “system-wide but still prompt on obviously risky shell operations” work

#### Permission summary

| Area                                    | Setting            | Practical effect                                                                              |
| --------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| Mode                                    | `primary`          | Intended as a directly selected high-privilege agent.                                         |
| `external_directory`                    | `allow`            | File tools can read and edit outside the current workspace.                                   |
| `read` / `glob` / `grep` / `list`       | `allow`            | Local exploration across external paths is allowed.                                           |
| `edit` / `write` / `apply_patch`        | `allow`            | Can modify files both inside and outside the workspace.                                       |
| `task`                                  | only `cx-explore`  | Broad discovery can still be delegated, but only to the explorer agent.                       |
| `webfetch` / `websearch` / `codesearch` | `deny`             | It is for local implementation, not network research.                                         |
| `bash`                                  | `allow` by default | Blacklist mode: most commands run directly, while listed high-risk patterns require approval. |

#### Bash highlights

| Category | Allowed without prompt | Still asks |
| --- | --- | --- |
| General shell | Most commands not matching explicit high-risk patterns | Listed high-risk patterns |
| Local filesystem mutation | Non-mutating shell inspection commands | `rm`, `rmdir`, `mv`, `cp`, `mkdir`, `touch`, `ln`, `patch`, in-place editors (`sed -i` / `perl -i*`), `chmod`, `chown`, `chgrp`, `install`, `sudo`, `tee`, `truncate`, `dd`, `*>*` |
| Git mutation / history rewrite | Read-only git inspection commands and low-risk sync/read flows that do not match blacklist patterns | `git reset`, `git clean`, `git checkout`, `git switch`, `git restore`, `git rebase`, `git merge`, `git cherry-pick`, `git revert`, `git apply`, stash write forms, branch/tag/worktree write forms, `git pull`, `git push`, `git submodule update` |
| Package / system mutation | — | install/update/remove flows (`npm` / `pnpm` / `yarn` / `pip` / system package managers) |
| Remote/API mutation & writey downloads | read-oriented `gh` commands and standard curl/wget stdout usage | `gh api` mutation flags and mutating `gh` subcommands, `curl` write/upload/data/custom method forms, generic `wget` downloads |

#### Typical prompts

- “Update this repo and also patch my `~/.config/opencode/opencode.json`.”
- “Modify the current workspace plus a sibling repo under `/ABS/PATH/...`.”
- “Fix the plugin source and the active global plugin shim in one pass.”

#### Important limitation

Like `cx-work`, `cx-omni` is **not** a hard sandbox. It is intentionally powerful.

Its safety model is:

- external file-tool access is allowed
- many obviously dangerous shell patterns ask first
- but `bash` still defaults to `allow`

So `cx-omni` should be treated as a dangerous convenience layer, not a security boundary.

## Safety notes

### Delegation rules

- `cx-work` can delegate only to `cx-explore`
- `cx-omni` can delegate only to `cx-explore`
- `cx-explore` cannot delegate at all

### External path rules

- `cx-explore`: external file access allowed
- `cx-work`: external file access denied through normal file tools
- `cx-omni`: external file access allowed

### Network rules

- `cx-explore`: network research tools allowed
- `cx-work`: network research tools denied
- `cx-omni`: network research tools denied

### Edit-tool rules

- `cx-explore`: cannot edit through `edit`, `write`, or `apply_patch`
- `cx-work`: can edit workspace files
- `cx-omni`: can edit workspace and external local files

### Bash is not a sandbox

This plugin uses bash permission patterns to gate risky operations, but that does **not** create a complete sandbox.

- `cx-work` uses a whitelist (`"*": "ask"`): only listed commands auto-run.
- `cx-omni` uses a blacklist (`"*": "allow"`): listed high-risk patterns ask first.
- Pattern matching is string-based, so policy coverage can still be incomplete.

Use OS-level isolation if you need real containment.

## Troubleshooting

### I do not see `cx-omni` or another agent

Check these in order:

1. start a new OpenCode session
2. restart the TUI / desktop app if needed
3. confirm the active plugin file is not a stale copied file
4. confirm your plugin-dir shim points at the repo `index.js`
5. confirm you are not accidentally loading two diverged plugin copies

### Recommended file layout

```text
~/.config/opencode/plugins/opencode-cx-agents.js   # shim
/ABS/PATH/opencode-cx-agents/index.js              # real source
```

### Example validation script

Replace the path with your active plugin file (either the shim file or the repo `index.js`):

```bash
node -e 'import("file:///ABS/PATH/ACTIVE-PLUGIN.js").then(async (m) => { const cfg = { agent: {} }; const p = await m.default({}); await p.config(cfg); console.log(Object.keys(cfg.agent).sort().join("\n")); }).catch((err) => { console.error(err); process.exit(1); })'
```

Expected output should include:

```text
cx-explore
cx-omni
cx-work
```

### Plain agent list caveat

If you are debugging plugin visibility, remember that runtime-injected plugin agents may not appear in every static CLI listing flow. Validate in a real OpenCode session when possible.
