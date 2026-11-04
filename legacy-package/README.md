# Moved to `@viaalink/playwright-video-merge`

`@accelerated-software-development/playwright-video-merge` is now
[`@viaalink/playwright-video-merge`](https://www.npmjs.com/package/@viaalink/playwright-video-merge).
Same CLI, same API, new name. New releases appear only there.

## Switch

```bash
npm uninstall @accelerated-software-development/playwright-video-merge
npm install -D @viaalink/playwright-video-merge
```

Then replace `@accelerated-software-development/playwright-video-merge` with
`@viaalink/playwright-video-merge` in your imports. The command stays
`playwright-video-merge`.

## Until you switch

This last version (0.1.1) contains no code of its own: it re-exports
`@viaalink/playwright-video-merge`, and its `playwright-video-merge` command runs
the new package's CLI. Existing imports and scripts keep working and pick up its
fixes. It is deprecated, so npm warns on install.
