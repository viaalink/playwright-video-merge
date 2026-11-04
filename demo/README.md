# Demo film

The storyboard behind the film of `@viaalink/playwright-video-merge`:
`storyboard.ts`, with `global-setup.ts` starting the terminal (tmux in a copy of
`shop/`, shown by ttyd). The film types `npx playwright test` and
`npx playwright-video-merge` into a real terminal and plays the reel it made.
Every step checks that it worked, so a broken tool fails the recording instead
of ending up on film.

`shop/` is a small Playwright project on its own: `cd demo/shop && npm install &&
npx playwright test && npm run reel` makes the same reel without any film tooling.

The film is made with Viaalink's own film and voice tooling, which is not part of
this repository; `just demo-video` only works on a machine that has it. Curious
how we make them? Mail **info@viaalink.com**.
