const animalEntries = document.querySelectorAll(".land-animal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const giraffeButton = document.querySelector(".land-giraffe");
const giraffeImage = giraffeButton?.querySelector("img");
let giraffeResetTimer;

document.querySelectorAll(".land-carousel-track").forEach((track) => {
    const images = Array.from(track.querySelectorAll("img"));
    if (!images.length) {
        return;
    }

    const group = document.createElement("div");
    group.className = "land-carousel-group";
    images.forEach((image) => group.append(image));
    track.append(group);

    const duplicate = group.cloneNode(true);
    duplicate.setAttribute("aria-hidden", "true");
    duplicate.querySelectorAll("img").forEach((image) => {
        image.alt = "";
    });
    track.append(duplicate);
});

giraffeButton?.addEventListener("click", () => {
    if (!giraffeImage) {
        return;
    }

    clearTimeout(giraffeResetTimer);
    giraffeButton.classList.add("is-bending");
    giraffeImage.src = "land-photos/giraffe_bend.png";
    giraffeImage.alt = "Giraffe bending down";

    giraffeResetTimer = setTimeout(() => {
        giraffeButton.classList.remove("is-bending");
        giraffeImage.src = "land-photos/giraffe.png";
        giraffeImage.alt = "Walking giraffe";
    }, 1000);
});

if (
    animalEntries.length &&
    "IntersectionObserver" in window &&
    !prefersReducedMotion
) {
    document.body.classList.add("land-reveal-ready");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
            } else {
                entry.target.classList.remove("is-visible");
            }
        });
    }, { threshold: 0.15 });

    animalEntries.forEach((entry) => observer.observe(entry));
}
