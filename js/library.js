/* =========================================================
   SAMRAMBA KERALAM 2030
   YOUR ENTREPRENEURIAL LIBRARY
   LIBRARY-ONLY JAVASCRIPT
   ---------------------------------------------------------
   Responsibilities in this first version:
   - Mobile sidebar open / close animation
   - Dynamic promotional banner
   - 12 learning categories
   - Data-driven book rendering
   - Search foundation
   - Locked book preview modal
   - DND mode toggle
   - Basic navigation state
   - Continue-reading placeholder handling

   IMPORTANT:
   This file intentionally does NOT contain real book catalogue
   content yet. Add the real catalogue to LIBRARY_BOOKS when
   the content structure is finalized.
========================================================= */

(function () {
    "use strict";

    const LIBRARY_API_URL =
        "https://script.google.com/macros/s/" +
        "AKfycbzQFLeWMQAX7gbedsu859N8nEZnGoAFinj4dn1JgpX0La7GSy-2xGHK38MdjcHM2ckk/" +
        "exec";


    /* =========================================================
       01. LIBRARY DATA
    ========================================================= */

    /*
     * Final agreed 12-category taxonomy.
     *
     * Keep this list as the single source for the Library
     * category navigation.
     */
    const LIBRARY_CATEGORIES = [
        {
            id: "entrepreneurship",
            name: "Entrepreneurship",
            icon: "rocket"
        },
        {
            id: "sales",
            name: "Sales",
            icon: "handshake"
        },
        {
            id: "investing",
            name: "Investing",
            icon: "trending-up"
        },
        {
            id: "marketing",
            name: "Marketing",
            icon: "megaphone"
        },
        {
            id: "business",
            name: "Business",
            icon: "briefcase-business"
        },
        {
            id: "money",
            name: "Money",
            icon: "wallet"
        },
        {
            id: "mindset-motivation",
            name: "Mindset & Motivation",
            icon: "brain"
        },
        {
            id: "self-help",
            name: "Self-Help",
            icon: "heart-handshake"
        },
        {
            id: "psychology",
            name: "Psychology",
            icon: "brain-circuit"
        },
        {
            id: "discipline",
            name: "Discipline",
            icon: "target"
        },
        {
            id: "health",
            name: "Health",
            icon: "heart-pulse"
        },
        {
            id: "wisdom",
            name: "Wisdom",
            icon: "lightbulb"
        }
    ];


    /*
     * Promotional banner data.
     *
     * The first banner is the Library welcome message.
     * Other SAMRAMBA KERALAM services can be promoted here.
     *
     * Replace the href values later with the real destination
     * pages when those pages are ready.
     */
    const LIBRARY_BANNERS = [
        {
            id: "library",
            eyebrow: "YOUR ENTREPRENEURIAL LIBRARY",
            title: "Discover what you want to learn",
            text:
                "Explore 500+ books across " +
                "Business • Wealth • Marketing • Psychology • ...",
            action: "Explore Library",
            href: "#explore-library"
        },
        {
            id: "virtual-office",
            eyebrow: "SAMRAMBA KERALAM SERVICES",
            title: "Need a Professional Business Address?",
            text:
                "Explore Virtual Office solutions designed for " +
                "emerging entrepreneurs.",
            action: "Explore Virtual Office",
            href: "#virtual-office"
        },
        {
            id: "sponsored-opportunities",
            eyebrow: "SPONSORED OPPORTUNITIES",
            title: "Put Your Business in Front of Future Entrepreneurs",
            text:
                "Explore opportunities to showcase your business " +
                "across the SAMRAMBA KERALAM ecosystem.",
            action: "Explore Opportunities",
            href: "#sponsored-opportunities"
        },
        {
            id: "workspace",
            eyebrow: "WORKSPACE",
            title: "Need a Place to Build Your Business?",
            text:
                "Discover workspace and coworking opportunities " +
                "for entrepreneurs and emerging teams.",
            action: "Explore Workspace",
            href: "#workspace"
        }
    ];


    /*
     * REAL BOOK CATALOGUE — PLACEHOLDER
     * ---------------------------------------------------------
     * The catalogue will be populated after the content model
     * is finalized.
     *
     * Expected structure:
     *
     * {
     *     id: "book-001",
     *     title: "Book Title",
     *     author: "Author Name",
     *     category: "business",
     *     cover: "assets/library/books/book-001.webp",
     *     pages: 9,
     *     popularity: 98,
     *     releaseDate: "2026-09-01",
     *     isNew: true,
     *     isLocked: true,
     *     versions: [
     *         {
     *             id: "standard",
     *             label: "Condensed Edition",
     *             pageCount: 9,
     *             contentRef: "..."
     *         }
     *     ]
     * }
     *
     * Do not duplicate this catalogue inside user records.
     */
    const LIBRARY_BOOKS = Array.isArray(window.LIBRARY_BOOKS)
        ? window.LIBRARY_BOOKS
        : [];


    /*
     * Optional user state hook.
     *
     * This is intentionally local for the prototype.
     * Later it can be replaced by authenticated user data.
     */
const LIBRARY_STATE = {
    currentBanner: 0,
    bannerTimer: null,
    searchTerm: "",
    selectedCategory: null,
    dndMode: false,
    viewAllSection: null,
    personalView: null,
    personalNotesView: false
};

const FAVOURITES_STORAGE_KEY =
    "samramba_library_favourites";

const BOOKMARKS_STORAGE_KEY =
    "samramba_library_bookmarks";

    const NOTES_STORAGE_KEY =
    "samramba_library_notes";

const HIGHLIGHTS_STORAGE_KEY =
    "samramba_library_highlights";

    function getSavedBookIds(storageKey) {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    storageKey
                ) || "[]"
            );

        return new Set(
            Array.isArray(saved)
                ? saved
                : []
        );

    } catch (error) {

        return new Set();

    }

}


function saveBookIds(
    storageKey,
    ids
) {

    try {

        localStorage.setItem(
            storageKey,
            JSON.stringify(
                Array.from(ids)
            )
        );

    } catch (error) {

        console.warn(
            "Unable to save Library state.",
            error
        );

    }

}


function toggleSavedBook(
    storageKey,
    bookId
) {

    const ids =
        getSavedBookIds(
            storageKey
        );

    if (ids.has(bookId)) {
        ids.delete(bookId);
    } else {
        ids.add(bookId);
    }

    saveBookIds(
        storageKey,
        ids
    );

    return ids.has(bookId);

}


function isBookSaved(
    storageKey,
    bookId
) {

    return getSavedBookIds(
        storageKey
    ).has(bookId);

}

function getStoredLibraryData(
    storageKey
) {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    storageKey
                ) || "[]"
            );

        return Array.isArray(saved)
            ? saved
            : [];

    } catch (error) {

        return [];

    }

}


function saveStoredLibraryData(
    storageKey,
    data
) {

    try {

        localStorage.setItem(
            storageKey,
            JSON.stringify(data)
        );

    } catch (error) {

        console.warn(
            "Unable to save Library data.",
            error
        );

    }

}


    /* =========================================================
       02. DOM REFERENCES
    ========================================================= */

    const app =
        document.getElementById("libraryApp");

    if (!app) {
        return;
    }

    const sidebar =
        document.getElementById("librarySidebar");

    const sidebarBackdrop =
        document.getElementById("librarySidebarBackdrop");

    const menuButton =
        document.getElementById("libraryMenuButton");

    const sidebarClose =
        document.getElementById("librarySidebarClose");

    const searchInput =
        document.getElementById("librarySearchInput");

    const categoryTrack =
        document.getElementById("libraryCategoryTrack");

    const popularGrid =
        document.getElementById("popularBooksGrid");

    const newGrid =
        document.getElementById("newReleasesGrid");

    const recommendedGrid =
        document.getElementById("recommendedBooksGrid");

    const exploreLibraryGrid =
        document.getElementById("exploreLibraryGrid");

    const libraryHome =
    document.getElementById(
        "libraryHome"
    );

const exploreLibrarySection =
    document.getElementById(
        "explore-library"
    );

const libraryPersonalView =
    document.getElementById(
        "libraryPersonalView"
    );

const libraryPersonalGrid =
    document.getElementById(
        "libraryPersonalGrid"
    );

const libraryPersonalTitle =
    document.getElementById(
        "libraryPersonalTitle"
    );

const libraryPersonalCount =
    document.getElementById(
        "libraryPersonalCount"
    ); 
    
    const libraryNotesView =
    document.getElementById(
        "libraryNotesView"
    );

const libraryNotesGrid =
    document.getElementById(
        "libraryNotesGrid"
    );

    const continueSection =
        document.querySelector(".library-continue-section");

    const continueGrid =
        document.getElementById("continueReadingGrid");

    const banner =
        document.getElementById("libraryBanner");

    const bannerEyebrow =
        document.getElementById("libraryBannerEyebrow");

    const bannerTitle =
        document.getElementById("libraryBannerTitle");

    const bannerText =
        document.getElementById("libraryBannerText");

    const bannerAction =
        document.getElementById("libraryBannerAction");

    const bannerVisual =
        document.getElementById("libraryBannerVisual");

    const bannerControls =
        document.getElementById("libraryBannerControls");

    const dndToggle =
        document.getElementById("libraryDndToggle");

    const bookModal =
        document.getElementById("libraryBookModal");

    const bookModalCover =
        document.getElementById("libraryBookModalCover");

    const bookModalTitle =
        document.getElementById("libraryBookModalTitle");

    const bookModalAuthor =
        document.getElementById("libraryBookModalAuthor");

    const bookModalAction =
        document.getElementById("libraryBookModalAction");


    /* =========================================================
       03. HELPERS
    ========================================================= */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function refreshIcons() {
        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {
            window.lucide.createIcons();
        }
    }


    function closeSidebar() {
        app.classList.remove("sidebar-open");

        document.body.classList.remove(
            "library-sidebar-is-open"
        );

        if (menuButton) {
            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }

        if (sidebar) {
            sidebar.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        if (sidebarBackdrop) {
            sidebarBackdrop.setAttribute(
                "aria-hidden",
                "true"
            );
        }
    }


    function openSidebar() {
        app.classList.add("sidebar-open");

        document.body.classList.add(
            "library-sidebar-is-open"
        );

        if (menuButton) {
            menuButton.setAttribute(
                "aria-expanded",
                "true"
            );
        }

        if (sidebar) {
            sidebar.setAttribute(
                "aria-hidden",
                "false"
            );
        }

        if (sidebarBackdrop) {
            sidebarBackdrop.setAttribute(
                "aria-hidden",
                "false"
            );
        }
    }


    function isMobileLayout() {
        return window.matchMedia(
            "(max-width: 900px)"
        ).matches;
    }


async function createLibrarySession(customerID) {

    if (!customerID) {
        return null;
    }

    try {

        const response =
            await fetch(
                LIBRARY_API_URL +
                "?action=librarysession" +
                "&cid=" +
                encodeURIComponent(customerID)
            );

        const data =
            await response.json();

        if (
            !data ||
            data.success !== true ||
            !data.token
        ) {
            console.warn(
                "Library session could not be created.",
                data
            );

            return null;
        }

        return data;

    } catch (error) {

        console.error(
            "Library session request failed.",
            error
        );

        return null;
    }

}



    /* =========================================================
       04. MOBILE SIDEBAR
    ========================================================= */

    function initialiseSidebar() {

        if (menuButton) {
            menuButton.addEventListener(
                "click",
                function () {

                    if (
                        app.classList.contains(
                            "sidebar-open"
                        )
                    ) {
                        closeSidebar();
                    } else {
                        openSidebar();
                    }

                }
            );
        }


        if (sidebarClose) {
            sidebarClose.addEventListener(
                "click",
                closeSidebar
            );
        }


        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener(
                "click",
                closeSidebar
            );
        }


        /*
         * Selecting a navigation item closes the drawer
         * on mobile.
         */
        if (sidebar) {

            sidebar
                .querySelectorAll(
                    ".library-nav-item"
                )
                .forEach(
                    function (item) {

                        item.addEventListener(
                            "click",
                            function () {

                                if (
                                    isMobileLayout()
                                ) {
                                    closeSidebar();
                                }

                            }
                        );

                    }
                );

        }


        /*
         * Escape closes the mobile sidebar.
         */
        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape" &&
                    app.classList.contains(
                        "sidebar-open"
                    )
                ) {
                    closeSidebar();
                }

            }
        );


        /*
         * If the viewport becomes desktop-sized while
         * the drawer is open, reset its mobile state.
         */
        window.addEventListener(
            "resize",
            function () {

                if (!isMobileLayout()) {
                    closeSidebar();
                }

            }
        );


        /*
         * Initial accessibility state.
         */
        if (sidebar) {
            sidebar.setAttribute(
                "aria-hidden",
                isMobileLayout()
                    ? "true"
                    : "false"
            );
        }

        if (sidebarBackdrop) {
            sidebarBackdrop.setAttribute(
                "aria-hidden",
                "true"
            );
        }

    }


    /* =========================================================
       05. DYNAMIC BANNER
    ========================================================= */

    function renderBannerControls() {

        if (!bannerControls) {
            return;
        }

        bannerControls.innerHTML = "";

        LIBRARY_BANNERS.forEach(
            function (item, index) {

                const button =
                    document.createElement("button");

                button.type = "button";

                button.className =
                    "library-banner-dot";

                button.setAttribute(
                    "aria-label",
                    "Show banner " + (index + 1)
                );

                button.setAttribute(
                    "data-banner-index",
                    String(index)
                );

                if (
                    index ===
                    LIBRARY_STATE.currentBanner
                ) {
                    button.classList.add(
                        "is-active"
                    );
                }

                button.addEventListener(
                    "click",
                    function () {

                        showBanner(index);

                        restartBannerTimer();

                    }
                );

                bannerControls.appendChild(
                    button
                );

            }
        );

    }


    function showBanner(index) {

        if (!LIBRARY_BANNERS.length) {
            return;
        }

        const safeIndex =
            (
                index +
                LIBRARY_BANNERS.length
            ) %
            LIBRARY_BANNERS.length;

        const item =
            LIBRARY_BANNERS[safeIndex];

        LIBRARY_STATE.currentBanner =
            safeIndex;


        if (banner) {
            banner.classList.add(
                "is-transitioning"
            );
        }


        /*
         * A short timeout gives the CSS transition a
         * chance to fade the existing content out.
         */
        window.setTimeout(
            function () {

                if (bannerEyebrow) {
                    bannerEyebrow.textContent =
                        item.eyebrow;
                }

                if (bannerTitle) {
                    bannerTitle.textContent =
                        item.title;
                }

                if (bannerText) {
                    bannerText.textContent =
                        item.text;
                }

                if (bannerAction) {
                    bannerAction.textContent =
                        item.action;

                    bannerAction.setAttribute(
                        "href",
                        item.href || "#"
                    );
                }

                if (bannerVisual) {
                    bannerVisual.setAttribute(
                        "data-banner-type",
                        item.id
                    );
                }


                renderBannerControls();


                if (banner) {
                    banner.classList.remove(
                        "is-transitioning"
                    );
                }


                refreshIcons();

            },
            180
        );

    }


    function restartBannerTimer() {

        if (
            LIBRARY_STATE.bannerTimer
        ) {
            window.clearInterval(
                LIBRARY_STATE.bannerTimer
            );
        }


        LIBRARY_STATE.bannerTimer =
            window.setInterval(
                function () {

                    showBanner(
                        LIBRARY_STATE.currentBanner +
                        1
                    );

                },
                6500
            );

    }


    function initialiseBanner() {

        if (!banner) {
            return;
        }


        showBanner(0);

        restartBannerTimer();


        /*
         * Pause automatic rotation while the user hovers
         * over the banner on desktop.
         */
        banner.addEventListener(
            "mouseenter",
            function () {

                if (!isMobileLayout()) {

                    if (
                        LIBRARY_STATE.bannerTimer
                    ) {
                        window.clearInterval(
                            LIBRARY_STATE.bannerTimer
                        );

                        LIBRARY_STATE.bannerTimer =
                            null;
                    }

                }

            }
        );


        banner.addEventListener(
            "mouseleave",
            function () {

                if (!isMobileLayout()) {
                    restartBannerTimer();
                }

            }
        );

    }


    /* =========================================================
       06. CATEGORIES
    ========================================================= */

    function renderCategories() {

        if (!categoryTrack) {
            return;
        }


        categoryTrack.innerHTML = "";


        LIBRARY_CATEGORIES.forEach(
            function (category) {

                const card =
                    document.createElement("button");

                card.type = "button";

                card.className =
                    "library-category-card";

                card.setAttribute(
                    "data-category-id",
                    category.id
                );


                card.innerHTML = `
                    <span class="library-category-icon">
                        <i data-lucide="${escapeHTML(
                            category.icon
                        )}"></i>
                    </span>

                    <span class="library-category-name">
                        ${escapeHTML(
                            category.name
                        )}
                    </span>
                `;


                card.addEventListener(
                    "click",
                    function () {

                        LIBRARY_STATE.selectedCategory =
                            category.id;

                        /*
                         * Category filtering is handled by
                         * the same catalogue renderer rather
                         * than creating 12 separate pages.
                         */
                        renderBookSections();

                        /*
                         * Keep the selected category visually
                         * identifiable.
                         */
                        categoryTrack
                            .querySelectorAll(
                                ".library-category-card"
                            )
                            .forEach(
                                function (item) {

                                    item.classList.toggle(
                                        "is-selected",
                                        item === card
                                    );

                                }
                            );

                    }
                );


                categoryTrack.appendChild(card);

            }
        );


        refreshIcons();

    }


    /* =========================================================
       07. BOOK CATALOGUE / CARDS
    ========================================================= */

    function getFilteredBooks() {

        let books =
            LIBRARY_BOOKS.slice();


        const searchTerm =
            LIBRARY_STATE.searchTerm
                .trim()
                .toLowerCase();


        if (searchTerm) {

            books =
                books.filter(
                    function (book) {

                        const searchable =
                            [
                                book.title,
                                book.author,
                                book.category
                            ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();

                        return searchable.includes(
                            searchTerm
                        );

                    }
                );

        }


        if (
            LIBRARY_STATE.selectedCategory
        ) {

            books =
                books.filter(
                    function (book) {

                        return (
                            book.category ===
                            LIBRARY_STATE.selectedCategory
                        );

                    }
                );

        }


        return books;

    }


    function createBookCard(book) {

    const article =
        document.createElement("article");

    article.className =
        "library-book-card";

    article.setAttribute(
        "tabindex",
        "0"
    );

    article.setAttribute(
        "role",
        "button"
    );

    article.setAttribute(
        "aria-label",
        "Open " +
        (book.title || "book")
    );


    const coverHTML =
        book.cover
            ? `
                <img
                    class="library-book-cover"
                    src="${escapeHTML(book.cover)}"
                    alt="${escapeHTML(
                        book.title || "Book cover"
                    )}"
                    loading="lazy"
                >
            `
            : `
                <div class="library-book-cover-placeholder">
                    <span>
                        ${escapeHTML(
                            book.title || "Book"
                        )}
                    </span>
                </div>
            `;


    article.innerHTML = `
        <div class="library-book-cover-wrap">

            ${coverHTML}

            ${
                book.isLocked
                    ? `
                        <span class="library-book-lock">
                            <i data-lucide="lock"></i>
                        </span>
                    `
                    : ""
            }

        </div>


        <div class="library-book-info">

            <h3 class="library-book-title">
                ${escapeHTML(
                    book.title || "Untitled Book"
                )}
            </h3>

            <p class="library-book-author">
                ${escapeHTML(
                    book.author || "Unknown Author"
                )}
            </p>


            <div class="library-book-actions">

                <button
                    type="button"
                    class="library-book-action library-favourite-button ${
                        isBookSaved(
                            FAVOURITES_STORAGE_KEY,
                            book.id
                        )
                            ? "is-active"
                            : ""
                    }"
                    data-book-action="favourite"
                    aria-label="Add to favourites"
                    aria-pressed="${
                        isBookSaved(
                            FAVOURITES_STORAGE_KEY,
                            book.id
                        )
                    }"
                >
                    <i data-lucide="heart"></i>
                </button>


                <button
                    type="button"
                    class="library-book-action library-bookmark-button ${
                        isBookSaved(
                            BOOKMARKS_STORAGE_KEY,
                            book.id
                        )
                            ? "is-active"
                            : ""
                    }"
                    data-book-action="bookmark"
                    aria-label="Add bookmark"
                    aria-pressed="${
                        isBookSaved(
                            BOOKMARKS_STORAGE_KEY,
                            book.id
                        )
                    }"
                >
                    <i data-lucide="bookmark"></i>
                </button>

            </div>

        </div>
    `;


    const favouriteButton =
        article.querySelector(
            ".library-favourite-button"
        );

    const bookmarkButton =
        article.querySelector(
            ".library-bookmark-button"
        );


    function updateSavedButton(
        button,
        active
    ) {

        if (!button) {
            return;
        }

        button.classList.toggle(
            "is-active",
            active
        );

        button.setAttribute(
            "aria-pressed",
            String(active)
        );

    }


    if (favouriteButton) {

        favouriteButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                const active =
                    toggleSavedBook(
                        FAVOURITES_STORAGE_KEY,
                        book.id
                    );

                updateSavedButton(
                    favouriteButton,
                    active
                );

            }
        );

    }


    if (bookmarkButton) {

        bookmarkButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                const active =
                    toggleSavedBook(
                        BOOKMARKS_STORAGE_KEY,
                        book.id
                    );

                updateSavedButton(
                    bookmarkButton,
                    active
                );

            }
        );

    }


  async function activateCard() {

    const version =
        Array.isArray(book.versions) &&
        book.versions.length
            ? book.versions[0]
            : null;


    if (!version) {

        console.warn(
            "No readable version found for:",
            book.id
        );

        return;

    }


    const currentParams =
        new URLSearchParams(
            window.location.search
        );


    const customerID =
    currentParams.get("cid") ||
    sessionStorage.getItem("texlearn_customer_id");


    /*
     * If a customer ID exists,
     * create a fresh Library session.
     */
    let token = null;


    if (customerID) {

        const session =
            await createLibrarySession(
                customerID
            );


        if (session) {

            token =
                session.token;

        }

    }


    /*
     * Build Reader URL.
     *
     * Paid customer:
     *     cid + fresh token
     *
     * Unpaid / unauthorized:
     *     cid only
     *
     * Reader will then show
     * the existing access error.
     */
    const params =
        new URLSearchParams();


    if (customerID) {

        params.set(
            "cid",
            customerID
        );

    }


    if (token) {

        params.set(
            "t",
            token
        );

    }


    params.set(
        "bookId",
        book.id
    );


    params.set(
        "versionId",
        version.id
    );


    /*
     * Pass the book-specific theme
     * to the Reader.
     */
    if (book.themePrimary) {

        params.set(
            "themePrimary",
            book.themePrimary
        );

    }


    if (book.themeSecondary) {

        params.set(
            "themeSecondary",
            book.themeSecondary
        );

    }


    /*
     * Pass the book-specific
     * title styling to the Reader.
     */
    if (book.titleBackground) {

        params.set(
            "titleBackground",
            book.titleBackground
        );

    }


    if (book.titlePrimary) {

        params.set(
            "titlePrimary",
            book.titlePrimary
        );

    }


    if (book.titleSecondary) {

        params.set(
            "titleSecondary",
            book.titleSecondary
        );

    }


    if (book.displayTitle) {

        params.set(
            "displayTitle",
            book.displayTitle
        );

    }


    window.location.href =
        "reader.html?" +
        params.toString();

}


    article.addEventListener(
        "click",
        activateCard
    );


    article.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                activateCard();

            }

        }
    );


    return article;

}

function renderBookGrid(
    container,
    books
) {

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!books.length) {

        container.innerHTML = `
            <div class="library-empty-state">

                <i data-lucide="book-open"></i>

                <p>
                    ${
                        LIBRARY_BOOKS.length
                            ? "No books found for this selection."
                            : "Your Library catalogue will appear here."
                    }
                </p>

            </div>
        `;

        refreshIcons();

        return;

    }


    books.forEach(
        function (book) {

            container.appendChild(
                createBookCard(book)
            );

        }
    );


    refreshIcons();

}


    function renderBookSections() {

    const books =
        getFilteredBooks();


    /*
     * Popular Books — Monthly 6 + 6 Rotation
     *
     * First month:
     *     Select the top 12 books by popularity.
     *
     * Following months:
     *     Keep 6 books from the previous month.
     *     Replace the other 6 with new books based on popularity.
     *
     * Editorial controls can later override this selection:
     *     editorialPopular: true  -> force include
     *     editorialPopular: false -> force exclude
     *     popularOrder: number     -> manual order
     */

    function getMonthlyPopularBooks(books) {

        const STORAGE_KEY =
            "samramba_library_popular_rotation";

        const currentDate =
            new Date();

        const currentMonth =
            currentDate.getFullYear() +
            "-" +
            String(
                currentDate.getMonth() + 1
            ).padStart(2, "0");

        let saved = null;

        try {

            saved =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    ) || "null"
                );

        } catch (error) {

            saved = null;

        }


        /*
         * ---------------------------------------------------------
         * 1. ELIGIBLE BOOKS
         * ---------------------------------------------------------
         */

        const eligibleBooks =
            books.filter(
                function (book) {
                    return (
                        book.editorialPopular !==
                        false
                    );
                }
            );


        /*
         * ---------------------------------------------------------
         * 2. POPULARITY RANKING
         * ---------------------------------------------------------
         */

        const popularityRanked =
            eligibleBooks
                .slice()
                .sort(
                    function (a, b) {
                        return (
                            Number(
                                b.popularity || 0
                            ) -
                            Number(
                                a.popularity || 0
                            )
                        );
                    }
                );


        /*
         * ---------------------------------------------------------
         * 3. EDITORIAL INCLUDE
         * ---------------------------------------------------------
         */

        const editorialBooks =
            eligibleBooks.filter(
                function (book) {
                    return (
                        book.editorialPopular ===
                        true
                    );
                }
            );


        let selectedBooks = [];


        /*
         * =========================================================
         * FIRST MONTH
         * =========================================================
         */

        if (
            !saved ||
            !Array.isArray(
                saved.bookIds
            ) ||
            saved.bookIds.length === 0
        ) {

            editorialBooks.forEach(
                function (book) {

                    if (
                        selectedBooks.length >= 12
                    ) {
                        return;
                    }

                    if (
                        selectedBooks.some(
                            function (item) {
                                return (
                                    item.id ===
                                    book.id
                                );
                            }
                        )
                    ) {
                        return;
                    }

                    selectedBooks.push(
                        book
                    );

                }
            );


            popularityRanked.forEach(
                function (book) {

                    if (
                        selectedBooks.length >= 12
                    ) {
                        return;
                    }

                    if (
                        selectedBooks.some(
                            function (item) {
                                return (
                                    item.id ===
                                    book.id
                                );
                            }
                        )
                    ) {
                        return;
                    }

                    selectedBooks.push(
                        book
                    );

                }
            );


        } else {


            /*
             * =====================================================
             * FOLLOWING MONTH
             * =====================================================
             */

            const previousBooks =
                saved.bookIds
                    .map(
                        function (bookId) {
                            return eligibleBooks.find(
                                function (book) {
                                    return (
                                        book.id ===
                                        bookId
                                    );
                                }
                            );
                        }
                    )
                    .filter(Boolean);


            const retainedBooks =
                previousBooks.slice(
                    0,
                    6
                );


            selectedBooks =
                retainedBooks.slice();


            const incomingBooks = [];


            editorialBooks.forEach(
                function (book) {

                    if (
                        incomingBooks.length >= 6
                    ) {
                        return;
                    }

                    if (
                        selectedBooks.some(
                            function (item) {
                                return (
                                    item.id ===
                                    book.id
                                );
                            }
                        )
                    ) {
                        return;
                    }

                    incomingBooks.push(
                        book
                    );

                }
            );


            popularityRanked.forEach(
                function (book) {

                    if (
                        incomingBooks.length >= 6
                    ) {
                        return;
                    }

                    if (
                        saved.bookIds.includes(
                            book.id
                        )
                    ) {
                        return;
                    }

                    if (
                        selectedBooks.some(
                            function (item) {
                                return (
                                    item.id ===
                                    book.id
                                );
                            }
                        )
                    ) {
                        return;
                    }

                    if (
                        incomingBooks.some(
                            function (item) {
                                return (
                                    item.id ===
                                    book.id
                                );
                            }
                        )
                    ) {
                        return;
                    }

                    incomingBooks.push(
                        book
                    );

                }
            );


            selectedBooks =
                selectedBooks.concat(
                    incomingBooks
                );

        }


        /*
         * ---------------------------------------------------------
         * 4. EDITORIAL ORDER
         * ---------------------------------------------------------
         */

        selectedBooks.sort(
            function (a, b) {

                const hasOrderA =
                    Number.isFinite(
                        Number(
                            a.popularOrder
                        )
                    );

                const hasOrderB =
                    Number.isFinite(
                        Number(
                            b.popularOrder
                        )
                    );


                if (
                    hasOrderA &&
                    hasOrderB
                ) {
                    return (
                        Number(
                            a.popularOrder
                        ) -
                        Number(
                            b.popularOrder
                        )
                    );
                }


                if (hasOrderA) {
                    return -1;
                }


                if (hasOrderB) {
                    return 1;
                }


                return 0;

            }
        );


        /*
         * ---------------------------------------------------------
         * 5. SAVE CURRENT MONTH
         * ---------------------------------------------------------
         */

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    month:
                        currentMonth,

                    bookIds:
                        selectedBooks
                            .slice(0, 12)
                            .map(
                                function (book) {
                                    return book.id;
                                }
                            )
                })
            );

        } catch (error) {

            /* Local storage is optional. */

        }


        /*
         * ---------------------------------------------------------
         * 6. FINAL RESULT
         * ---------------------------------------------------------
         */

        return selectedBooks.slice(
            0,
            12
        );

    }


    const popularSelection =
        getMonthlyPopularBooks(
            books
        );


    const popular =
        LIBRARY_STATE.viewAllSection === "popular"
            ? books
                .filter(
                    function (book) {
                        return (
                            book.editorialPopular !==
                            false
                        );
                    }
                )
                .sort(
                    function (a, b) {
                        return (
                            Number(
                                b.popularity || 0
                            ) -
                            Number(
                                a.popularity || 0
                            )
                        );
                    }
                )
                .slice(0, 15)
            : popularSelection;


    const newBooksBase =
        books
            .filter(
                function (book) {
                    return book.isNew === true;
                }
            )
            .sort(
                function (a, b) {
                    return (
                        new Date(b.releaseDate) -
                        new Date(a.releaseDate)
                    );
                }
            );


    const newBooks =
        LIBRARY_STATE.viewAllSection === "new"
            ? newBooksBase.slice(0, 12)
            : newBooksBase.slice(0, 8);


    const recommendedBase =
        books.slice();


    const recommended =
        LIBRARY_STATE.viewAllSection === "recommended"
            ? recommendedBase.slice(0, 12)
            : recommendedBase.slice(0, 8);


    renderBookGrid(
        popularGrid,
        popular
    );

    if (popularGrid) {
        popularGrid.classList.toggle(
            "is-view-all",
            LIBRARY_STATE.viewAllSection === "popular"
        );
    }


    renderBookGrid(
        newGrid,
        newBooks
    );

    if (newGrid) {
        newGrid.classList.toggle(
            "is-view-all",
            LIBRARY_STATE.viewAllSection === "new"
        );
    }


    renderBookGrid(
        recommendedGrid,
        recommended
    );

    if (recommendedGrid) {
        recommendedGrid.classList.toggle(
            "is-view-all",
            LIBRARY_STATE.viewAllSection === "recommended"
        );
    }


    /*
     * Explore Library:
     * Show the complete filtered catalogue.
     */

    renderBookGrid(
        exploreLibraryGrid,
        books
    );

}


    /* =========================================================
       08. CONTINUE READING
    ========================================================= */

    function renderContinueReading() {

        /*
         * No authenticated progress data exists yet.
         * Keep this section hidden rather than showing fake
         * progress.
         */
        if (!continueSection) {
            return;
        }

        if (continueGrid) {
            continueGrid.innerHTML = "";
        }

        continueSection.classList.remove(
            "has-content"
        );

    }


    /* =========================================================
       09. SEARCH
    ========================================================= */

    function initialiseSearch() {

        if (!searchInput) {
            return;
        }


        searchInput.addEventListener(
            "input",
            function () {

                LIBRARY_STATE.searchTerm =
                    searchInput.value;

                if (LIBRARY_STATE.personalView) {

    renderPersonalView(
        LIBRARY_STATE.personalView
    );

} else {

    renderBookSections();

}

            }
        );


        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    searchInput.value = "";

                    LIBRARY_STATE.searchTerm =
                        "";

                    if (LIBRARY_STATE.personalView) {

    renderPersonalView(
        LIBRARY_STATE.personalView
    );

} else {

    renderBookSections();

}

                    searchInput.blur();

                }

            }
        );

    }


    /* =========================================================
   09B. SECTION VIEW ALL
========================================================= */

function initialiseSectionViewAll() {

    const viewAllLinks =
        document.querySelectorAll(
            ".library-view-all[data-library-view]"
        );

    viewAllLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function (event) {

                    const section =
                        link.getAttribute(
                            "data-library-view"
                        );

                    if (
                        section !== "popular" &&
                        section !== "new" &&
                        section !== "recommended"
                    ) {
                        return;
                    }

                    event.preventDefault();

                    LIBRARY_STATE.viewAllSection =
                        section;

                    history.pushState(
                        {
                            libraryViewAll:
                                section
                        },
                        "",
                        "#library-" + section
                    );

                    renderBookSections();

                }
            );

        }
    );

}


function initialiseSectionViewAllHistory() {

    window.addEventListener(
        "popstate",
        function () {

            if (
                LIBRARY_STATE.viewAllSection !== null
            ) {

                LIBRARY_STATE.viewAllSection =
                    null;

                renderBookSections();

            }

        }
    );

}


    /* =========================================================
       10. BOOK MODAL
    ========================================================= */

    function openBookModal(book) {

        if (!bookModal) {
            return;
        }


        if (bookModalCover) {

            bookModalCover.innerHTML =
                book.cover
                    ? `
                        <img
                            src="${escapeHTML(book.cover)}"
                            alt="${escapeHTML(book.title)} book cover"
                        >
                    `
                    : `
                        <div class="library-book-cover-placeholder">
                            <span>
                                ${escapeHTML(book.title || "Book")}
                            </span>
                        </div>
                    `;

        }


        if (bookModalTitle) {
            bookModalTitle.textContent =
                book.title || "Book";
        }


        if (bookModalAuthor) {
            bookModalAuthor.textContent =
                book.author || "Author";
        }


        if (bookModalAction) {

            /*
             * Actual authentication/payment state will later
             * determine whether this says Read or Unlock.
             */
            bookModalAction.innerHTML = `
                <button
                    type="button"
                    class="library-modal-placeholder-button"
                    data-book-id="${escapeHTML(book.id || "")}"
                >
                    <i data-lucide="lock"></i>
                    Unlock to Read
                </button>
            `;

        }


        bookModal.hidden = false;
        bookModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "library-modal-is-open"
        );

        refreshIcons();


        /*
         * Move focus to the close button if available.
         */
        const closeButton =
            bookModal.querySelector(
                ".library-book-modal-close"
            );

        if (closeButton) {
            closeButton.focus();
        }

    }


    function closeBookModal() {

        if (!bookModal) {
            return;
        }

        bookModal.hidden = true;

        bookModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "library-modal-is-open"
        );

    }


    function initialiseBookModal() {

        if (!bookModal) {
            return;
        }


        bookModal
            .querySelectorAll(
                "[data-library-modal-close]"
            )
            .forEach(
                function (element) {

                    element.addEventListener(
                        "click",
                        closeBookModal
                    );

                }
            );


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape" &&
                    !bookModal.hidden
                ) {
                    closeBookModal();
                }

            }
        );

    }


    /* =========================================================
       11. DND MODE
    ========================================================= */

    function initialiseDndMode() {

        if (!dndToggle) {
            return;
        }


        dndToggle.addEventListener(
            "click",
            function () {

                LIBRARY_STATE.dndMode =
                    !LIBRARY_STATE.dndMode;


                app.classList.toggle(
                    "is-dnd",
                    LIBRARY_STATE.dndMode
                );


                dndToggle.classList.toggle(
                    "is-on",
                    LIBRARY_STATE.dndMode
                );


                dndToggle.setAttribute(
                    "aria-pressed",
                    String(
                        LIBRARY_STATE.dndMode
                    )
                );

            }
        );

    }

  function showLibraryHome() {

    LIBRARY_STATE.personalView = null;
    LIBRARY_STATE.personalNotesView = false;

    if (libraryHome) {
        libraryHome.style.display = "";
    }

    if (exploreLibrarySection) {
        exploreLibrarySection.style.display = "";
    }

  if (libraryPersonalView) {
    libraryPersonalView.classList.remove(
        "is-active"
    );
}

    if (libraryNotesView) {
        libraryNotesView.classList.remove(
            "is-active"
        );
    }

    if (libraryPersonalView) {
    libraryPersonalView.classList.add(
        "is-active"
    );
}

    renderBookSections();
}


function renderPersonalView(view) {

    const storageKey =
        view === "favourites"
            ? FAVOURITES_STORAGE_KEY
            : BOOKMARKS_STORAGE_KEY;


    const title =
        view === "favourites"
            ? "Favourites"
            : "Bookmarks";


    const eyebrow =
        view === "favourites"
            ? "YOUR FAVOURITES"
            : "YOUR BOOKMARKS";


    const emptyMessage =
        view === "favourites"
            ? "Books you favourite will appear here."
            : "Books you bookmark will appear here.";


    const ids =
        getSavedBookIds(
            storageKey
        );


    const books =
        LIBRARY_BOOKS.filter(
            function (book) {

                return ids.has(
                    book.id
                );

            }
        );


    LIBRARY_STATE.personalView =
        view;


    if (libraryHome) {
        libraryHome.style.display = "none";
    }

    if (exploreLibrarySection) {
        exploreLibrarySection.style.display = "none";
    }

if (libraryNotesView) {
    libraryNotesView.classList.remove(
        "is-active"
    );
}

if (libraryPersonalView) {
    libraryPersonalView.classList.add(
        "is-active"
    );
}


    if (libraryPersonalTitle) {
        libraryPersonalTitle.textContent =
            title;
    }


    const eyebrowElement =
        document.getElementById(
            "libraryPersonalEyebrow"
        );


    if (eyebrowElement) {
        eyebrowElement.textContent =
            eyebrow;
    }


    if (libraryPersonalCount) {

        libraryPersonalCount.textContent =
            books.length
                ? `${books.length} book${
                    books.length === 1
                        ? ""
                        : "s"
                }`
                : "";

    }


    if (!libraryPersonalGrid) {
        return;
    }


    if (!books.length) {

        libraryPersonalGrid.innerHTML = `
            <div class="library-empty-state">

                <i data-lucide="${
                    view === "favourites"
                        ? "heart"
                        : "bookmark"
                }"></i>

                <p>
                    ${emptyMessage}
                </p>

            </div>
        `;

        refreshIcons();

        return;

    }


    renderBookGrid(
        libraryPersonalGrid,
        books
    );

}

function renderNotesView() {

    const notes =
        getStoredLibraryData(
            NOTES_STORAGE_KEY
        );

    const highlights =
        getStoredLibraryData(
            HIGHLIGHTS_STORAGE_KEY
        );

    LIBRARY_STATE.personalView = null;
    LIBRARY_STATE.personalNotesView = true;

    if (libraryHome) {
        libraryHome.style.display = "none";
    }

    if (exploreLibrarySection) {
        exploreLibrarySection.style.display = "none";
    }

    if (libraryPersonalView) {
        libraryPersonalView.classList.remove(
            "is-active"
        );
    }

    if (libraryNotesView) {
        libraryNotesView.classList.add(
            "is-active"
        );
    }

    const eyebrowElement =
        document.getElementById(
            "libraryNotesEyebrow"
        );

    if (eyebrowElement) {
        eyebrowElement.textContent =
            "NOTES & HIGHLIGHTS";
    }

    const titleElement =
        document.getElementById(
            "libraryNotesTitle"
        );

    if (titleElement) {
        titleElement.textContent =
            "Notes & Highlights";
    }

    const countElement =
        document.getElementById(
            "libraryNotesCount"
        );

    if (countElement) {
        const total =
            notes.length +
            highlights.length;

        countElement.textContent =
            total
                ? `${total} item${
                    total === 1
                        ? ""
                        : "s"
                }`
                : "";
    }

    if (!libraryNotesGrid) {
        return;
    }

    const items = [
        ...highlights.map(
            function (item) {
                return {
                    ...item,
                    type: "highlight"
                };
            }
        ),
        ...notes.map(
            function (item) {
                return {
                    ...item,
                    type: "note"
                };
            }
        )
    ];

    if (!items.length) {

        libraryNotesGrid.innerHTML = `
            <div class="library-empty-state">
                <i data-lucide="notebook-pen"></i>
                <p>
                    Your notes and highlights will appear here.
                </p>
            </div>
        `;

        refreshIcons();
        return;
    }

    libraryNotesGrid.innerHTML = items
        .map(
            function (item) {

                return `
                    <article class="library-note-card">

                        <div class="library-note-card-type">
                            ${
                                item.type === "highlight"
                                    ? "HIGHLIGHT"
                                    : "NOTE"
                            }
                        </div>

                        <div class="library-note-card-content">
                            ${escapeHTML(
                                item.text || ""
                            )}
                        </div>

                    </article>
                `;

            }
        )
        .join("");

    refreshIcons();
}


    /* =========================================================
       12. NAVIGATION STATE
    ========================================================= */

    function initialiseNavigation() {

    const navItems =
        document.querySelectorAll(
            ".library-nav-item[data-library-view]"
        );


    navItems.forEach(
        function (item) {

            item.addEventListener(
                "click",
                function (event) {

                    const view =
                        item.getAttribute(
                            "data-library-view"
                        );


                   if (
    view === "favourites" ||
    view === "bookmarks" ||
    view === "notes"
) {

                        event.preventDefault();


                        navItems.forEach(
                            function (navItem) {

                                navItem.classList.remove(
                                    "is-active"
                                );

                            }
                        );
                    }

                        item.classList.add(
                            "is-active"
                        );


                      if (view === "notes") {

    history.pushState(
        {
            libraryNotesView: true
        },
        "",
        "#notes"
    );

    renderNotesView();

} else {

    history.pushState(
        {
            libraryPersonalView:
                view
        },
        "",
        "#" + view
    );

    renderPersonalView(
        view
    );

}

return;


                    navItems.forEach(
                        function (navItem) {

                            navItem.classList.remove(
                                "is-active"
                            );

                        }
                    );


                    item.classList.add(
                        "is-active"
                    );


                    if (
                        LIBRARY_STATE.personalView
                    ) {

                        showLibraryHome();

                    }

                }
            );

        }
    );



    window.addEventListener(
        "popstate",
        function (event) {

            const personalView =
                event.state &&
                event.state.libraryPersonalView;

                const notesView =
    event.state &&
    event.state.libraryNotesView;


            if (
                personalView === "favourites" ||
                personalView === "bookmarks"
            ) {

                if (notesView) {

    navItems.forEach(
        function (navItem) {

            navItem.classList.toggle(
                "is-active",
                navItem.getAttribute(
                    "data-library-view"
                ) === "notes"
            );

        }
    );

    renderNotesView();

    return;
}

                navItems.forEach(
                    function (navItem) {

                        navItem.classList.toggle(
                            "is-active",
                            navItem.getAttribute(
                                "data-library-view"
                            ) === personalView
                        );

                    }
                );


                renderPersonalView(
                    personalView
                );

                return;

            }


            if (
                LIBRARY_STATE.personalView
            ) {

                navItems.forEach(
                    function (navItem) {

                        navItem.classList.remove(
                            "is-active"
                        );

                    }
                );


                showLibraryHome();

            }

        }
    );

}


    /* =========================================================
       13. INITIALISE
    ========================================================= */

    function initialiseLibrary() {

        initialiseSidebar();

        initialiseBanner();

        renderCategories();

        renderBookSections();

        renderContinueReading();

        initialiseSearch();

        initialiseSectionViewAll();

        initialiseSectionViewAllHistory();

        initialiseBookModal();

        initialiseDndMode();

        initialiseNavigation();

        refreshIcons();

    }


    /*
     * Wait until the document is ready.
     */
    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialiseLibrary,
            { once: true }
        );

    } else {

        initialiseLibrary();

    }


    /*
     * Expose only the small public API that will be useful
     * when the real authentication / catalogue layer is added.
     */
    window.SamrambaLibrary = {

        categories:
            LIBRARY_CATEGORIES,

        banners:
            LIBRARY_BANNERS,

        books:
            LIBRARY_BOOKS,

        openSidebar:
            openSidebar,

        closeSidebar:
            closeSidebar,

        showBanner:
            showBanner,

        openBookModal:
            openBookModal,

        closeBookModal:
            closeBookModal,

        refresh:
            renderBookSections

    };

})();