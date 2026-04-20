#!/bin/sh
# install.sh - install repo git hooks (idempotent, hook-agnostic).
#
# Wired by `npm install` via the `prepare` script. Safe to run by hand:
#   sh scripts/git-hooks/install.sh
#
# For every standard git hook name (pre-commit, pre-push, post-merge, ...)
# present as a file under scripts/git-hooks/, copy it to .git/hooks/ and
# chmod +x. If a non-managed user hook already exists, preserve it as
# .git/hooks/<name>.local; the managed hook (which carries the marker
# `MANAGED-BY-pow3r-git-hooks`) chains to it at the end.
#
# Idempotent: re-running just refreshes the managed hooks.
#
set -e

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[git-hooks/install] not in a git worktree; skipping"
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

HOOK_DIR=".git/hooks"
SOURCE_DIR="scripts/git-hooks"
mkdir -p "$HOOK_DIR"

# Standard git hook names. Keep this list canonical; we only consider
# files in scripts/git-hooks/ that match one of these basenames so
# install.sh, READMEs, etc. are never mistakenly installed.
HOOK_NAMES="applypatch-msg pre-applypatch post-applypatch pre-commit pre-merge-commit prepare-commit-msg commit-msg post-commit pre-rebase post-checkout post-merge pre-push pre-auto-gc post-rewrite sendemail-validate fsmonitor-watchman push-to-checkout"

for name in $HOOK_NAMES; do
  src="$SOURCE_DIR/$name"
  dst="$HOOK_DIR/$name"
  [ -f "$src" ] || continue
  if [ -f "$dst" ] && ! grep -q "MANAGED-BY-pow3r-git-hooks" "$dst" 2>/dev/null; then
    if [ ! -f "$HOOK_DIR/$name.local" ]; then
      mv "$dst" "$HOOK_DIR/$name.local"
      chmod +x "$HOOK_DIR/$name.local" 2>/dev/null || true
      echo "[git-hooks/install] preserved existing $name as $HOOK_DIR/$name.local"
    else
      rm -f "$dst"
    fi
  fi
  cp "$src" "$dst"
  chmod +x "$dst"
  echo "[git-hooks/install] installed $dst"
done

exit 0
