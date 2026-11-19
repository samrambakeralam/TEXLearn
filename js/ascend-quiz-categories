/* ASCEND Quiz Arena: category and curated-collection registry.
   Quiz content can be added later without changing the category structure. */
(function () {
    "use strict";

    window.ASCEND_QUIZ_DATA = {
        tracks: [
            { id: "wealth", title: "Wealth", subtitle: "Build a wealthier perspective", icon: "💎", tone: "violet" },
            { id: "entrepreneurship", title: "Entrepreneurship", subtitle: "Turn ideas into action", icon: "🚀", tone: "blue" },
            { id: "sales", title: "Sales", subtitle: "Master the art of influence", icon: "🎯", tone: "orange" },
            { id: "investing", title: "Investing", subtitle: "Make informed money moves", icon: "📈", tone: "green" },
            { id: "marketing", title: "Marketing", subtitle: "Make ideas stand out", icon: "📣", tone: "pink" },
            { id: "business", title: "Business", subtitle: "Understand how business works", icon: "🏢", tone: "cyan" },
            { id: "motivation", title: "Motivation", subtitle: "Find the drive to begin", icon: "🔥", tone: "orange" },
            { id: "self-help", title: "Self-Help", subtitle: "Keep becoming your best self", icon: "🌱", tone: "green" },
            { id: "psychology", title: "Psychology", subtitle: "Understand people and behaviour", icon: "🧠", tone: "violet" },
            { id: "discipline", title: "Discipline", subtitle: "Build habits that move you forward", icon: "⚡", tone: "blue" },
            { id: "health", title: "Health", subtitle: "Build a healthier life", icon: "💚", tone: "green" },
            { id: "wisdom", title: "Wisdom", subtitle: "Learn to think beyond the obvious", icon: "✨", tone: "pink" }
        ],
        collections: [
            { id: "dream-big", title: "Dream Big, Start Small", description: "Turn ambition into your first meaningful step.", icon: "🌄", tracks: ["entrepreneurship", "motivation", "discipline"], tone: "blue" },
            { id: "future-founder", title: "The Future Founder", description: "Think creatively, solve problems and build value.", icon: "🚀", tracks: ["entrepreneurship", "business", "marketing", "sales"], tone: "violet" },
            { id: "know-yourself", title: "Know Yourself", description: "Discover how you think, decide and grow.", icon: "🪞", tracks: ["psychology", "self-help", "wisdom"], tone: "pink" },
            { id: "beat-the-odds", title: "Beat the Odds", description: "Build resilience when the road gets difficult.", icon: "⛰️", tracks: ["discipline", "motivation", "health"], tone: "orange" },
            { id: "money-moves", title: "Money Moves", description: "Build confidence in the choices you make with money.", icon: "💸", tracks: ["wealth", "investing", "business"], tone: "green" }
        ]
    };

    function render() {
        const data = window.ASCEND_QUIZ_DATA;
        const trackHost = document.getElementById("quizCategoryGrid");
        const collectionHost = document.getElementById("quizCollectionGrid");
        if (!trackHost || !collectionHost) return;

        trackHost.innerHTML = data.tracks.map((track, index) => `
            <article class="quiz-category-card tone-${track.tone}" data-track="${track.id}">
                <div class="quiz-card-top"><span class="quiz-card-icon">${track.icon}</span><span class="quiz-card-number">${String(index + 1).padStart(2, "0")}</span></div>
                <h4>${track.title}</h4>
                <p>${track.subtitle}</p>
                <span class="quiz-card-status">QUIZZES COMING SOON</span>
            </article>
        `).join("");

        collectionHost.innerHTML = data.collections.map(collection => `
            <article class="quiz-collection-card tone-${collection.tone}">
                <span class="collection-icon">${collection.icon}</span>
                <div><h4>${collection.title}</h4><p>${collection.description}</p></div>
                <span class="collection-arrow">↗</span>
            </article>
        `).join("");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", render, { once: true });
    } else {
        render();
    }
})();