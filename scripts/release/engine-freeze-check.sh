#!/usr/bin/env bash
# Read-only. Fails if the frozen Inner Rep engine (lib/innerRep/v2) differs from the freeze tag. Run from the repository root.
set -u
TAG="${ENGINE_TAG:-inner-rep-engine-v2.0.1-correction-fix}"
git rev-parse -q --verify "refs/tags/$TAG" >/dev/null || { echo "FAIL  freeze tag $TAG not found"; exit 1; }
if git diff --quiet "$TAG" -- lib/innerRep/v2; then echo "PASS  lib/innerRep/v2 is byte-identical to $TAG"; else echo "FAIL  lib/innerRep/v2 differs from $TAG:"; git diff --stat "$TAG" -- lib/innerRep/v2; exit 1; fi
