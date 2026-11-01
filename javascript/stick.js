// Stick Hero. Game logic based on this tutorial: https://youtu.be/eue3UdFvwPo

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
    return this[this.length - 1];
};

// A sinus function that accepts degrees instead of radians
Math.sinus = function (degree) {
    return Math.sin((degree / 180) * Math.PI);
};

// Game data
let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

let heroX; // Changes when moving forward
let heroY; // Only changes when falling
let sceneOffset; // Moves the whole game

let platforms = [];
let sticks = [];
let trees = [];

let score = 0;

// Configuration
const canvasWidth = 375; // Size of the main game area
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 10; // While waiting
const paddingX = 100; // The waiting position of the hero from the left edge of the game area
const perfectAreaSize = 10;

// The background moves slower than the hero
const backgroundSpeedMultiplier = 0.2;

const hill1BaseHeight = 100;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 70;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;

const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
const turningSpeed = 4; // Milliseconds it takes to turn a degree
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 17;
const heroHeight = 30;

const canvas = document.getElementById("game");
const container = canvas.parentElement;
const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

// Size of the drawing area in CSS pixels
let viewWidth = canvasWidth;
let viewHeight = canvasHeight;

// The canvas fills its container; the 375x375 game area is centered inside it.
// The backing store is scaled by devicePixelRatio so it stays sharp on high-DPI screens.
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    viewWidth = Math.max(container.clientWidth, canvasWidth);
    viewHeight = Math.max(container.clientHeight, canvasHeight);
    canvas.width = Math.round(viewWidth * dpr);
    canvas.height = Math.round(viewHeight * dpr);
}

// Initialize layout; initProfile (profile.js) shows onboarding for new players, then resets the game
resizeCanvas();
initProfile();

// Resets game variables and layout but does not start the game (game starts on press)
function resetGame() {
    phase = "waiting";
    lastTimestamp = undefined;
    sceneOffset = 0;
    score = 0;

    introductionElement.textContent = introMessage();
    introductionElement.style.opacity = onboardingElement.hidden ? 1 : 0;
    perfectElement.style.opacity = 0;
    gameOverElement.hidden = true;
    profileButton.hidden = !onboardingElement.hidden; // Only offered between runs
    scoreElement.innerText = score;

    // The first platform is always the same; x + w has to match paddingX
    platforms = [{ x: 50, w: 50 }];
    for (let i = 0; i < 4; i++) generatePlatform();

    sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

    trees = [];
    for (let i = 0; i < 10; i++) generateTree();

    heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
    heroY = 0;

    draw();
}

function generateTree() {
    const minimumGap = 30;
    const maximumGap = 150;

    // X coordinate of the furthest tree
    const lastTree = trees.last();
    const furthestX = lastTree ? lastTree.x : 0;

    const x =
        furthestX +
        minimumGap +
        Math.floor(Math.random() * (maximumGap - minimumGap));

    const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
    const color = treeColors[Math.floor(Math.random() * treeColors.length)];

    trees.push({ x, color });
}

function generatePlatform() {
    const minimumGap = 40;
    const maximumGap = 200;
    const minimumWidth = 20;
    const maximumWidth = 100;

    // X coordinate of the right edge of the furthest platform
    const lastPlatform = platforms.last();
    const furthestX = lastPlatform.x + lastPlatform.w;

    const x =
        furthestX +
        minimumGap +
        Math.floor(Math.random() * (maximumGap - minimumGap));
    const w =
        minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

    platforms.push({ x, w });
}

// Input: pointer events cover mouse, touch and pen
window.addEventListener("pointerdown", startStretch);
window.addEventListener("pointerup", endStretch);
window.addEventListener("pointercancel", endStretch);

// Press space to restart the game (not while typing or editing the profile)
window.addEventListener("keydown", function (event) {
    if (event.key !== " " || !onboardingElement.hidden) return;
    if (event.target.closest && event.target.closest("input, button")) return;
    event.preventDefault();
    resetGame();
});

window.addEventListener("resize", function () {
    resizeCanvas();
    draw();
});

restartButton.addEventListener("click", function (event) {
    event.preventDefault();
    resetGame();
});

function startStretch(event) {
    if (isUiOpen()) return;
    if (event.target.closest && event.target.closest("button, input, .panel")) return;
    if (event.button !== undefined && event.button !== 0) return; // Left button / touch only
    if (phase === "waiting") {
        lastTimestamp = undefined;
        introductionElement.style.opacity = 0;
        profileButton.hidden = true;
        phase = "stretching";
        window.requestAnimationFrame(animate);
    }
}

function endStretch() {
    if (phase === "stretching") {
        phase = "turning";
    }
}

// The main game loop
function animate(timestamp) {
    if (!lastTimestamp) {
        lastTimestamp = timestamp;
        window.requestAnimationFrame(animate);
        return;
    }

    const elapsed = timestamp - lastTimestamp;

    switch (phase) {
        case "waiting":
            return; // Stop the loop
        case "stretching": {
            sticks.last().length += elapsed / stretchingSpeed;
            break;
        }
        case "turning": {
            sticks.last().rotation += elapsed / turningSpeed;

            if (sticks.last().rotation >= 90) {
                sticks.last().rotation = 90;

                const [nextPlatform, perfectHit] = thePlatformTheStickHits();
                if (nextPlatform) {
                    score += perfectHit ? 2 : 1;
                    scoreElement.innerText = score;

                    if (perfectHit) {
                        perfectElement.style.opacity = 1;
                        setTimeout(() => (perfectElement.style.opacity = 0), 1500);
                    }

                    generatePlatform();
                    generateTree();
                    generateTree();
                }

                phase = "walking";
            }
            break;
        }
        case "walking": {
            heroX += elapsed / walkingSpeed;

            const [nextPlatform] = thePlatformTheStickHits();
            if (nextPlatform) {
                // If the hero will reach another platform, stop at its edge
                const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
                if (heroX > maxHeroX) {
                    heroX = maxHeroX;
                    phase = "transitioning";
                }
            } else {
                // Otherwise stop at the end of the stick
                const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
                if (heroX > maxHeroX) {
                    heroX = maxHeroX;
                    phase = "falling";
                }
            }
            break;
        }
        case "transitioning": {
            sceneOffset += elapsed / transitioningSpeed;

            const [nextPlatform] = thePlatformTheStickHits();
            if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
                sceneOffset = nextPlatform.x + nextPlatform.w - paddingX;
                // Add the next stick
                sticks.push({
                    x: nextPlatform.x + nextPlatform.w,
                    length: 0,
                    rotation: 0,
                });
                phase = "waiting";
            }
            break;
        }
        case "falling": {
            if (sticks.last().rotation < 180) {
                sticks.last().rotation = Math.min(
                    180,
                    sticks.last().rotation + elapsed / turningSpeed
                );
            }

            heroY += elapsed / fallingSpeed;
            const maxHeroY = platformHeight + 100 + (viewHeight - canvasHeight) / 2;
            if (heroY > maxHeroY) {
                draw();
                onGameOver(score);
                return;
            }
            break;
        }
        default:
            throw Error("Wrong phase");
    }

    draw();
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
}

// Returns the platform the stick hit (undefined if none) and whether it was a perfect hit
function thePlatformTheStickHits() {
    const stick = sticks.last();
    const stickFarX = stick.x + stick.length;

    const platformTheStickHits = platforms.find(
        (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
    );

    const perfectHit =
        !!platformTheStickHits &&
        platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 < stickFarX &&
        stickFarX < platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2;

    return [platformTheStickHits, perfectHit];
}

function draw() {
    const dpr = canvas.width / viewWidth;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.clearRect(0, 0, viewWidth, viewHeight);

    drawBackground();

    // Center the main game area in the canvas
    ctx.translate(
        (viewWidth - canvasWidth) / 2 - sceneOffset,
        (viewHeight - canvasHeight) / 2
    );

    drawPlatforms();
    drawHero();
    drawSticks();

    ctx.restore();
}

function drawPlatforms() {
    platforms.forEach(({ x, w }) => {
        ctx.fillStyle = "black";
        ctx.fillRect(
            x,
            canvasHeight - platformHeight,
            w,
            platformHeight + (viewHeight - canvasHeight) / 2
        );

        // Draw the perfect area only if the hero has not yet reached the platform
        if (sticks.last().x < x) {
            ctx.fillStyle = "red";
            ctx.fillRect(
                x + w / 2 - perfectAreaSize / 2,
                canvasHeight - platformHeight,
                perfectAreaSize,
                perfectAreaSize
            );
        }
    });
}

function drawHero() {
    ctx.save();
    ctx.translate(
        heroX - heroWidth / 2,
        heroY + canvasHeight - platformHeight - heroHeight / 2
    );
    drawHeroFigure(ctx, profile.color);
    ctx.restore();
}

// Draws the hero centered on the current origin; also used by the onboarding preview
function drawHeroFigure(c, bandColor) {
    c.fillStyle = "black";

    // Body
    drawRoundedRect(c, -heroWidth / 2, -heroHeight / 2, heroWidth, heroHeight - 4, 5);

    // Legs
    const legDistance = 5;
    c.beginPath();
    c.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
    c.fill();
    c.beginPath();
    c.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
    c.fill();

    // Eye
    c.beginPath();
    c.fillStyle = "white";
    c.arc(5, -7, 3, 0, Math.PI * 2, false);
    c.fill();

    // Band
    c.fillStyle = bandColor;
    c.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
    c.beginPath();
    c.moveTo(-9, -14.5);
    c.lineTo(-17, -18.5);
    c.lineTo(-14, -8.5);
    c.fill();
    c.beginPath();
    c.moveTo(-10, -10.5);
    c.lineTo(-15, -3.5);
    c.lineTo(-5, -7);
    c.fill();
}

function drawRoundedRect(c, x, y, width, height, radius) {
    c.beginPath();
    c.moveTo(x, y + radius);
    c.lineTo(x, y + height - radius);
    c.arcTo(x, y + height, x + radius, y + height, radius);
    c.lineTo(x + width - radius, y + height);
    c.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    c.lineTo(x + width, y + radius);
    c.arcTo(x + width, y, x + width - radius, y, radius);
    c.lineTo(x + radius, y);
    c.arcTo(x, y, x, y + radius, radius);
    c.fill();
}

function drawSticks() {
    sticks.forEach((stick) => {
        ctx.save();

        // Move the anchor point to the start of the stick and rotate
        ctx.translate(stick.x, canvasHeight - platformHeight);
        ctx.rotate((Math.PI / 180) * stick.rotation);

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stick.length);
        ctx.stroke();

        ctx.restore();
    });
}

function drawBackground() {
    // Sky
    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
    gradient.addColorStop(0, "#BBD691");
    gradient.addColorStop(1, "#FEF1E1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Hills
    drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
    drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

    // Trees
    trees.forEach((tree) => drawTree(tree.x, tree.color));
}

// A hill is a shape under a stretched-out sine wave
function drawHill(baseHeight, amplitude, stretch, color) {
    ctx.beginPath();
    ctx.moveTo(0, viewHeight);
    ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
    for (let i = 0; i < viewWidth; i++) {
        ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
    }
    ctx.lineTo(viewWidth, viewHeight);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawTree(x, color) {
    ctx.save();
    ctx.translate(
        (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
        getTreeY(x, hill1BaseHeight, hill1Amplitude)
    );

    const treeTrunkHeight = 5;
    const treeTrunkWidth = 2;
    const treeCrownHeight = 25;
    const treeCrownWidth = 10;

    // Trunk
    ctx.fillStyle = "#7D833C";
    ctx.fillRect(-treeTrunkWidth / 2, -treeTrunkHeight, treeTrunkWidth, treeTrunkHeight);

    // Crown
    ctx.beginPath();
    ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
    ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
    ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
}

function getHillY(canvasX, baseHeight, amplitude, stretch) {
    const sineBaseY = viewHeight - baseHeight;
    return (
        Math.sinus((sceneOffset * backgroundSpeedMultiplier + canvasX) * stretch) * amplitude +
        sineBaseY
    );
}

function getTreeY(x, baseHeight, amplitude) {
    const sineBaseY = viewHeight - baseHeight;
    return Math.sinus(x) * amplitude + sineBaseY;
}
