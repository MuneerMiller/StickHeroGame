<div align="center">

# 🥷 Stick Hero

**A one-button browser arcade game built from scratch with vanilla JavaScript and the HTML5 Canvas API.**

Hold to grow a stick, release to drop it, and walk your ninja across the gap. Too short or too long and you fall.

[**▶ Play it live**](https://muneermiller.github.io/StickHeroGame/) · [Report a bug](https://github.com/MuneerMiller/StickHeroGame/issues)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Canvas API](https://img.shields.io/badge/Canvas_API-222222)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

![Stick Hero gameplay: start screen, stretching the stick, a perfect hit, and game over](docs/screenshots/overview.png)

</div>

## How to play

| Action | Mouse | Touch | Keyboard |
| --- | --- | --- | --- |
| Grow the stick | Hold the left button | Hold your finger down | – |
| Drop the stick | Release | Lift your finger | – |
| Restart | Click **RESTART** | Tap **RESTART** | <kbd>Space</kbd> |

- Each platform you reach scores **1 point**.
- Land the stick on the **red square** in the middle of a platform for a **perfect hit** and **double score**.
- If the stick is too short or too long, the hero walks off the end and falls.

## Features

- **Smooth 60 fps animation.** A `requestAnimationFrame` game loop uses time-based movement, so the speed is the same on every monitor refresh rate.
- **Simple state machine.** Each frame runs one phase: `waiting → stretching → turning → walking → transitioning`, or `falling` on a miss.
- **Procedural levels.** Platform gaps, platform widths and background trees are random, so every run is different.
- **Parallax scenery.** Sine-wave hills and trees scroll slower than the foreground to give a sense of depth.
- **Works on desktop and mobile.** Pointer events handle mouse, touch and pen in one place, and touch scrolling is turned off during play.
- **Sharp on high-DPI and Retina screens.** The canvas draws at the display's pixel ratio.
- **No dependencies.** Plain HTML, CSS and JavaScript, with no build step or framework.

## Screenshots

<p align="center">
  <img src="docs/screenshots/start.png" width="200" alt="Start screen">
  <img src="docs/screenshots/stretching.png" width="200" alt="Stretching the stick">
  <img src="docs/screenshots/perfect-hit.png" width="200" alt="Perfect hit: double score">
  <img src="docs/screenshots/game-over.png" width="200" alt="Game over">
</p>

<p align="center">
  <img src="docs/screenshots/desktop.png" width="820" alt="Stick Hero running in a desktop browser">
</p>

## Run it locally

No install is needed. Clone the repo and open `index.html` in any modern browser:

```bash
git clone https://github.com/MuneerMiller/StickHeroGame.git
cd StickHeroGame
open index.html        # macOS; on Windows use: start index.html, on Linux: xdg-open index.html
```

Or serve it locally:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Project structure

```
StickHeroGame/
├── index.html            # Page markup: canvas, score, intro text, restart button
├── css/assets.css        # Layout and UI styling
├── javascript/stick.js   # Game loop, physics, input handling and rendering
└── docs/screenshots/     # Images used in this README
```

## How it works

1. **Stretching.** While the button is held, the current stick grows by `elapsed / stretchingSpeed` pixels each frame.
2. **Turning.** On release, the stick rotates to 90°. The game then checks whether its tip lands on a platform, and whether it lands inside the red perfect zone.
3. **Walking.** The hero walks to the far edge of the next platform, or to the end of the stick if it missed.
4. **Transitioning.** The whole scene scrolls left so the next platform moves into place, and a new platform and new trees are generated.
5. **Falling.** On a miss, the stick swings down, the hero drops off screen, and the restart button appears.

## Credits

Built by **[Muneer Miller](https://github.com/MuneerMiller)**. Inspired by the classic Stick Hero mobile game, with game logic based on [this video tutorial](https://youtu.be/eue3UdFvwPo).
