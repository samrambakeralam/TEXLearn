/* =========================================================
   SAMRAMBA KERALAM 2030
   RC2.3 — DATA-DRIVEN CAROUSEL ENGINE
========================================================= */


/* =========================================================
   CAROUSEL DATA

   Images can later be replaced without changing
   the carousel engine.
========================================================= */

const FEATURED_BOOK_IDS = [
    "book-323",
    "book-250",
    "book-277",
    "book-150",
    "book-238"
];


const FEATURED_BOOK_CATEGORIES = {
    "book-323": "Entrepreneurship • Wealth",
    "book-250": "Marketing • Psychology",
    "book-277": "Purpose • Entrepreneurship",
    "book-150": "Startup • Business",
    "book-238": "Money • Mindset"
};


function getFeaturedCarouselData() {

    if (!Array.isArray(window.LIBRARY_BOOKS)) {
        return [];
    }

    return FEATURED_BOOK_IDS
        .map(function (bookId) {

            const book =
                window.LIBRARY_BOOKS.find(
                    function (item) {
                        return item.id === bookId;
                    }
                );

            if (!book) {
                return null;
            }

            return {
                id: book.id,
                type: "book",
                title: book.title,
                category: FEATURED_BOOK_CATEGORIES[book.id] || book.category,
                image: book.cover,
                badge: "FEATURED",
                buttonText: "Explore",
                link: "#learning-modules",
                active: true
            };

        })
        .filter(Boolean);

}


/* =========================================================
   FEATURED LEARNING MODULE DATA
========================================================= */

const FEATURED_MODULE_DATA = [

    {
        id: "book-039",
        bookId: "book-039",
        versionId: "book-039-v1",

        number: "MODULE 01",

        category: "Entrepreneurship",

        title: "500 Tips for Startup Folks",

        description:
            "A practical roadmap covering idea validation, product development, branding, sales, leadership, finance, and business growth.",

        pages: "7 Pages",

        readTime: "15–20 min read",

        badge: "FREE PREVIEW",

        buttonText: "Read Preview",

        link:
            "reader.html?bookId=book-039&versionId=book-039-v1&preview=1",

        active: true
    },


    {
        id: "book-379",
        bookId: "book-379",
        versionId: "book-379-v1",

        number: "MODULE 02",

        category: "Marketing Strategy",

        title: "Contagious",

        description:
            "Discover why certain ideas, products, and messages spread naturally, and learn practical principles to make your own ideas more memorable and shareable.",

        pages: "9 Pages",

        readTime: "20–25 min read",

        badge: "PREVIEW EDITION",

        buttonText: "Read Preview",

        link:
            "reader.html?bookId=book-379&versionId=book-379-v1&preview=1",

        active: true
    },


    {
        id: "book-086",
        bookId: "book-086",
        versionId: "book-086-v1",

        number: "MODULE 03",

        category: "Sales Mastery",

        title: "The Psychology of Selling",

        description:
            "Learn the mindset, communication techniques, and customer psychology behind successful selling, negotiation, and long-term relationship building.",

        pages: "7 Pages",

        readTime: "15–20 min read",

        badge: "PREVIEW EDITION",

        buttonText: "Read Preview",

        link:
            "reader.html?bookId=book-086&versionId=book-086-v1&preview=1",

        active: true
    }

];

/* =========================================================
   CAROUSEL INITIALISATION
========================================================= */

function initialiseCarousel() {

    const carousel =
        document.getElementById("rc2Carousel");


    if (!carousel) {

        console.warn(
            "RC2 Carousel container not found."
        );

        return;

    }


    const track =
        carousel.querySelector(
            ".rc2-carousel-track"
        );


    if (!track) {

        console.warn(
            "RC2 Carousel track not found."
        );

        return;

    }


    const items =
    getFeaturedCarouselData().filter(
        item => item.active
    );


    if (!items.length) {
        return;
    }


    /* =====================================================
       RENDER CARDS
    ===================================================== */

    renderCarousel(
        track,
        items
    );


    /* =====================================================
       DESKTOP / STANDARD CAROUSEL CONTROLS
    ===================================================== */

    const previousButton =
        document.getElementById(
            "rc2CarouselPrev"
        );


    const nextButton =
        document.getElementById(
            "rc2CarouselNext"
        );


    /* =====================================================
       SCROLL AMOUNT
    ===================================================== */

    function getScrollAmount() {

        const card =
            track.querySelector(
                ".rc2-carousel-card"
            );


        if (!card) {
            return 0;
        }


        const gap =
            parseFloat(
                getComputedStyle(track).gap
            ) || 0;


        return (
            card.offsetWidth +
            gap
        );

    }


    /* =====================================================
       PREVIOUS
    ===================================================== */

    if (previousButton) {

        previousButton.addEventListener(
            "click",
            () => {

                const scrollAmount =
                    getScrollAmount();


                if (!scrollAmount) {
                    return;
                }


                track.scrollBy({

                    left:
                        -scrollAmount,

                    behavior:
                        "smooth"

                });

            }
        );

    }


    /* =====================================================
       NEXT
    ===================================================== */

    if (nextButton) {

        nextButton.addEventListener(
            "click",
            () => {

                const scrollAmount =
                    getScrollAmount();


                if (!scrollAmount) {
                    return;
                }


                track.scrollBy({

                    left:
                        scrollAmount,

                    behavior:
                        "smooth"

                });

            }
        );

    }

}


function formatCarouselTitle(title) {

    return String(title || "")
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });

}


function formatCarouselCategory(category) {

    const raw = String(category || "")
        .trim();

    if (!raw) {
        return "";
    }

    const categories = raw
        .split(/[,•|]+/)
        .map(function (item) {
            return item
                .trim()
                .replace(/-/g, " ")
                .replace(/\s+/g, " ");
        })
        .filter(Boolean);

    const selected = categories
        .slice(0, 2)
        .map(function (item) {

            return item
                .toLowerCase()
                .replace(/\b\w/g, function (letter) {
                    return letter.toUpperCase();
                });

        });

    return selected.join(" • ");

}


/* =========================================================
   RENDER CAROUSEL
========================================================= */

function renderCarousel(
    track,
    items
) {

    track.innerHTML = "";


    items.forEach(
        (item, index) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "rc2-carousel-card";


            card.dataset.index =
                index;


            card.innerHTML = `

                <div class="rc2-carousel-image-wrap">

                    <img
                        src="${item.image}"
                        alt="${item.title}"
                        class="rc2-carousel-image"
                        loading="lazy"
                    >

                    <span class="rc2-carousel-badge">
                        ${item.badge}
                    </span>

                </div>


                <div class="rc2-carousel-content">

                    <h3>
                         ${formatCarouselTitle(item.title)}
                    </h3>

                    <p>
                         ${formatCarouselCategory(item.category)}
                    </p>

                    <a
                        href="${item.link}"
                        class="rc2-carousel-button"
                    >
                        ${item.buttonText}

                        <i data-lucide="arrow-right"></i>

                    </a>

                </div>

            `;


            track.appendChild(
                card
            );

        }
    );


    /* =====================================================
       RENDER LUCIDE ICONS
    ===================================================== */

    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }

}

/* =========================================================
   FEATURED MODULES — DYNAMIC RENDERER
========================================================= */

function renderFeaturedModules() {

    const track =
        document.getElementById(
            "featuredModulesTrack"
        );

    if (!track) {

        console.warn(
            "Featured Modules track not found."
        );

        return;

    }

    const items =
        FEATURED_MODULE_DATA.filter(
            item => item.active
        );

    track.innerHTML = "";

    items.forEach(
        (item, index) => {

            const card =
                document.createElement("article");

            card.className =
                "module-card";

            card.dataset.index =
                index;

            card.innerHTML = `

                <div class="module-cover">

                    <div class="module-cover-content">

                        <div class="module-cover-text">

                            <span class="module-number">
                                ${item.number}
                            </span>

                            <h4>
                                ${item.category}
                            </h4>

                        </div>

                        <span class="preview-badge">
                            ${item.badge}
                        </span>

                    </div>

                </div>


                <h3>
                    ${item.title}
                </h3>


                <p>
                    ${item.description}
                </p>


                <div class="module-footer">

                    <div class="module-meta">

                        <span>
                            📄 ${item.pages}
                        </span>

                        <span>
                            ⏱ ${item.readTime}
                        </span>

                    </div>


                    <a
                        href="${item.link}"
                        class="module-button"
                    >
                        📖 ${item.buttonText}
                    </a>

                </div>

            `;

            track.appendChild(card);

        }
    );

}


/* =========================================================
   VISION • MISSION • PROMISE
   MOBILE CAROUSEL + SCROLL REVEAL
========================================================= */

function initialiseMissionValuesCarousel() {

    const carousel = document.querySelector(".mission-values");

    if (!carousel) return;

    const cards = Array.from(
        carousel.querySelectorAll(".value-card")
    );

    if (cards.length !== 3) {
        console.warn(
            "Mission Values carousel requires exactly 3 cards."
        );
        return;
    }

    const mobileQuery = window.matchMedia("(max-width: 767px)");

    if (!mobileQuery.matches) return;

    /* Prevent duplicate initialization */
    if (carousel.dataset.carouselInitialised === "true") return;
    carousel.dataset.carouselInitialised = "true";

    /* Vision centre, Mission right, Promise left */
    let positions = ["center", "right", "left"];

    function updateCards() {
        cards.forEach((card, index) => {
            card.classList.remove(
                "mvc-left",
                "mvc-center",
                "mvc-right"
            );

            card.classList.add("mvc-" + positions[index]);

            /* Let the existing CSS control card positioning */
            card.style.removeProperty("transform");
            card.style.removeProperty("opacity");
            card.style.removeProperty("z-index");
            card.style.removeProperty("box-shadow");
        });
    }

    function rotateLeft() {
        positions = [
            positions[2],
            positions[0],
            positions[1]
        ];

        updateCards();
    }

    function rotateRight() {
        positions = [
            positions[1],
            positions[2],
            positions[0]
        ];

        updateCards();
    }

    /* Touch/swipe navigation */
    let startX = 0;
    let startY = 0;

    carousel.addEventListener("touchstart", event => {
        startX = event.changedTouches[0].clientX;
        startY = event.changedTouches[0].clientY;
    }, { passive: true });

    carousel.addEventListener("touchend", event => {
        const endX = event.changedTouches[0].clientX;
        const endY = event.changedTouches[0].clientY;

        const distanceX = endX - startX;
        const distanceY = endY - startY;

        /* Do not interfere with vertical page scrolling */
        if (Math.abs(distanceX) < 40) return;
        if (Math.abs(distanceX) < Math.abs(distanceY)) return;

        if (distanceX < 0) {
            rotateLeft();
        } else {
            rotateRight();
        }
    }, { passive: true });

    /* Reveal the carousel when it enters the viewport */
    if ("IntersectionObserver" in window) {

        carousel.classList.add("mvc-reveal-pending");

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    carousel.classList.add("mvc-reveal-visible");
                    carousel.classList.remove("mvc-reveal-pending");
                    observer.disconnect();
                }
            });
        }, {
            threshold: 0.15
        });

        observer.observe(carousel);

    } else {
        carousel.classList.add("mvc-reveal-visible");
    }

    /* Apply the initial card positions */
    updateCards();
}


/* =========================================================
   FEATURED MODULES — CAROUSEL CONTROLS
========================================================= */

function initialiseFeaturedModulesCarousel() {

    const track =
        document.getElementById(
            "featuredModulesTrack"
        );

    const previousButton =
        document.getElementById(
            "featuredModulesPrev"
        );

    const nextButton =
        document.getElementById(
            "featuredModulesNext"
        );


    if (
        !track ||
        !previousButton ||
        !nextButton
    ) {

        console.warn(
            "Featured Modules carousel controls not found."
        );

        return;

    }


    const getScrollAmount = () => {

        const card =
            track.querySelector(
                ".module-card"
            );

        if (!card) {
            return 0;
        }


        const gap =
            parseFloat(
                getComputedStyle(track).gap
            ) || 0;


        return card.offsetWidth + gap;

    };


    previousButton.addEventListener(
        "click",
        () => {

            track.scrollBy({

                left:
                    -getScrollAmount(),

                behavior:
                    "smooth"

            });

        }
    );


    nextButton.addEventListener(
        "click",
        () => {

            track.scrollBy({

                left:
                    getScrollAmount(),

                behavior:
                    "smooth"

            });

        }
    );

}

function initialiseFeaturedBookCarouselWhenReady() {

    if (
        Array.isArray(window.LIBRARY_BOOKS) &&
        window.LIBRARY_BOOKS.length
    ) {
        initialiseCarousel();
        return;
    }

    window.addEventListener(
        "samrambaLibraryCatalogueLoaded",
        initialiseCarousel,
        { once: true }
    );
}

/* =========================================================
   START CAROUSEL
========================================================= */

/* =========================================================
   START CAROUSELS
========================================================= */

function startAllCarousels() {

    initialiseFeaturedBookCarouselWhenReady();

    renderFeaturedModules();

    initialiseFeaturedModulesCarousel();

    initialiseMissionValuesCarousel();

}


/* ---------------------------------------------------------
   START WHEN DOM IS READY
--------------------------------------------------------- */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startAllCarousels
    );

} else {

    startAllCarousels();

}