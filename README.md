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

## V1.1 — Beyond the Push (review branch)

Open **MEGA MACHINE** from Classic, or open `mega.html` beneath the Vite base. Classic uses its original storage keys and room server. Mega runs entirely in the browser. Its records and mix preferences use the separate `gcr-mega-` namespace.

**Awaken the Neon Robot.** Rotate the twin-rail guide clockwise to line up the current circuit. Push the core toward its matching socket. Activate the magnet as the core comes within the 2.45-unit field. The reticle begins on the matching socket, tapping the deck repositions it, dragging adjusts push strength, and Aim at socket restores the default. Cooldowns are 0.65 s (push), 1.65 s (magnet) and 0.78 s (rotate). Matching colour and engraved numerals identify the four sockets. Two locks retract the gate and tilt the ramp. Four locks start the awakening. Recover reloads only the loose core. Restart in Settings resets the entire mission.

The score is 12,000 less 15 points per active second (rounded), 45 per power and 250 per recovery, with a 100-point floor. S/A/B thresholds are 9,400/8,000/5,900. Optional badges reward a sub-90-second clear, at most 24 actions, and zero recoveries. Each earned grade adds its robot trophy to the local cabinet.

### Implementation and review

- `src/reactor.ts` owns the fixed 60 Hz Rapier world, typed operator commands, cooldown ticks, matching socket sensors, mission progress and event queue. One dynamic core is in flight. Rotating rails and toothed gear have kinematic colliders. The lift, retracting gate and tilting ramp move their colliders. The marked belt imparts an impulse only to a core on its surface.
- `src/forge.ts` renders the physical components and the articulated guardian. Shared Three.js geometry and pooled trails/sparks bound allocation. A vector renderer draws the same scene when GPU initialization fails. Resolution adapts to slow frames. Reduced motion suppresses shake, trails, slowdown and camera zoom.
- `src/mega.ts` maps touch/keyboard input to commands, presents G-BOT captions, grades and controls. Settings pause simulation time. `src/host.ts` handles original synthesized mechanical effects, a procedural music loop and optional recordings. No network service is needed for this mission.
- Run `npm ci && npm test && npm run build`. Run `npm run dev` to play the branch locally. Vite builds Classic and Mega as separate entry points. The existing main-branch Pages deployment workflow is unchanged.

### Cantonese recording slots

G-BOT ships with Hong Kong Cantonese captions and original instrumental audio. Supply licensed or original MP3s in `public/audio/gbot/` and rebuild. Filenames map to the lines in `src/host.ts`: open-1.mp3, push-1.mp3, push-2.mp3, magnet-1.mp3, magnet-2.mp3, rotate-1.mp3, near-1.mp3, blocked-1.mp3, recover-1.mp3, connect-1.mp3, connect-2.mp3, transform-1.mp3, awake-1.mp3, victory-1.mp3. Uninstalled clips use captions. Routine callouts share a 2.35-second cooldown.

### Test coverage

The command-only walkthrough solves the four-core mission from a new world without writing positions or teleporting the core. Rejection cases cover incorrect colour, height and alignment. Power tests cover velocity changes, rotation, cooldown and recovery. Classic stacking, edge scoring, game progression, body limits and the existing two-client co-op test run in the same suite.
