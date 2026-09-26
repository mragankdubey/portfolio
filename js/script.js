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

// Jarvis 

const jarvis = document.querySelector(".jarvis");
const jarvisButton = document.querySelector(".jarvis-button");
const jarvisWindow = document.querySelector(".jarvis-window");
const chatWindow = document.querySelector(".chat-window");
const jarvisInput = document.querySelector(".jarvis-input");
const jarvisTextInput = document.querySelector(".jarvis-input input");
const quickQuestions = document.querySelectorAll(
    ".jarvis-quick button"
);

if (jarvis && jarvisButton) {
    jarvisButton.addEventListener("click", () => {
        jarvis.classList.toggle("active");

        if (jarvis.classList.contains("active")) {
            setTimeout(() => {
                jarvisTextInput.focus();
            }, 300);
        }
    });
}

function addJarvisMessage(message) {
    const messageElement =
        document.createElement("div");
    messageElement.className =
        "jarvis-message";
    messageElement.innerHTML = `
        <span class="message-label">
            JARVIS
        </span>
        <p>${message}</p>
    `;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop =
        chatWindow.scrollHeight;
}

function addUserMessage(message) {
    const messageElement =
        document.createElement("div");
    messageElement.className =
        "user-message";
    messageElement.textContent =
        message;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop =
        chatWindow.scrollHeight;
}

function showThinking() {
    const thinking =
        document.createElement("div");
    thinking.className =
        "jarvis-message thinking-message";
    thinking.innerHTML = `
        <span class="message-label">
            JARVIS
        </span>
        <p>Processing...</p>
    `;
    chatWindow.appendChild(thinking);
    chatWindow.scrollTop =
        chatWindow.scrollHeight;
    return thinking;
}

function getJarvisResponse(question) {
    const q =
        question.toLowerCase().trim();

    if (
        q.includes("who is mragank") ||
        q.includes("about mragank") ||
        q.includes("who are you") ||
        q.includes("tell me about him")
    ) {
        return `
            Mragank Dubey is a CSE (AI & ML) student
            focused on software development, AI-powered
            applications, backend systems and intelligent
            interfaces.
        `;
    }

    if (
        q.includes("skill") ||
        q.includes("technolog")
    ) {
        return `
            Current systems include Python, HTML, CSS,
            FastAPI and SQL. JavaScript and AI/ML systems
            are currently under development.
        `;
    }

    if (
        q.includes("project") ||
        q.includes("built") ||
        q.includes("portfolio")
    ) {
        return `
            Current projects include CareerBridge,
            To-Do List, Netflix Clone and BrawlDex.
            You can access their repositories through
            the Project Systems section.
        `;
    }

    if (
        q.includes("career") ||
        q.includes("goal") ||
        q.includes("aspir")
    ) {
        return `
            The current objective is to develop practical
            software engineering skills while progressing
            toward AI engineering and intelligent systems.
        `;
    }

    if (
        q.includes("contact") ||
        q.includes("connect") ||
        q.includes("reach")
    ) {
        return `
            You can establish a connection through the
            Contact section below, or use the social links
            in the footer.
        `;
    }
    if (
        q.includes("python")
    ) {

        return `
            Python is currently one of the core development
            systems, used across projects and backend work.
        `;
    }

    if (
        q.includes("fastapi") ||
        q.includes("backend")
    ) {
        return `
            FastAPI is part of the backend stack, primarily
            for building APIs and connecting applications
            with data and AI services.
        `;
    }
    if (
        q.includes("hello") ||
        q.includes("hi") ||
        q.includes("hey")
    ) {
        return `
            Hello. JARVIS systems are online...
            How may I assist you?
        `;
    }

    return `
        I don't have a local protocol for that question yet.
        Try asking about Mragank, his skills, projects,
        career goals, or contact information.
    `;
}
function askJarvis(question) {
    question = question.trim();
    if (!question) {
        return;
    }
    addUserMessage(question);
    const thinking =
        showThinking();
    setTimeout(() => {
        thinking.remove();
        const response =
            getJarvisResponse(question);
        addJarvisMessage(response);
    }, 700);
}
if (jarvisInput) {
    jarvisInput.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();
            const question =
                jarvisTextInput.value.trim();
            if (!question) {
                return;
            }
            askJarvis(question);
            jarvisTextInput.value = "";
        }
    );
}
quickQuestions.forEach((button) => {
    button.addEventListener("click", () => {
        const question =
            button.dataset.question;
        askJarvis(question);
    });
});