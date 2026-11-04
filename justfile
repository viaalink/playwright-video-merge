build:
    npm run build

test:
    npm test

publish-dry:
    npm pack --dry-run

publish:
    npm publish --access public

typecheck:
    npm run typecheck

# Run the CLI on the real Playwright 1.58 fixture; writes ./reel.mp4
demo:
    npm run build
    node dist/cli.js -i tests/fixtures/playwright-1.58/test-results -r tests/fixtures/playwright-1.58/playwright-report.json --sort report-order -o reel.mp4 -f mp4 -v

# Pack the old package name, which only re-exports this one
legacy-pack:
    cd legacy-package && npm pack --dry-run

# Publish the forwarding release of the old name, then deprecate it (needs npm login)
legacy-publish:
    cd legacy-package && npm publish --access public
    npm deprecate "@accelerated-software-development/playwright-video-merge" "Moved to @viaalink/playwright-video-merge (same CLI and API). This name gets no new releases."

# Demo film (Viaalink's film engine, not in this repo; PRODUCT_VIDEO points at it).
# voice → record → render → contact sheet; output in local/video/reel/<variant>/.
# PVM_FROM_NPM=1 films the release on npm instead of this checkout.
demo-video variant="promo":
    #!/usr/bin/env bash
    set -euo pipefail
    PV="${PRODUCT_VIDEO:-../../packages/product-video}"
    if [[ ! -x "$PV/bin/film.sh" ]]; then
      echo "The film engine is not on this machine (looked in $PV)." >&2
      echo "It is Viaalink's own tooling; ask info@viaalink.com if you want to know how the films are made." >&2
      exit 1
    fi
    bash "$PV/bin/film.sh" demo/film.config.ts reel {{variant}}

# Typecheck the storyboard (needs the film engine for its types)
demo-typecheck:
    npx tsc -p demo/tsconfig.json
