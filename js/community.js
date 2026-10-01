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

    caption:
        community.caption,

    description:
        community.description,

    image:
        "https://samrambakeralam.github.io/TEXLearn/assets/community/" +
        community.image,

    active:
        String(
            community.status || ""
        )
        .trim()
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
   COMMUNITY GRID ENGINE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const grid =
            document.getElementById(
                "rc2CommunityGrid"
            );


        const emptyState =
            document.getElementById(
                "rc2CommunityEmpty"
            );


        const filters =
            document.querySelectorAll(
                ".rc2-community-filter"
            );


        if (!grid) {
            return;
        }


        /*
         * Start with the first available
         * filter button.
         *
         * Current filters:
         * COMMUNITY
         * INSTITUTIONS
         * EVENTS
         */

        let currentFilter =
            filters.length
                ? filters[0].dataset.communityFilter
                : "COMMUNITY";


        /* =========================================
           GET FILTERED ITEMS
        ========================================== */

        function getFilteredItems() {

            return COMMUNITY_DATA.filter(
                function (item) {

                    if (!item.active) {
                        return false;
                    }


                    return (
                        item.type ===
                        currentFilter
                    );

                }
            );

        }


        /* =========================================
           RENDER COMMUNITY GRID
        ========================================== */

        function renderCommunity() {

            const items =
                getFilteredItems();


            grid.innerHTML = "";


            if (!items.length) {

                if (emptyState) {

                    emptyState.hidden =
                        false;

                }

                return;

            }


            if (emptyState) {

                emptyState.hidden =
                    true;

            }


            /*
             * Render EVERY matching item.
             *
             * CSS controls the layout:
             * 2 cards per row on mobile.
             */

            items.forEach(
                function (item) {

                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "rc2-community-card";


                    card.innerHTML = `

                        <div class="rc2-community-image-wrap">

                            <img
                                src="${item.image}"
                                alt="${item.title || item.id}"
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
                                ${item.title || ""}
                            </h3>

                            <p>
                                ${item.caption || ""}
                            </p>

                        </div>

                    `;


                    grid.appendChild(card);

                }
            );


            if (
                typeof lucide !==
                "undefined"
            ) {

                lucide.createIcons();

            }

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
           INITIAL FILTER STATE
        ========================================== */

        if (filters.length) {

            filters.forEach(
                function (button) {

                    button.classList.remove(
                        "active"
                    );

                }
            );


            filters[0].classList.add(
                "active"
            );

        }


        /* =========================================
           INITIAL LOAD
        ========================================== */

        loadCommunityCatalogue()
            .then(
                function () {

                    renderCommunity();

                }
            );

    }
);