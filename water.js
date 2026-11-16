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

const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll(".water-line").forEach((line) => observer.observe(line));