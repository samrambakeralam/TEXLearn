/* =========================================================
   SAMRAMBA KERALAM 2030
   RC2.3 — DATA-DRIVEN CAROUSEL ENGINE
========================================================= */



/* =========================================================
   FEATURED MODULES — GOOGLE SHEET DATA SOURCE
========================================================= */

const FEATURED_MODULES_API_URL =
    "https://script.google.com/macros/s/" +
    "AKfycbzQFLeWMQAX7gbedsu859N8nEZnGoAFinj4dn1JgpX0La7GSy-2xGHK38MdjcHM2ckk/" +
    "exec";


function loadFeaturedModules() {

    return new Promise(function(resolve, reject) {

        const callbackName =
            "texlearnFeaturedModulesCallback_" +
            Date.now() +
            "_" +
            Math.floor(Math.random() * 100000);

        const script = document.createElement("script");

        const requestURL =
            FEATURED_MODULES_API_URL +
            "?action=featuredmodules" +
            "&callback=" +
            encodeURIComponent(callbackName);

        window[callbackName] = function(response) {

            delete window[callbackName];
            script.remove();

            if (
                !response ||
                response.success !== true ||
                !Array.isArray(response.modules)
            ) {
                reject(
                    new Error("Featured modules response is invalid.")
                );
                return;
            }

            resolve(response.modules);
        };

        script.onerror = function() {

            delete window[callbackName];
            script.remove();

            reject(
                new Error("Unable to load featured modules.")
            );
        };

        script.src = requestURL;

        document.head.appendChild(script);

    });
}


/* =========================================================
   BUILD FEATURED CAROUSEL DATA
========================================================= */

function getFeaturedCarouselData(featuredModules) {

    if (!Array.isArray(window.LIBRARY_BOOKS)) {
        return [];
    }

    return featuredModules
        .slice()
        .sort(function(a, b) {
            return a.displayOrder - b.displayOrder;
        })
        .map(function(module) {

            const book = window.LIBRARY_BOOKS.find(
                function(item) {
                    return item.id === module.bookID;
                }
            );

            if (!book) {
                console.warn(
                    "Featured book missing from catalogue:",
                    module.bookID
                );
                return null;
            }

            return {
                id: book.id,
                type: "book",
                title: book.title,
                category: book.category,
                image: book.cover,
                badge: "FREE PREVIEW",
                buttonText: "Read Preview",
                link:
                    "reader.html?bookId=" +
                    encodeURIComponent(module.bookID) +
                    "&versionId=" +
                    encodeURIComponent(module.versionID) +
                    "&preview=1",
                active: true
            };

        })
        .filter(Boolean);
}


/* =========================================================
   CAROUSEL INITIALISATION
========================================================= */

function initialiseCarouselControls() {

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


async function initialiseFeaturedBookCarouselWhenReady() {

    try {

        // Wait until the live library catalogue is available.
        if (
            !Array.isArray(window.LIBRARY_BOOKS) ||
            !window.LIBRARY_BOOKS.length
        ) {

            await new Promise(function(resolve) {

                window.addEventListener(
                    "samrambaLibraryCatalogueLoaded",
                    resolve,
                    { once: true }
                );

            });

        }

        // Load active featured modules from Google Sheets.
        const featuredModules = await loadFeaturedModules();

        const items =
            getFeaturedCarouselData(featuredModules)
                .filter(function(item) {
                    return item.active;
                });

        const carousel =
            document.getElementById("rc2Carousel");

        const track = carousel
            ? carousel.querySelector(".rc2-carousel-track")
            : null;

        if (!track || !items.length) {
            console.warn("No featured carousel items available.");
            return;
        }

        renderCarousel(track, items);

        initialiseCarouselControls();

    } catch (error) {

        console.error(
            "Featured carousel initialization failed:",
            error
        );

    }
}


/* =========================================================
   START CAROUSEL
========================================================= */

/* =========================================================
   START CAROUSELS
========================================================= */

function startAllCarousels() {

    initialiseFeaturedBookCarouselWhenReady();

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