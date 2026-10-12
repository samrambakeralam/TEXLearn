
/* =====================================================
   TEXLEARN — TWO-FRAME HERO QUIZ
   Frame 1: Introduction
   Frame 2: Question, voting and results
===================================================== */

(() => {
    "use strict";

    const API_BASE =
        "https://samramba-api.samrambakerala.workers.dev";

    const quizBox = document.getElementById("tkHeroQuiz");
    const introFrame = document.getElementById("tkHeroQuizIntro");
    const voteFrame = document.getElementById("tkHeroQuizVote");
    const startButton = document.getElementById("tkHeroQuizStart");
    const quizStatus = document.getElementById("tkHeroQuizStatus");
    const quizContent = document.getElementById("tkHeroQuizContent");
    const bookStage = document.getElementById("rc2UnboxingStage");

    if (
        !quizBox || !introFrame || !voteFrame ||
        !startButton || !quizStatus || !quizContent || !bookStage
    ) {
        return;
    }

    
let activeQuiz = null;
let selectedAnswer = null;
let submitting = false;
let transitionTimer = null;

// Automatic book–quiz rotation
const BOOK_DURATION = 20000;
const QUIZ_DURATION = 20000;
const FADE_DURATION = 1500;
const FIRST_BOOK_DURATION = 30000;

let rotationTimer = null;
let rotationPaused = false;
let currentHeroView = "book";

let isTransitioning = false;


function fadeToView(nextView) {
    if (isTransitioning || currentHeroView === nextView) return;

    isTransitioning = true;

    const outgoing = nextView === "quiz" ? bookStage : quizBox;
    const incoming = nextView === "quiz" ? quizBox : bookStage;

    incoming.hidden = false;
    incoming.classList.add("tk-hero-fading");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            outgoing.classList.add("tk-hero-fading");
            incoming.classList.remove("tk-hero-fading");

            setTimeout(() => {
                outgoing.hidden = true;
                outgoing.classList.remove("tk-hero-fading");

                currentHeroView = nextView;
                isTransitioning = false;
            }, FADE_DURATION);
        });
    });
}




  

function showBook() {
    clearTimeout(transitionTimer);
    clearTimeout(rotationTimer);

    if (currentHeroView === "book" && !isTransitioning) {
        quizBox.hidden = true;
        bookStage.hidden = false;
    } else {
        fadeToView("book");
    }

    rotationPaused = false;

    if (activeQuiz) {
    rotationTimer = setTimeout(showIntro, BOOK_DURATION);
}
}






function showIntro() {
    clearTimeout(transitionTimer);
    clearTimeout(rotationTimer);

    rotationPaused = false;

    // Desktop: skip the intro and show the question directly.
    if (window.matchMedia("(min-width: 768px)").matches) {
        introFrame.hidden = true;
        voteFrame.hidden = false;
        startButton.disabled = false;

        if (currentHeroView === "quiz" && !isTransitioning) {
            quizBox.hidden = false;
        } else {
            fadeToView("quiz");
        }

        if (!rotationPaused) {
            rotationTimer = setTimeout(showBook, QUIZ_DURATION);
        }

        return;
    }

    // Phone: retain the existing intro frame.
    introFrame.hidden = false;
    voteFrame.hidden = true;
    startButton.disabled = false;

    if (currentHeroView === "quiz" && !isTransitioning) {
        quizBox.hidden = false;
    } else {
        fadeToView("quiz");
    }

    transitionTimer = setTimeout(showVoteFrame, 6000);
}



   




function showVoteFrame() {
    clearTimeout(transitionTimer);

    if (!activeQuiz) return;

    clearTimeout(rotationTimer);

    // Prepare the question frame before fading it in.
    voteFrame.hidden = false;
    voteFrame.classList.add("tk-frame-fading");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Fade out the intro while fading in the question.
            introFrame.classList.add("tk-frame-fading");
            voteFrame.classList.remove("tk-frame-fading");

            // Remove the intro after the crossfade completes.
            transitionTimer = setTimeout(() => {
                introFrame.hidden = true;
                introFrame.classList.remove("tk-frame-fading");

                // Keep the question visible for 20 seconds
                // unless the student is actively participating.
                if (!rotationPaused) {
                    rotationTimer = setTimeout(showBook, QUIZ_DURATION);
                }
            }, FADE_DURATION);
        });
    });
}





    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;

        return element;
    }

    

function renderQuestion(quiz) {
    activeQuiz = quiz;
    selectedAnswer = null;
    submitting = false;

    quizStatus.textContent = "";
    quizContent.replaceChildren();
    quizContent.hidden = false;

    const question = createElement(
        "h3",
        "tk-hero-quiz-question",
        quiz.question
    );

    const instruction = createElement(
        "p",
        "tk-hero-quiz-instruction",
        "Choose the answer you think is right."
    );

    const optionsBox = createElement(
        "div",
        "tk-hero-quiz-options"
    );

    const letters = ["A", "B", "C", "D"];
    const optionButtons = [];

    const voteKey = "tk_quiz_voted_" + quiz.quizId;

    function hasVotedLocally() {
        try {
            return localStorage.getItem(voteKey) === "true";
        } catch (error) {
            return false;
        }
    }

    async function submitAnswer(letter) {
        if (submitting || selectedAnswer) return;

        clearTimeout(rotationTimer);
        rotationPaused = true;

        selectedAnswer = letter;
        submitting = true;

        optionButtons.forEach((button) => {
            button.disabled = true;
            button.classList.toggle(
                "is-selected",
                button.dataset.answer === letter
            );
            button.setAttribute(
                "aria-pressed",
                String(button.dataset.answer === letter)
            );
        });

        quizStatus.textContent = "Submitting your answer…";

        try {
            const response = await fetch(`${API_BASE}/quiz/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    quizId: quiz.quizId,
                    selectedAnswer: letter,
                    sessionId: getSessionId()
                })
            });

            const result = await response.json();

           
if (!response.ok || !result.success) {
    const alreadyRecorded =
        (result.message || "").toLowerCase().includes(
            "already been recorded"
        );

    if (alreadyRecorded) {
        try {
            localStorage.setItem(voteKey, "true");
        } catch (error) {
            console.warn(
                "Could not save quiz vote status:",
                error
            );
        }

        selectedAnswer = "already-voted";
        submitting = true;

        const resultsResponse = await fetch(
            `${API_BASE}/quiz/results?quizId=${encodeURIComponent(quiz.quizId)}`
        );

        const latestResults = await resultsResponse.json();

        if (!resultsResponse.ok || !latestResults.success) {
            throw new Error("Could not load the latest poll results.");
        }

        renderResults(latestResults);

        rotationPaused = false;
        clearTimeout(rotationTimer);
        rotationTimer = setTimeout(showBook, QUIZ_DURATION);

        return;
    }

    throw new Error(
        result.message ||
        "Your answer could not be recorded."
    );
}


            try {
                localStorage.setItem(voteKey, "true");
            } catch (error) {
                console.warn(
                    "Could not save quiz vote status:",
                    error
                );
            }

            renderResults(result);

            rotationPaused = false;
            clearTimeout(rotationTimer);
            rotationTimer = setTimeout(
                showBook,
                QUIZ_DURATION
            );

        } catch (error) {
            selectedAnswer = null;
            submitting = false;

            optionButtons.forEach((button) => {
                button.disabled = false;
                button.classList.remove("is-selected");
                button.setAttribute("aria-pressed", "false");
            });

            quizStatus.textContent =
                error.message ||
                "Unable to submit. Please try again.";

            rotationPaused = false;
            clearTimeout(rotationTimer);
            rotationTimer = setTimeout(
                showBook,
                QUIZ_DURATION
            );
        }
    }

    letters.forEach((letter) => {
        const optionText = quiz.options?.[letter];
        if (!optionText) return;

        const button = createElement(
            "button",
            "tk-hero-quiz-option"
        );

        button.type = "button";
        button.dataset.answer = letter;
        button.setAttribute("aria-pressed", "false");

        const badge = createElement(
            "span",
            "tk-hero-quiz-option-letter",
            letter
        );

        const label = createElement(
            "span",
            "tk-hero-quiz-option-text",
            optionText
        );

        button.append(badge, label);

        button.addEventListener("click", () => {
            submitAnswer(letter);
        });

        optionButtons.push(button);
        optionsBox.appendChild(button);
    });

    quizContent.append(
        question,
        instruction,
        optionsBox
    );

    // Returning voters see results instead of being asked to vote again.
    if (hasVotedLocally()) {
        selectedAnswer = "already-voted";
        submitting = true;

        optionButtons.forEach((button) => {
            button.disabled = true;
            button.setAttribute("aria-disabled", "true");
        });

        instruction.textContent = "Current poll results";

        fetch(
            `${API_BASE}/quiz/results?quizId=${encodeURIComponent(quiz.quizId)}`
        )
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Could not load poll results.");
                }
                return response.json();
            })
            .then((data) => {
                if (!data.success) {
                    throw new Error(
                        data.message || "Could not load poll results."
                    );
                }

                renderResults(data);
            })
            .catch((error) => {
                console.error("Quiz results error:", error);
                quizStatus.textContent =
                    "Poll results are temporarily unavailable.";
            });
    }
}



    function getSessionId() {
        const key = "tk_quiz_session_id";

        try {
            let id = localStorage.getItem(key);

            if (!id) {
                id = window.crypto?.randomUUID
                    ? window.crypto.randomUUID()
                    : "tk-" + Date.now() + "-" +
                      Math.random().toString(36).slice(2);

                localStorage.setItem(key, id);
            }

            return id;
        } catch (error) {
            return "tk-" + Date.now() + "-" +
                Math.random().toString(36).slice(2);
        }
    }

   

function renderResults(result) {
    const data = result.results || result;

    const counts = data.optionCounts || {};
    const percentages = data.optionPercentages || {};
    const letters = ["A", "B", "C", "D"];

    const colours = {
        A: "#D81B83",
        B: "#7025A8",
        C: "#E53935",
        D: "#F28C28"
    };

    quizStatus.textContent = "";

    // Preserve the existing question and option labels.
    const question = quizContent.querySelector(
        ".tk-hero-quiz-question"
    );

    const instruction = quizContent.querySelector(
        ".tk-hero-quiz-instruction"
    );

    const optionsBox = quizContent.querySelector(
        ".tk-hero-quiz-options"
    );

    if (!optionsBox) {
        console.warn("Quiz options container was not found.");
        return;
    }

    if (instruction) {
        instruction.textContent = "Current poll results";
    }

    const optionButtons = Array.from(
        optionsBox.querySelectorAll(".tk-hero-quiz-option")
    );

    optionButtons.forEach((button) => {
        const letter = button.dataset.answer;
        const optionText =
            activeQuiz?.options?.[letter] || letter;

        const rawPercentage = Number(percentages[letter]);
        const percentage = Number.isFinite(rawPercentage)
            ? Math.max(0, Math.min(100, rawPercentage))
            : 0;

        const count = Number(counts[letter]) || 0;

        button.replaceChildren();
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
        button.setAttribute("aria-pressed", "false");
        button.classList.remove("is-selected");
        button.classList.add("is-results");
        button.style.position = "relative";
        button.style.overflow = "hidden";
        button.style.width = "100%";
        button.style.cursor = "default";
        button.style.pointerEvents = "none";
        button.style.background = "#FFFFFF";
        button.style.border = "1px solid #E2E6EB";
        button.style.minHeight = "0";
        button.style.padding = "2px 7px";
        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.gap = "8px";
        button.style.textAlign = "left";

        // Coloured progress fill.
        const fill = createElement("span", "");
        fill.setAttribute("aria-hidden", "true");
        fill.style.position = "absolute";
        fill.style.left = "0";
        fill.style.top = "0";
        fill.style.bottom = "0";
        fill.style.width = percentage + "%";
        fill.style.background = colours[letter];
        fill.style.opacity = "0.24";
        fill.style.transition = "width 450ms ease";
        fill.style.pointerEvents = "none";

        // Keep the option letter visible.
        const badge = createElement(
            "span",
            "tk-hero-quiz-option-letter",
            letter
        );
        badge.style.position = "relative";
        badge.style.zIndex = "1";
        badge.style.flex = "0 0 auto";

        // Keep the full option text visible.
        const label = createElement(
            "span",
            "tk-hero-quiz-option-text",
            optionText
        );
        label.style.position = "relative";
        label.style.zIndex = "1";
        label.style.flex = "1";
        label.style.minWidth = "0";
        label.style.color = "#172B4D";

        // Percentage at the right edge.
        const percentLabel = createElement(
            "span",
            "tk-hero-quiz-percentage",
            percentage + "%"
        );
        percentLabel.style.position = "relative";
        percentLabel.style.zIndex = "1";
        percentLabel.style.flex = "0 0 auto";
        percentLabel.style.fontWeight = "700";
        percentLabel.style.color = colours[letter];
        percentLabel.style.whiteSpace = "nowrap";

        button.append(
            fill,
            badge,
            label,
            percentLabel
        );

        button.setAttribute(
            "aria-label",
            `${letter}: ${optionText}. ${percentage}% of votes, ${count} votes.`
        );
    });
    
    optionsBox.classList.add("tk-hero-quiz-results");

    // No correct answer or explanation is displayed.
}





    async function loadActiveQuiz() {
        try {
            const response = await fetch(`${API_BASE}/quiz/active`, {
                method: "GET",
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error("Quiz service unavailable.");
            }

            const data = await response.json();

            if (
                !data.success ||
                !data.quiz ||
                !data.quiz.quizId ||
                !data.quiz.question ||
                !data.quiz.options
            ) {
                showBook();
                return;
            }

           
activeQuiz = data.quiz;
renderQuestion(activeQuiz);

// Keep the book visible when the homepage first loads.
clearTimeout(rotationTimer);

bookStage.hidden = false;
quizBox.hidden = true;

currentHeroView = "book";
rotationPaused = false;

// Show the book for 30 seconds before the first crossfade.
rotationTimer = setTimeout(showIntro, 30000);


        } catch (error) {
            showBook();
            console.warn("Hero quiz unavailable:", error);
        }
    }

   
startButton.addEventListener("click", () => {
    clearTimeout(rotationTimer);
    clearTimeout(transitionTimer);

    rotationPaused = true;
    showVoteFrame();
});


    // Begin with the original book visible until a quiz loads.
    showBook();
    loadActiveQuiz();
})();
