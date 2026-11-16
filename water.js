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

        const now = performance.now();
        if (now - lastBubbleTime < 55) return;
        lastBubbleTime = now;

        const bubble = document.createElement("span");
        bubble.className = "cursor-bubble";
        bubble.style.left = `${event.clientX}px`;
        bubble.style.top = `${event.clientY}px`;
        bubble.style.setProperty("--bubble-size", `${4 + Math.random() * 15}px`);
        bubble.style.setProperty("--bubble-drift", `${Math.random() * 36 - 18}px`);
        bubble.style.setProperty("--bubble-duration", `${700 + Math.random() * 500}ms`);

        document.body.appendChild(bubble);
        bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
    });
}