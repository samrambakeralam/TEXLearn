/* =========================================================
   TEXLEARN — GLOBAL SEARCH HEADER BEHAVIOUR
   Homepage only
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const header = document.querySelector(".rc2-header");
    const searchToggle = document.getElementById("rc2GlobalSearchToggle");
    const searchRow = document.getElementById("rc2GlobalSearchRow");
    const searchInput = document.getElementById("rc2GlobalSearchInput");

    if (!header || !searchToggle || !searchRow || !searchInput) {
        return;
    }

    const SCROLL_THRESHOLD = 120;

    let manuallyOpened = false;
    let lastScrollY = window.scrollY;

    function showSearchRow() {
        header.classList.remove("search-collapsed");
        searchToggle.setAttribute("aria-expanded", "true");
    }

    function collapseSearchRow() {
        header.classList.add("search-collapsed");
        searchToggle.setAttribute("aria-expanded", "false");
        manuallyOpened = false;
    }

    function updateSearchHeader() {

        const currentScrollY = window.scrollY;

        if (currentScrollY <= SCROLL_THRESHOLD) {
            manuallyOpened = false;
            showSearchRow();
        } else if (
            !manuallyOpened &&
            Math.abs(currentScrollY - lastScrollY) > 5
        ) {
            collapseSearchRow();
        }

        lastScrollY = currentScrollY;
    }

    searchToggle.addEventListener("click", function () {

        if (header.classList.contains("search-collapsed")) {
            manuallyOpened = true;
            showSearchRow();
            searchInput.focus();
        } else {
            collapseSearchRow();
        }

    });

    window.addEventListener("scroll", updateSearchHeader, {
        passive: true
    });

    updateSearchHeader();

});
