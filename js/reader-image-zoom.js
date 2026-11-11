
(function () {

    "use strict";

    const readerContent =
        document.getElementById("readerContent");

    if (!readerContent) return;


    let overlay;
    let zoomImage;
    let zoomLevelLabel;

    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    const MIN_SCALE = 1;
    const MAX_SCALE = 5;

    let savedScrollPosition = 0;

    const pointers = new Map();

    let pinchStartDistance = 0;
    let pinchStartScale = 1;

    let dragStartX = 0;
    let dragStartY = 0;

    let dragStartTranslateX = 0;
    let dragStartTranslateY = 0;


    /* =====================================================
       CREATE VIEWER
    ===================================================== */

    function createViewer() {

        if (overlay) return;

        overlay =
            document.createElement("div");

        overlay.className =
            "reader-image-zoom-overlay";

        overlay.innerHTML = `

            <div class="reader-zoom-toolbar">

                <span class="reader-zoom-title">
                    Image Viewer
                </span>

                <button
                    type="button"
                    class="reader-zoom-close"
                    aria-label="Close image viewer"
                >
                    &times;
                </button>

            </div>


            <div class="reader-zoom-stage">

                <img
                    class="reader-zoom-image"
                    alt=""
                    draggable="false"
                >

            </div>


            <div class="reader-zoom-controls">

                <button
                    type="button"
                    data-zoom="out"
                    aria-label="Zoom out"
                >
                    −
                </button>

                <span class="reader-zoom-level">
                    100%
                </span>

                <button
                    type="button"
                    data-zoom="in"
                    aria-label="Zoom in"
                >
                    +
                </button>

                <button
                    type="button"
                    data-zoom="reset"
                    aria-label="Reset zoom"
                >
                    ↺
                </button>

            </div>

        `;


        document.body.appendChild(overlay);

        zoomImage =
            overlay.querySelector(
                ".reader-zoom-image"
            );

        zoomLevelLabel =
            overlay.querySelector(
                ".reader-zoom-level"
            );


        overlay
            .querySelector(".reader-zoom-close")
            .addEventListener("click", closeViewer);


        overlay.addEventListener(
            "click",
            function (event) {

                if (event.target === overlay) {
                    closeViewer();
                }

            }
        );


        overlay
            .querySelectorAll("[data-zoom]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const action =
                            button.dataset.zoom;

                        if (action === "in") {
                            scale = Math.min(
                                MAX_SCALE,
                                scale + 0.5
                            );
                        }

                        if (action === "out") {
                            scale = Math.max(
                                MIN_SCALE,
                                scale - 0.5
                            );
                        }

                        if (action === "reset") {
                            resetZoom();
                            return;
                        }

                        updateTransform();

                    }
                );

            });


        zoomImage.addEventListener(
            "pointerdown",
            onPointerDown
        );

        zoomImage.addEventListener(
            "pointermove",
            onPointerMove
        );

        zoomImage.addEventListener(
            "pointerup",
            onPointerEnd
        );

        zoomImage.addEventListener(
            "pointercancel",
            onPointerEnd
        );


        document.addEventListener(
            "keydown",
            onKeyDown
        );

    }


    /* =====================================================
       OPEN IMAGE
    ===================================================== */

    function openViewer(image) {

        createViewer();

        resetZoom();

        pointers.clear();

        zoomImage.src =
            image.currentSrc || image.src;

        zoomImage.alt =
            image.alt || "Enlarged visual";

        savedScrollPosition =
            window.scrollY;

        document.body.style.overflow =
            "hidden";

        overlay.classList.add("active");

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        overlay
            .querySelector(".reader-zoom-close")
            .focus();

    }


    /* =====================================================
       CLOSE IMAGE
    ===================================================== */

    function closeViewer() {

        if (!overlay) return;

        overlay.classList.remove("active");

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow = "";

        pointers.clear();

        zoomImage.removeAttribute("src");

        window.scrollTo(
            0,
            savedScrollPosition
        );

    }


    /* =====================================================
       RESET ZOOM
    ===================================================== */

    function resetZoom() {

        scale = 1;

        translateX = 0;
        translateY = 0;

        updateTransform();

    }


    /* =====================================================
       UPDATE IMAGE TRANSFORM
    ===================================================== */

    function updateTransform() {

        zoomImage.style.transform =
            `translate(${translateX}px, ${translateY}px) scale(${scale})`;

        zoomLevelLabel.textContent =
            Math.round(scale * 100) + "%";

    }


    /* =====================================================
       POINTER HELPERS
    ===================================================== */

    function getDistance(a, b) {

        return Math.hypot(
            b.x - a.x,
            b.y - a.y
        );

    }


    function onPointerDown(event) {

        event.preventDefault();

        zoomImage.setPointerCapture(
            event.pointerId
        );

        pointers.set(
            event.pointerId,
            {
                x: event.clientX,
                y: event.clientY
            }
        );


        if (pointers.size === 2) {

            const points =
                Array.from(pointers.values());

            pinchStartDistance =
                getDistance(points[0], points[1]);

            pinchStartScale = scale;

        }
        else if (pointers.size === 1) {

            dragStartX = event.clientX;
            dragStartY = event.clientY;

            dragStartTranslateX = translateX;
            dragStartTranslateY = translateY;

        }

    }


    function onPointerMove(event) {

        if (!pointers.has(event.pointerId)) {
            return;
        }

        event.preventDefault();

        pointers.set(
            event.pointerId,
            {
                x: event.clientX,
                y: event.clientY
            }
        );


        /* Two-finger pinch */

        if (pointers.size === 2) {

            const points =
                Array.from(pointers.values());

            const distance =
                getDistance(points[0], points[1]);

            if (pinchStartDistance > 0) {

                scale = Math.min(
                    MAX_SCALE,
                    Math.max(
                        MIN_SCALE,
                        pinchStartScale *
                        (distance / pinchStartDistance)
                    )
                );

                updateTransform();

            }

            return;

        }


        /* One-finger dragging */

        if (pointers.size === 1 && scale > 1) {

            translateX =
                dragStartTranslateX +
                (event.clientX - dragStartX);

            translateY =
                dragStartTranslateY +
                (event.clientY - dragStartY);

            updateTransform();

        }

    }


    function onPointerEnd(event) {

        pointers.delete(event.pointerId);

        if (pointers.size === 1) {

            const remaining =
                Array.from(pointers.values())[0];

            dragStartX = remaining.x;
            dragStartY = remaining.y;

            dragStartTranslateX = translateX;
            dragStartTranslateY = translateY;

        }

        if (pointers.size === 0) {
            pinchStartDistance = 0;
        }

    }


    /* =====================================================
       KEYBOARD CONTROLS
    ===================================================== */

    function onKeyDown(event) {

        if (!overlay.classList.contains("active")) {
            return;
        }

        if (event.key === "Escape") {
            closeViewer();
        }

        if (event.key === "+") {
            scale = Math.min(MAX_SCALE, scale + 0.5);
            updateTransform();
        }

        if (event.key === "-") {
            scale = Math.max(MIN_SCALE, scale - 0.5);
            updateTransform();
        }

    }


    /* =====================================================
       IMAGE CLICK HANDLER
    ===================================================== */

    readerContent.addEventListener(
        "click",
        function (event) {

            const image =
                event.target.closest("img");

            if (!image) return;

            if (!readerContent.contains(image)) {
                return;
            }

            if (
                image.closest(
                    "[data-no-zoom], a"
                )
            ) {
                return;
            }

            if (!image.complete || !image.naturalWidth) {
                return;
            }

            openViewer(image);

        }
    );


    /* =====================================================
       ACCESSIBILITY FOR DYNAMIC IMAGES
    ===================================================== */

    function prepareImages() {

        readerContent
            .querySelectorAll("img")
            .forEach(image => {

                if (
                    image.closest(
                        "[data-no-zoom], a"
                    )
                ) {
                    return;
                }

                image.classList.add(
                    "reader-zoom-trigger"
                );

                image.setAttribute(
                    "tabindex",
                    "0"
                );

                image.setAttribute(
                    "role",
                    "button"
                );

                image.setAttribute(
                    "aria-label",
                    "Open image for zooming"
                );

            });

    }


    readerContent.addEventListener(
        "keydown",
        function (event) {

            if (
                event.target.matches(
                    "img.reader-zoom-trigger"
                ) &&
                (
                    event.key === "Enter" ||
                    event.key === " "
                )
            ) {

                event.preventDefault();

                openViewer(event.target);

            }

        }
    );


    const observer =
        new MutationObserver(prepareImages);

    observer.observe(
        readerContent,
        {
            childList: true,
            subtree: true
        }
    );


    prepareImages();

})();
