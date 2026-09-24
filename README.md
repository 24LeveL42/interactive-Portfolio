# Rajini Interactive Portfolio V3

A small-scale 3D portfolio experience inspired by the idea of discovering a portfolio inside an interactive world. It is not a copy of Bruno Simon.

## Controls
- W / A / S / D = drive
- SPACE = brake
- Mouse = look around
- Drive into the four glowing locations to open portfolio panels

## Custom Blender model
Export a lightweight `.glb` from Blender and put it here:

`assets/player.glb`

Then in `script.js` change:

`const USE_CUSTOM_MODEL=false;`

to:

`const USE_CUSTOM_MODEL=true;`

The model is automatically scaled.

## GitHub Pages
Upload `index.html`, `style.css`, `script.js` and the `assets` folder to the repository root. No build step is required.

## Replace before submission
Update the About, Work, Skills and Contact text in `script.js`, and replace the placeholder contact information with your own.
