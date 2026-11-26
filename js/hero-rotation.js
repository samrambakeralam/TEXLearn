
/* =====================================================
   TEXLEARN — HERO CAMPAIGN CAROUSEL

   Desktop: Multiple horizontal campaign cards
   Tablet/Phone: One campaign banner at a time
   Android: Same sequence and timing

   Rotation interval: 7 seconds
===================================================== */

(() => {
    "use strict";

    const HERO_CAMPAIGN_API =
        "https://script.google.com/macros/s/AKfycbxpv1gaF3-kNWsB6Zn5weUkaSPp92m1Yln3xkQ4f_wcKa7JahoaUyKid2BkkuvoEi_X/exec";

    const POSTER_DURATION = 5000;

    const campaignBox =
        document.getElementById("tkHeroCampaign");

    const viewport =
        campaignBox?.querySelector(".tk-hero-viewport");

    const track =
        document.getElementById("tkHeroTrack");

    if (!campaignBox || !viewport || !track) {
        console.warn(
            "TEXLearn hero: Required carousel elements not found."
        );
        return;
    }

    let campaignImages = [];
    let currentIndex = 0;
    let rotationTimer = null;
    let resizeTimer = null;

    let isTransitioning = false;

    /* -----------------------------------------
       LOAD CAMPAIGN POSTERS
    ----------------------------------------- */

    async function loadHeroCampaign() {
        try {
            const response = await fetch(
                HERO_CAMPAIGN_API,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Campaign service unavailable."
                );
            }

            const data = await response.json();

            if (
                !data.success ||
                !Array.isArray(data.posters)
            ) {
                throw new Error(
                    "Invalid hero campaign response."
                );
            }

            campaignImages = data.posters
                .filter(item => {
                    if (!item.posterId || !item.imageUrl) {
                        return false;
                    }

                    try {
                        const parsed = new URL(
                            item.imageUrl,
                            document.baseURI
                        );

                        return (
                            parsed.protocol === "https:" ||
                            parsed.protocol === "http:"
                        );
                    } catch (error) {
                        return false;
                    }
                })
                .sort((a, b) => (
                    Number(a.displayOrder || 999) -
                    Number(b.displayOrder || 999) ||
                    Number(a.posterOrder || 999) -
                    Number(b.posterOrder || 999)
                ));

        } catch (error) {
            campaignImages = [];

            console.warn(
                "Hero campaign unavailable:",
                error
            );
        }
    }

    /* -----------------------------------------
       VERIFY CAMPAIGN IMAGE
    ----------------------------------------- */

    async function isCampaignImageUsable(item) {
        const testImage = new Image();

        try {
            testImage.src = new URL(
                item.imageUrl,
                document.baseURI
            ).href;

            if (testImage.decode) {
                await testImage.decode();
            } else {
                await new Promise((resolve, reject) => {
                    testImage.onload = resolve;
                    testImage.onerror = reject;
                });
            }

            return testImage.naturalWidth > 0;

        } catch (error) {
            return false;
        }
    }

    /* -----------------------------------------
       CREATE CAMPAIGN CARD
    ----------------------------------------- */

    function createCampaignCard(item, isClone = false) {
        const link = document.createElement("a");

        link.className = "tk-hero-card";

        link.target = "_blank";
        link.rel = "noopener noreferrer";

        if (item.imageLink) {
            link.href = item.imageLink;
        } else {
            link.removeAttribute("href");
            link.style.pointerEvents = "none";
        }

        if (isClone) {
            link.setAttribute("aria-hidden", "true");
            link.setAttribute("tabindex", "-1");
        }

        const image = document.createElement("img");

        image.src = new URL(
            item.imageUrl,
            document.baseURI
        ).href;

        image.alt = item.imageAlt || "";
        image.draggable = false;
        image.loading = "eager";

        link.appendChild(image);

        return link;
    }

    /* -----------------------------------------
       BUILD CAROUSEL TRACK
    ----------------------------------------- */

    function buildHeroCarousel() {
        track.innerHTML = "";

        campaignImages.forEach(item => {
            track.appendChild(
                createCampaignCard(item)
            );
        });

        /*
         * Duplicate the first two cards.
         * These provide a seamless loop on desktop
         * and mobile.
         */

        campaignImages.slice(0, 2).forEach(item => {
            track.appendChild(
                createCampaignCard(item, true)
            );
        });

        currentIndex = 0;

        track.style.transition = "none";
        track.style.transform = "translate3d(0, 0, 0)";

        campaignBox.hidden = false;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                track.style.transition = "";
            });
        });
    }

    /* -----------------------------------------
       CALCULATE CARD MOVEMENT
    ----------------------------------------- */

    function getCardStep() {
        const firstCard =
            track.querySelector(".tk-hero-card");

        if (!firstCard) {
            return 0;
        }

        const cardWidth =
            firstCard.getBoundingClientRect().width;

        const trackStyle =
            window.getComputedStyle(track);

        const gap =
            parseFloat(trackStyle.columnGap) ||
            parseFloat(trackStyle.gap) ||
            0;

        return cardWidth + gap;
    }

    /* -----------------------------------------
       MOVE CAROUSEL
    ----------------------------------------- */

    function moveHeroCarousel() {
        if (isTransitioning || campaignImages.length <= 1) {
            return;
        }

        isTransitioning = true;

        currentIndex++;

        const distance =
            getCardStep() * currentIndex;

        track.style.transform =
            `translate3d(-${distance}px, 0, 0)`;
    }

    /* -----------------------------------------
       HANDLE SEAMLESS LOOP
    ----------------------------------------- */

    track.addEventListener(
        "transitionend",
        event => {
            if (event.target !== track) {
                return;
            }

            if (currentIndex >= campaignImages.length) {
                track.style.transition = "none";

                currentIndex = 0;

                track.style.transform =
                    "translate3d(0, 0, 0)";

                track.offsetHeight;

                track.style.transition = "";
            }

            isTransitioning = false;
        }
    );

    /* -----------------------------------------
       START AUTOMATIC ROTATION
    ----------------------------------------- */

    function startRotation() {
        clearInterval(rotationTimer);

        if (campaignImages.length <= 1) {
            return;
        }

        rotationTimer = setInterval(
            moveHeroCarousel,
            POSTER_DURATION
        );
    }

    /* -----------------------------------------
       HANDLE RESIZE
    ----------------------------------------- */

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
            track.style.transition = "none";

            const distance =
                getCardStep() * currentIndex;

            track.style.transform =
                `translate3d(-${distance}px, 0, 0)`;

            track.offsetHeight;

            track.style.transition = "";
        }, 150);
    });

    /* -----------------------------------------
       INITIALISE HERO
    ----------------------------------------- */

    async function initialiseHero() {
        await loadHeroCampaign();

        if (!campaignImages.length) {
            campaignBox.hidden = true;

            console.warn(
                "TEXLearn hero: No active campaign images."
            );

            return;
        }

        const verifiedImages = [];

        for (const item of campaignImages) {
            if (await isCampaignImageUsable(item)) {
                verifiedImages.push(item);
            } else {
                console.warn(
                    "Hero campaign image failed to load:",
                    item.imageUrl
                );
            }
        }

        campaignImages = verifiedImages;

        if (!campaignImages.length) {
            campaignBox.hidden = true;
            return;
        }

        buildHeroCarousel();
        startRotation();
    }

    initialiseHero();

})();
