# Hunger Snake

A classic snake game with multiple modes, skins, sprint, magnet, and optional hard/carnival rules. Play in the browser—no server required.

**GitHub:** [View on GitHub](https://github.com/jingyuguo0621-debug/snake-game-1) · Clone: `git clone https://github.com/jingyuguo0621-debug/snake-game-1.git`

*(Repo: [snake-game-1](https://github.com/jingyuguo0621-debug/snake-game-1).)*

---

## Table of contents (links)

- [GitHub](#github)
- [Features](#features)
- [Game modes](#game-modes)
  - [Easy](#easy)
  - [Hard](#hard)
  - [Carnival](#carnival)
- [Skins](#skins)
  - [Regular](#regular)
  - [Limited](#limited)
- [Controls](#controls)
- [Run locally](#run-locally)

---

## GitHub

- **Repo / play online:** [https://github.com/jingyuguo0621-debug/snake-game-1](https://github.com/jingyuguo0621-debug/snake-game-1)  
  *(If you use GitHub Pages, the game can be played from `https://jingyuguo0621-debug.github.io/snake-game-1/`.)*
- **Clone:**  
  `git clone https://github.com/jingyuguo0621-debug/snake-game-1.git`  
  Then open `index.html` in a browser.

---
- [Game modes](#game-modes)
  - [Easy](#easy)
  - [Hard](#hard)
  - [Carnival](#carnival)
- [Skins](#skins)
  - [Regular](#regular)
  - [Limited](#limited)
- [Controls](#controls)
- [Run locally](#run-locally)

---

## Features

- **Score, high score, and timer** — Elapsed time shown next to high score; resets each game.
- **Switch mode anytime** — Change Easy / Hard / Carnival without refreshing; current game restarts in the new mode.
- **Sprint** — Hold Space to speed up (consumes charges). Three full charges → invincible sprint (no bomb penalty).
- **Magnet** — Press M to pull all red and yellow apples on the board (points only). First use after ~30s; then on a cooldown.
- **Handbook** — In-game rules and rewards for all modes.
- **Skin preview** — Opening Skin shows a 23-segment S-shaped preview for every skin.

---

## Game modes

### Easy

- **Grid:** 16×16.
- **Apples:** 6 fixed (no expiry). Red +1 pt / +1 length; golden +3 pt / +2 length. Blue = slow, Green = fast (temporary).
- **Bomb:** 1 (never expires). Touch = -10 pts, respawns elsewhere.
- No stars or white hearts.

### Hard

- **Grid:** 20×20.
- **Apples:** 10, expire after ~3 s (blink before expiry).
- **Bombs:** 3 (expire and respawn on timers).
- **Stars:** Spawn periodically, +10 pts.
- **White hearts:** Spawn with stars, -5 length (min length 3).

### Carnival

- **Grid:** 30×30.
- **Apples:** Many, expire. Bombs, stars, white hearts; **Apple Rain** at 20 pts then every +15 pts (5 s of falling items).
- **Bomb zone** — Moving zone with warning; enter for extra items/penalties.
- **Pink square** — Temporary; eat for 3 s invincibility.
- **Purple square** — Temporary; 3 s double score/penalty.
- **Combo** — Consecutive eats grant bonus points.

---

## Skins

### Regular

| Skin         | Description                    |
|-------------|---------------------------------|
| Default     | Blue-gray head, lighter body   |
| Light blue  | Blue head/body palette         |
| Purple      | Purple head/body palette       |
| Pink heart  | Pink heart shapes, head darker |
| Red hearts  | Red heart shapes               |

### Limited

| Skin           | Description                                                                 |
|----------------|-----------------------------------------------------------------------------|
| Rainbow       | Pastel rainbow segments, darker head, red tail; color changes every 3 segs |
| Starry        | Two image strips, 90° rotation per segment, 1/4 overlap                    |
| Starry window | Hidden starry background; snake reveals it only where the body passes     |
| Water lilies  | Hidden water-lily image; snake reveals it only where the body passes       |
| Deep sea      | Hidden deep-sea image; snake reveals it only where the body passes        |

The last three (Starry window, Water lilies, Deep sea) use a single full image as a hidden board; each segment shows the crop under that cell—no stretch, aspect ratio preserved with center crop.

---

## Controls

| Input            | Action                                      |
|------------------|---------------------------------------------|
| Arrow keys / WASD| Move                                       |
| Space (hold)     | Sprint (uses 1 charge, 2 s)                 |
| Space (3 charges)| Invincible sprint (3 s, no bomb penalty)   |
| Double-tap Space | Pause / resume                              |
| M                | Magnet (when ready: collect all red/yellow)|
| Enter            | Start / restart game                        |

Don’t hit yourself or (in Hard/Carnival) bombs.

---

## Run locally

Open `index.html` in a browser. No build step or server required. High score is stored in `localStorage`.

**From GitHub:** clone the repo (see [GitHub](#github) above), then open `index.html` in a browser.
