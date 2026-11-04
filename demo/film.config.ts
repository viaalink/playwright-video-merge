/**
 * The demo film of this repo, for Viaalink's film engine (private, not part of
 * this repository). Only what is specific to this film lives here: the
 * storyboard, the terminal setup and the shop whose tests it films.
 *
 * Want to know how the films are made? Mail info@viaalink.com.
 */
import { resolve } from "path";

export default {
  /** Code cards cut files from the repository root. */
  root: resolve(__dirname, ".."),
  out: resolve(__dirname, "../local/video"),
  boards: {
    reel: {
      storyboard: resolve(__dirname, "storyboard.ts"),
      setup: resolve(__dirname, "global-setup.ts"),
      teardown: resolve(__dirname, "global-teardown.ts"),
    },
  },
};
