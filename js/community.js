/* =========================================
   TEXLEARN COMMUNITY DATA
   Loaded from COMMUNITY_CATALOGUE API
========================================= */

let COMMUNITY_DATA = [];


/* =========================================
   COMMUNITY CATALOGUE API
========================================= */

const COMMUNITY_API_URL =
    "https://script.google.com/macros/s/AKfycbzQFLeWMQAX7gbedsu859N8nEZnGoAFinj4dn1JgpX0La7GSy-2xGHK38MdjcHM2ckk/exec";


async function loadCommunityCatalogue() {

    try {

        const response =
            await fetch(
                COMMUNITY_API_URL +
                "?action=communitycatalogue"
            );


        if (!response.ok) {

            throw new Error(
                "Community API request failed."
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success !== true ||
            !Array.isArray(data.communities)
        ) {

            throw new Error(
                "Invalid Community Catalogue response."
            );

        }


        COMMUNITY_DATA =
            data.communities.map(
                function (community) {

                    return {

                        id:
                            community.id,

                        type:
                            community.type,

                        title:
                            community.caption,

                        caption:
                            community.description,

                        image:
                            "assets/community/" +
                            community.image,

                        badge:
                            community.type,

                        active:
                            community.status
                                .toLowerCase() ===
                            "active"

                    };

                }
            );


        return true;

    }
    catch (error) {

        console.error(
            "COMMUNITY CATALOGUE ERROR:",
            error
        );

        COMMUNITY_DATA = [];

        return false;

    }

}

/* =========================================
   COMMUNITY CAROUSEL ENGINE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const grid =
            document.getElementById("rc2CommunityGrid");

        const emptyState =
            document.getElementById("rc2CommunityEmpty");

        const filters =
            document.querySelectorAll(
                ".rc2-community-filter"
            );


        if (!grid) {
            return;
        }


        let currentFilter = "all";

        let currentIndex = 0;


        /* =========================================
           GET FILTERED ITEMS
        ========================================== */

        function getFilteredItems() {

            return COMMUNITY_DATA.filter(
                function (item) {

                    if (!item.active) {
                        return false;
                    }

                    if (currentFilter === "all") {
                        return true;
                    }

                    return item.type === currentFilter;

                }
            );

        }


        /* =========================================
           RENDER
        ========================================== */

        function renderCommunity() {

            const items =
                getFilteredItems();


            grid.innerHTML = "";


            if (!items.length) {

                if (emptyState) {
                    emptyState.hidden = false;
                }

                return;
            }


            if (emptyState) {
                emptyState.hidden = true;
            }


            /* Keep index valid after filtering */

            if (currentIndex >= items.length) {
                currentIndex = 0;
            }


            items.forEach(
                function (item, index) {

                    const card =
                        document.createElement("article");


                    card.className =
                        "rc2-community-card";


                    /*
                        Only the active card is visible.
                    */

                    if (index !== currentIndex) {

                        card.classList.add(
                            "rc2-community-card-hidden"
                        );

                    }


                    card.innerHTML = `

                        <div class="rc2-community-image-wrap">

                            <img
                                src="${item.image}"
                                alt="${item.title}"
                                class="rc2-community-image"
                                loading="lazy"
                            >

                            <span
                                class="rc2-community-card-badge"
                            >
                                ${item.badge}
                            </span>

                        </div>


                        <div class="rc2-community-card-content">

                            <h3>
                                ${item.title}
                            </h3>

                            <p>
                                ${item.caption}
                            </p>

                        </div>

                    `;


                    grid.appendChild(card);

                }
            );


            if (
                typeof lucide !== "undefined"
            ) {

                lucide.createIcons();

            }

            updateArrowVisibility();

        }


        /* =========================================
           SHOW NEXT
        ========================================== */

        function showNext() {

            const items =
                getFilteredItems();


            if (items.length <= 1) {
                return;
            }


            currentIndex++;

            if (currentIndex >= items.length) {
                currentIndex = 0;
            }


            renderCommunity();

        }


        /* =========================================
           SHOW PREVIOUS
        ========================================== */

        function showPrevious() {

            const items =
                getFilteredItems();


            if (items.length <= 1) {
                return;
            }


            currentIndex--;

            if (currentIndex < 0) {
                currentIndex = items.length - 1;
            }


            renderCommunity();

        }


        /* =========================================
           FILTERS
        ========================================== */

        filters.forEach(
            function (filterButton) {

                filterButton.addEventListener(
                    "click",
                    function () {

                        currentFilter =
                            this.dataset.communityFilter;


                        currentIndex = 0;


                        filters.forEach(
                            function (button) {

                                button.classList.remove(
                                    "active"
                                );

                            }
                        );


                        this.classList.add(
                            "active"
                        );


                        renderCommunity();

                    }
                );

            }
        );


        /* =========================================
   ARROWS
========================================= */

const previousButton =
    document.getElementById(
        "rc2CommunityPrev"
    );


const nextButton =
    document.getElementById(
        "rc2CommunityNext"
    );


/* =========================================
   UPDATE ARROW VISIBILITY
========================================= */

function updateArrowVisibility() {

    const items =
        getFilteredItems();


    const showArrows =
        items.length > 1;


    if (previousButton) {

        previousButton.style.display =
            showArrows ? "flex" : "none";

    }


    if (nextButton) {

        nextButton.style.display =
            showArrows ? "flex" : "none";

    }

}


/* =========================================
   ARROW EVENTS
========================================= */

if (previousButton) {

    previousButton.addEventListener(
        "click",
        showPrevious
    );

}


if (nextButton) {

    nextButton.addEventListener(
        "click",
        showNext
    );

}


        /* =========================================
           MOBILE SWIPE
        ========================================== */

        let touchStartX = 0;

        let touchEndX = 0;


        grid.addEventListener(
            "touchstart",
            function (event) {

                touchStartX =
                    event.changedTouches[0].screenX;

            },
            {
                passive: true
            }
        );


        grid.addEventListener(
            "touchend",
            function (event) {

                touchEndX =
                    event.changedTouches[0].screenX;


                const distance =
                    touchEndX - touchStartX;


                const minimumSwipe =
                    50;


                if (
                    Math.abs(distance) <
                    minimumSwipe
                ) {

                    return;

                }


                if (distance < 0) {

                    showNext();

                } else {

                    showPrevious();

                }

            },
            {
                passive: true
            }
        );


        /* =========================================
   INITIAL LOAD
========================================= */

loadCommunityCatalogue()
    .then(
        function () {

            renderCommunity();

        }
    );