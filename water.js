const textElements = document.querySelectorAll(
    ".content-section h1, .content-section h2, .content-section p"
);

textElements.forEach((element) => {
    const tokens = (element.textContent.match(/\s+|[^\s]+/g) || []).map((text) => {
        if (/^\s+$/.test(text)) {
            const space = document.createElement("span");
            space.textContent = text;
            return { node: space, isWord: false };
        }

        const word = document.createElement("span");
        word.className = "water-word";

        [...text].forEach((character, index) => {
            const char = document.createElement("span");
            char.className = "water-char";
            char.style.setProperty("--char-delay", `${Math.min(index * 25, 500)}ms`);
            char.textContent = character;
            word.appendChild(char);
        });

        return { node: word, isWord: true };
    });

    element.replaceChildren(...tokens.map((token) => token.node));

    // Measure the words before grouping them into visual lines.
    const lineTops = tokens.map((token) =>
        token.isWord ? Math.round(token.node.getBoundingClientRect().top) : null
    );

    const lineGroups = new Map();
    let previousLine = 0;

    tokens.forEach((token, index) => {
        let line = lineTops[index];

        if (line === null) {
            const nextWord = lineTops.slice(index + 1).find((top) => top !== null);
            line = nextWord ?? previousLine;
        } else {
            previousLine = line;
        }

        if (!lineGroups.has(line)) lineGroups.set(line, []);
        lineGroups.get(line).push(token.node);
    });

    const lines = [...lineGroups.values()].map((nodes) => {
        const line = document.createElement("span");
        line.className = "water-line";
        line.append(...nodes);
        return line;
    });

    element.replaceChildren(...lines);
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
    });
}, { threshold: 0.2 });

document.querySelectorAll(".water-line, .water-photos img").forEach((element) => observer.observe(element));

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let lastBubbleTime = 0;

    document.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;

        const nav = document.querySelector("nav");
        if (nav && (nav.contains(event.target) || event.clientY <= nav.getBoundingClientRect().bottom)) {
            return;
        }

        const now = performance.now();
        if (now - lastBubbleTime < 250) return;
        lastBubbleTime = now;

        const bubble = document.createElement("span");
        bubble.className = "cursor-bubble";
        bubble.style.left = `${event.clientX}px`;
        bubble.style.top = `${event.clientY}px`;
        bubble.style.setProperty("--bubble-size", `${4 + Math.random() * 15}px`);
        bubble.style.setProperty("--bubble-drift", `${Math.random() * 36 - 18}px`);
        bubble.style.setProperty("--bubble-duration", `${1500 + Math.random() * 1000}ms`);
        document.body.appendChild(bubble);
        bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
    });
}

const lightbox = document.createElement("div");
lightbox.className = "water-lightbox";
lightbox.setAttribute("role", "dialog");
lightbox.setAttribute("aria-modal", "true");
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

document.addEventListener("click", (event) => {
    const photo = event.target.closest(".water-photos img");

    if (photo) {
        lightboxImage.src = photo.currentSrc || photo.src;
        lightboxImage.alt = photo.alt;
        lightboxCaption.textContent = photo.dataset.animal || photo.alt;
        lightbox.hidden = false;
        document.body.classList.add("water-lightbox-open");
    } else if (event.target === lightbox || event.target.closest(".water-lightbox-close")) {
        lightbox.hidden = true;
        document.body.classList.remove("water-lightbox-open");
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
        lightbox.hidden = true;
        document.body.classList.remove("water-lightbox-open");
    }
});