export default async function agentPack(_ctx) {
  return {
    async config(cfg) {
      if (!cfg || typeof cfg !== "object") return;
      if (!cfg.agent || typeof cfg.agent !== "object") cfg.agent = {};

      const dataLossAskBashRules = {
        // Deletion / data-loss-prone filesystem operations
        "rm *": "ask",
        "rmdir *": "ask",
        "mv *": "ask",
        "cp *": "ask",
        "sed -i *": "ask",
        "perl -i*": "ask",
        "truncate *": "ask",
        "dd *": "ask",
        "tee *": "ask",
        "*>*": "ask",

        // Permission / ownership changes can lock out data
        "chmod *": "ask",
        "chown *": "ask",
        "chgrp *": "ask",
        "sudo *": "ask",

        // Destructive git operations / history rewrites
        "git reset *": "ask",
        "git clean *": "ask",
        "git checkout *": "ask",
        "git switch *": "ask",
        "git restore *": "ask",
        "git rebase *": "ask",

        // Stash destructive variants
        "git stash pop *": "ask",
        "git stash drop *": "ask",
        "git stash clear *": "ask",

        // Branch/tag/worktree destructive operations
        "git branch -d *": "ask",
        "git branch -D *": "ask",
        "git branch --delete *": "ask",
        "git tag -d *": "ask",
        "git tag --delete *": "ask",
        "git worktree remove *": "ask",
        "git worktree prune *": "ask",

        // Potentially destructive pull/push variants
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

        // Package/system removals
        "npm uninstall *": "ask",
        "npm remove *": "ask",
        "pnpm remove *": "ask",
        "yarn remove *": "ask",
        "pip uninstall *": "ask",
        "pip3 uninstall *": "ask",
        "apt remove *": "ask",
        "apt purge *": "ask",
        "apt-get remove *": "ask",
        "apt-get purge *": "ask",
        "brew uninstall *": "ask",
        "yum remove *": "ask",
        "dnf remove *": "ask",
        "pacman -R*": "ask",
        "snap remove *": "ask",

        // Explicit remote deletions
        "gh issue close *": "ask",
        "gh secret delete *": "ask",
        "gh variable delete *": "ask",
        "gh api * -X DELETE*": "ask",
        "gh api * --method DELETE*": "ask",

        // Explicit HTTP DELETE requests
        "curl * -X DELETE*": "ask",
        "curl * --request DELETE*": "ask",
      };

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
          "*": "allow",
          doom_loop: "deny",
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
          },
        },
      };

      cfg.agent["cx-local"] = {
        mode: "primary",
        description:
          "Workspace-first write agent (cx): same write profile as cx-global, but external file-tool access asks approval",
        prompt:
          "You are a workspace-first write-focused implementation agent.\n\n" +
          "Scope:\n" +
          "- Prefer the current workspace/worktree first for reads, edits, and implementations.\n" +
          "- You can read/write external local directories when needed, but external file-tool access requires approval.\n" +
          "- Before writing outside the current workspace, verify the exact target path and parent directory, then keep changes tightly scoped.\n\n" +
          "Delegation (mandatory):\n" +
          "- If you need broad codebase exploration, unknown file discovery, architecture mapping, large-scale searches, network research, or external repository/artifact inspection, delegate to the cx-explore agent via the task tool.\n" +
          "- Ask cx-explore for a concise, evidence-based summary (paths + key excerpts), not a full dump.\n\n" +
          "Editing:\n" +
          "- Make changes using edit/write/apply_patch tools, not via bash redirections.\n" +
          "- Be careful with external local directories: verify the destination before creating, moving, or overwriting files.\n\n" +
          "Bash safety:\n" +
          "- Bash is allowed for builds/tests and safe inspection.\n" +
          "- Downloads/creation flows should run directly; commands that can cause deletion or data loss must require approval (the permission system will ask).\n\n" +
          "Output:\n" +
          "- Be concise. State what changed, why, and how to verify (commands to run).\n",
        permission: {
          "*": "allow",
          doom_loop: "ask",

          external_directory: "ask",

          read: "allow",
          glob: "allow",
          grep: "allow",
          list: "allow",

          edit: "allow",
          apply_patch: "allow",

          bash: {
            "*": "allow",
            ...dataLossAskBashRules,
          },
        },
      };

      cfg.agent["cx-global"] = {
        mode: "primary",
        description:
          "High-privilege write agent (cx): workspace + external local directories; only deletion/data-loss-prone bash patterns ask",
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
          "- Downloads/creation flows should run directly; commands that can cause deletion or data loss must require approval (the permission system will ask).\n\n" +
          "Output:\n" +
          "- Be concise. State what changed, why, and how to verify (commands to run).\n",
        permission: {
          "*": "allow",
          doom_loop: "ask",

          external_directory: "allow",

          read: "allow",
          glob: "allow",
          grep: "allow",
          list: "allow",

          edit: "allow",
          apply_patch: "allow",

          bash: {
            "*": "allow",
            ...dataLossAskBashRules,
          },
        },
      };
    },
  };
}
