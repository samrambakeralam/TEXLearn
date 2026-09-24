(function () {
    "use strict";


    /* =========================================================
       CONFIG
    ========================================================= */

    const LIBRARY_API_URL =
        "https://script.google.com/macros/s/" +
        "AKfycbzQFLeWMQAX7gbedsu859N8nEZnGoAFinj4dn1JgpX0La7GSy-2xGHK38MdjcHM2ckk/" +
        "exec";


    /* =========================================================
       URL PARAMETERS
    ========================================================= */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const customerID =
        params.get("cid") || "";

    const token =
        params.get("t") || "";

    const bookID =
        params.get("bookId") || "";

    const versionID =
        params.get("versionId") || "";

    const themePrimary =
        params.get("themePrimary") || "";

    const themeSecondary =
        params.get("themeSecondary") || "";

    let titleBackground =
        params.get("titleBackground") || "";

    let titlePrimary =
        params.get("titlePrimary") || "";

    let titleSecondary =
    params.get("titleSecondary") || "";

    let subtitle =
    params.get("subtitle") || "";

    let displayTitle =
    params.get("displayTitle") || "";


    const libraryParams =
        new URLSearchParams();


    if (customerID) {
        libraryParams.set(
            "cid",
            customerID
        );
    }


    if (token) {
        libraryParams.set(
            "t",
            token
        );
    }


    const libraryURL =
        "library.html" +
        (
            libraryParams.toString()
                ? "?" + libraryParams.toString()
                : ""
        );


    /* =========================================================
       DOM
    ========================================================= */

    const content =
        document.getElementById(
            "readerContent"
        );

    const pageIndicator =
        document.getElementById(
            "readerPageIndicator"
        );

    const pageDots =
        document.getElementById(
            "readerPageDots"
        );

    const backButton =
        document.getElementById(
            "readerBackButton"
        );


    /* =========================================================
       READER STATE
    ========================================================= */

    let pages = [];

    let currentPageIndex = 0;

    let bookAuthor = "";


    /* =========================================================
       BOOK THEME
    ========================================================= */

    if (themePrimary) {

        document.documentElement.style.setProperty(
            "--reader-theme-primary",
            themePrimary
        );

    }


    if (themeSecondary) {

        document.documentElement.style.setProperty(
            "--reader-theme-secondary",
            themeSecondary
        );

    }


    /* =========================================================
       HELPERS
    ========================================================= */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    let readerSelectionToolbar = null;

function ensureSelectionToolbar() {
    if (readerSelectionToolbar) {
        return;
    }

    readerSelectionToolbar =
        document.createElement("div");

    readerSelectionToolbar.className =
        "reader-selection-toolbar";

    readerSelectionToolbar.innerHTML = `
        <button
            type="button"
            data-reader-action="highlight"
        >
            Highlight
        </button>

        <button
            type="button"
            data-reader-action="note"
        >
            Add Note
        </button>
    `;

    Object.assign(
        readerSelectionToolbar.style,
        {
            position: "fixed",
            zIndex: "9999",
            display: "none",
            alignItems: "center",
            gap: "6px",
            padding: "6px",
            borderRadius: "10px",
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,.10)",
            boxShadow: "0 8px 24px rgba(0,0,0,.14)"
        }
    );

    readerSelectionToolbar
        .querySelectorAll("button")
        .forEach(function (button) {
            Object.assign(
                button.style,
                {
                    border: "0",
                    borderRadius: "7px",
                    padding: "7px 10px",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600"
                }
            );
        });

    document.body.appendChild(
        readerSelectionToolbar
    );
}


document.addEventListener(
    "selectionchange",
    function () {
        const selection =
            window.getSelection();

        if (!selection || selection.isCollapsed) {
            if (readerSelectionToolbar) {
                readerSelectionToolbar.style.display =
                    "none";
            }
            return;
        }

        const selectedText =
            selection.toString().trim();

        if (!selectedText) {
            if (readerSelectionToolbar) {
                readerSelectionToolbar.style.display =
                    "none";
            }
            return;
        }

        const range =
            selection.getRangeAt(0);

        if (
            !content ||
            !content.contains(
                range.commonAncestorContainer
            )
        ) {
            if (readerSelectionToolbar) {
                readerSelectionToolbar.style.display =
                    "none";
            }
            return;
        }

        ensureSelectionToolbar();

        const rect =
            range.getBoundingClientRect();

        readerSelectionToolbar.style.display =
            "flex";

        const toolbarWidth =
            readerSelectionToolbar.offsetWidth;

        let left =
            rect.left +
            (rect.width / 2) -
            (toolbarWidth / 2);

     let top =
    rect.bottom + 12;

left = Math.max(
    8,
    Math.min(
        left,
        window.innerWidth -
            toolbarWidth -
            8
    )
);

if (
    top +
        readerSelectionToolbar.offsetHeight >
    window.innerHeight - 8
) {
    top =
        rect.top -
        readerSelectionToolbar.offsetHeight -
        12;
}

        readerSelectionToolbar.style.left =
            `${left}px`;

        readerSelectionToolbar.style.top =
            `${top}px`;
    }
);


    /* =========================================================
       LOAD BOOK
    ========================================================= */

    async function loadBook() {

        if (
            !customerID ||
            !token ||
            !bookID ||
            !versionID
        ) {

            showError(
                "This reading session is missing required access information."
            );

            return;
        }


        try {

            const url =
                LIBRARY_API_URL +
                "?action=bookcontent" +
                "&cid=" +
                encodeURIComponent(customerID) +
                "&t=" +
                encodeURIComponent(token) +
                "&bookId=" +
                encodeURIComponent(bookID) +
                "&versionId=" +
                encodeURIComponent(versionID);


            const response =
                await fetch(url);


            if (!response.ok) {

                throw new Error(
                    "Unable to connect to the Library."
                );

            }


            const data =
                await response.json();


            if (!data.success) {

                showError(
                    data.message ||
                    "Unable to load this book."
                );

                return;
            }


            pages =
                Array.isArray(data.pages)
                    ? data.pages
                    : [];


            if (!pages.length) {

                showError(
                    "No reading content is available for this book."
                );

                return;
            }


            await loadBookTitleStyle();

            renderPage();

        } catch (error) {

            console.error(
                "Reader error:",
                error
            );

            showError(
                "Unable to load the book. Please try again."
            );

        }

    }


    /* =========================================================
       LOAD BOOK TITLE STYLE
    ========================================================= */

    async function loadBookTitleStyle() {

        /*
         * If the Reader URL already contains
         * title styling, keep using it.
         */

        if (
            displayTitle &&
            titleBackground &&
            titlePrimary &&
            titleSecondary
        ) {

            return;

        }


        try {

            const url =
                LIBRARY_API_URL +
                "?action=librarycatalogue";


            const response =
                await fetch(url);


            if (!response.ok) {

                throw new Error(
                    "Unable to load the Library catalogue."
                );

            }


            const data =
                await response.json();


            if (
                !data.success ||
                !Array.isArray(data.books)
            ) {

                console.warn(
                    "Library catalogue did not return books."
                );

                return;
            }


            const book =
                data.books.find(
                    item =>
                        String(item.id) ===
                        String(bookID)
                );


            if (!book) {

                console.warn(
                    "Book not found in catalogue:",
                    bookID
                );

                return;
            }


            /*
             * Use catalogue values only when
             * the Reader URL does not already
             * provide them.
             */

            if (!titleBackground) {

                titleBackground =
                    book.titleBackground || "";

            }


            if (!titlePrimary) {

                titlePrimary =
                    book.titlePrimary || "";

            }


            if (!titleSecondary) {

                titleSecondary =
                    book.titleSecondary || "";

            }

            if (!subtitle) {

               subtitle =
                   book.subtitle || "";

            }


            if (!displayTitle) {

                displayTitle =
                    book.displayTitle || "";

            }


            /*
             * Apply the general Reader theme
             * when available from the catalogue.
             */

            if (!themePrimary && book.themePrimary) {

    document.documentElement.style.setProperty(
        "--reader-theme-primary",
        book.themePrimary
    );

}


           if (!themeSecondary && book.themeSecondary) {

    document.documentElement.style.setProperty(
        "--reader-theme-secondary",
        book.themeSecondary
    );

}

        } catch (error) {

            console.error(
                "Book title style error:",
                error
            );

        }

    }


    /* =========================================================
       RENDER PAGE
    ========================================================= */

    function renderPage() {

        const page =
            pages[currentPageIndex];


        if (!page) {
            return;
        }


        let introParagraphRendered = false;


        let pageHTML =
            page.blocks
                .map(
                    block => {

                        if (
                            currentPageIndex === 0 &&
                            block.type === "paragraph" &&
                            !introParagraphRendered
                        ) {

                            introParagraphRendered = true;

                            return renderBlock(
                                block,
                                true
                            );

                        }


                        return renderBlock(
                            block,
                            false
                        );

                    }
                )
                .join("");


        /*
         * Display the book-specific
         * title card on Page 1.
         */

        if (
            currentPageIndex === 0 &&
            displayTitle
        ) {

            pageHTML =
                renderDisplayTitle() +
                pageHTML;

        }


        content.innerHTML =
            pageHTML;


        pageIndicator.textContent =
            "Page " +
            page.page +
            " / " +
            pages.length;


        renderPageDots();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    /* =========================================================
       PAGE DOTS
    ========================================================= */

    function renderPageDots() {

        if (!pageDots) {
            return;
        }


        pageDots.innerHTML =
            pages
                .map(
                    (_, index) => `

                        <button
                            type="button"
                            class="reader-page-dot ${
                                index === currentPageIndex
                                    ? "is-active"
                                    : ""
                            }"
                            data-page-index="${index}"
                            aria-label="Go to page ${index + 1}"
                            aria-current="${
                                index === currentPageIndex
                                    ? "page"
                                    : "false"
                            }"
                        ></button>

                    `
                )
                .join("");


        pageDots
            .querySelectorAll(
                ".reader-page-dot"
            )
            .forEach(
                dot => {

                    dot.addEventListener(
                        "click",
                        () => {

                            const index =
                                Number(
                                    dot.dataset.pageIndex
                                );

                            goToPage(index);

                        }
                    );

                }
            );

    }


    /* =========================================================
       GO TO PAGE
    ========================================================= */

    function goToPage(index) {

        if (
            index < 0 ||
            index >= pages.length ||
            index === currentPageIndex
        ) {

            return;

        }


        const direction =
            index > currentPageIndex
                ? "next"
                : "previous";


        animatePageTransition(
            index,
            direction
        );

    }


    /* =========================================================
       PAGE TRANSITION
    ========================================================= */

    function animatePageTransition(
        index,
        direction
    ) {

        if (!content) {

            currentPageIndex =
                index;

            renderPage();

            return;
        }


        const exitClass =
            direction === "next"
                ? "reader-page-exit-left"
                : "reader-page-exit-right";


        const enterClass =
            direction === "next"
                ? "reader-page-enter-right"
                : "reader-page-enter-left";


        content.classList.add(
            exitClass
        );


        window.setTimeout(
            () => {

                currentPageIndex =
                    index;


                renderPage();


                content.classList.remove(
                    exitClass
                );


                content.classList.add(
                    enterClass
                );


                /*
                 * Force the browser to register
                 * the starting position before
                 * beginning the entrance animation.
                 */

                void content.offsetWidth;


                content.classList.remove(
                    enterClass
                );

            },
            150
        );

    }


    /* =========================================================
       RENDER BLOCK
    ========================================================= */

    function parseStyledBlockContent(value) {

        if (
            value &&
            typeof value === "object"
        ) {

            return value;

        }


        const raw =
            String(
                value ?? ""
            ).trim();


        if (!raw) {

            return {
                text: ""
            };

        }


        try {

            const parsed =
                JSON.parse(raw);


            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {

                return parsed;

            }

        } catch (error) {

            /*
             * Plain text is valid legacy content.
             */

        }


        return {
            text: raw
        };

    }


    /* =========================================================
       SAFE CSS FONT FAMILY
    ========================================================= */

    function safeCssFontFamily(value) {

        const cleaned =
            String(
                value || ""
            )
                .replace(
                    /[^a-zA-Z0-9 ,"\'_-]/g,
                    ""
                )
                .trim();


        return cleaned ||
            "inherit";

    }


    /* =========================================================
       SAFE CSS WEIGHT
    ========================================================= */

    function safeCssWeight(value) {

        const raw =
            String(
                value || ""
            )
                .trim()
                .toLowerCase();


        if (
            [
                "normal",
                "bold"
            ].includes(raw)
        ) {

            return raw;

        }


        const numeric =
            Number(raw);


        if (
            Number.isFinite(numeric) &&
            numeric >= 100 &&
            numeric <= 900
        ) {

            return String(
                Math.round(
                    numeric / 100
                ) * 100
            );

        }


        return "700";

    }


    /* =========================================================
       SAFE CSS LETTER SPACING
    ========================================================= */

    function safeCssLetterSpacing(value) {

        const raw =
            String(
                value || ""
            ).trim();


        if (
            /^-?(?:0|[0-9]+(?:\.[0-9]+)?)(?:px|em|rem|%)$/
                .test(raw)
        ) {

            return raw;

        }


        return "0";

    }

    /* =========================================================
   SAFE CSS LENGTH
========================================================= */

function safeCssLength(value) {

    const raw =
        String(
            value || ""
        ).trim();


    if (
        /^-?(?:0|[0-9]+(?:\.[0-9]+)?)(?:px|em|rem|%)$/
            .test(raw)
    ) {

        return raw;

    }


    return "";
}


    /* =========================================================
       RENDER STANDARD BLOCKS
    ========================================================= */

    function renderBlock(
        block,
        isIntro = false
    ) {

        const text =
            escapeHTML(
                block.content
            );


        switch (block.type) {


            /* =================================================
               TITLE
            ================================================= */

            case "title":

                /*
                 * Title is intentionally not rendered here.
                 * The book-specific title card is rendered
                 * separately by renderDisplayTitle().
                 */

                return "";


            /* =================================================
               AUTHOR
            ================================================= */

            case "author":

                bookAuthor =
                    String(
                        block.content || ""
                    ).trim();


                return "";


            /* =================================================
   HEADING
================================================= */

case "heading": {

    const data =
        parseStyledBlockContent(
            block.content
        );

    const headingText =
        escapeHTML(
            data.text || ""
        );

    const color =
        data.color
            ? escapeHTML(data.color)
            : "var(--reader-theme-secondary, #FFFFFF)";

    const backgroundColor =
        data.backgroundColor
            ? escapeHTML(data.backgroundColor)
            : "var(--reader-theme-primary, #5B1A8F)";

    const weight =
        data.weight
            ? safeCssWeight(data.weight)
            : "";

    const fontFamily =
        data.fontFamily
            ? safeCssFontFamily(data.fontFamily)
            : "";

    const fontSize =
        data.fontSize
            ? safeCssLength(data.fontSize)
            : "";

    const lineHeight =
        data.lineHeight
            ? safeCssLength(data.lineHeight)
            : "";

    const letterSpacing =
        data.letterSpacing
            ? safeCssLetterSpacing(data.letterSpacing)
            : "";

    const fontStyle =
        data.fontStyle === "italic"
            ? "italic"
            : data.fontStyle === "normal"
                ? "normal"
                : "";

    return `
        <h2
            class="reader-block reader-heading"
            style="
                color: ${color};
                background-color: ${backgroundColor};
                ${weight ? `font-weight: ${weight};` : ""}
                ${fontFamily ? `font-family: ${fontFamily};` : ""}
                ${fontSize ? `font-size: ${fontSize};` : ""}
                ${lineHeight ? `line-height: ${lineHeight};` : ""}
                ${letterSpacing ? `letter-spacing: ${letterSpacing};` : ""}
                ${fontStyle ? `font-style: ${fontStyle};` : ""}
            "
        >
            ${headingText}
        </h2>
    `;
}


            /* =================================================
   SUBHEADING
================================================= */

case "subheading": {

    const data =
        parseStyledBlockContent(
            block.content
        );


    const subText =
        escapeHTML(
            data.text || ""
        );


    const weight =
        safeCssWeight(
            data.weight ||
            700
        );


    const fontFamily =
        safeCssFontFamily(
            data.fontFamily ||
            "inherit"
        );


    const letterSpacing =
        safeCssLetterSpacing(
            data.letterSpacing ||
            "0"
        );


    return `
        <div
            class="
                reader-block
                reader-subheading
            "
            style="
                color: #000000;
                font-weight: ${weight};
                font-family: ${fontFamily};
                letter-spacing: ${letterSpacing};
                background-color: transparent;
            "
        >
            ${subText}
        </div>
    `;

}


            /* =================================================
               BOLD
            ================================================= */

            case "bold": {

                const data =
                    parseStyledBlockContent(
                        block.content
                    );


                const boldText =
                    escapeHTML(
                        data.text || ""
                    );


                const color =
                    data.color
                        ? escapeHTML(data.color)
                        : "#000000";


                const backgroundColor =
                    data.backgroundColor
                        ? escapeHTML(data.backgroundColor)
                        : "transparent";


                const weight =
                    safeCssWeight(
                        data.weight ||
                        700
                    );


                const fontFamily =
                    safeCssFontFamily(
                        data.fontFamily ||
                        "inherit"
                    );


                const fontSize =
                    data.fontSize
                        ? safeCssLength(
                            data.fontSize
                        )
                        : "";


                const lineHeight =
                    data.lineHeight
                        ? safeCssLength(
                            data.lineHeight
                        )
                        : "";


                const letterSpacing =
                    data.letterSpacing
                        ? safeCssLetterSpacing(
                            data.letterSpacing
                        )
                        : "";


                const fontStyle =
                    data.fontStyle === "italic"
                        ? "italic"
                        : data.fontStyle === "normal"
                            ? "normal"
                            : "";


                return `
                    <div
                        class="
                            reader-block
                            reader-bold
                        "
                        style="
                            color: ${color};
                            font-weight: ${weight};
                            font-family: ${fontFamily};
                            background-color: ${backgroundColor};
                            ${fontSize ? `font-size: ${fontSize};` : ""}
                            ${lineHeight ? `line-height: ${lineHeight};` : ""}
                            ${letterSpacing ? `letter-spacing: ${letterSpacing};` : ""}
                            ${fontStyle ? `font-style: ${fontStyle};` : ""}
                        "
                    >
                        ${boldText}
                    </div>
                `;

            }


            /* =================================================
   BULLET
================================================= */

case "bullet": {

    const data =
        parseStyledBlockContent(
            block.content
        );

    let bulletText =
        String(
            data.text || ""
        ).trim();


    let marker =
            String(
        data.marker || ""
    ).trim();

if (!marker) {

    const match =
        bulletText.match(
            /^(🟠|🔴|🟡|🟢|🔵|🟣|⚫|⚪|🟤|•)\s*/u
        );

    if (match) {

        marker =
            match[1];

        bulletText =
            bulletText.slice(
                match[0].length
            ).trim();
    }
}

if (!marker) {
    marker = "●";
}

const markerHTML =
    escapeHTML(
        marker
    );

    const markerColor =
        escapeHTML(
            data.markerColor ||
            "var(--reader-theme-secondary, #F5C518)"
        );

    const fontFamily =
        safeCssFontFamily(
            data.fontFamily ||
            "inherit"
        );

    const weight =
        safeCssWeight(
            data.weight ||
            400
        );

    const textColor =
        escapeHTML(
            data.color || "#000000"
        );

    const backgroundColor =
        escapeHTML(
            data.backgroundColor || "transparent"
        );

    return `
        <div
            class="
                reader-block
                reader-bullet
            "
            style="
                color: ${textColor};
                font-family: ${fontFamily};
                font-weight: ${weight};
                background-color: ${backgroundColor};
            "
        >

            <span
                class="reader-bullet-marker"
                style="
                    color: ${markerColor};
                "
                aria-hidden="true"
            >
                ${markerHTML}
            </span>

            <span
                class="reader-bullet-text"
            >
                ${escapeHTML(
                    bulletText
                )}
            </span>

        </div>
    `;
}


            /* =================================================
   PARAGRAPH
================================================= */

case "paragraph": {

    const data =
        parseStyledBlockContent(
            block.content
        );

    const paragraphText =
        escapeHTML(
            data.text || ""
        );

    const fontStyle =
        data.italic === true
            ? "italic"
            : "";

    return `
        <p
            class="
                reader-block
                reader-paragraph
                ${
                    isIntro
                        ? "reader-intro"
                        : ""
                }
            "
            style="
                ${fontStyle
                    ? `font-style: ${fontStyle};`
                    : ""}
            "
        >
            ${paragraphText}
        </p>
    `;
}


            /* =================================================
               LEGACY LIST
            ================================================= */

            case "list":

                return `
                    <div
                        class="
                            reader-block
                            reader-list-item
                        "
                    >

                        <span>
                            •
                        </span>

                        <span>
                            ${text}
                        </span>

                    </div>
                `;


            /* =================================================
               QUOTE
            ================================================= */

            case "quote":

                return `
                    <blockquote
                        class="
                            reader-block
                            reader-quote
                        "
                    >
                        ${text}
                    </blockquote>
                `;


            /* =================================================
               TAKEAWAY
            ================================================= */

            case "takeaway":

                return `
                    <div
                        class="
                            reader-block
                            reader-takeaway
                        "
                    >
                        ${text}
                    </div>
                `;

            
                /* =================================================
   TABLE

   Content format:
   {"headers":[...],"rows":[[...],[...]]}
================================================= */

case "table": {

    let tableData = null;

    try {
        tableData = JSON.parse(
            String(block.content || text || "{}").trim()
        );
    } catch (error) {
        console.error("Invalid table data:", error);
    }

    if (
        !tableData ||
        !Array.isArray(tableData.headers) ||
        !tableData.headers.length ||
        !Array.isArray(tableData.rows)
    ) {
        return `
            <div class="reader-block reader-table-error">
                ${escapeHTML(block.content || "")}
            </div>
        `;
    }

    const headersHTML = tableData.headers
        .map(header => `
            <th scope="col">${escapeHTML(header)}</th>
        `)
        .join("");

    const rowsHTML = tableData.rows
        .map(row => {

            const cells = Array.isArray(row)
                ? row
                : (Array.isArray(row?.cells) ? row.cells : []);

            return `
                <tr>
                    ${tableData.headers.map((_, index) => `
                        <td>${escapeHTML(cells[index] ?? "")}</td>
                    `).join("")}
                </tr>
            `;
        })
        .join("");

    return `
        <div class="reader-block reader-table-block">
            <div class="reader-table-wrap">
                <table class="reader-table">
                    <thead>
                        <tr>${headersHTML}</tr>
                    </thead>

                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


            /* =================================================
               COMPARISON
            ================================================= */

            case "comparison": {

    let comparisonData = null;

    try {
        comparisonData =
            JSON.parse(
                block.content || text || "{}"
            );
    } catch (error) {
        console.error(
            "Invalid comparison data:",
            error
        );
    }

    if (
        !comparisonData ||
        !Array.isArray(
            comparisonData.rows
        )
    ) {
        return `
            <div class="reader-block reader-comparison">
                ${escapeHTML(
                    text || ""
                )}
            </div>
        `;
    }

    const comparisonTitle =
        comparisonData.title
            ? `
                <div class="reader-comparison-title">
                    ${escapeHTML(
                        comparisonData.title
                    )}
                </div>
              `
            : "";

    const tableRows =
        comparisonData.rows
            .map(
                (row, rowIndex) => {

                    const cells =
                        Array.isArray(row.cells)
                            ? row.cells
                            : [];

                    return `
                        <tr>
                            ${cells
                                .map(
                                    cell => `
                                        <td>
                                            ${escapeHTML(
                                                cell
                                            )}
                                        </td>
                                    `
                                )
                                .join("")}
                        </tr>
                    `;
                }
            )
            .join("");

    return `
        <div class="reader-block reader-comparison">

            ${comparisonTitle}

            <div class="reader-comparison-table-wrap">

                <table
                    class="reader-comparison-table"
                >

                    <tbody>
                        ${tableRows}
                    </tbody>

                </table>

            </div>

        </div>
    `;
}


            /* =================================================
               VISUAL
            ================================================= */

            case "visual":

                return renderVisualBlock(
                    block
                );


            /* =================================================
               COVER
            ================================================= */

            case "cover":

                return renderCoverBlock(
                    block
                );


            /* =================================================
               DEFAULT
            ================================================= */

            default:

                return `
                    <p
                        class="
                            reader-block
                            reader-paragraph
                        "
                    >
                        ${text}
                    </p>
                `;

        }

    }


    /* =========================================================
       DISPLAY TITLE
    ========================================================= */

    function renderDisplayTitle() {

    if (!displayTitle) {
        return "";
    }

    let titleParts;

    try {
        titleParts =
            JSON.parse(
                displayTitle
            );

    } catch (error) {

        console.error(
            "Invalid DisplayTitle data:",
            error
        );

        return "";
    }


    if (
        !Array.isArray(titleParts) ||
        !titleParts.length
    ) {
        return "";
    }


    const background =
        titleBackground ||
        "#5B1A8F";


    const primary =
        titlePrimary ||
        "#F5C518";


    const secondary =
        titleSecondary ||
        "#FFFFFF";


    const authorColor =
        titleParts[0]?.authorColor ||
        "#000000";


    const subtitleText =
        String(
            subtitle || ""
        ).trim();


    const hasSubtitle =
        subtitleText.length > 0;


    const titleHTML =
        titleParts
            .map(
                (part, index) => {

                    const text =
                        escapeHTML(
                            part.text || ""
                        );


                    const size =
                        [
                            "large",
                            "medium",
                            "small"
                        ].includes(
                            part.size
                        )
                            ? part.size
                            : "medium";


                    const color =
                        part.color === "primary"
                            ? primary
                            : secondary;


                    const weight =
                        safeCssWeight(
                            part.weight ||
                            700
                        );


                    const fontFamily =
                        safeCssFontFamily(
                            part.fontFamily ||
                            "inherit"
                        );


                    const letterSpacing =
                        safeCssLetterSpacing(
                            part.letterSpacing ||
                            "0"
                        );


                    const fontSize =
                        part.fontSize
                            ? safeCssLength(
                                part.fontSize
                            )
                            : "";


                    const isPrimaryTitle =
                        index === 0;


                    return `
                        <span
                            class="
                                reader-display-title-line
                                reader-display-title-${size}
                            "
                            style="
                                color: ${color};
                                font-weight: ${weight};
                                font-family: ${fontFamily};
                                letter-spacing: ${letterSpacing};
                                ${fontSize ? `font-size: ${fontSize};` : ""}
                                ${hasSubtitle && isPrimaryTitle ? "margin-bottom: 6px;" : ""}
                            "
                        >
                            ${text}
                        </span>
                    `;
                }
            )
            .join("");


    const subtitleHTML =
        hasSubtitle
            ? `
                <div
                    class="reader-display-title-subtitle"
                    style="
                        color: ${secondary};
                        font-size: 16px;
                        font-weight: 400;
                        margin-top: 2px;
                    "
                >
                    ${escapeHTML(
                        subtitleText
                    )}
                </div>
              `
            : "";


    const authorHTML =
        bookAuthor
            ? `
                <div
                    class="
                        reader-display-title-author
                    "
                    style="
                        color: ${authorColor};
                        font-size: 12px;
                    "
                >
                    ${escapeHTML(
                        bookAuthor
                    )}
                </div>
              `
            : "";


    return `
        <div
            class="reader-display-title"
            style="
                background: ${background};
            "
        >

            ${titleHTML}

            ${subtitleHTML}

            ${authorHTML}

        </div>
    `;
}


    /* =========================================================
       RENDER VISUAL BLOCK
    ========================================================= */

    function renderVisualBlock(
        block
    ) {

        let visualData;


        try {

            visualData =
                typeof block.content === "string"
                    ? JSON.parse(
                        block.content
                    )
                    : block.content;

        } catch (error) {

            console.error(
                "Invalid visual block data:",
                error
            );

            return "";
        }


        if (
            !visualData ||
            !visualData.type
        ) {

            return "";

        }


        switch (
            visualData.type
        ) {

            case "image":

                return renderImageVisual(
                    visualData
                );


            default:

                console.warn(
                    "Unknown visual type:",
                    visualData.type
                );

                return "";

        }

    }


    /* =========================================================
       RENDER IMAGE VISUAL
    ========================================================= */

    function renderImageVisual(
        data
    ) {

        const src =
            String(
                data.src || ""
            ).trim();


        if (!src) {

            console.warn(
                "Visual image source is missing."
            );

            return "";

        }


        const alt =
            escapeHTML(
                data.alt ||
                "Learning infographic"
            );


        const caption =
            escapeHTML(
                data.caption ||
                ""
            );


        return `
            <figure
                class="
                    reader-visual-image
                "
            >

                <img
                    src="${src}"
                    alt="${alt}"
                    loading="lazy"
                    decoding="async"
                >


                ${
                    caption
                        ? `
                            <figcaption>
                                ${caption}
                            </figcaption>
                          `
                        : ""
                }

            </figure>
        `;

    }


    /* =========================================================
       RENDER COVER BLOCK
    ========================================================= */

    function renderCoverBlock(
        block
    ) {

        let coverData;


        try {

            coverData =
                typeof block.content === "string"
                    ? JSON.parse(
                        block.content
                    )
                    : block.content;

        } catch (error) {

            console.error(
                "Invalid cover block data:",
                error
            );

            return "";
        }


        if (!coverData) {
            return "";
        }


        const src =
            String(
                coverData.src || ""
            ).trim();


        if (!src) {

            console.warn(
                "Cover image source is missing."
            );

            return "";

        }


        const alt =
            escapeHTML(
                coverData.alt ||
                "Book cover"
            );


        return `
            <div
                class="reader-cover"
            >

                <img
                    src="${src}"
                    alt="${alt}"
                    loading="eager"
                    decoding="async"
                >

            </div>
        `;

    }


    /* =========================================================
       ERROR
    ========================================================= */

    function showError(
        message
    ) {

        content.innerHTML = `

            <div
                class="reader-error"
            >

                <h2>
                    Unable to open this book
                </h2>


                <p>
                    ${escapeHTML(
                        message
                    )}
                </p>


                <a
                    href="${escapeHTML(
                        libraryURL
                    )}"
                >
                    Return to Library
                </a>

            </div>

        `;

    }


    /* =========================================================
       NAVIGATION
    ========================================================= */

    backButton.addEventListener(
        "click",
        function () {

            window.location.href =
                libraryURL;

        }
    );


    /* =========================================================
       TOUCH SWIPE NAVIGATION
    ========================================================= */

    let touchStartX = 0;

    let touchStartY = 0;

    let touchEndX = 0;

    let touchEndY = 0;


    content.addEventListener(
        "touchstart",
        event => {

            if (
                !event.touches ||
                !event.touches.length
            ) {

                return;

            }


            touchStartX =
                event.touches[0].clientX;


            touchStartY =
                event.touches[0].clientY;

        },
        {
            passive: true
        }
    );


    content.addEventListener(
        "touchend",
        event => {

            if (
                !event.changedTouches ||
                !event.changedTouches.length
            ) {

                return;

            }


            touchEndX =
                event.changedTouches[0].clientX;


            touchEndY =
                event.changedTouches[0].clientY;


            handleSwipe();

        },
        {
            passive: true
        }
    );


    function handleSwipe() {

        const deltaX =
            touchEndX -
            touchStartX;


        const deltaY =
            touchEndY -
            touchStartY;


        const minimumSwipeDistance =
            50;


        /*
         * Ignore mostly-vertical gestures.
         */

        if (
            Math.abs(deltaX) <=
            Math.abs(deltaY)
        ) {

            return;

        }


        /*
         * Ignore very short horizontal movements.
         */

        if (
            Math.abs(deltaX) <
            minimumSwipeDistance
        ) {

            return;

        }


        if (deltaX < 0) {

            /*
             * Swipe left → next page
             */

            goToPage(
                currentPageIndex + 1
            );

        } else {

            /*
             * Swipe right → previous page
             */

            goToPage(
                currentPageIndex - 1
            );

        }

    }


    /* =========================================================
       START
    ========================================================= */

    loadBook();

})();