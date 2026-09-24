// Iron-Man cursor system
const ironmanContainer = document.querySelector(".ironman-container");
const face = document.querySelector(".face");

if (ironmanContainer && face) {

    ironmanContainer.addEventListener("mousemove", (event) => {

        const rect = ironmanContainer.getBoundingClientRect();

        // Cursor position inside the Iron Man area
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert position into percentages
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        // Reveal your face around the cursor
        face.style.clipPath =
            `circle(75px at ${xPercent}% ${yPercent}%)`;

    });

    ironmanContainer.addEventListener("mouseleave", () => {

        // Hide the portrait again
        face.style.clipPath =
            "circle(0px at 50% 50%)";
    });

}