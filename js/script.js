// Iron-Man cursor system
const ironmanContainer = document.querySelector(".ironman-container");
const face = document.querySelector(".face");

if (ironmanContainer && face) {
    ironmanContainer.addEventListener("mousemove", (event) => {

        const rect = ironmanContainer.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        face.style.clipPath =
            `circle(90px at ${xPercent}% ${yPercent}%)`;

    });

    ironmanContainer.addEventListener("mouseleave", () => {
        face.style.clipPath =
            "circle(0px at 50% 50%)";
    });
}


// Vertical -> Horizontal 

(function () {
    const pinWrapper      = document.querySelector(".project-pin-wrapper");
    const projectViewport = document.querySelector(".project-viewport");
    const projectTrack    = document.querySelector(".project-track");

    if (!pinWrapper || !projectViewport || !projectTrack) return;
    let maxHorizontal = 0; 
    let targetX = 0;         
    let currentX = 0;        
    let rafId = null;
    const EASE = 0.15;

    function calculateDistance() {
        maxHorizontal = Math.max(
            0,
            projectTrack.scrollWidth - projectViewport.clientWidth
        );
        pinWrapper.style.height = `${window.innerHeight + maxHorizontal}px`;
        requestFrame();
    }
    function requestFrame() {
        if (rafId === null) {
            rafId = requestAnimationFrame(frame);
        }
    }

    function frame() {
        rafId = null;
        if (maxHorizontal > 0) {
            const rect = pinWrapper.getBoundingClientRect();
            let progress = -rect.top / maxHorizontal;
            progress = Math.min(Math.max(progress, 0), 1);
            targetX = maxHorizontal * progress;

        } else {
            targetX = 0;
        }
        currentX += (targetX - currentX) * EASE;
        if (Math.abs(targetX - currentX) < 0.4) {
            currentX = targetX;
        }
        projectTrack.style.transform = `translate3d(${-currentX}px, 0, 0)`;
        if (currentX !== targetX) {
            requestFrame();
        }
    }
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", calculateDistance);
    window.addEventListener("load", calculateDistance);

    
    calculateDistance();
})();