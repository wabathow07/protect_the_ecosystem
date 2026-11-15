document.querySelectorAll(".content-section h1, .content-section h2, .content-section p")
    .forEach((element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        let characterIndex = 0;

        textNodes.forEach((textNode) => {
            const fragment = document.createDocumentFragment();

            for (const character of textNode.nodeValue) {
                if (/\s/.test(character)) {
                    fragment.appendChild(document.createTextNode(character));
                    continue;
                }

                const span = document.createElement("span");
                span.className = "water-char";
                span.style.setProperty(
                    "--char-delay",
                    `${Math.min(characterIndex * 12, 360)}ms`
                );
                span.textContent = character;
                fragment.appendChild(span);
                characterIndex++;
            }

            textNode.parentNode.replaceChild(fragment, textNode);
        });
    });

const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll(".content-section h1, .content-section h2, .content-section p")
    .forEach((element) => observer.observe(element));