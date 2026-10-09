# Saifworks

Personal portfolio of Saif Alshalabi — [saifworks.vercel.app](https://saifworks.vercel.app).

## About

Interactive single-page portfolio featuring an art-directed portrait collage, project explorer, gallery filters, keyboard command menu, creative playground, responsive layout, and reduced-motion controls.

### Featured projects

- **REPOT** — [getrepot.com](https://getrepot.com) — feature transfer between repositories.
- **Parallax** — intelligence interface (in development; demo in portfolio is illustrative).
- **Ghost Director** — AI-assisted film creation concept.
- **Wanneesh** — truck services platform concept for Jordan.

## Run locally

No build is needed. Serve this directory with any local HTTP server, for example:

```sh
python -m http.server 8000
```

Then visit [localhost:8000](http://localhost:8000).

## Deployment

Connected to Vercel through GitHub. The root domain `saifworks.com` should point to the portfolio's Vercel project; other apps can be deployed independently and attached via subdomains such as `parallax.saifworks.com`. The portfolio can link to those apps once deployed. Domain configuration is managed separately from this UI update.

## Hero artwork

`assets/hero-collage.webp` preserves the approved portrait, paper edging, and opaque blue sculpture. `assets/hero-knot.webp` is an aligned color layer: Remix changes the sculpture, never the portrait. These assets are stored in this repository and served locally; there is no runtime dependency on an image-editing service.

`hero.css` lays out an 835-by-690 art board that scales as a group so the project cards continue to fit around the cutout. `hero.js` adds bounded pointer/keyboard tilt and color controls. This is an interactive collage, not a freely rotating 3D model. Motion starts off and honors reduced-motion preferences. The project buttons remain real, keyboard-accessible controls, not pixels in a full-page screenshot.

## Browser checks

`tests/verify-hero.mjs` checks the site at desktop, tablet, and mobile sizes. With Playwright installed in a development environment, set `BASE_URL` to a locally served or deployed URL and run:

```sh
BASE_URL=http://localhost:8000 node tests/verify-hero.mjs
```

Tests verify asset loading, viewport bounds, project dialogs, the REPOT launch URL, search navigation, filtering, and gallery/index switching. Screenshots and a JSON report are written to `test-results/`.

## Notes

The in-page demos are simulations, not production product integrations. Live project links should only be added after launch.
