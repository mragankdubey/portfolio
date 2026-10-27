// Iron-Man cursor system (Desktop cursor + Mobile touch support)
const ironmanContainer = document.querySelector(".ironman-container");
const face = document.querySelector(".face");

if (ironmanContainer && face) {
    function updateFaceReveal(clientX, clientY) {
        const rect = ironmanContainer.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const xPercent = Math.min(Math.max((x / rect.width) * 100, 0), 100);
        const yPercent = Math.min(Math.max((y / rect.height) * 100, 0), 100);

        face.style.clipPath =
            `circle(90px at ${xPercent}% ${yPercent}%)`;
    }

    ironmanContainer.addEventListener("mousemove", (event) => {
        updateFaceReveal(event.clientX, event.clientY);
    });

    ironmanContainer.addEventListener("mouseleave", () => {
        face.style.clipPath =
            "circle(0px at 50% 50%)";
    });

    // Mobile touch interaction: reveal face on tap/touch-drag without breaking desktop cursor
    let touchTimeout = null;
    ironmanContainer.addEventListener("touchstart", (event) => {
        if (event.touches.length > 0) {
            if (touchTimeout) clearTimeout(touchTimeout);
            updateFaceReveal(event.touches[0].clientX, event.touches[0].clientY);
        }
    }, { passive: true });

    ironmanContainer.addEventListener("touchmove", (event) => {
        if (event.touches.length > 0) {
            updateFaceReveal(event.touches[0].clientX, event.touches[0].clientY);
        }
    }, { passive: true });

    ironmanContainer.addEventListener("touchend", () => {
        touchTimeout = setTimeout(() => {
            face.style.clipPath =
                "circle(0px at 50% 50%)";
        }, 1500);
    }, { passive: true });
}


// =========================================================
// PROJECTS: MANUAL HORIZONTAL TRACK & SYNCHRONIZED SCROLLBAR
// =========================================================

(function () {
    const viewport = document.querySelector(".project-viewport");
    const track = document.querySelector(".project-track");
    const scrollbarTrack = document.getElementById("project-scrollbar-track");
    const scrollbarThumb = document.getElementById("project-scrollbar-thumb");
    const navLabel = document.querySelector(".nav-scroll-label");

    if (!viewport || !track || !scrollbarTrack || !scrollbarThumb) return;

    let isDragging = false;
    let hasDragged = false;
    let ignoreNextClick = false;
    let startX = 0;
    let startScrollLeft = 0;
    let glideRafId = null;

    // 1. Calculate and update thumb width and position
    function updateThumb() {
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        if (maxScroll <= 1) {
            scrollbarTrack.style.opacity = "0.4";
            scrollbarThumb.style.width = "100%";
            scrollbarThumb.style.transform = "translateX(0px)";
            return;
        }
        scrollbarTrack.style.opacity = "1";

        const trackWidth = scrollbarTrack.clientWidth;
        const visibleRatio = Math.min(viewport.clientWidth / viewport.scrollWidth, 1);
        const thumbWidth = Math.max(44, Math.round(trackWidth * visibleRatio));
        scrollbarThumb.style.width = `${thumbWidth}px`;

        const scrollRatio = Math.min(Math.max(viewport.scrollLeft / maxScroll, 0), 1);
        const maxThumbTravel = trackWidth - thumbWidth;
        const thumbLeft = Math.round(scrollRatio * maxThumbTravel);

        scrollbarThumb.style.transform = `translateX(${thumbLeft}px)`;

        // Update ARIA progress
        const percentNow = Math.round(scrollRatio * 100);
        scrollbarTrack.setAttribute("aria-valuenow", String(percentNow));
    }

    // 2. High-performance, cancelable smooth gliding animation (quartic ease-out)
    function cancelGlide() {
        if (glideRafId !== null) {
            cancelAnimationFrame(glideRafId);
            glideRafId = null;
        }
    }

    function smoothGlideTo(targetLeft, customDuration) {
        cancelGlide();

        const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        const clampedTarget = Math.max(0, Math.min(Math.round(targetLeft), maxScroll));
        const startLeft = viewport.scrollLeft;
        const distance = clampedTarget - startLeft;

        if (Math.abs(distance) < 1) {
            viewport.scrollLeft = clampedTarget;
            updateThumb();
            return;
        }

        // Respect prefers-reduced-motion
        const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
            viewport.scrollLeft = clampedTarget;
            updateThumb();
            return;
        }

        // Dynamic duration based on distance: short hops ~380ms, long sweeps ~650-700ms
        const duration = customDuration || Math.min(700, Math.max(380, Math.round(Math.sqrt(Math.abs(distance)) * 16)));
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Quartic ease-out: rapid initial acceleration with silky, friction-damped deceleration
            const ease = 1 - Math.pow(1 - progress, 4);

            viewport.scrollLeft = Math.round(startLeft + distance * ease);
            updateThumb();

            if (progress < 1) {
                glideRafId = requestAnimationFrame(step);
            } else {
                viewport.scrollLeft = clampedTarget;
                updateThumb();
                glideRafId = null;
            }
        }

        glideRafId = requestAnimationFrame(step);
    }

    // Calculate individual card offsets for seamless card-by-card navigation
    function getCardOffsets() {
        const cards = Array.from(track.querySelectorAll(".project-card"));
        if (!cards.length) return [];
        const baseOffset = cards[0].offsetLeft;
        return cards.map((c) => Math.max(0, c.offsetLeft - baseOffset));
    }

    function glideToNextCard() {
        const offsets = getCardOffsets();
        const current = viewport.scrollLeft;
        const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);

        if (!offsets.length) {
            smoothGlideTo(Math.min(maxScroll, current + Math.round(viewport.clientWidth * 0.75)));
            return;
        }

        const next = offsets.find((offset) => offset > current + 25);
        if (next !== undefined) {
            smoothGlideTo(next);
        } else if (current < maxScroll - 25) {
            smoothGlideTo(maxScroll);
        } else {
            // Loop back to the first card once end of archive is reached
            smoothGlideTo(0);
        }
    }

    function glideToPrevCard() {
        const offsets = getCardOffsets();
        const current = viewport.scrollLeft;

        if (!offsets.length) {
            smoothGlideTo(Math.max(0, current - Math.round(viewport.clientWidth * 0.75)));
            return;
        }

        const prev = [...offsets].reverse().find((offset) => offset < current - 25);
        if (prev !== undefined) {
            smoothGlideTo(prev);
        } else {
            smoothGlideTo(0);
        }
    }

    // 3. User interaction cancels running animation immediately for 100% manual responsiveness
    viewport.addEventListener("touchstart", cancelGlide, { passive: true });
    viewport.addEventListener("pointerdown", cancelGlide, { passive: true });
    viewport.addEventListener("wheel", (e) => {
        // If user scrolls horizontally via wheel/trackpad, cancel programmatic glide
        if (Math.abs(e.deltaX) > 0) {
            cancelGlide();
        }
    }, { passive: true });

    // 4. Synchronize thumb on scroll, resize, and initial load
    viewport.addEventListener("scroll", updateThumb, { passive: true });
    window.addEventListener("resize", () => {
        cancelGlide();
        updateThumb();
    });
    window.addEventListener("load", updateThumb);

    // 5. Dragging the thumb (Mouse & Touch) - instantaneous 1:1 direct tracking
    function onDragStart(clientX) {
        cancelGlide();
        isDragging = true;
        hasDragged = false;
        startX = clientX;
        startScrollLeft = viewport.scrollLeft;
        document.body.classList.add("project-dragging");
        scrollbarThumb.classList.add("is-dragging");
    }

    function onDragMove(clientX) {
        if (!isDragging) return;
        const deltaX = clientX - startX;
        if (Math.abs(deltaX) > 2) {
            hasDragged = true;
        }
        const trackWidth = scrollbarTrack.clientWidth;
        const thumbWidth = scrollbarThumb.offsetWidth;
        const maxThumbTravel = trackWidth - thumbWidth;
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;

        if (maxThumbTravel <= 0 || maxScroll <= 0) return;

        const scrollDelta = (deltaX / maxThumbTravel) * maxScroll;
        viewport.scrollLeft = Math.round(startScrollLeft + scrollDelta);
    }

    function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        document.body.classList.remove("project-dragging");
        scrollbarThumb.classList.remove("is-dragging");

        if (hasDragged) {
            ignoreNextClick = true;
            setTimeout(() => {
                ignoreNextClick = false;
            }, 80);
        }
    }

    // Mouse events on thumb
    scrollbarThumb.addEventListener("mousedown", (e) => {
        e.preventDefault();
        onDragStart(e.clientX);
    });

    window.addEventListener("mousemove", (e) => {
        if (isDragging) {
            e.preventDefault();
            onDragMove(e.clientX);
        }
    });

    window.addEventListener("mouseup", onDragEnd);

    // Touch events on thumb
    scrollbarThumb.addEventListener("touchstart", (e) => {
        if (e.touches.length > 0) {
            onDragStart(e.touches[0].clientX);
        }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        if (isDragging && e.touches.length > 0) {
            onDragMove(e.touches[0].clientX);
        }
    }, { passive: true });

    window.addEventListener("touchend", onDragEnd);

    // 6. Click on track smoothly glides toward the target
    scrollbarTrack.addEventListener("click", (e) => {
        if (ignoreNextClick || isDragging) return;
        if (e.target === scrollbarThumb) return;

        const rect = scrollbarTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const trackWidth = rect.width;
        const thumbWidth = scrollbarThumb.offsetWidth;
        const maxThumbTravel = trackWidth - thumbWidth;
        const targetThumbLeft = clickX - thumbWidth / 2;
        const ratio = Math.min(Math.max(targetThumbLeft / maxThumbTravel, 0), 1);
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;

        smoothGlideTo(Math.round(ratio * maxScroll));
    });

    // 7. Interactive navigation label & arrow
    if (navLabel) {
        navLabel.addEventListener("click", () => {
            glideToNextCard();
        });

        navLabel.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                glideToNextCard();
            }
        });
    }

    // 8. Keyboard accessibility on scrollbar track
    scrollbarTrack.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            glideToPrevCard();
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            glideToNextCard();
        } else if (e.key === "Home") {
            e.preventDefault();
            smoothGlideTo(0);
        } else if (e.key === "End") {
            e.preventDefault();
            smoothGlideTo(viewport.scrollWidth - viewport.clientWidth);
        } else if (e.key === "PageDown") {
            e.preventDefault();
            smoothGlideTo(viewport.scrollLeft + Math.round(viewport.clientWidth * 0.8));
        } else if (e.key === "PageUp") {
            e.preventDefault();
            smoothGlideTo(viewport.scrollLeft - Math.round(viewport.clientWidth * 0.8));
        }
    });

    // Initial check
    updateThumb();
})();

// Jarvis 

const jarvis = document.querySelector(".jarvis");
const jarvisButton = document.querySelector(".jarvis-button");
const jarvisWindow = document.querySelector(".jarvis-window");
const chatWindow = document.querySelector(".chat-window");
const jarvisInput = document.querySelector("#jarvis-form");
const jarvisTextInput = document.querySelector("#jarvis-input");
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
        q.includes("who are you") ||
        q.includes("what are you")
    ) {
        return `
            I am JARVIS, the personal AI assistant
            integrated into Mragank's portfolio.
            I can help visitors explore his skills,
            projects and development journey.
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
async function askJarvis(question) {
    question = question.trim();

    if (!question) {
        return;
    }

    addUserMessage(question);
    const thinking = showThinking();

    try {
        const response = await fetch(
            "https://portfolio-ea2h.onrender.com/chat",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: question
                })
            }
        );
        if (!response.ok) {
            throw new Error("JARVIS backend error");
        }

        const data = await response.json();
        thinking.remove();
        addJarvisMessage(data.response);

    } catch (error) {
        console.error(
            "JARVIS connection error:",
            error
        );
        thinking.remove();

        const fallback =
            getJarvisResponse(question);
        addJarvisMessage(fallback);
    }
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

// Nav 

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(
    "#about, #skills, #projects, #contact"
);


const navObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {

            if (entry.isIntersecting) {
                navLinks.forEach((link) => {
                    link.classList.remove("active");
                });

                const activeLink =
                    document.querySelector(
                        `.nav-link[href="#${entry.target.id}"]`
                    );

                if (activeLink) {
                    activeLink.classList.add("active");
                }
            }
        });
    },
    {
        threshold: 0.35
    }
);

sections.forEach((section) => {
    navObserver.observe(section);
});
// =========================================
// CONTACT FORM
// =========================================

const contactForm = document.querySelector("#contact-form");

if (contactForm) {

    const statusBox =
        document.querySelector("#contact-status");

    const statusTitle =
        statusBox.querySelector(".status-title");

    const statusMessage =
        statusBox.querySelector(".status-message");

    const submitButton =
        document.querySelector("#contact-submit");


    function updateContactStatus(
        state,
        title,
        message
    ) {

        statusBox.classList.remove(
            "transmitting",
            "success",
            "error"
        );

        if (state) {
            statusBox.classList.add(state);
        }

        statusTitle.textContent = title;
        statusMessage.textContent = message;
    }


    contactForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const name =
                document.querySelector("#name")
                    .value.trim();

            const email =
                document.querySelector("#email")
                    .value.trim();

            const message =
                document.querySelector("#message")
                    .value.trim();


            /* -------------------------
               TRANSMISSION START
            ------------------------- */

            submitButton.disabled = true;

            submitButton.textContent =
                "TRANSMITTING...";


            updateContactStatus(
                "transmitting",
                "TRANSMISSION ACTIVE",
                "Establishing secure communication channel..."
            );


            try {

                const response = await fetch(
                    "https://portfolio-ea2h.onrender.com/contact",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name: name,
                            email: email,
                            message: message
                        })
                    }
                );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {
                    throw new Error(
                        data.message ||
                        "Message transmission failed"
                    );
                }


                /* -------------------------
                   SUCCESS
                ------------------------- */

                updateContactStatus(
                    "success",
                    "TRANSMISSION COMPLETE",
                    "Your message has been securely delivered to Mragank."
                );


                submitButton.textContent =
                    "MESSAGE TRANSMITTED";


                contactForm.reset();


            } catch (error) {

                console.error(
                    "Contact form error:",
                    error
                );


                /* -------------------------
                   ERROR
                ------------------------- */

                updateContactStatus(
                    "error",
                    "TRANSMISSION FAILED",
                    "Unable to establish communication. Please try again."
                );


                submitButton.textContent =
                    "RETRY TRANSMISSION";


            } finally {

                submitButton.disabled = false;
            }
        }
    );
}

// =========================================================
// MOBILE NAVIGATION
// CHECKPOINT 1
// =========================================================

(function () {

    const header =
        document.querySelector("#main-header");

    const menuToggle =
        document.querySelector(".nav-menu-toggle");

    const mainNav =
        document.querySelector("#main-nav");

    const mobileNavLinks =
        document.querySelectorAll("#main-nav .nav-link");


    if (!header || !menuToggle || !mainNav) {
        return;
    }


    function openMobileMenu() {

        header.classList.add("menu-open");

        document.body.classList.add(
            "mobile-menu-open"
        );

        menuToggle.setAttribute(
            "aria-expanded",
            "true"
        );

        menuToggle.setAttribute(
            "aria-label",
            "Close navigation menu"
        );

    }


    function closeMobileMenu() {

        header.classList.remove("menu-open");

        document.body.classList.remove(
            "mobile-menu-open"
        );

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        menuToggle.setAttribute(
            "aria-label",
            "Open navigation menu"
        );

    }


    function toggleMobileMenu() {

        const isOpen =
            header.classList.contains("menu-open");

        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }

    }


    /* Hamburger */

    menuToggle.addEventListener(
        "click",
        toggleMobileMenu
    );


    /* Close after selecting a section */

    mobileNavLinks.forEach((link) => {

        link.addEventListener(
            "click",
            () => {
                closeMobileMenu();
            }
        );

    });


    /* Escape closes menu */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                header.classList.contains("menu-open")
            ) {
                closeMobileMenu();

                menuToggle.focus();
            }

        }
    );


    /* Clicking outside closes menu */

    document.addEventListener(
        "click",
        (event) => {

            if (
                !header.classList.contains("menu-open")
            ) {
                return;
            }


            if (
                !header.contains(event.target)
            ) {
                closeMobileMenu();
            }

        }
    );


    /* If screen becomes desktop again,
       reset mobile state */

    window.addEventListener(
        "resize",
        () => {

            if (window.innerWidth > 768) {
                closeMobileMenu();
            }

        }
    );

})();


/* STARK SYSTEM STARTUP */

document.addEventListener("DOMContentLoaded", () => {
    const intro = document.getElementById("stark-intro");
    const reactorButton = document.getElementById("reactor-activate");

    if (!intro || !reactorButton) return;

    document.body.classList.add("intro-active");

    reactorButton.addEventListener("click", () => {
        reactorButton.disabled = true;

        const status = intro.querySelector(".intro-status");
        const instruction = intro.querySelector(".intro-instruction");

        if (status) status.textContent = "SYSTEM ONLINE";
        if (instruction) instruction.textContent = "WELCOME TO STARK INTERFACE";

        intro.classList.add("intro-exit");
        document.body.classList.remove("intro-active");
    });
});
