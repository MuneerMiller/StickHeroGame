// Player profile, onboarding and personalized messages.
// Loaded before stick.js; stick.js calls initProfile() once the game is set up.

const HERO_COLORS = [
    { name: "Crimson", value: "#E53935" },
    { name: "Ocean", value: "#1E88E5" },
    { name: "Violet", value: "#8E24AA" },
    { name: "Sunset", value: "#FB8C00" },
    { name: "Mint", value: "#00A88F" },
    { name: "Rose", value: "#EC407A" },
];

const PROFILE_KEY = "stickHero.profile";

const defaultProfile = () => ({
    name: "",
    color: HERO_COLORS[0].value,
    best: 0,
    gamesPlayed: 0,
});

// localStorage can be unavailable (private mode, blocked storage), so never let it break the game
function loadProfile() {
    try {
        const saved = JSON.parse(localStorage.getItem(PROFILE_KEY));
        if (saved && typeof saved === "object") return { ...defaultProfile(), ...saved };
    } catch (e) {
        /* ignore */
    }
    return null;
}

function saveProfile() {
    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
        /* ignore */
    }
}

let profile = loadProfile() || defaultProfile();
let isNewPlayer = !loadProfile();
let onboardingStep = 0;

const onboardingElement = document.getElementById("onboarding");
const onboardingSteps = [...onboardingElement.querySelectorAll("[data-step]")];
const stepDots = [...onboardingElement.querySelectorAll(".dot")];
const nameInput = document.getElementById("name-input");
const nameError = document.getElementById("name-error");
const backButton = document.getElementById("onboarding-back");
const nextButton = document.getElementById("onboarding-next");
const swatchContainer = document.getElementById("swatches");
const previewCanvas = document.getElementById("hero-preview");
const welcomePreviewCanvas = document.getElementById("welcome-preview");
const profileButton = document.getElementById("profile-button");
const bestElement = document.getElementById("best");
const gameOverElement = document.getElementById("gameover");

function displayName() {
    return profile.name || "Hero";
}

function isUiOpen() {
    return !onboardingElement.hidden || !gameOverElement.hidden;
}

// ---------- Onboarding ----------

function openOnboarding() {
    onboardingStep = 0;
    nameInput.value = profile.name;
    nameError.textContent = "";
    onboardingElement.querySelector("#onboarding-title").textContent = isNewPlayer
        ? "Welcome to Stick Hero"
        : "Edit your hero";
    onboardingElement.hidden = false;
    introductionElement.style.opacity = 0;
    profileButton.hidden = true;
    renderOnboardingStep();
}

function closeOnboarding() {
    onboardingElement.hidden = true;
    profileButton.hidden = false;
    applyProfile();
    resetGame();
}

function renderOnboardingStep() {
    onboardingSteps.forEach((section, i) => (section.hidden = i !== onboardingStep));
    stepDots.forEach((dot, i) => dot.classList.toggle("active", i <= onboardingStep));
    backButton.style.visibility = onboardingStep === 0 ? "hidden" : "visible";

    const last = onboardingStep === onboardingSteps.length - 1;
    nextButton.textContent = last ? `Let's go, ${displayName()}!` : "Next";

    document.getElementById("look-title").textContent = `Pick your look, ${displayName()}`;

    if (onboardingStep === 0) {
        drawPreview(welcomePreviewCanvas, profile.color);
        setTimeout(() => nameInput.focus(), 50);
    }
    if (onboardingStep === 1) {
        renderSwatches();
        drawPreview(previewCanvas, profile.color);
    }
}

function nextOnboardingStep() {
    if (onboardingStep === 0) {
        const name = nameInput.value.trim().replace(/\s+/g, " ");
        if (!name) {
            nameError.textContent = "Every hero needs a name!";
            nameInput.focus();
            return;
        }
        profile.name = name.slice(0, 16);
    }
    if (onboardingStep < onboardingSteps.length - 1) {
        onboardingStep++;
        renderOnboardingStep();
    } else {
        isNewPlayer = false;
        saveProfile();
        closeOnboarding();
    }
}

function renderSwatches() {
    swatchContainer.innerHTML = "";
    HERO_COLORS.forEach(({ name, value }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "swatch";
        button.style.background = value;
        button.title = name;
        button.setAttribute("aria-label", name);
        button.setAttribute("aria-pressed", String(value === profile.color));
        button.addEventListener("click", () => {
            profile.color = value;
            applyAccent();
            renderSwatches();
            drawPreview(previewCanvas, value);
        });
        swatchContainer.appendChild(button);
    });
    const selected = HERO_COLORS.find((c) => c.value === profile.color);
    document.getElementById("color-name").textContent = selected ? selected.name : "";
}

// Draws the hero, large and centered, on a small preview canvas
function drawPreview(target, color) {
    const dpr = window.devicePixelRatio || 1;
    const size = target.clientWidth || 96;
    target.width = size * dpr;
    target.height = size * dpr;
    const c = target.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, size, size);
    c.translate(size / 2 + 4, size / 2);
    c.scale(size / 40, size / 40);
    drawHeroFigure(c, color);
}

// ---------- Personalization ----------

function applyAccent() {
    document.documentElement.style.setProperty("--accent", profile.color);
}

function applyProfile() {
    applyAccent();
    profileButton.textContent = displayName().charAt(0).toUpperCase();
    profileButton.title = `${displayName()} - edit profile`;
    updateBest();
}

function updateBest() {
    bestElement.textContent = profile.best > 0 ? `Best ${profile.best}` : "";
}

// Text shown before each run
function introMessage() {
    if (profile.gamesPlayed === 0) {
        return `Hold down (or hold Space) to stretch your stick, ${displayName()}. Let go to drop it!`;
    }
    if (profile.best > 0) {
        return `Welcome back, ${displayName()}! Your best is ${profile.best}. Hold down to beat it.`;
    }
    return `Welcome back, ${displayName()}! Hold down to stretch your stick.`;
}

function onGameOver(finalScore) {
    const previousBest = profile.best;
    const newBest = finalScore > previousBest;
    profile.gamesPlayed++;
    if (newBest) profile.best = finalScore;
    saveProfile();
    updateBest();

    let title;
    let text;
    if (newBest && previousBest > 0) {
        title = `New personal best, ${displayName()}!`;
        text = `You beat your old record of ${previousBest}.`;
    } else if (newBest) {
        title = `Great start, ${displayName()}!`;
        text = "That's your first record. Now try to beat it.";
    } else if (finalScore === 0) {
        title = `Oops! Even heroes slip, ${displayName()}.`;
        text = "Tip: let go a little earlier or later than you think.";
    } else {
        const gap = previousBest - finalScore + 1;
        title = `Nice run, ${displayName()}!`;
        text = `Only ${gap} more point${gap === 1 ? "" : "s"} to beat your best.`;
    }

    document.getElementById("gameover-title").textContent = title;
    document.getElementById("gameover-text").textContent = text;
    document.getElementById("gameover-score").textContent = finalScore;
    document.getElementById("gameover-best").textContent = profile.best;
    gameOverElement.classList.toggle("record", newBest);
    gameOverElement.hidden = false;
    profileButton.hidden = false;
    setTimeout(() => restartButton.focus(), 50);
}

// ---------- Events ----------

nextButton.addEventListener("click", nextOnboardingStep);
backButton.addEventListener("click", () => {
    if (onboardingStep > 0) {
        onboardingStep--;
        renderOnboardingStep();
    }
});
nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        nextOnboardingStep();
    }
});
nameInput.addEventListener("input", () => (nameError.textContent = ""));
profileButton.addEventListener("click", () => {
    gameOverElement.hidden = true;
    openOnboarding();
});
window.addEventListener("keydown", (event) => {
    // Returning players can close the profile editor without changes
    if (event.key === "Escape" && !onboardingElement.hidden && !isNewPlayer) {
        profile = { ...profile, ...loadProfile() };
        closeOnboarding();
    }
});

function initProfile() {
    applyProfile();
    resetGame(); // Draw the world first so it shows behind the onboarding panel
    if (isNewPlayer) openOnboarding();
}
