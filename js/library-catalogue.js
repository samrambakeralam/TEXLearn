/* =========================================================
   SAMRAMBA KERALAM 2030
   LIBRARY CATALOGUE
   ---------------------------------------------------------
   Purpose:
   - Single source of truth for Library book metadata
   - Data-driven rendering for Library Home
   - Designed to scale from prototype to 500+ books
   - Google Sheet is now the catalogue source
   - Keeps catalogue data separate from user activity data

   IMPORTANT:
   This file contains METADATA only.
   Actual reader content will be connected later through
   contentRef / version records.
========================================================= */

(function () {
    "use strict";


    /* =========================================================
       01. LIBRARY CATEGORIES
    ========================================================= */

    /*
     * Final Library taxonomy.
     *
     * Use the category ID in each book record.
     */

    const CATEGORIES = [

        {
            id: "entrepreneurship",
            name: "Entrepreneurship"
        },

        {
            id: "sales",
            name: "Sales"
        },

        {
            id: "investing",
            name: "Investing"
        },

        {
            id: "marketing",
            name: "Marketing"
        },

        {
            id: "business",
            name: "Business"
        },

        {
            id: "money",
            name: "Money"
        },

        {
            id: "mindset-motivation",
            name: "Mindset & Motivation"
        },

        {
            id: "self-help",
            name: "Self-Help"
        },

        {
            id: "psychology",
            name: "Psychology"
        },

        {
            id: "discipline",
            name: "Discipline"
        },

        {
            id: "health",
            name: "Health"
        },

        {
            id: "wisdom",
            name: "Wisdom"
        }

    ];


    /* =========================================================
       02. LIVE BOOK CATALOGUE
    ========================================================= */

    /*
     * Google Sheet tab:
     *
     *     LIBRARY_CATALOGUE
     *
     * is now the single source of truth.
     *
     * Apps Script returns the catalogue as JSONP so this
     * static Library page can load the data.
     *
     * Actual reader content is NOT loaded here.
     * Only catalogue metadata is returned.
     */

    const LIBRARY_API_URL =
        "https://script.google.com/macros/s/" +
        "AKfycbzQFLeWMQAX7gbedsu859N8nEZnGoAFinj4dn1JgpX0La7GSy-2xGHK38MdjcHM2ckk/" +
        "exec";


    /*
     * Keep this array object stable.
     *
     * library.js reads window.LIBRARY_BOOKS during
     * initialization.
     *
     * We therefore populate this SAME array after the
     * Google Sheet response arrives rather than replacing
     * it with another array.
     */

    const BOOKS = [];


    /* =========================================================
       03. CATEGORY NORMALIZATION
    ========================================================= */

    /*
     * Google Sheets stores human-readable category names:
     *
     *     Money
     *     Entrepreneurship
     *     Mindset & Motivation
     *
     * library.js uses category IDs:
     *
     *     money
     *     entrepreneurship
     *     mindset-motivation
     */

    function normalizeCategory(categoryName) {

        const value =
            String(categoryName || "")
                .trim()
                .toLowerCase();


        const category =
            CATEGORIES.find(
                function (item) {

                    return (
                        item.name.toLowerCase() === value ||
                        item.id === value
                    );

                }
            );


        if (category) {
            return category.id;
        }


        /*
         * Fallback normalization in case a new category
         * is temporarily added to the spreadsheet.
         */

        return value
            .replace(/&/g, "and")
            .replace(/\s+/g, "-");

    }


    /* =========================================================
       04. COVER PATH NORMALIZATION
    ========================================================= */

    /*
     * Google Sheet:
     *
     *     book-001.webp
     *
     * becomes:
     *
     *     assets/library/covers/book-001.webp
     *
     * If a complete URL/path is already stored, it is
     * preserved.
     */

    function normalizeCover(coverFile) {

        const value =
            String(coverFile || "").trim();


        if (!value) {
            return "";
        }


        if (
            value.startsWith("assets/") ||
            value.startsWith("/") ||
            value.startsWith("http://") ||
            value.startsWith("https://")
        ) {

            return value;

        }


        return (
            "assets/library/covers/" +
            value
        );

    }


    /* =========================================================
       05. BOOK NORMALIZATION
    ========================================================= */

    /*
     * Convert one Apps Script book record into the exact
     * structure expected by library.js.
     */

    function normalizeBook(record) {

        const pages =
            Number(record.pages || 0);


        const versionId =
            String(

                record.versionId ||

                (
                    Array.isArray(record.versions) &&
                    record.versions[0] &&
                    record.versions[0].id
                ) ||

                ""

            ).trim();


        const versionLabel =
            String(

                record.versionLabel ||

                (
                    Array.isArray(record.versions) &&
                    record.versions[0] &&
                    record.versions[0].label
                ) ||

                "Condensed Edition"

            ).trim();


        const contentRef =
            String(

                record.contentRef ||

                (
                    Array.isArray(record.versions) &&
                    record.versions[0] &&
                    record.versions[0].contentRef
                ) ||

                ""

            ).trim();


        return {

            id:
                String(
                    record.id || ""
                ).trim(),


            title:
                String(
                    record.title || ""
                ).trim(),


            subtitle:
                String(
                   record.subtitle || ""
                ).trim(),


            author:
                String(
                    record.author || ""
                ).trim(),


            category:
                normalizeCategory(
                    record.category
                ),


            cover:
                normalizeCover(
                    record.cover
                ),


            pages:
                pages,


            popularity:
    Number(
        record.popularity || 0
    ),

editorialPopular:
    record.editorialPopular === true
        ? true
        : record.editorialPopular === false
            ? false
            : null,

popularOrder:
    Number(
        record.popularOrder || 0
    ),

releaseDate:
                String(
                    record.releaseDate || ""
                ).trim(),


            isNew:
                Boolean(
                    record.isNew
                ),


            isLocked:
                Boolean(
                    record.isLocked
                ),


            versions: [

                {

                    id:
                        versionId,

                    label:
                        versionLabel,

                    pageCount:
                        pages,

                    contentRef:
                        contentRef

                }

            ],


                    themePrimary:
    String(
        record.themePrimary || ""
    ).trim(),

themeSecondary:
    String(
        record.themeSecondary || ""
    ).trim(),

titleBackground:
    String(
        record.titleBackground || ""
    ).trim(),

titlePrimary:
    String(
        record.titlePrimary || ""
    ).trim(),

titleSecondary:
    String(
        record.titleSecondary || ""
    ).trim(),

displayTitle:
    String(
        record.displayTitle || ""
    ).trim(),

description:
    String(
        record.description || ""
    ).trim()


        };

    }


    /* =========================================================
       06. RECEIVE LIVE CATALOGUE
    ========================================================= */

    /*
     * This function receives the JSONP response from
     * Google Apps Script.
     */

    function receiveLibraryCatalogue(response) {

    /*
     * Basic response validation.
     */

    if (
        !response ||
        response.success !== true ||
        !Array.isArray(response.books)
    ) {

        console.error(
            "SAMRAMBA Library catalogue failed:",
            response
        );

        return;

    }


    /*
     * Normalize every book received from Google Sheets.
     */

    const normalizedBooks =
        response.books

            .map(
                normalizeBook
            )

            .filter(
                function (book) {

                    return (
                        book.id &&
                        book.title &&
                        book.author
                    );

                }
            );


    /*
     * GROUP VERSION ROWS BY BOOK ID
     *
     * Example:
     *
     * book-001 / v1
     * book-001 / v2
     *
     * becomes ONE Library book:
     *
     * book-001
     *    ├── v2
     *    └── v1
     */

    const groupedBooks =
        new Map();


    normalizedBooks.forEach(
        function (book) {

            if (!groupedBooks.has(book.id)) {

                groupedBooks.set(
                    book.id,
                    {
                        ...book,
                        versions: []
                    }
                );

            }


            const groupedBook =
                groupedBooks.get(book.id);


            /*
             * Add this row's version.
             */

            if (
                Array.isArray(book.versions) &&
                book.versions.length
            ) {

                groupedBook.versions.push(
                    ...book.versions
                );

            }


            /*
             * Keep the latest catalogue row's
             * metadata as the main book metadata.
             *
             * Since your catalogue currently lists
             * V1 first and V2 second, V2 becomes
             * the active/latest book metadata.
             */

            Object.assign(
                groupedBook,
                {
                    title: book.title,
                    subtitle: book.subtitle,
                    author: book.author,
                    category: book.category,
                    cover: book.cover,
                    pages: book.pages,
                    popularity: book.popularity,
                    editorialPopular: book.editorialPopular,
                    popularOrder: book.popularOrder,
                    releaseDate: book.releaseDate,
                    isNew: book.isNew,
                    isLocked: book.isLocked,
                    themePrimary: book.themePrimary,
                    themeSecondary: book.themeSecondary,
                    titleBackground: book.titleBackground,
                    titlePrimary: book.titlePrimary,
                    titleSecondary: book.titleSecondary,
                    displayTitle: book.displayTitle,
                    description: book.description
                }
            );

        }
    );


    /*
     * Convert grouped books back into an array.
     */

    const uniqueBooks =
        Array.from(
            groupedBooks.values()
        );


    /*
     * Put the newest version first.
     *
     * Your current activateCard() already uses
     * versions[0], so this makes V2 the active
     * version without changing library.js.
     */

    uniqueBooks.forEach(
        function (book) {

            book.versions.sort(
                function (a, b) {

                    const aMatch =
                        String(a.id || "")
                            .match(/v(\d+)$/i);

                    const bMatch =
                        String(b.id || "")
                            .match(/v(\d+)$/i);


                    const aNumber =
                        aMatch
                            ? Number(aMatch[1])
                            : 0;

                    const bNumber =
                        bMatch
                            ? Number(bMatch[1])
                            : 0;


                    return bNumber - aNumber;

                }
            );

        }
    );


    /*
     * IMPORTANT:
     *
     * Do not replace BOOKS with another array.
     *
     * Mutate the existing array so library.js
     * keeps the same reference.
     */

    BOOKS.length = 0;


    uniqueBooks.forEach(
        function (book) {

            BOOKS.push(
                book
            );

        }
    );


    /*
     * library.js may have already rendered the page
     * with an empty catalogue.
     *
     * Refresh it after the live catalogue arrives.
     */

    if (
        window.SamrambaLibrary &&
        typeof window.SamrambaLibrary.refresh ===
            "function"
    ) {

        window.SamrambaLibrary.refresh();

    }


    /*
     * Validate the live catalogue.
     */

    validateCatalogue(
        BOOKS
    );


    console.info(
        `SAMRAMBA Library live catalogue loaded: ${BOOKS.length} books.`
    );

}


    /* =========================================================
       07. JSONP LOADER
    ========================================================= */

    /*
     * Google Apps Script is being accessed from the static
     * Library website.
     *
     * JSONP avoids depending on normal cross-origin fetch.
     */

    function loadLibraryCatalogue() {

        const callbackName =
            "__samrambaLibraryCatalogue_" +
            Date.now();


        let script = null;


        /*
         * Create the global JSONP callback.
         */

        window[callbackName] =
            function (response) {

                try {

                    receiveLibraryCatalogue(
                        response
                    );

                }

                finally {

                    /*
                     * Clean up the temporary callback.
                     */

                    delete window[
                        callbackName
                    ];


                    /*
                     * Remove the temporary script element.
                     */

                    if (
                        script &&
                        script.parentNode
                    ) {

                        script.parentNode.removeChild(
                            script
                        );

                    }

                }

            };


        /*
         * Create script element.
         */

        script =
            document.createElement(
                "script"
            );


        /*
         * Build the Apps Script URL.
         */

        script.src =
            LIBRARY_API_URL +
            "?action=librarycatalogue" +
            "&callback=" +
            encodeURIComponent(
                callbackName
            ) +
            "&_=" +
            Date.now();


        script.async = true;


        /*
         * Handle loading failure.
         */

        script.onerror =
            function () {

                console.error(
                    "SAMRAMBA Library catalogue could not be loaded."
                );


                delete window[
                    callbackName
                ];


                if (
                    script &&
                    script.parentNode
                ) {

                    script.parentNode.removeChild(
                        script
                    );

                }

            };


        /*
         * Start request.
         */

        document.head.appendChild(
            script
        );

    }


    /* =========================================================
       08. CATALOGUE VALIDATION
    ========================================================= */

    /*
     * This validation function helps us catch mistakes when
     * the catalogue becomes large.
     *
     * It checks:
     *
     * - Missing book IDs
     * - Duplicate book IDs
     * - Missing titles
     * - Missing authors
     * - Invalid category IDs
     * - Missing versions
     * - Missing version IDs
     * - Missing content references
     */

    function validateCatalogue(
        books
    ) {

        const categoryIds =
            new Set(

                CATEGORIES.map(
                    function (category) {

                        return category.id;

                    }
                )

            );


        const bookIds =
            new Set();


        const errors = [];


        books.forEach(
            function (book, index) {

                /* ---------------------------------------------
                   Book ID
                --------------------------------------------- */

                if (!book.id) {

                    errors.push(
                        `Book at index ${index} has no ID.`
                    );

                }

                else if (
                    bookIds.has(
                        book.id
                    )
                ) {

                    errors.push(
                        `Duplicate book ID: ${book.id}`
                    );

                }

                else {

                    bookIds.add(
                        book.id
                    );

                }


                /* ---------------------------------------------
                   Title
                --------------------------------------------- */

                if (!book.title) {

                    errors.push(
                        `${book.id || "Unknown book"} has no title.`
                    );

                }


                /* ---------------------------------------------
                   Author
                --------------------------------------------- */

                if (!book.author) {

                    errors.push(
                        `${book.id || "Unknown book"} has no author.`
                    );

                }


                /* ---------------------------------------------
                   Category
                --------------------------------------------- */

                if (
                    !book.category ||
                    !categoryIds.has(
                        book.category
                    )
                ) {

                    errors.push(
                        `${book.id || "Unknown book"} has an invalid category.`
                    );

                }


                /* ---------------------------------------------
                   Versions
                --------------------------------------------- */

                if (
                    !Array.isArray(
                        book.versions
                    )
                ) {

                    errors.push(
                        `${book.id || "Unknown book"} has no versions array.`
                    );

                }


                /* ---------------------------------------------
                   Version validation
                --------------------------------------------- */

                if (
                    Array.isArray(
                        book.versions
                    )
                ) {

                    book.versions.forEach(
                        function (version) {

                            if (!version.id) {

                                errors.push(
                                    `${book.id || "Unknown book"} has a version without an ID.`
                                );

                            }


                            if (
                                !version.contentRef
                            ) {

                                errors.push(
                                    `${book.id || "Unknown book"} has a version without contentRef.`
                                );

                            }

                        }
                    );

                }

            }
        );


        /* ---------------------------------------------
           Console output
        --------------------------------------------- */

        if (errors.length) {

            console.warn(
                "SAMRAMBA Library catalogue validation warnings:",
                errors
            );

        }

        else {

            console.info(
                `SAMRAMBA Library catalogue validated: ${books.length} books.`
            );

        }


        return {

            valid:
                errors.length === 0,

            errors:
                errors

        };

    }


    /* =========================================================
       09. PUBLIC CATALOGUE API
    ========================================================= */

    /*
     * This keeps catalogue access organized.
     *
     * library.js does not need to know how the catalogue
     * itself is structured internally.
     */

    window.SamrambaLibraryCatalogue = {

        /* ---------------------------------------------
           All categories
        --------------------------------------------- */

        categories:
            CATEGORIES,


        /* ---------------------------------------------
           All books
        --------------------------------------------- */

        books:
            BOOKS,


        /* ---------------------------------------------
           Validate catalogue
        --------------------------------------------- */

        validate:
            function () {

                return validateCatalogue(
                    BOOKS
                );

            },


        /* ---------------------------------------------
           Find a single book
        --------------------------------------------- */

        getBook:
            function (bookId) {

                return BOOKS.find(
                    function (book) {

                        return (
                            book.id ===
                            bookId
                        );

                    }
                ) || null;

            },


        /* ---------------------------------------------
           Find a category
        --------------------------------------------- */

        getCategory:
            function (categoryId) {

                return CATEGORIES.find(
                    function (category) {

                        return (
                            category.id ===
                            categoryId
                        );

                    }
                ) || null;

            },


        /* ---------------------------------------------
           Find books by category
        --------------------------------------------- */

        getBooksByCategory:
            function (categoryId) {

                return BOOKS.filter(
                    function (book) {

                        return (
                            book.category ===
                            categoryId
                        );

                    }
                );

            }

    };


    /* =========================================================
       10. LIBRARY.JS COMPATIBILITY
    ========================================================= */

    /*
     * The existing library.js already looks for:
     *
     *     window.LIBRARY_BOOKS
     *
     * Expose the SAME mutable BOOKS array.
     *
     * library.js therefore does not need to be changed.
     */

    window.LIBRARY_BOOKS =
        BOOKS;


    /* =========================================================
       11. LOAD LIVE CATALOGUE
    ========================================================= */

    /*
     * Start loading the Google Sheet catalogue.
     *
     * The array is initially empty and is populated when
     * Apps Script responds.
     */

    loadLibraryCatalogue();


})();