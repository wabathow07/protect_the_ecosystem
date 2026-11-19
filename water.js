const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Wrap text into visual lines, then reveal each line as it scrolls into view.
document.querySelectorAll(".content-section h1, .content-section h2, .content-section p")
    .forEach((element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach((textNode) => {
            const fragment = document.createDocumentFragment();
            const parts = textNode.nodeValue.split(/(\s+)/);

            parts.forEach((part) => {
                if (!part || /^\s+$/.test(part)) {
                    fragment.appendChild(document.createTextNode(part));
                    return;
                }

                const word = document.createElement("span");
                word.className = "water-word";

                [...part].forEach((character, index) => {
                    const char = document.createElement("span");
                    char.className = "water-char";
                    char.style.setProperty("--char-delay", `${index * 25}ms`);
                    char.textContent = character;
                    word.appendChild(char);
                });

                fragment.appendChild(word);
            });

            textNode.parentNode.replaceChild(fragment, textNode);
        });
    });

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
    });
}, { threshold: 0.2 });

document.querySelectorAll(
    ".content-section h1, .content-section h2, .content-section p, .water-photos img"
).forEach((element) => revealObserver.observe(element));

const depthZones = [...document.querySelectorAll(".water-zone")];
const depthMeter = document.querySelector(".water-depth-meter");
const depthZoneLabel = depthMeter?.querySelector(".water-depth-zone");
const depthReading = depthMeter?.querySelector(".water-depth-reading");
const depthTicks = [...(depthMeter?.querySelectorAll(".water-depth-ruler li") || [])];
const colorStops = [
    { at: 0, rgb: [98, 198, 223] },
    { at: 0.2, rgb: [8, 77, 111] },
    { at: 0.5, rgb: [4, 39, 61] },
    { at: 0.75, rgb: [1, 15, 25] },
    { at: 1, rgb: [0, 0, 0] },
];
let depthFrame = 0;

function updateOceanDepth() {
    depthFrame = 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    const stopIndex = colorStops.findIndex((stop) => stop.at >= progress);
    const upperStop = colorStops[Math.max(1, stopIndex) - 1];
    const lowerStop = colorStops[Math.max(1, stopIndex)];
    const blend = Math.min(1, (progress - upperStop.at) / (lowerStop.at - upperStop.at));
    const rgb = upperStop.rgb.map((channel, index) =>
        Math.round(channel + (lowerStop.rgb[index] - channel) * blend)
    );

    document.body.style.setProperty("--water-depth-color", rgb.join(" "));

    const marker = window.innerHeight * 0.5;
    let activeIndex = depthZones.findIndex((zone) => {
        const bounds = zone.getBoundingClientRect();
        return bounds.top <= marker && bounds.bottom >= marker;
    });

    if (activeIndex < 0 && depthZones.length) {
        activeIndex = window.scrollY < depthZones[0].offsetTop ? -1 : depthZones.length - 1;
    }

    const activeZone = depthZones[activeIndex];
    depthZoneLabel.textContent = activeZone?.querySelector("h2")?.textContent.trim() || "Surface";
    depthReading.textContent = activeZone?.dataset.depthLabel || "0 m";
    depthTicks.forEach((tick, index) => {
        if (index === Math.max(0, activeIndex)) {
            tick.setAttribute("aria-current", "location");
        } else {
            tick.removeAttribute("aria-current");
        }
    });
}

function scheduleOceanDepthUpdate() {
    if (!depthFrame) depthFrame = window.requestAnimationFrame(updateOceanDepth);
}

window.addEventListener("scroll", scheduleOceanDepthUpdate, { passive: true });
window.addEventListener("resize", scheduleOceanDepthUpdate);
scheduleOceanDepthUpdate();

// Roaming shark, with a click/keyboard flip.
const shark = document.querySelector(".water-shark");
const sharkImage = shark?.querySelector("img");
const title = document.querySelector(".water-title");

if (shark && sharkImage && title) {
    const originalSrc = sharkImage.getAttribute("src");
    let biteTimer;

    function showBite() {
        clearTimeout(biteTimer);
        sharkImage.src = "water-photos/sharkmouth.png";
        shark.classList.add("is-biting");

        biteTimer = setTimeout(() => {
            sharkImage.src = originalSrc;
            shark.classList.remove("is-biting");
        }, 2000);
    }

    shark.addEventListener("click", showBite);
    shark.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            showBite();
        }
    });

    if (!reducedMotion) {
        function moveShark() {
            const maxX = Math.max(0, title.clientWidth - shark.offsetWidth);
            const maxY = Math.max(0, title.clientHeight - shark.offsetHeight);
            const currentX = parseFloat(shark.style.left) || 0;
            const nextX = Math.random() * maxX;

            shark.style.setProperty("--travel-direction", nextX < currentX ? "-1" : "1");
            shark.style.setProperty("--travel-time", `${3 + Math.random() * 3}s`);
            shark.style.left = `${nextX}px`;
            shark.style.top = `${Math.random() * maxY}px`;

            setTimeout(moveShark, 3500 + Math.random() * 3500);
        }

        setTimeout(moveShark, 100);
    }
}

// Bubbles, throttled and disabled over the navigation bar.
let lastBubbleTime = 0;

document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;

    const nav = document.querySelector("nav");
    if (nav && (nav.contains(event.target) || event.clientY <= nav.getBoundingClientRect().bottom)) {
        return;
    }

    const now = performance.now();
    if (now - lastBubbleTime < 500) return;
    lastBubbleTime = now;

    const bubble = document.createElement("span");
    bubble.className = "cursor-bubble";
    bubble.style.left = `${event.clientX}px`;
    bubble.style.top = `${event.clientY}px`;
    bubble.style.setProperty("--bubble-size", `${(10 + Math.random() * 18)}px`);
    bubble.style.setProperty("--bubble-drift", `${Math.random() * 36 - 18}px`);
    bubble.style.setProperty("--bubble-duration", `${1500 + Math.random() * 1000}ms`);

    document.body.appendChild(bubble);
    bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
});

// Photo lightbox.
const lightbox = document.createElement("div");
lightbox.className = "water-lightbox";
lightbox.setAttribute("role", "dialog");
lightbox.setAttribute("aria-modal", "true");
lightbox.setAttribute("aria-label", "Photo preview");
lightbox.hidden = true;
lightbox.innerHTML = `
    <div class="water-lightbox-content">
        <button class="water-lightbox-close" type="button" aria-label="Close photo">×</button>
        <img class="water-lightbox-image" alt="">
        <p class="water-lightbox-caption"></p>
    </div>
`;
document.body.appendChild(lightbox);

const lightboxImage = lightbox.querySelector(".water-lightbox-image");
const lightboxCaption = lightbox.querySelector(".water-lightbox-caption");
const closeButton = lightbox.querySelector(".water-lightbox-close");
let lastFocusedPhoto = null;

function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("water-lightbox-open");
    lastFocusedPhoto?.focus();
}

document.addEventListener("click", (event) => {
    const photo = event.target.closest?.(".water-photos img");

    if (photo) {
        lastFocusedPhoto = photo;
        lightboxImage.src = photo.currentSrc || photo.src;
        lightboxImage.alt = photo.alt;
        lightboxCaption.textContent = photo.dataset.animal || photo.alt;
        lightbox.hidden = false;
        document.body.classList.add("water-lightbox-open");
        closeButton.focus();
    } else if (event.target === lightbox || event.target.closest?.(".water-lightbox-close")) {
        closeLightbox();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
        closeLightbox();
    }
});