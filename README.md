# Rajini Portfolio — 3D Explorer

A static Three.js portfolio experience. The current About Me player boards are 2.5x their previous size, and the selected character stands beside the board.

The welcome screen uses the supplied `portfolio-landing.png` artwork. Its destination cards open their stations directly; Start Exploring begins the driving experience. The scroll prompt is covered, and the fullscreen control requests browser fullscreen.

The Contact stop links to the portfolio owner's GitHub profile at `https://github.com/24Level42`. Background music uses `portfolio-music.mp3` and starts after the visitor's first interaction. The sound button toggles playback. Music credit: “Deflector” by Ghostrifter Official, licensed under CC BY-NC 3.0, via BreakingCopyright. See the Music credits link in the page for the creator, license, track, and source links.

## Run locally

Double-click `Start Preview.bat` on Windows. It starts the included Node.js static server and opens `http://127.0.0.1:5174/`.

## Run from GitHub Pages

1. Upload the contents of this folder to the root of your GitHub repository.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, choose your branch and `/ (root)`, then save.
4. Open the published Pages URL after deployment completes.

No build step is required. The page loads Three.js and GLTFLoader from jsDelivr, so the viewer needs an internet connection. Keep the included GLB and PNG assets beside `index.html`; filenames are case-sensitive on GitHub Pages.

## About Me player animations

The four player models use the supplied FBX characters and loop their matching animation clips. The player-selection controls are part of the Portfolio Journey panel and appear there at the About Me stop:

- Casual: Moonwalk
- Fitness: Jog Forward
- SAF Warrior: Push Up
- Future Vision: Listening To Music

The FBX files were converted to animated GLB files so the browser can load each skinned character and its clip with GLTFLoader.

## Kopi Boy station

The Kopi Boy stop uses `KB desktop LARGE Vsn.glb` and the supplied delivery rider model with colorful animated fireworks. The desktop is 1.5 times smaller than its previous displayed size, shifted farther to screen-right, moved one step back, and one step farther from the truck, with no added screen or bezel glow. A neon banner above it reads “NEXT PROJECT · LAUNCHING SOON.” The rider keeps its current rotation and travels from screen-right to screen-left in front of the desktop. The generated placeholder platform, station sign, and top HUD are hidden at this stop.

The supplied desk-top GLB includes the desktop screen and keyboard and is used on its own without the extra panel or procedural table.

## 3D Art station

The supplied figures stay in a stationary row facing the truck and rotate gently in place. Each figure is normalized to a 3.3-unit display height using world-space bounds, with its pivot raised to keep its feet on the ground. The row is spaced to fit the larger models and positioned farther from the truck. Each display circle spins slowly in a random direction.


## Journey panel

Use the close button on the vehicle destination panel to hide it and the floating OPEN DESTINATIONS button to show it again. The open or closed choice is remembered in the browser.

## Supplied sky texture

SKY HDR pp.hdr is used continuously as the exterior sky and reflection environment during travel and at every station. The built-in procedural skies remain available if the HDR cannot load.



## Monster truck

The supplied Y-up `monster_truck.glb` is the portfolio vehicle. The driver camera starts raised in the cab and faces through the windshield. During travel, the exterior moves opposite the vehicle's forward direction so the drive reads correctly. Destination stops and station scenes remain part of the portfolio experience. The supplied HDR sky remains visible throughout travel and at every station.

Five copies of `flying_bike.glb` fly on separate looping paths around the active destination and remain in the experience during travel. The 3D Art stop uses `3d_set_4_station.glb`; its figures stand one after another in a straight line parallel to the truck's lane, offset beside the truck and facing toward it like a welcome line. Figures stay planted and make a subtle in-place turn, while each display base spins independently. Figure height matches the About Me characters. The dashboard information board is shown at 3x scale beside the lineup.
