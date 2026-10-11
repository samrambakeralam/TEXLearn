
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

    function showBook() {
        clearTimeout(transitionTimer);
        quizBox.hidden = true;
        bookStage.hidden = false;
    }

    function showIntro() {
        introFrame.hidden = false;
        voteFrame.hidden = true;
        startButton.disabled = false;

        clearTimeout(transitionTimer);
        transitionTimer = setTimeout(showVoteFrame, 2000);
    }

    function showVoteFrame() {
        clearTimeout(transitionTimer);

        if (!activeQuiz) return;

        introFrame.hidden = true;
        voteFrame.hidden = false;
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
                if (submitting) return;

                selectedAnswer = letter;

                optionsBox.querySelectorAll("button").forEach((item) => {
                    const chosen = item.dataset.answer === letter;
                    item.classList.toggle("is-selected", chosen);
                    item.setAttribute("aria-pressed", String(chosen));
                });

                submitButton.disabled = false;
            });

            optionsBox.appendChild(button);
        });

        const submitButton = createElement(
            "button",
            "tk-hero-quiz-submit",
            "Submit my answer"
        );

        submitButton.type = "button";
        submitButton.disabled = true;

        submitButton.addEventListener("click", async () => {
            if (!selectedAnswer || submitting) return;

            submitting = true;
            submitButton.disabled = true;
            submitButton.textContent = "Submitting…";

            optionsBox.querySelectorAll("button").forEach((button) => {
                button.disabled = true;
            });

            try {
                const response = await fetch(`${API_BASE}/quiz/vote`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        quizId: activeQuiz.quizId,
                        selectedAnswer,
                        sessionId: getSessionId()
                    })
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || "Your answer could not be recorded."
                    );
                }

                renderResults(result);

            } catch (error) {
                submitting = false;
                submitButton.disabled = false;
                submitButton.textContent = "Try submitting again";

                optionsBox.querySelectorAll("button").forEach((button) => {
                    button.disabled = false;
                });

                quizStatus.textContent =
                    error.message || "Please try again.";
            }
        });

        quizContent.append(
            question,
            instruction,
            optionsBox,
            submitButton
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

        const feedback = createElement(
            "div",
            "tk-hero-quiz-feedback"
        );

        feedback.append(
            createElement(
                "h3",
                "",
                result.isCorrect ? "Correct! 🎉" : "Good try!"
            ),
            createElement(
                "p",
                "",
                result.explanation || "Thanks for participating."
            )
        );

        quizContent.appendChild(feedback);

        const results = result.results;

        if (results && Number(results.totalVotes) > 0) {
            const heading = createElement(
                "h3",
                "",
                "How everyone answered"
            );

            heading.style.marginTop = "10px";
            quizContent.appendChild(heading);

            quizContent.appendChild(
                createElement(
                    "p",
                    "",
                    `${results.totalVotes} response` +
                    (results.totalVotes === 1 ? "" : "s")
                )
            );

            ["A", "B", "C", "D"].forEach((letter) => {
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
                row.style.marginTop = "6px";

                const label = createElement(
                    "p",
                    "",
                    `${letter}. ${optionText} — ${percentage}%`
                );

                label.style.margin = "0 0 3px";
                label.style.fontSize = "11px";

                const track = createElement("div", "");
                track.style.height = "6px";
                track.style.overflow = "hidden";
                track.style.borderRadius = "99px";
                track.style.background = "#E5EAF0";

                const bar = createElement("div", "");
                bar.style.width = `${percentage}%`;
                bar.style.height = "100%";
                bar.style.borderRadius = "99px";
                bar.style.background = "#16866A";

                track.appendChild(bar);
                row.append(label, track);
                quizContent.appendChild(row);
            });
        }

        quizStatus.textContent = "Thanks for sharing your answer!";
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

            bookStage.hidden = true;
            quizBox.hidden = false;

            showIntro();

        } catch (error) {
            showBook();
            console.warn("Hero quiz unavailable:", error);
        }
    }

    startButton.addEventListener("click", showVoteFrame);

    // Begin with the original book visible until a quiz loads.
    showBook();
    loadActiveQuiz();
})();
