# Third-Party Notices

This site bundles the following third-party components **locally** so that the pages
make **no requests to any external CDN** and work fully offline (including when opened
directly from disk). Full license texts are in [`licenses/`](licenses/).

| Component | Version | Used in | License | Copyright | License text |
|---|---|---|---|---|---|
| React (UMD, production) | 18.3.1 | `drift-meter.html` | MIT | © Meta Platforms, Inc. and affiliates | [`licenses/React-LICENSE.txt`](licenses/React-LICENSE.txt) |
| ReactDOM (UMD, production) | 18.3.1 | `drift-meter.html` | MIT | © Meta Platforms, Inc. and affiliates | [`licenses/React-LICENSE.txt`](licenses/React-LICENSE.txt) |
| IBM Plex Sans | Google Fonts woff2 subset | `index.html`, `drift-meter.html` | SIL Open Font License 1.1 | © 2017 IBM Corp. (Reserved Font Name "Plex") | [`licenses/IBM-Plex-OFL.txt`](licenses/IBM-Plex-OFL.txt) |
| IBM Plex Mono | Google Fonts woff2 subset | `index.html`, `drift-meter.html` | SIL Open Font License 1.1 | © 2017 IBM Corp. (Reserved Font Name "Plex") | [`licenses/IBM-Plex-OFL.txt`](licenses/IBM-Plex-OFL.txt) |
| Newsreader | Google Fonts woff2 subset | `index.html`, `drift-meter.html` | SIL Open Font License 1.1 | © 2020 The Newsreader Project Authors | [`licenses/Newsreader-OFL.txt`](licenses/Newsreader-OFL.txt) |

## How each component is bundled

- **React + ReactDOM** — the 18.3.1 UMD production builds are embedded as gzip+base64
  assets inside `drift-meter.html`'s existing bundle manifest, and loaded (in order, before
  the page's runtime) so that `window.React` / `window.ReactDOM` are already defined. The
  runtime's CDN loader (`loadReactUmd`) therefore short-circuits and never contacts unpkg.
  Before bundling, the downloaded files were verified byte-for-byte against the
  Subresource-Integrity hashes already present in the page:
  - `react.production.min.js` → `sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z`
  - `react-dom.production.min.js` → `sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1`
  Upstream: https://github.com/facebook/react (obtained from `unpkg.com/react@18.3.1` &
  `unpkg.com/react-dom@18.3.1`, `umd/*.production.min.js`).

- **Fonts (IBM Plex Sans, IBM Plex Mono, Newsreader)** — the woff2 subset files (latin and
  latin-ext, weights 400 & 500) were already embedded in `drift-meter.html`. The same bytes
  are reused for `index.html`, inlined as `data:` URIs in `@font-face` rules, replacing the
  former `fonts.googleapis.com` stylesheet link. No font bytes were modified.
  Upstreams: https://github.com/IBM/plex and https://github.com/productiontype/Newsreader.
  Under OFL 1.1 these fonts may be bundled and redistributed provided this copyright notice
  and license travel with them (satisfied by this file and `licenses/`), and the Reserved
  Font Name "Plex" is not used for any modified font (no fonts were modified).

## Not bundled

- **@babel/standalone 7.26.4** — `drift-meter.html`'s runtime references this on unpkg only to
  transform dynamically-imported `.jsx` modules. This app ships none (its logic is a plain
  JavaScript class, no JSX), so Babel is never loaded. It is therefore neither fetched at
  runtime nor bundled, and no Babel license notice is required.
