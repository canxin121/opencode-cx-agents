export default async function agentPack(_ctx) {
  return {
    async config(cfg) {
      if (!cfg || typeof cfg !== "object") return;
      if (!cfg.agent || typeof cfg.agent !== "object") cfg.agent = {};

      cfg.agent["cx-explore"] = {
        mode: "all",
        description:
          "Read-first explorer (cx): local-first, then network; blocks write/state-changing shell commands",
        prompt:
          "You are OpenCode.\n" +
          "You are an interactive CLI research/exploration agent.\n\n" +
          "Core behavior:\n" +
          "- Be read-first and evidence-driven.\n" +
          "- Explore broadly: map the codebase, find entry points, trace behavior, then narrow.\n" +
          "- Strict priority: (1) local workspace, (2) local system paths if relevant, (3) network.\n\n" +
          "Local-first workflow:\n" +
          "1) Inventory quickly: list key dirs, glob for likely files, grep for keywords/symbols, then read the most relevant files.\n" +
          "2) Deepen: follow references, configs, build scripts, and git history to understand intent.\n" +
          "3) Only if local evidence is insufficient, use network search (webfetch/websearch/codesearch) and clearly state why.\n\n" +
          "Read-only shell policy:\n" +
          "- Bash write/state-changing commands are blocked by permission rules.\n" +
          "- Prefer read-only inspection and fetch-to-stdout workflows.\n" +
          "- Never write into or modify the user's current project/worktree.\n\n" +
          "Tooling rules:\n" +
          "- Prefer native tools for local exploration: list, glob, grep, read.\n" +
          "- Use bash primarily for git/gh and targeted network inspection (curl/wget) and read-only utilities.\n" +
          "- Run tool calls in parallel when independent.\n\n" +
          "Safety and privacy:\n" +
          "- Avoid exposing secrets. Do not quote sensitive values (tokens, private keys, credentials). If a sensitive file is relevant, summarize structure/impact without leaking values.\n\n" +
          "Output requirements:\n" +
          "- Cite evidence: include absolute file paths (and line numbers when possible), key command outputs, and URLs used.\n" +
          "- If uncertain, say what is unknown and propose the next 1-3 local checks first.\n",
        permission: {
          "*": "ask",
          doom_loop: "ask",
          external_directory: "allow",
          read: "allow",
          glob: "allow",
          grep: "allow",
          list: "allow",
          webfetch: "allow",
          websearch: "allow",
          codesearch: "allow",
          "github-pr-search": "allow",
          question: "deny",
          task: "deny",
          todowrite: "deny",
          todoread: "deny",
          plan_enter: "deny",
          plan_exit: "deny",
          edit: "deny",
          apply_patch: "deny",
          skill: "deny",
          planpilot: "deny",
          workbench: "deny",
          web_preview_helper: "deny",
          "github-triage": "deny",
          bash: {
            "*": "allow",

            // Filesystem mutations / potential data loss
            "rm *": "deny",
            "rmdir *": "deny",
            "mv *": "deny",
            "cp *": "deny",
            "mkdir *": "deny",
            "touch *": "deny",
            "ln *": "deny",
            "chmod *": "deny",
            "chown *": "deny",
            "chgrp *": "deny",
            "install *": "deny",
            "sudo *": "deny",
            "tee *": "deny",
            "truncate *": "deny",
            "dd *": "deny",
            "patch *": "deny",
            "sed -i *": "deny",
            "perl -i*": "deny",
            "*>*": "deny",

            // Package / system install or uninstall flows
            "npm install *": "deny",
            "npm i *": "deny",
            "npm ci *": "deny",
            "npm update *": "deny",
            "npm uninstall *": "deny",
            "npm remove *": "deny",
            "pnpm install *": "deny",
            "pnpm i *": "deny",
            "pnpm add *": "deny",
            "pnpm update *": "deny",
            "pnpm remove *": "deny",
            "yarn install *": "deny",
            "yarn add *": "deny",
            "yarn remove *": "deny",
            "yarn upgrade *": "deny",
            "pip install *": "deny",
            "pip uninstall *": "deny",
            "pip3 install *": "deny",
            "pip3 uninstall *": "deny",
            "apt *": "deny",
            "apt-get *": "deny",
            "brew *": "deny",
            "yum *": "deny",
            "dnf *": "deny",
            "pacman *": "deny",
            "snap *": "deny",

            // Archive extraction / writes to disk
            "unzip *": "deny",
            "tar -x*": "deny",
            "7z x *": "deny",

            // Git state changes (local or remote)
            "git add *": "deny",
            "git commit *": "deny",
            "git rm *": "deny",
            "git mv *": "deny",
            "git checkout *": "deny",
            "git switch *": "deny",
            "git restore *": "deny",
            "git reset *": "deny",
            "git clean *": "deny",
            "git rebase *": "deny",
            "git merge *": "deny",
            "git cherry-pick *": "deny",
            "git revert *": "deny",
            "git apply *": "deny",

            // stash write operations
            "git stash": "deny",
            "git stash push *": "deny",
            "git stash save *": "deny",
            "git stash pop *": "deny",
            "git stash apply *": "deny",
            "git stash drop *": "deny",
            "git stash clear *": "deny",
            "git stash branch *": "deny",
            "git stash store *": "deny",

            // branch/tag/worktree write operations
            "git branch -d *": "deny",
            "git branch -D *": "deny",
            "git branch --delete *": "deny",
            "git branch -m *": "deny",
            "git branch -M *": "deny",
            "git branch --move *": "deny",
            "git branch -c *": "deny",
            "git branch -C *": "deny",
            "git branch --copy *": "deny",
            "git branch --set-upstream-to *": "deny",
            "git branch --unset-upstream *": "deny",

            "git tag -d *": "deny",
            "git tag --delete *": "deny",
            "git tag -a *": "deny",
            "git tag -s *": "deny",
            "git tag -u *": "deny",
            "git tag -f *": "deny",

            "git worktree add *": "deny",
            "git worktree remove *": "deny",
            "git worktree move *": "deny",
            "git worktree lock *": "deny",
            "git worktree unlock *": "deny",
            "git worktree prune *": "deny",
            "git worktree repair *": "deny",

            "git submodule update *": "deny",
            "git clone *": "deny",
            "git fetch *": "deny",
            "git pull *": "deny",
            "git push *": "deny",

            // GH operations that can mutate remote or write locally
            "gh api * -X *": "deny",
            "gh api * --method *": "deny",
            "gh api * -f *": "deny",
            "gh api * -F *": "deny",
            "gh api * --field *": "deny",
            "gh api * --raw-field *": "deny",
            "gh api * --input *": "deny",
            "gh repo clone *": "deny",
            "gh release download *": "deny",
            "gh gist clone *": "deny",
            "gh pr create *": "deny",
            "gh pr merge *": "deny",
            "gh issue create *": "deny",
            "gh issue close *": "deny",
            "gh release create *": "deny",
            "gh secret *": "deny",
            "gh variable *": "deny",

            // curl can write files or mutate remote resources
            "curl * -o *": "deny",
            "curl * --output *": "deny",
            "curl * --output=*": "deny",
            "curl * -O *": "deny",
            "curl * --remote-name *": "deny",
            "curl * --remote-name-all *": "deny",
            "curl * -T *": "deny",
            "curl * --upload-file *": "deny",
            "curl * -d *": "deny",
            "curl * --data *": "deny",
            "curl * --data-*": "deny",
            "curl * -F *": "deny",
            "curl * --form *": "deny",
            "curl * -X *": "deny",
            "curl * --request *": "deny",

            "wget *": "deny",
            "wget -qO- *": "allow",
            "wget -qO - *": "allow",
            "wget --quiet -O - *": "allow",
          },
        },
      };

      cfg.agent["cx-work"] = {
        mode: "primary",
        description:
          "Safer workspace implementation agent (cx) with whitelist bash permissions; delegates broad exploration to cx-explore",
        prompt:
          "You are a write-focused implementation agent for the current workspace.\n\n" +
          "Scope:\n" +
          "- Your job is to implement changes (edit/write/apply_patch) in the current workspace.\n" +
          "- Keep context small: do only lightweight local checks (glob/grep/read/list) when you already have a strong lead.\n\n" +
          "Delegation (mandatory):\n" +
          "- If you need broad codebase exploration, unknown file discovery, architecture mapping, large-scale searches, network research, inspecting external repositories/artifacts, OR reading ANY external paths outside the current workspace/worktree, delegate to the cx-explore agent via the task tool.\n" +
          "- Ask cx-explore for a concise, evidence-based summary (paths + key excerpts), not a full dump.\n\n" +
          "Editing:\n" +
          "- Make changes using edit/write/apply_patch tools, not via bash redirections.\n" +
          "- Avoid deleting/moving large sets of files unless clearly required.\n\n" +
          "Bash safety:\n" +
          "- Bash uses a whitelist model: explicitly allowed read/inspection commands run directly; all other commands require approval.\n" +
          "- Treat state-changing commands as dangerous and avoid them unless explicitly justified.\n\n" +
          "Output:\n" +
          "- Be concise. State what changed, why, and how to verify (commands to run).\n",
        permission: {
          doom_loop: "ask",

          external_directory: "deny",

          read: "allow",
          glob: "allow",
          grep: "allow",
          list: "allow",

          edit: "allow",
          apply_patch: "allow",

          task: {
            "*": "deny",
            "cx-explore": "allow",
          },

          todowrite: "deny",
          todoread: "deny",
          plan_enter: "deny",
          plan_exit: "deny",

          webfetch: "deny",
          websearch: "deny",
          codesearch: "deny",
          skill: "deny",

          bash: {
            "*": "ask",

            // Safe local/environment inspection
            "pwd *": "allow",
            "whoami *": "allow",
            "id *": "allow",
            "uname *": "allow",
            "which *": "allow",

            // Safe filesystem reads
            "ls *": "allow",
            "stat *": "allow",
            "file *": "allow",
            "readlink *": "allow",
            "realpath *": "allow",
            "cat *": "allow",
            "head *": "allow",
            "tail *": "allow",
            "nl *": "allow",
            "wc *": "allow",
            "grep *": "allow",
            "rg *": "allow",
            "strings *": "allow",
            "hexdump *": "allow",
            "od *": "allow",
            "xxd *": "allow",
            "sha256sum *": "allow",
            "shasum *": "allow",
            "md5sum *": "allow",
            "diff *": "allow",
            "cmp *": "allow",

            // Safe system diagnostics / introspection
            "date *": "allow",
            "uptime *": "allow",
            "hostname *": "allow",
            "ps *": "allow",
            "df *": "allow",
            "du *": "allow",
            "free *": "allow",
            "lsof *": "allow",
            "tree *": "allow",
            "jq *": "allow",
            "yq *": "allow",

            // Safe git inspection
            "git status *": "allow",
            "git diff *": "allow",
            "git log *": "allow",
            "git show *": "allow",
            "git grep *": "allow",
            "git ls-files *": "allow",
            "git ls-tree *": "allow",
            "git rev-parse *": "allow",
            "git cat-file *": "allow",
            "git blame *": "allow",
            "git for-each-ref *": "allow",
            "git describe *": "allow",
            "git show-ref *": "allow",
            "git reflog *": "allow",
            "git ls-remote *": "allow",
            "git stash list *": "allow",
            "git stash show *": "allow",
            "git branch": "allow",
            "git branch --show-current *": "allow",
            "git branch --list *": "allow",
            "git branch -l *": "allow",
            "git tag": "allow",
            "git tag --list *": "allow",
            "git tag -l *": "allow",
            "git worktree list *": "allow",

            "git -C * status *": "allow",
            "git -C * diff *": "allow",
            "git -C * log *": "allow",
            "git -C * show *": "allow",
            "git -C * grep *": "allow",
            "git -C * ls-files *": "allow",
            "git -C * ls-tree *": "allow",
            "git -C * rev-parse *": "allow",
            "git -C * cat-file *": "allow",
            "git -C * blame *": "allow",

            // Common build/test/check commands (non-destructive by intent)
            "npm test *": "allow",
            "npm run test *": "allow",
            "npm run lint *": "allow",
            "npm run build *": "allow",
            "npm run typecheck *": "allow",
            "npm run check *": "allow",

            "pnpm test *": "allow",
            "pnpm run test *": "allow",
            "pnpm run lint *": "allow",
            "pnpm run build *": "allow",
            "pnpm run typecheck *": "allow",
            "pnpm run check *": "allow",

            "yarn test *": "allow",
            "yarn run test *": "allow",
            "yarn run lint *": "allow",
            "yarn run build *": "allow",
            "yarn run typecheck *": "allow",
            "yarn run check *": "allow",

            "bun test *": "allow",
            "bun run test *": "allow",
            "bun run lint *": "allow",
            "bun run build *": "allow",
            "bun run typecheck *": "allow",
            "bun run check *": "allow",

            // Common development server / preview commands
            "npm run dev *": "allow",
            "npm run start *": "allow",
            "npm run serve *": "allow",
            "npm run preview *": "allow",
            "pnpm run dev *": "allow",
            "pnpm run start *": "allow",
            "pnpm run serve *": "allow",
            "pnpm run preview *": "allow",
            "yarn run dev *": "allow",
            "yarn run start *": "allow",
            "yarn run serve *": "allow",
            "yarn run preview *": "allow",
            "bun run dev *": "allow",
            "bun run start *": "allow",
            "bun run serve *": "allow",
            "bun run preview *": "allow",

            // Common package manager flows with low loss risk
            "npm ci *": "allow",
            "npm install *": "allow",
            "npm ls *": "allow",
            "npm outdated *": "allow",
            "npm view *": "allow",
            "npm doctor *": "allow",
            "pnpm install *": "allow",
            "pnpm list *": "allow",
            "pnpm outdated *": "allow",
            "pnpm why *": "allow",
            "yarn install *": "allow",
            "yarn list *": "allow",
            "yarn info *": "allow",
            "yarn why *": "allow",
            "yarn outdated *": "allow",
            "bun install *": "allow",
            "pip list *": "allow",
            "pip show *": "allow",
            "pip freeze *": "allow",
            "pip3 list *": "allow",
            "pip3 show *": "allow",
            "pip3 freeze *": "allow",

            "pytest *": "allow",
            "python -m pytest *": "allow",
            "python -m unittest *": "allow",
            "python -m compileall *": "allow",
            "ruff check *": "allow",
            "mypy *": "allow",
            "pyright *": "allow",
            "go test *": "allow",
            "go build *": "allow",
            "go list *": "allow",
            "go vet *": "allow",
            "cargo test *": "allow",
            "cargo check *": "allow",
            "cargo clippy *": "allow",
            "cargo build *": "allow",
            "cargo fmt --check *": "allow",
            "cargo doc *": "allow",
            "tsc *": "allow",
            "eslint *": "allow",
            "prettier --check *": "allow",
            "vitest *": "allow",
            "jest *": "allow",
            "playwright test *": "allow",
            "mvn test *": "allow",
            "mvn verify *": "allow",
            "mvn package *": "allow",
            "gradle test *": "allow",
            "gradle build *": "allow",
            "dotnet test *": "allow",
            "dotnet build *": "allow",

            // Common make/just targets typically used for checks
            "make test *": "allow",
            "make lint *": "allow",
            "make build *": "allow",
            "make check *": "allow",
            "make verify *": "allow",
            "just test *": "allow",
            "just lint *": "allow",
            "just build *": "allow",
            "just check *": "allow",

            // Common container / orchestration read-only operations
            "docker ps *": "allow",
            "docker images *": "allow",
            "docker logs *": "allow",
            "docker inspect *": "allow",
            "docker stats *": "allow",
            "docker compose logs *": "allow",
            "kubectl get *": "allow",
            "kubectl describe *": "allow",
            "kubectl logs *": "allow",
            "kubectl config get-contexts *": "allow",
            "kubectl config current-context *": "allow",

            // Common non-destructive git flows
            "git add *": "allow",
            "git commit *": "allow",
            "git fetch *": "allow",
            "git pull *": "allow",
            "git push *": "allow",
            "git clone *": "allow",
            "git switch -c *": "allow",
            "git switch --create *": "allow",
            "git checkout -b *": "allow",
            "git remote -v *": "allow",
            "git remote show *": "allow",
            "git remote get-url *": "allow",

            // Common read-only gh flows
            "gh search *": "allow",
            "gh repo view *": "allow",
            "gh repo list *": "allow",
            "gh issue list *": "allow",
            "gh issue view *": "allow",
            "gh pr list *": "allow",
            "gh pr view *": "allow",
            "gh pr diff *": "allow",
            "gh pr checks *": "allow",
            "gh release list *": "allow",
            "gh release view *": "allow",
            "gh run list *": "allow",
            "gh run view *": "allow",
            "gh workflow list *": "allow",
            "gh workflow view *": "allow",
            "gh auth status *": "allow",
            "gh api *": "allow",
            "gh repo clone *": "allow",

            // Network reads to stdout by default
            "curl *": "allow",
            "wget -qO- *": "allow",
            "wget -qO - *": "allow",
            "wget --quiet -O - *": "allow",

            // Risky variants of otherwise-allowed git flows
            "git commit --amend*": "ask",
            "git commit * --amend*": "ask",
            "git pull --rebase*": "ask",
            "git pull * --rebase*": "ask",
            "git pull -r *": "ask",
            "git pull * -r *": "ask",
            "git push --force*": "ask",
            "git push * --force*": "ask",
            "git push -f *": "ask",
            "git push * -f *": "ask",
            "git push --delete*": "ask",
            "git push * --delete *": "ask",
            "git push --mirror*": "ask",
            "git push * --mirror*": "ask",
            "git push --prune*": "ask",
            "git push * --prune*": "ask",
            "git push :*": "ask",
            "git push * :*": "ask",
            "git push +*": "ask",
            "git push * +*": "ask",

            // GH API mutations
            "gh api * -X *": "ask",
            "gh api * --method *": "ask",
            "gh api * -f *": "ask",
            "gh api * -F *": "ask",
            "gh api * --field *": "ask",
            "gh api * --raw-field *": "ask",
            "gh api * --input *": "ask",

            // curl mutations / file writes
            "curl * -o *": "ask",
            "curl * --output *": "ask",
            "curl * --output=*": "ask",
            "curl * -O *": "ask",
            "curl * --remote-name *": "ask",
            "curl * --remote-name-all *": "ask",
            "curl * -T *": "ask",
            "curl * --upload-file *": "ask",
            "curl * -d *": "ask",
            "curl * --data *": "ask",
            "curl * --data-*": "ask",
            "curl * -F *": "ask",
            "curl * --form *": "ask",
            "curl * -X *": "ask",
            "curl * --request *": "ask",

            // Lint autofix / format writes
            "eslint --fix*": "ask",
            "eslint * --fix*": "ask",
            "ruff check * --fix*": "ask",

            // Keep write-style redirection gated when read commands are allowed
            "*>*": "ask",
          },
        },
      };

      cfg.agent["cx-omni"] = {
        mode: "primary",
        description:
          "High-privilege write agent (cx) for workspace-first plus external local directories; blacklist-style bash with high-risk asks",
        prompt:
          "You are a high-privilege write-focused implementation agent.\n\n" +
          "Scope:\n" +
          "- Prefer the current workspace/worktree first for reads, edits, and implementations.\n" +
          "- You may also read from and write to external local directories when the task requires it.\n" +
          "- Before writing outside the current workspace, verify the exact target path and parent directory, then keep changes tightly scoped.\n\n" +
          "Delegation (mandatory):\n" +
          "- If you need broad codebase exploration, unknown file discovery, architecture mapping, large-scale searches, network research, or external repository/artifact inspection, delegate to the cx-explore agent via the task tool.\n" +
          "- Ask cx-explore for a concise, evidence-based summary (paths + key excerpts), not a full dump.\n\n" +
          "Editing:\n" +
          "- Make changes using edit/write/apply_patch tools, not via bash redirections.\n" +
          "- Be careful with external local directories: verify the destination before creating, moving, or overwriting files.\n\n" +
          "Bash safety:\n" +
          "- Bash is allowed for builds/tests and safe inspection.\n" +
          "- Destructive or state-changing shell commands must require approval (the permission system will ask). Avoid them unless clearly justified.\n\n" +
          "Output:\n" +
          "- Be concise. State what changed, why, and how to verify (commands to run).\n",
        permission: {
          doom_loop: "ask",

          external_directory: "allow",

          read: "allow",
          glob: "allow",
          grep: "allow",
          list: "allow",

          edit: "allow",
          apply_patch: "allow",

          task: {
            "*": "deny",
            "cx-explore": "allow",
          },

          todowrite: "deny",
          todoread: "deny",
          plan_enter: "deny",
          plan_exit: "deny",

          webfetch: "deny",
          websearch: "deny",
          codesearch: "deny",
          skill: "deny",

          bash: {
            "*": "allow",

            "rm *": "ask",
            "rmdir *": "ask",
            "mv *": "ask",
            "cp *": "ask",
            "mkdir *": "ask",
            "touch *": "ask",
            "ln *": "ask",
            "patch *": "ask",
            "sed -i *": "ask",
            "perl -i*": "ask",

            "chmod *": "ask",
            "chown *": "ask",
            "chgrp *": "ask",
            "install *": "ask",
            "sudo *": "ask",

            "git reset *": "ask",
            "git clean *": "ask",
            "git checkout *": "ask",
            "git switch *": "ask",
            "git restore *": "ask",
            "git rebase *": "ask",
            "git merge *": "ask",
            "git cherry-pick *": "ask",
            "git revert *": "ask",
            "git apply *": "ask",

            // stash write operations
            "git stash": "ask",
            "git stash push *": "ask",
            "git stash save *": "ask",
            "git stash pop *": "ask",
            "git stash apply *": "ask",
            "git stash drop *": "ask",
            "git stash clear *": "ask",
            "git stash branch *": "ask",
            "git stash store *": "ask",

            // branch/tag/worktree write operations
            "git branch -d *": "ask",
            "git branch -D *": "ask",
            "git branch --delete *": "ask",
            "git branch -m *": "ask",
            "git branch -M *": "ask",
            "git branch --move *": "ask",
            "git branch -c *": "ask",
            "git branch -C *": "ask",
            "git branch --copy *": "ask",
            "git branch --set-upstream-to *": "ask",
            "git branch --unset-upstream *": "ask",

            "git tag -d *": "ask",
            "git tag --delete *": "ask",
            "git tag -a *": "ask",
            "git tag -s *": "ask",
            "git tag -u *": "ask",
            "git tag -f *": "ask",

            "git worktree add *": "ask",
            "git worktree remove *": "ask",
            "git worktree move *": "ask",
            "git worktree lock *": "ask",
            "git worktree unlock *": "ask",
            "git worktree prune *": "ask",
            "git worktree repair *": "ask",

            "git pull *": "ask",
            "git push *": "ask",
            "git submodule update *": "ask",

            // package / system mutation
            "npm install *": "ask",
            "npm i *": "ask",
            "npm ci *": "ask",
            "npm update *": "ask",
            "npm uninstall *": "ask",
            "npm remove *": "ask",
            "pnpm install *": "ask",
            "pnpm i *": "ask",
            "pnpm add *": "ask",
            "pnpm update *": "ask",
            "pnpm remove *": "ask",
            "yarn install *": "ask",
            "yarn add *": "ask",
            "yarn remove *": "ask",
            "yarn upgrade *": "ask",
            "pip install *": "ask",
            "pip uninstall *": "ask",
            "pip3 install *": "ask",
            "pip3 uninstall *": "ask",
            "apt *": "ask",
            "apt-get *": "ask",
            "brew *": "ask",
            "yum *": "ask",
            "dnf *": "ask",
            "pacman *": "ask",
            "snap *": "ask",

            // GH operations that can mutate remote or write locally
            "gh api * -X *": "ask",
            "gh api * --method *": "ask",
            "gh api * -f *": "ask",
            "gh api * -F *": "ask",
            "gh api * --field *": "ask",
            "gh api * --raw-field *": "ask",
            "gh api * --input *": "ask",
            "gh pr create *": "ask",
            "gh pr merge *": "ask",
            "gh issue create *": "ask",
            "gh issue close *": "ask",
            "gh release create *": "ask",
            "gh secret *": "ask",
            "gh variable *": "ask",

            // curl can write files or mutate remote resources
            "curl * -o *": "ask",
            "curl * --output *": "ask",
            "curl * --output=*": "ask",
            "curl * -O *": "ask",
            "curl * --remote-name *": "ask",
            "curl * --remote-name-all *": "ask",
            "curl * -T *": "ask",
            "curl * --upload-file *": "ask",
            "curl * -d *": "ask",
            "curl * --data *": "ask",
            "curl * --data-*": "ask",
            "curl * -F *": "ask",
            "curl * --form *": "ask",
            "curl * -X *": "ask",
            "curl * --request *": "ask",

            // archive extraction / write-heavy ops
            "unzip *": "ask",
            "tar -x*": "ask",
            "7z x *": "ask",

            "tee *": "ask",
            "truncate *": "ask",
            "dd *": "ask",

            "wget *": "ask",
            "wget -qO- *": "allow",
            "wget -qO - *": "allow",
            "wget --quiet -O - *": "allow",

            "*>*": "ask",
          },
        },
      };
    },
  };
}
