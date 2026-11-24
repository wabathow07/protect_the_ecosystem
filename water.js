const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const roughEdgeMask = (seed) => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" preserveAspectRatio="none">
            <filter id="roughen" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency=".22" numOctaves="3" seed="${seed}" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <rect x="4" y="4" width="92" height="92" fill="white" filter="url(#roughen)" />
        </svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

document.querySelectorAll(".water-photos img").forEach((image) => {
    image.style.setProperty("--rough-edge-mask", roughEdgeMask(Math.floor(Math.random() * 1_000_000)));
});

// Wrap headings, paragraphs, and depth-meter labels into animated characters.
function setRandomCharacterWiggle(char) {
    const displacement = (Math.random() * 3 - 1.5).toFixed(2);
    const rotation = (Math.random() * 1.6 - 0.8).toFixed(2);
    char.style.setProperty("--wiggle-y", `${displacement}px`);
    char.style.setProperty("--wiggle-rotate", `${rotation}deg`);
}

function wrapTextCharacters(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    const shouldWiggle = !reducedMotion && element.matches(
        ".content-section h1, .content-section h2, .water-depth-zone, .water-depth-ruler button"
    );

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
                if (shouldWiggle) setRandomCharacterWiggle(char);
                word.appendChild(char);
            });

            fragment.appendChild(word);
        });

        textNode.parentNode.replaceChild(fragment, textNode);
    });
}

document.querySelectorAll(
    ".content-section h1, .content-section h2, .content-section p, .water-depth-zone, .water-depth-ruler button"
).forEach(wrapTextCharacters);

const textCharSelector = [
    ".content-section h1 .water-char",
    ".content-section h2 .water-char",
    ".water-depth-meter .water-char"
].join(", ");
let textChars = [...document.querySelectorAll(textCharSelector)];

if (!reducedMotion) {
    const nextWiggleAt = new WeakMap();
    const now = performance.now();
    textChars.filter((char) => !char.closest(".water-depth-meter")).forEach((char) => {
        nextWiggleAt.set(char, now + Math.random() * 1400);
    });

    function updateTextWiggle() {
        const now = performance.now();
        textChars.forEach((char) => {
            if (char.closest(".water-depth-meter")) return;
            if (nextWiggleAt.get(char) > now) return;

            nextWiggleAt.set(char, now + 500 + Math.random() * 700);
            if (!char.closest(".is-visible")) return;

            setRandomCharacterWiggle(char);
        });

        window.setTimeout(updateTextWiggle, document.hidden ? 500 : 120);
    }

    function updateDepthMeterWiggle() {
        document.querySelectorAll(".water-depth-meter .water-char").forEach(setRandomCharacterWiggle);
        window.setTimeout(updateDepthMeterWiggle, 1000);
    }

    updateTextWiggle();
    updateDepthMeterWiggle();
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
    });
}, { threshold: 0.2 });

document.querySelectorAll(
    ".content-section h1, .content-section h2, .content-section p, .water-animal-toggle, .water-photo-arrow"
).forEach((element) => revealObserver.observe(element));

const photoRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
    });
}, { threshold: 0.1, rootMargin: "0px 0px 80px 0px" });

document.querySelectorAll(".water-photos img").forEach((image) => {
    photoRevealObserver.observe(image);
});

const depthZones = [...document.querySelectorAll(".water-zone")];
const depthMeter = document.querySelector(".water-depth-meter");
const depthZoneLabel = depthMeter?.querySelector(".water-depth-zone");
depthMeter?.classList.add("is-visible");
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
        if (window.scrollY < depthZones[0].offsetTop) {
            activeIndex = -1;
        } else {
            let nearestDistance = Infinity;
            depthZones.forEach((zone, index) => {
                const bounds = zone.getBoundingClientRect();
                const distance = marker < bounds.top
                    ? bounds.top - marker
                    : marker - bounds.bottom;
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    activeIndex = index;
                }
            });
        }
    }

    const activeZone = depthZones[activeIndex];
    const zoneLabel = activeZone?.querySelector("h2")?.textContent.trim() || "Surface";
    if (depthZoneLabel.textContent.trim() !== zoneLabel) {
        depthZoneLabel.textContent = zoneLabel;
        wrapTextCharacters(depthZoneLabel);
        textChars = [...document.querySelectorAll(textCharSelector)];
    }
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

depthTicks.forEach((tick, index) => {
    const button = tick.querySelector("button");
    button?.addEventListener("click", () => {
        depthZones[index]?.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
            block: "center"
        });
    });
});

// Roaming shark, with a click/keyboard flip.
const shark = document.querySelector(".water-shark");
const sharkImage = shark?.querySelector("img");
const title = document.querySelector(".water-title");

if (shark && sharkImage && title) {
    const originalSrc = sharkImage.getAttribute("src");
    let biteTimer;
    let cursorHideTimer;
    let mouthHoverTimer;
    let isFollowingPointer = false;
    let isCheckingForPointer = false;
    let isPointerOverShark = false;
    let cursorHiddenDuringHover = false;

    const initialMaxX = Math.max(0, title.clientWidth - shark.offsetWidth);
    const initialMaxY = Math.max(0, title.clientHeight - shark.offsetHeight);
    shark.classList.add("is-positioning");
    shark.style.left = `${Math.random() * initialMaxX}px`;
    shark.style.top = `${Math.random() * initialMaxY}px`;
    shark.getBoundingClientRect();
    shark.classList.remove("is-positioning");

    function hidePointerCursor() {
        document.body.classList.add("water-cursor-hidden");
        if (!reducedMotion) shark.classList.add("is-cursor-hidden");
        clearTimeout(cursorHideTimer);
        cursorHideTimer = setTimeout(() => {
            document.body.classList.remove("water-cursor-hidden");
            shark.classList.remove("is-cursor-hidden");
            cursorHiddenDuringHover = false;
            schedulePointerCursorHide();
        }, 3000);
    }

    function schedulePointerCursorHide() {
        if (!isPointerOverShark || cursorHiddenDuringHover || mouthHoverTimer ||
            sharkImage.getAttribute("src") !== "water-photos/sharkmouth.png") return;

        mouthHoverTimer = setTimeout(() => {
            mouthHoverTimer = null;
            if (!isPointerOverShark || sharkImage.getAttribute("src") !== "water-photos/sharkmouth.png") return;
            cursorHiddenDuringHover = true;
            hidePointerCursor();
        }, 1000);
    }

    function showBite(duration = isFollowingPointer ? 5000 : 2000) {
        clearTimeout(biteTimer);
        sharkImage.src = "water-photos/sharkmouth.png";
        shark.classList.add("is-biting");
        schedulePointerCursorHide();

        biteTimer = setTimeout(() => {
            sharkImage.src = originalSrc;
            shark.classList.remove("is-biting");
        }, duration);
    }

    shark.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "mouse") return;
        isPointerOverShark = true;
        cursorHiddenDuringHover = false;
        schedulePointerCursorHide();
    });
    shark.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "mouse") {
            isPointerOverShark = false;
            cursorHiddenDuringHover = false;
            clearTimeout(mouthHoverTimer);
            mouthHoverTimer = null;
        }
    });
    shark.addEventListener("pointerdown", (event) => {
        if (event.button === 0 && event.isPrimary) showBite();
    });
    shark.addEventListener("click", () => showBite());
    shark.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            showBite();
        }
    });

    if (!reducedMotion) {
        let roamTimer;
        let normalTravelTime = 4.5;
        let hoverTimer;
        let followTimer;
        let checkingTimer;
        let flipTimers = [];
        let lastPointerPosition = null;
        let lastFollowFrameTime = null;
        let followFrame = 0;

        function followPointerFrame(timestamp) {
            if (!isFollowingPointer || !lastPointerPosition) return;

            const bounds = title.getBoundingClientRect();
            const maxX = Math.max(0, title.clientWidth - shark.offsetWidth);
            const maxY = Math.max(0, title.clientHeight - shark.offsetHeight);
            const targetLeft = Math.min(maxX, Math.max(0, lastPointerPosition.x - bounds.left - shark.offsetWidth / 2));
            const targetTop = Math.min(maxY, Math.max(0, lastPointerPosition.y - bounds.top - shark.offsetHeight / 2));
            const currentLeft = parseFloat(shark.style.left) || 0;
            const currentTop = parseFloat(shark.style.top) || 0;
            const deltaX = targetLeft - currentLeft;
            const deltaY = targetTop - currentTop;
            const distance = Math.hypot(deltaX, deltaY);

            if (!isCheckingForPointer && distance > 0.5 && lastFollowFrameTime !== null) {
                const travelTime = parseFloat(shark.style.getPropertyValue("--travel-time")) || 4.5;
                const speed = Math.max(title.clientWidth, title.clientHeight) / travelTime;
                const elapsed = Math.min((timestamp - lastFollowFrameTime) / 1000, 0.05);
                const step = Math.min(distance, speed * elapsed);
                shark.style.left = `${currentLeft + deltaX / distance * step}px`;
                shark.style.top = `${currentTop + deltaY / distance * step}px`;
            }

            lastFollowFrameTime = timestamp;
            followFrame = requestAnimationFrame(followPointerFrame);
        }

        function handlePointerMove(event) {
            if (event.pointerType !== "mouse" || (!hoverTimer && !isFollowingPointer)) return;
            const previousPosition = lastPointerPosition;
            lastPointerPosition = { x: event.clientX, y: event.clientY };
            if (isFollowingPointer && !isCheckingForPointer && Math.abs(lastPointerPosition.x - previousPosition.x) > 1) {
                shark.style.setProperty("--travel-direction", lastPointerPosition.x > previousPosition.x ? "1" : "-1");
            }
        }

        function checkForPointer() {
            if (!isFollowingPointer || document.body.classList.contains("water-cursor-hidden")) return;
            isCheckingForPointer = true;
            shark.classList.add("is-checking");

            const normalDirection = shark.style.getPropertyValue("--travel-direction") || "1";
            const flippedDirection = normalDirection === "1" ? "-1" : "1";
            [flippedDirection, normalDirection, flippedDirection, normalDirection].forEach((direction, index) => {
                flipTimers.push(setTimeout(() => {
                    if (document.body.classList.contains("water-cursor-hidden")) {
                        flipTimers.forEach(clearTimeout);
                        flipTimers = [];
                        isCheckingForPointer = false;
                        shark.classList.remove("is-checking");
                        shark.style.setProperty("--travel-direction", normalDirection);
                        return;
                    }
                    shark.style.setProperty("--travel-direction", direction);
                }, index * 500));
            });
        }

        function stopFollowingPointer() {
            clearTimeout(followTimer);
            clearTimeout(checkingTimer);
            flipTimers.forEach(clearTimeout);
            flipTimers = [];
            cancelAnimationFrame(followFrame);
            followFrame = 0;
            lastFollowFrameTime = null;
            isFollowingPointer = false;
            isCheckingForPointer = false;
            shark.classList.remove("is-following", "is-checking");
            document.removeEventListener("pointermove", handlePointerMove);
            lastPointerPosition = null;
            clearTimeout(biteTimer);
            sharkImage.src = originalSrc;
            shark.classList.remove("is-biting");
            moveShark();
        }

        function startFollowingPointer() {
            if (isFollowingPointer) return;
            clearTimeout(hoverTimer);
            hoverTimer = null;
            clearTimeout(roamTimer);
            const currentPosition = getComputedStyle(shark);
            shark.style.left = currentPosition.left;
            shark.style.top = currentPosition.top;
            isFollowingPointer = true;
            shark.classList.add("is-following");
            showBite();
            lastFollowFrameTime = null;
            followFrame = requestAnimationFrame(followPointerFrame);
            checkingTimer = setTimeout(checkForPointer, 3000);
            followTimer = setTimeout(stopFollowingPointer, 5000);
        }

        shark.addEventListener("pointerdown", (event) => {
            if (event.button !== 0 || !event.isPrimary || isFollowingPointer) return;
            lastPointerPosition = { x: event.clientX, y: event.clientY };
            document.addEventListener("pointermove", handlePointerMove, { passive: true });
            startFollowingPointer();
        });

        shark.addEventListener("pointerenter", (event) => {
            if (event.pointerType !== "mouse" || isFollowingPointer) return;

            lastPointerPosition = { x: event.clientX, y: event.clientY };
            document.addEventListener("pointermove", handlePointerMove, { passive: true });
            hoverTimer = setTimeout(startFollowingPointer, 3000);
        });

        shark.addEventListener("pointerleave", () => {
            if (!hoverTimer) return;
            clearTimeout(hoverTimer);
            hoverTimer = null;
            document.removeEventListener("pointermove", handlePointerMove);
            lastPointerPosition = null;
        });

        function moveShark() {
            if (isFollowingPointer) return;
            const maxX = Math.max(0, title.clientWidth - shark.offsetWidth);
            const maxY = Math.max(0, title.clientHeight - shark.offsetHeight);
            const currentX = parseFloat(shark.style.left) || 0;
            const nextX = Math.random() * maxX;

            shark.style.setProperty("--travel-direction", nextX < currentX ? "-1" : "1");
            normalTravelTime = 3 + Math.random() * 3;
            shark.style.setProperty("--travel-time", `${normalTravelTime}s`);
            shark.style.left = `${nextX}px`;
            shark.style.top = `${Math.random() * maxY}px`;

            roamTimer = setTimeout(moveShark, 3500 + Math.random() * 3500);
        }

        title.addEventListener("pointerdown", (event) => {
            if (!event.isPrimary || event.button !== 0 || event.target.closest?.(".water-shark")) return;

            const bounds = title.getBoundingClientRect();
            const maxX = Math.max(0, title.clientWidth - shark.offsetWidth);
            const maxY = Math.max(0, title.clientHeight - shark.offsetHeight);
            const targetLeft = Math.min(maxX, Math.max(0, event.clientX - bounds.left - shark.offsetWidth / 2));
            const targetTop = Math.min(maxY, Math.max(0, event.clientY - bounds.top - shark.offsetHeight / 2));
            const currentLeft = parseFloat(shark.style.left) || 0;
            const clickTravelTime = normalTravelTime / 1.5;

            shark.style.setProperty("--travel-time", `${clickTravelTime}s`);
            if (Math.abs(targetLeft - currentLeft) > 0.5) {
                shark.style.setProperty("--travel-direction", targetLeft > currentLeft ? "1" : "-1");
            }

            if (isFollowingPointer) {
                if (isCheckingForPointer) {
                    flipTimers.forEach(clearTimeout);
                    flipTimers = [];
                    isCheckingForPointer = false;
                    shark.classList.remove("is-checking");
                }
                lastPointerPosition = { x: event.clientX, y: event.clientY };
                lastFollowFrameTime = null;
                return;
            }

            clearTimeout(roamTimer);
            shark.style.left = `${targetLeft}px`;
            shark.style.top = `${targetTop}px`;
            roamTimer = setTimeout(
                moveShark,
                Math.max(clickTravelTime * 1000 + 100, 3500 + Math.random() * 3500)
            );
        });

        roamTimer = setTimeout(moveShark, 100);
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

document.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest?.(".water-shark")) return;

    for (let index = 0; index < 5; index += 1) {
        const bubble = document.createElement("span");
        bubble.className = "cursor-bubble";
        bubble.style.left = `${event.clientX + (Math.random() * 56 - 28)}px`;
        bubble.style.top = `${event.clientY + (Math.random() * 36 - 18)}px`;
        bubble.style.setProperty("--bubble-size", `${10 + Math.random() * 18}px`);
        bubble.style.setProperty("--bubble-drift", `${Math.random() * 36 - 18}px`);
        bubble.style.setProperty("--bubble-duration", `${1500 + Math.random() * 1000}ms`);

        document.body.appendChild(bubble);
        bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
    }
});

// Give each zone with photos its own swipeable, selectable instant stack.
document.querySelectorAll(".water-photos").forEach((photoCarousel) => {
    const photoStack = photoCarousel.querySelector(".water-photo-stack");
    const photoCards = [...(photoStack?.querySelectorAll(".water-photo-card") || [])];
    const previousPhotoButton = photoCarousel.querySelector(".water-photo-previous");
    const nextPhotoButton = photoCarousel.querySelector(".water-photo-next");
    const animalButtons = photoCarousel.closest(".water-zone")
        ?.querySelectorAll(".water-animal-popover .water-animal-name") || [];
    let activePhotoIndex = 0;
    let swipeStart = null;
    let suppressPhotoClick = false;

    if (!photoStack || !previousPhotoButton || !nextPhotoButton || !photoCards.length) return;

    photoCards.forEach((card) => {
        const angle = (1.5 + Math.random() * 2.5) * (Math.random() < 0.5 ? -1 : 1);
        card.style.setProperty("--photo-rotation", `${angle.toFixed(2)}deg`);
    });

    function showPhoto(index, { singlePhoto = false } = {}) {
        activePhotoIndex = (index + photoCards.length) % photoCards.length;
        photoStack.classList.toggle("is-single-photo", singlePhoto);
        photoCards.forEach((card, cardIndex) => {
            const isActive = cardIndex === activePhotoIndex;
            const isNext = cardIndex === (activePhotoIndex + 1) % photoCards.length;
            card.classList.toggle("is-active", isActive);
            card.classList.toggle("is-next", isNext && !isActive && !singlePhoto);
            card.setAttribute("aria-hidden", String(!isActive));
            card.tabIndex = isActive ? 0 : -1;
        });

        const activePhoto = photoCards[activePhotoIndex].querySelector("img").dataset.photo;
        animalButtons.forEach((animal) => {
            animal.setAttribute("aria-pressed", String(animal.dataset.photo === activePhoto));
        });

        const previousIndex = (activePhotoIndex - 1 + photoCards.length) % photoCards.length;
        const nextIndex = (activePhotoIndex + 1) % photoCards.length;
        const previousCaption = photoCards[previousIndex].querySelector("img").dataset.animal;
        const nextCaption = photoCards[nextIndex].querySelector("img").dataset.animal;
        previousPhotoButton.setAttribute("aria-label", `Show previous photo: ${previousCaption}`);
        nextPhotoButton.setAttribute("aria-label", `Show next photo: ${nextCaption}`);
        previousPhotoButton.disabled = photoCards.length < 2;
        nextPhotoButton.disabled = photoCards.length < 2;
    }

    showPhoto(activePhotoIndex);

    previousPhotoButton.addEventListener("click", () => {
        showPhoto(activePhotoIndex - 1);
    });

    nextPhotoButton.addEventListener("click", () => {
        showPhoto(activePhotoIndex + 1);
    });

    photoStack.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            showPhoto(activePhotoIndex + (event.key === "ArrowRight" ? 1 : -1));
        }
    });

    photoStack.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        swipeStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    });

    window.addEventListener("pointerup", (event) => {
        if (!swipeStart || event.pointerId !== swipeStart.pointerId) return;

        const distance = event.clientX - swipeStart.x;
        const verticalDistance = event.clientY - swipeStart.y;
        swipeStart = null;
        if (Math.abs(distance) < 45 || Math.abs(distance) <= Math.abs(verticalDistance)) return;

        showPhoto(activePhotoIndex + (distance < 0 ? 1 : -1));
        suppressPhotoClick = true;
        setTimeout(() => {
            suppressPhotoClick = false;
        }, 0);
    });

    window.addEventListener("pointercancel", () => {
        swipeStart = null;
    });

    photoCarousel.addEventListener("click", (event) => {
        if (!suppressPhotoClick) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressPhotoClick = false;
    }, true);

    animalButtons.forEach((animal) => {
        animal.addEventListener("click", () => {
            const photoIndex = photoCards.findIndex((card) =>
                card.querySelector("img").dataset.photo === animal.dataset.photo
            );
            if (photoIndex >= 0) showPhoto(photoIndex, { singlePhoto: true });
        });
    });
});

// Keep the animal information popovers mutually exclusive.
const animalToggles = [...document.querySelectorAll(".water-animal-toggle")];

function closeAnimalPopovers() {
    animalToggles.forEach((toggle) => {
        toggle.setAttribute("aria-expanded", "false");
        document.getElementById(toggle.getAttribute("aria-controls")).hidden = true;
    });
}

animalToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
        const popover = document.getElementById(toggle.getAttribute("aria-controls"));
        const willOpen = toggle.getAttribute("aria-expanded") !== "true";
        closeAnimalPopovers();
        toggle.setAttribute("aria-expanded", String(willOpen));
        popover.hidden = !willOpen;
        if (willOpen) {
            const heading = popover.closest(".water-zone-heading");
            const headingRect = heading.getBoundingClientRect();
            const toggleRect = toggle.getBoundingClientRect();
            popover.style.left = `${toggleRect.left - headingRect.left}px`;
            popover.style.top = `${toggleRect.bottom - headingRect.top + 8}px`;
            keepAnimalPopoverInView(popover);
        }
    });
});

function keepAnimalPopoverInView(popover) {
    const rect = popover.getBoundingClientRect();
    const heading = popover.closest(".water-zone-heading");
    const headingRect = heading.getBoundingClientRect();
    const margin = 12;
    const viewportLeft = Math.min(
        Math.max(margin, rect.left),
        Math.max(margin, window.innerWidth - rect.width - margin)
    );
    const viewportTop = Math.min(
        Math.max(margin, rect.top),
        Math.max(margin, window.innerHeight - rect.height - margin)
    );
    popover.style.left = `${viewportLeft - headingRect.left}px`;
    popover.style.top = `${viewportTop - headingRect.top}px`;
}

document.querySelectorAll(".water-animal-popover").forEach((popover) => {
    const handle = popover.querySelector("h3");
    let drag = null;

    handle?.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const rect = popover.getBoundingClientRect();
        drag = {
            pointerId: event.pointerId,
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top
        };
        handle.setPointerCapture(event.pointerId);
        handle.style.cursor = "grabbing";
        event.preventDefault();
    });

    handle?.addEventListener("pointermove", (event) => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        const rect = popover.getBoundingClientRect();
        const headingRect = popover.closest(".water-zone-heading").getBoundingClientRect();
        const margin = 12;
        const left = Math.min(
            Math.max(margin, event.clientX - drag.offsetX),
            Math.max(margin, window.innerWidth - rect.width - margin)
        );
        const top = Math.min(
            Math.max(margin, event.clientY - drag.offsetY),
            Math.max(margin, window.innerHeight - rect.height - margin)
        );
        popover.style.left = `${left - headingRect.left}px`;
        popover.style.top = `${top - headingRect.top}px`;
    });

    const stopDragging = (event) => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        drag = null;
        handle.style.cursor = "grab";
    };

    handle?.addEventListener("pointerup", stopDragging);
    handle?.addEventListener("pointercancel", stopDragging);
});

window.addEventListener("resize", () => {
    document.querySelectorAll(".water-animal-popover:not([hidden])")
        .forEach(keepAnimalPopoverInView);
});

const animalZoneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) return;

        const toggle = entry.target.querySelector(".water-animal-toggle");
        if (!toggle) return;

        const popover = document.getElementById(toggle.getAttribute("aria-controls"));
        if (popover && !popover.hidden) {
            toggle.setAttribute("aria-expanded", "false");
            popover.hidden = true;
        }
    });
}, {
    root: null,
    threshold: 0
});

document.querySelectorAll(".water-zone").forEach((zone) => {
    animalZoneObserver.observe(zone);
});

document.addEventListener("click", (event) => {
    if (!event.target.closest?.(".water-zone-heading")) closeAnimalPopovers();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAnimalPopovers();
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
        <img class="water-lightbox-image" alt="" draggable="false">
        <div class="water-lightbox-caption-row">
            <button class="water-lightbox-arrow water-lightbox-previous" type="button" aria-label="Previous photo">&lt;</button>
            <p class="water-lightbox-caption"></p>
            <button class="water-lightbox-arrow water-lightbox-next" type="button" aria-label="Next photo">&gt;</button>
        </div>
    </div>
`;
document.body.appendChild(lightbox);

const lightboxImage = lightbox.querySelector(".water-lightbox-image");
const lightboxCaption = lightbox.querySelector(".water-lightbox-caption");
const closeButton = lightbox.querySelector(".water-lightbox-close");
const lightboxPreviousButton = lightbox.querySelector(".water-lightbox-previous");
const lightboxNextButton = lightbox.querySelector(".water-lightbox-next");
let lastFocusedPhoto = null;
let lightboxPhotoCards = [];
let lightboxPhotoIndex = -1;
let lightboxSwipeStart = null;

function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("water-lightbox-open");
    lastFocusedPhoto?.focus();
}

function showLightboxPhoto(direction) {
    if (lightboxPhotoCards.length < 2) return;

    lightboxPhotoIndex = (lightboxPhotoIndex + direction + lightboxPhotoCards.length)
        % lightboxPhotoCards.length;
    const photoCard = lightboxPhotoCards[lightboxPhotoIndex];
    const photo = photoCard.querySelector("img");
    const carousel = photoCard.closest(".water-photos");
    carousel?.querySelector(direction < 0 ? ".water-photo-previous" : ".water-photo-next")?.click();

    lightboxImage.src = photo.currentSrc || photo.src;
    lightboxImage.alt = photo.alt;
    lightboxCaption.textContent = photo.dataset.animal || photo.alt;
    lastFocusedPhoto = photoCard;
}

lightboxPreviousButton.addEventListener("click", () => showLightboxPhoto(-1));
lightboxNextButton.addEventListener("click", () => showLightboxPhoto(1));

lightboxImage.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    lightboxSwipeStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    lightboxImage.setPointerCapture(event.pointerId);
});

lightboxImage.addEventListener("pointerup", (event) => {
    if (!lightboxSwipeStart || event.pointerId !== lightboxSwipeStart.pointerId) return;

    const distance = event.clientX - lightboxSwipeStart.x;
    const verticalDistance = event.clientY - lightboxSwipeStart.y;
    lightboxSwipeStart = null;
    if (Math.abs(distance) < 45 || Math.abs(distance) <= Math.abs(verticalDistance)) return;

    showLightboxPhoto(distance < 0 ? 1 : -1);
});

lightboxImage.addEventListener("pointercancel", () => {
    lightboxSwipeStart = null;
});

document.addEventListener("click", (event) => {
    const photoCard = event.target.closest?.(".water-photo-card");
    const photo = photoCard?.querySelector("img") || event.target.closest?.(".water-photos img");

    if (photo) {
        lastFocusedPhoto = photoCard || photo;
        const photoStack = photo.closest(".water-photo-stack");
        lightboxPhotoCards = [...(photoStack?.querySelectorAll(".water-photo-card") || [])];
        lightboxPhotoIndex = lightboxPhotoCards.findIndex((card) => card.contains(photo));
        const hasMultiplePhotos = lightboxPhotoCards.length > 1;
        lightboxPreviousButton.hidden = !hasMultiplePhotos;
        lightboxNextButton.hidden = !hasMultiplePhotos;
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
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showLightboxPhoto(-1);
    } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showLightboxPhoto(1);
    }
});
