
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

    
async function submitAnswer(letter, button) {
    if (submitting || selectedAnswer) return;

    clearTimeout(rotationTimer);
    rotationPaused = true;

    selectedAnswer = letter;
    submitting = true;


        optionButtons.forEach((item) => {
            item.disabled = true;
            item.classList.toggle(
                "is-selected",
                item.dataset.answer === letter
            );
            item.setAttribute(
                "aria-pressed",
                String(item.dataset.answer === letter)
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
                    quizId: activeQuiz.quizId,
                    selectedAnswer: letter,
                    sessionId: getSessionId()
                })
            });

            const result = await response.json();

            clearTimeout(rotationTimer);
            rotationPaused = true;

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Your answer could not be recorded."
                );
            }

            renderResults(result);

        } catch (error) {
            selectedAnswer = null;
            submitting = false;

            optionButtons.forEach((item) => {
                item.disabled = false;
                item.classList.remove("is-selected");
                item.setAttribute("aria-pressed", "false");
            });

            quizStatus.textContent =
                error.message ||
                "Unable to submit. Please select an answer to try again.";
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

        const label = createElement("span", "", optionText);

        button.append(badge, label);

        button.addEventListener("click", () => {
            submitAnswer(letter, button);
        });

        optionButtons.push(button);
        optionsBox.appendChild(button);
    });

    quizContent.append(
        question,
        instruction,
        optionsBox
    );
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
    quizContent.replaceChildren();

    const results = result.results;

    if (!results) {
        quizStatus.textContent = "Results are temporarily unavailable.";
        return;
    }

    const panel = createElement("div", "tk-hero-quiz-feedback");

    const summary = createElement("div", "");
    summary.style.display = "flex";
    summary.style.alignItems = "center";
    summary.style.justifyContent = "space-between";
    summary.style.marginBottom = "10px";

    const heading = createElement("h3", "", "Poll results");
    heading.style.margin = "0";
    heading.style.fontSize = "13px";

    const votes = Number(results.totalVotes) || 0;
    const voteCount = createElement(
        "span",
        "",
        `${votes} ${votes === 1 ? "vote" : "votes"}`
    );
    voteCount.style.fontSize = "11px";
    voteCount.style.fontWeight = "600";
    voteCount.style.whiteSpace = "nowrap";

    summary.append(heading, voteCount);
    panel.appendChild(summary);

    const letters = ["A", "B", "C", "D"];
    const colors = {
        A: "#D81B83",
        B: "#7025A8",
        C: "#E53935",
        D: "#F28C28"
    };

    letters.forEach((letter) => {
        const optionText = activeQuiz.options?.[letter];
        if (!optionText) return;

        const percentage = Math.max(
            0,
            Math.min(
                100,
                Number(results.optionPercentages?.[letter]) || 0
            )
        );

        const row = createElement("div", "");
        row.style.marginTop = "8px";

        const track = createElement("div", "");
        track.style.position = "relative";
        track.style.height = "32px";
        track.style.width = "100%";
        track.style.overflow = "hidden";
        track.style.border = "1px solid #E2E6EB";
        track.style.borderRadius = "9px";
        track.style.background = "#FFFFFF";
        track.style.boxSizing = "border-box";

        const bar = createElement("div", "");
        bar.style.position = "absolute";
        bar.style.left = "0";
        bar.style.top = "0";
        bar.style.bottom = "0";
        bar.style.width = `${percentage}%`;
        bar.style.background = colors[letter];
        bar.style.borderRadius = "8px";
        bar.style.transition = "width 350ms ease";

        const letterLabel = createElement("span", "", letter);
        letterLabel.style.position = "absolute";
        letterLabel.style.left = "10px";
        letterLabel.style.top = "50%";
        letterLabel.style.transform = "translateY(-50%)";
        letterLabel.style.fontSize = "12px";
        letterLabel.style.fontWeight = "700";
        letterLabel.style.color = "#172B4D";
        letterLabel.style.zIndex = "1";

        const percentageLabel = createElement(
            "span",
            "",
            `${percentage}%`
        );
        percentageLabel.style.position = "absolute";
        percentageLabel.style.right = "10px";
        percentageLabel.style.top = "50%";
        percentageLabel.style.transform = "translateY(-50%)";
        percentageLabel.style.fontSize = "12px";
        percentageLabel.style.fontWeight = "700";
        percentageLabel.style.color = "#172B4D";
        percentageLabel.style.zIndex = "1";

        track.append(bar, letterLabel, percentageLabel);

        const accessibleLabel = createElement(
            "span",
            "",
            `${letter}: ${optionText}, ${percentage}%`
        );
        accessibleLabel.style.position = "absolute";
        accessibleLabel.style.width = "1px";
        accessibleLabel.style.height = "1px";
        accessibleLabel.style.padding = "0";
        accessibleLabel.style.margin = "-1px";
        accessibleLabel.style.overflow = "hidden";
        accessibleLabel.style.clip = "rect(0, 0, 0, 0)";
        accessibleLabel.style.whiteSpace = "nowrap";

        row.append(track, accessibleLabel);
        panel.appendChild(row);
    });

    quizContent.appendChild(panel);
    quizStatus.textContent = "Poll results updated.";
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
