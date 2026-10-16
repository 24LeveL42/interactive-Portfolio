# Rajini Portfolio — 3D Explorer

A static Three.js portfolio experience. The current About Me player boards are 2.5x their previous size, and the selected character stands beside the board.

The welcome screen uses the supplied `portfolio-landing.png` artwork. Its Start Exploring button begins the 3D experience, and its fullscreen control requests browser fullscreen.

## Run locally

Double-click `Start Preview.bat` on Windows. It starts the included Node.js static server and opens `http://127.0.0.1:5174/`.

## Run from GitHub Pages

1. Upload the contents of this folder to the root of your GitHub repository.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, choose your branch and `/ (root)`, then save.
4. Open the published Pages URL after deployment completes.

No build step is required. The page loads Three.js and GLTFLoader from jsDelivr, so the viewer needs an internet connection. Keep the included GLB and PNG assets beside `index.html`; filenames are case-sensitive on GitHub Pages.

## About Me player animations

The four player models use the supplied FBX characters and loop their matching animation clips:

- Casual: Moonwalk
- Fitness: Jog Forward
- SAF Warrior: Push Up
- Future Vision: Listening To Music

The FBX files were converted to animated GLB files so the browser can load each skinned character and its clip with GLTFLoader.

## Kopi Boy station

The Kopi Boy stop uses the supplied desktop and delivery rider models with colorful animated fireworks. The desktop is scaled to 3x, positioned four steps back and one step to screen-left, with no added screen or bezel glow. The rider keeps its current rotation and travels from screen-right to screen-left in front of the desktop. The generated placeholder platform, station sign, and top HUD are hidden at this stop.

The supplied desk-top GLB includes the desktop screen and keyboard and is used on its own without the extra panel or procedural table.


## Journey panel

Use the close button on the vehicle destination panel to hide it and the floating OPEN DESTINATIONS button to show it again. The open or closed choice is remembered in the browser.

## Supplied sky texture

SKY HDR pp.hdr is used continuously as the exterior sky and reflection environment during travel and at every station. The built-in procedural skies remain available if the HDR cannot load.



## Monster truck

The supplied Y-up `monster_truck.glb` is the portfolio vehicle. The driver camera starts raised in the cab and faces through the windshield. During travel, the exterior moves opposite the vehicle's forward direction so the drive reads correctly. Destination stops and station scenes remain part of the portfolio experience. The supplied HDR sky remains visible throughout travel and at every station.

Five copies of `flying_bike.glb` fly on separate looping paths around the active destination and remain in the experience during travel. The 3D Art stop uses `3d_set_4_station.glb`; each model and circular display base rotates around its own geometry-centered pivot, so the figures stay planted at their display spots. Exhibit figures are enlarged independently of the overall layout. The lineup is placed farther from the vehicle, and the dashboard information board is shown at 3x scale beside it.
