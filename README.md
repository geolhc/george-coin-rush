# GEORGE COIN RUSH
**PUSH TO THE MAX!** · Neon Harbour, a Hong Kong skyline medal cabinet.
[Play the single-player machine](https://geolhc.github.io/george-coin-rush/)

Drag across the machine and release to drop, or set the lane and press **Drop Medal**. Desktop also supports arrows and Space. Time the shelf as it retracts to fill a gap behind the front row. Medals are free and unlimited. Cores release physical bonus showers. Five sequential challenges lead into free play. Best score and collection achievements persist locally. Replay resets the bed.

## Run
Use Node 22 or newer. Run `npm ci` then `npm run dev` and open the displayed /george-coin-rush/ path. `npm test` exercises Rapier contacts, collection, scoring, progression and two real WebSocket clients. `npm run build` type-checks and generates dist. `npm run preview` serves the production build.

Three.js renders an instanced metal medal bed, original procedurally drawn skyline display and minted G faces. Rapier advances at fixed 60 Hz with cylinder and convex colliders, a position-based kinematic ram and 150 dynamic bodies maximum. Dropped pieces score only past the front lip below the deck. Rendering resolution adapts to sustained slow frames. Sound unlocks on first interaction.

## Co-op
Run `npm run server` alongside Vite, then use Settings to create a room and invite another browser. Two to four players share one server-side physics world. The server accepts alternating drops, broadcasts transforms and scores at 15 Hz, skips disconnected seats and accepts per-seat reconnect tokens. Empty rooms expire after two minutes. Server restarts end active rooms.
For a hosted release, expose the Node server behind HTTPS/WSS, set PORT and ORIGINS (comma-separated exact frontend origins), then set repository Actions variable VITE_ROOM_SERVER to its wss:// address and redeploy. GitHub Pages hosts the solo frontend. The hosted client exposes private rooms only when a backend is configured.

## Audio
Collision, motor and award sounds are original procedural audio. Cantonese host captions are included. Replacement recording filenames and scripts are in public/audio/host. No recordings are bundled.

## Publish
The Pages workflow runs tests, checks TypeScript, builds Vite and deploys dist from main with the /george-coin-rush/ base. Select GitHub Actions as the repository Pages source.
