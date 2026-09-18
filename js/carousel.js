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
                category: book.category,
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
        id: "startup-fundamentals",

        number: "MODULE 01",

        category: "Entrepreneurship",

        title: "Startup Fundamentals",

        description:
            "Build a strong foundation in entrepreneurship by learning idea validation, product development, branding, sales, finance, and business growth.",

        pages: "7 Pages",

        readTime: "15–20 min read",

        badge: "FREE PREVIEW",

        buttonText: "Read Preview",

        link: "#",

        active: true
    },


    {
        id: "viral-marketing",

        number: "MODULE 02",

        category: "Marketing Strategy",

        title: "Viral Marketing",

        description:
            "Learn why ideas, products, and messages spread naturally, and discover practical principles for creating memorable and shareable marketing.",

        pages: "9 Pages",

        readTime: "20–25 min read",

        badge: "PREVIEW EDITION",

        buttonText: "Read Preview",

        link: "#",

        active: true
    },


    {
        id: "psychology-selling",

        number: "MODULE 03",

        category: "Sales Mastery",

        title: "Psychology of Selling",

        description:
            "Understand customer behaviour, communication, negotiation, and relationship building to become more confident in real-world selling situations.",

        pages: "7 Pages",

        readTime: "15–20 min read",

        badge: "PREVIEW EDITION",

        buttonText: "Read Preview",

        link: "#",

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
                        ${item.title}
                    </h3>

                    <p>
                        ${item.category}
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
   VISION • MISSION • PROMISE — MOBILE COVER FLOW
========================================================= */

function initialiseMissionValuesCarousel() {

    const carousel =
        document.querySelector(".mission-values");

        /* Prevent native horizontal scrolling */

        carousel.scrollLeft = 0;

    if (!carousel) {

        console.warn(
            "Mission Values carousel not found."
        );

        return;

    }

    const cards =
        Array.from(
            carousel.querySelectorAll(".value-card")
        );

    if (cards.length !== 3) {

        console.warn(
            "Mission Values carousel requires exactly 3 cards."
        );

        return;

    }


    /* -----------------------------------------------------
       MOBILE CHECK
    ----------------------------------------------------- */

    const isMobile =
        window.matchMedia(
            "(max-width: 768px)"
        ).matches;

    if (!isMobile) {

        return;

    }


    /* -----------------------------------------------------
       CARD POSITIONS
       
       left   = Promise
       center = Vision
       right  = Mission
    ----------------------------------------------------- */

    let positions = [
        "center",
        "right",
        "left"
    ];


    /* -----------------------------------------------------
       APPLY POSITIONS
    ----------------------------------------------------- */

    function updateCards() {

    carousel.scrollLeft = 0;

    cards.forEach(
        (card, index) => {

            const position =
                positions[index];

            card.classList.remove(
                "mvc-left",
                "mvc-center",
                "mvc-right"
            );

            card.classList.add(
                "mvc-" + position
            );


            /* ------------------------------------------
               APPLY POSITION DIRECTLY
            ------------------------------------------ */

            if (position === "left") {

                // LEFT
                card.style.transform =
                "translateX(-78%) scale(.92) rotateY(8deg)";

                card.style.opacity =
                    ".65";

                card.style.zIndex =
                    "1";

            }


            else if (position === "center") {

                card.style.transform =
                "translateX(-50%) scale(1.05) rotateY(0deg)";

                card.style.opacity =
                    "1";

                card.style.zIndex =
                    "3";

                card.style.boxShadow =
                    "0 20px 50px rgba(15,23,42,.14)";

            }


            else if (position === "right") {

                // RIGHT
                card.style.transform =
                "translateX(-22%) scale(.92) rotateY(-8deg)";

                card.style.opacity =
                    ".65";

                card.style.zIndex =
                    "1";

            }

        }
    );

}


    /* -----------------------------------------------------
   ROTATE LEFT
----------------------------------------------------- */

function rotateLeft() {

    positions = [
        positions[2],
        positions[0],
        positions[1]
    ];

    updateCards();

}


/* -----------------------------------------------------
   ROTATE RIGHT
----------------------------------------------------- */

function rotateRight() {

    positions = [
        positions[1],
        positions[2],
        positions[0]
    ];

    updateCards();

}


    /* -----------------------------------------------------
       TOUCH / SWIPE
    ----------------------------------------------------- */

    let startX = 0;
    let endX = 0;


    carousel.addEventListener(
        "touchstart",
        event => {

            startX =
                event.touches[0].clientX;

        },
        { passive:true }
    );


    carousel.addEventListener(
        "touchend",
        event => {

            endX =
                event.changedTouches[0].clientX;

            const distance =
                endX - startX;


            if (Math.abs(distance) < 35) {

                return;

            }


            if (distance < 0) {

                rotateLeft();

            } else {

                rotateRight();

            }

        },
        { passive:true }
    );


    /* -----------------------------------------------------
       INITIAL STATE
    ----------------------------------------------------- */

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