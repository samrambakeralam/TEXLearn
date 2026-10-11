
/* =====================================================
   TEXLEARN — HERO QUIZ
   Temporarily replaces the hero book display.
===================================================== */

(() => {
    "use strict";

    const API_BASE =
        "https://samramba-api.samrambakerala.workers.dev";

    const quizBox = document.getElementById("tkHeroQuiz");
    const quizStatus = document.getElementById("tkHeroQuizStatus");
    const quizContent = document.getElementById("tkHeroQuizContent");
    const bookStage = document.getElementById("rc2UnboxingStage");

    if (!quizBox || !quizStatus || !quizContent || !bookStage) {
        return;
    }

    let activeQuiz = null;
    let selectedAnswer = null;
    let submitting = false;

    function showBook() {
        quizBox.hidden = true;
        bookStage.hidden = false;
    }

    function showQuiz() {
        bookStage.hidden = true;
        quizBox.hidden = false;
    }

    function getSessionId() {
        const storageKey = "tk_quiz_session_id";

        try {
            let id = localStorage.getItem(storageKey);

            if (!id) {
                id = window.crypto?.randomUUID
                    ? window.crypto.randomUUID()
                    : "tk-" + Date.now() + "-" +
                      Math.random().toString(36).slice(2);

                localStorage.setItem(storageKey, id);
            }

            return id;
        } catch (error) {
            return "tk-" + Date.now() + "-" +
                Math.random().toString(36).slice(2);
        }
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined) {
            element.textContent = text;
        }

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

        const optionLetters = ["A", "B", "C", "D"];

        optionLetters.forEach((letter) => {
            const optionText = quiz.options?.[letter];

            if (!optionText) return;

            const button = createElement(
                "button",
                "tk-hero-quiz-option"
            );

            button.type = "button";
            button.dataset.answer = letter;

            const badge = createElement(
                "span",
                "tk-hero-quiz-option-letter",
                letter
            );

            const label = createElement(
                "span",
                "",
                optionText
            );

            button.append(badge, label);

            button.addEventListener("click", () => {
                if (submitting) return;

                selectedAnswer = letter;

                optionsBox.querySelectorAll("button").forEach((item) => {
                    item.classList.toggle(
                        "is-selected",
                        item.dataset.answer === letter
                    );
                    item.setAttribute(
                        "aria-pressed",
                        String(item.dataset.answer === letter)
                    );
                });

                submitButton.disabled = false;
            });

            button.setAttribute("aria-pressed", "false");
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
                    error.message ||
                    "Something went wrong. Please try again.";
            }
        });

        quizContent.append(
            question,
            instruction,
            optionsBox,
            submitButton
        );
    }

    function renderResults(result) {
        quizContent.replaceChildren();

        const feedback = createElement(
            "div",
            "tk-hero-quiz-feedback"
        );

        const heading = createElement(
            "h3",
            "",
            result.isCorrect ? "Correct! 🎉" : "Good try!"
        );

        const explanation = createElement(
            "p",
            "",
            result.explanation || "Thanks for participating."
        );

        feedback.append(heading, explanation);

        const results = result.results;

        if (results && results.totalVotes > 0) {
            const resultsHeading = createElement(
                "h3",
                "",
                "How everyone answered"
            );

            resultsHeading.style.marginTop = "18px";

            const resultsSummary = createElement(
                "p",
                "",
                `${results.totalVotes} response` +
                (results.totalVotes === 1 ? "" : "s")
            );

            quizContent.append(feedback, resultsHeading, resultsSummary);

            ["A", "B", "C", "D"].forEach((letter) => {
                const optionText = activeQuiz.options?.[letter];

                if (!optionText) return;

                const percentage =
                    Number(results.optionPercentages?.[letter]) || 0;

                const row = createElement("div", "");
                row.style.marginTop = "10px";

                const label = createElement(
                    "p",
                    "",
                    `${letter}. ${optionText} — ${percentage}%`
                );

                label.style.margin = "0 0 5px";
                label.style.fontSize = "12px";

                const track = createElement("div", "");
                track.style.height = "7px";
                track.style.overflow = "hidden";
                track.style.borderRadius = "99px";
                track.style.background = "#E5EAF0";

                const bar = createElement("div", "");
                bar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
                bar.style.height = "100%";
                bar.style.borderRadius = "99px";
                bar.style.background =
                    "linear-gradient(90deg, #16866A, #65C7A5)";

                track.appendChild(bar);
                row.append(label, track);
                quizContent.appendChild(row);
            });
        } else {
            quizContent.append(feedback);
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

            showQuiz();
            renderQuestion(data.quiz);

        } catch (error) {
            // If the quiz cannot load, keep the original book visible.
            showBook();
            console.warn("Hero quiz unavailable:", error);
        }
    }

    showBook();
    loadActiveQuiz();
})();
