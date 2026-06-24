# PAROS DCS Takeaways Site

Static, GitHub Pages-ready site for sharing an authored navigation and discussion layer around the PAROS Epilepsy 2026 DCS during SEEG VOD catalog.

## Files

- `index.html` - static page shell.
- `styles.css` - visual system and responsive layout.
- `app.js` - search, filters, selected-talk panel, and takeaway-outline builder.
- `assets/vod-catalog.js` - share-safe public metadata generated from the local VOD manifest.
- `assets/chapter-texts.js` - draft share-safe synthesis text generated from the private transcript set.

## Sharing Boundary

This site does not include raw transcripts, downloaded videos, or direct MP4 URLs. It links to official VOD pages and uses public thumbnail URLs from the source site. Share authored summaries and teaching notes from this layer; do not redistribute raw videos or transcripts without permission.

## GitHub Pages

The folder can be pushed to a GitHub repository and served as a static site. If the repository serves from `/docs`, copy this folder's contents into that directory. If it serves from the repository root, copy these files to the root.
