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
            const words = textNode.nodeValue.split(/(\s+)/);

            words.forEach((word) => {
                if (/^\s+$/.test(word)) {
                    fragment.appendChild(document.createTextNode(word));
                    return;
                }

                if (!word) return;

                const wordSpan = document.createElement("span");
                wordSpan.className = "water-word";

                for (const character of word) {
                    const charSpan = document.createElement("span");
                    charSpan.className = "water-char";
                    charSpan.style.setProperty("--char-delay", `${characterIndex * 20}ms`);
                    charSpan.textContent = character;
                    wordSpan.appendChild(charSpan);
                    characterIndex++;
                }

                fragment.appendChild(wordSpan);
            });

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