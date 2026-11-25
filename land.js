const animalEntries = document.querySelectorAll(".land-animal");

if (
    animalEntries.length &&
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
    document.body.classList.add("land-reveal-ready");

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    animalEntries.forEach((entry) => observer.observe(entry));
}
