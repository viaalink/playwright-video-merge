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
