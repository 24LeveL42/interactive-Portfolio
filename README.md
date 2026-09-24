# 3D Interactive Portfolio — GitHub Template

A static portfolio template inspired by the feel of experimental 3D creative portfolios.

## Files

- `index.html` — page structure and portfolio content
- `style.css` — visual design and responsive layout
- `script.js` — Three.js 3D scene, interactions and project modal
- `assets/` — put your custom 3D model here

## Put your own 3D model

1. Export your model from Blender as **GLB**.
2. Name it `default-model.glb`.
3. Put it inside `assets/`.
4. Open `script.js`.
5. Change:

```js
const USE_CUSTOM_MODEL = false;
```

to:

```js
const USE_CUSTOM_MODEL = true;
```

The site will load your GLB and automatically scale it into the scene.

### Recommended Blender export
- Format: GLB / glTF Binary
- Include textures: yes, if needed
- Apply transforms before export
- Keep polygon count reasonable for a web portfolio
- Put the model's main subject near the origin

## GitHub Pages

Upload all files to a GitHub repository, keeping the `assets` folder.

Then enable:
**Repository → Settings → Pages → Deploy from branch → main → / (root)**

The site is plain HTML/CSS/JavaScript, so no build process is required.

## Customise

Search `index.html` for:
- RAJINI
- project names
- email
- About text

You can replace the placeholder copy with your assignment content.

## Important

The default 3D character is procedural, so the template works immediately without a model file. When you are ready, replace it with your own `.glb`.
