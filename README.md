# FAST 3D Portfolio V2

This version shows the portfolio immediately. The 3D library loads separately in the background, so a CDN/model problem cannot trap the visitor on a loading screen.

## Upload to GitHub
Unzip this package. Replace the files in your repository with `index.html`, `style.css`, `script.js`, and the `assets` folder.

## Custom model
Export a web-friendly GLB from Blender and save it as:

`assets/default-model.glb`

Then in `script.js` change:

`const USE_CUSTOM_MODEL=false;`

to:

`const USE_CUSTOM_MODEL=true;`

Keep the GLB reasonably small for fast GitHub Pages loading.
