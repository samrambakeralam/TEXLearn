
/* =====================================================
   TEXLEARN — HERO ROTATION
   Book → Founders → Campaign → repeat
   Quiz functionality removed
===================================================== */

(() => {
    "use strict";

    const HERO_CAMPAIGN_API =
        "https://script.google.com/macros/s/AKfycbxpv1gaF3-kNWsB6Zn5weUkaSPp92m1Yln3xkQ4f_wcKa7JahoaUyKid2BkkuvoEi_X/exec";

    const BOOK_DURATION = 20000;
    const FIRST_BOOK_DURATION = 30000;
    const FADE_DURATION = 1500;

    const bookStage =
        document.getElementById("rc2UnboxingStage");

    const foundersPoster =
        document.getElementById("tkHeroFounders");

    const campaignBox =
        document.getElementById("tkHeroCampaign");

    const campaignMainLink =
        document.getElementById("tkCampaignMainLink");

    const campaignMainImage =
        document.getElementById("tkCampaignMainImage");

    const campaignSupportingLink =
        document.getElementById("tkCampaignSupportingLink");

    const campaignSupportingImage =
        document.getElementById("tkCampaignSupportingImage");

    if (!bookStage || !foundersPoster || !campaignBox) {
        console.warn(
            "TEXLearn hero: Required hero elements not found."
        );
        return;
    }

    const views = {
        book: bookStage,
        founders: foundersPoster,
        campaign: campaignBox
    };

    let currentHeroView = "book";
    let rotationTimer = null;
    let transitionTimer = null;
    let isTransitioning = false;

    let campaignImages = [];
    let campaignLoadPromise = null;
    let activeCampaignLink = null;

    /* -----------------------------------------
       HERO VIEW TRANSITION
    ----------------------------------------- */

    function fadeToView(nextView) {
        if (!views[nextView]) return;

        if (isTransitioning) return;

        if (currentHeroView === nextView) {
            views[nextView].hidden = false;
            return;
        }

        const outgoing = views[currentHeroView];
        const incoming = views[nextView];

        if (!outgoing || !incoming) return;

        isTransitioning = true;

        incoming.hidden = false;
        incoming.classList.add("tk-hero-fading");

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                outgoing.classList.add("tk-hero-fading");
                incoming.classList.remove("tk-hero-fading");

                transitionTimer = setTimeout(() => {
                    outgoing.hidden = true;
                    outgoing.classList.remove("tk-hero-fading");

                    currentHeroView = nextView;
                    isTransitioning = false;
                    transitionTimer = null;

                }, FADE_DURATION);
            });
        });
    }

    /* -----------------------------------------
       BOOK VIEW
    ----------------------------------------- */

    function showBook(duration = BOOK_DURATION) {
        clearTimeout(rotationTimer);
        rotationTimer = null;

        fadeToView("book");

        rotationTimer = setTimeout(() => {
            showFoundersPoster();
        }, duration);
    }

    /* -----------------------------------------
       FOUNDERS POSTER
    ----------------------------------------- */

    function showFoundersPoster() {
        clearTimeout(rotationTimer);
        rotationTimer = null;

        fadeToView("founders");

        rotationTimer = setTimeout(async () => {
            await loadHeroCampaign();

            if (campaignImages.length) {
                showCampaignImage(0);
            } else {
                showBook();
            }

        }, BOOK_DURATION);
    }

    /* -----------------------------------------
       CAMPAIGN IMAGE LOADING
    ----------------------------------------- */

    function loadHeroCampaign() {
        if (campaignLoadPromise) {
            return campaignLoadPromise;
        }

        campaignLoadPromise = (async () => {

            if (
                !campaignMainLink ||
                !campaignMainImage ||
                !campaignSupportingLink ||
                !campaignSupportingImage
            ) {
                return;
            }

            try {
                const response = await fetch(HERO_CAMPAIGN_API, {
                    method: "GET",
                    cache: "no-store"
                });

                if (!response.ok) {
                    throw new Error(
                        "Campaign service unavailable."
                    );
                }

                const data = await response.json();

                if (!data.success || !data.campaign) {
                    return;
                }

                const campaign = data.campaign;

                const candidates = [
                    {
                        url: campaign.mainImageUrl,
                        alt: campaign.mainImageAlt,
                        linkUrl: campaign.mainImageLink,
                        link: campaignMainLink,
                        image: campaignMainImage
                    },
                    {
                        url: campaign.supportingImageUrl,
                        alt: campaign.supportingImageAlt,
                        linkUrl: campaign.supportingImageLink,
                        link: campaignSupportingLink,
                        image: campaignSupportingImage
                    }
                ];

                campaignImages = candidates.filter(item => {

                    if (!item.url) return false;

                    try {
                        const parsed = new URL(
                            item.url,
                            document.baseURI
                        );

                        return (
                            parsed.protocol === "https:" ||
                            parsed.protocol === "http:"
                        );

                    } catch (error) {
                        return false;
                    }
                });

            } catch (error) {
                campaignImages = [];

                console.warn(
                    "Hero campaign unavailable:",
                    error
                );
            }
        })();

        return campaignLoadPromise;
    }

    /* -----------------------------------------
       VERIFY CAMPAIGN IMAGE
    ----------------------------------------- */

    async function isCampaignImageUsable(item) {
        const testImage = new Image();

        try {
            testImage.src = new URL(
                item.url,
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
       DISPLAY CAMPAIGN IMAGE
    ----------------------------------------- */

    async function showCampaignImage(index = 0) {
        clearTimeout(rotationTimer);
        rotationTimer = null;

        if (!campaignImages.length) {
            showBook();
            return;
        }

        const item = campaignImages[index];

        if (!item) {
            showBook();
            return;
        }

        /* Verify image before displaying it */

        const imageUsable =
            await isCampaignImageUsable(item);

        if (!imageUsable) {
            console.warn(
                "Hero campaign image failed to load:",
                item.url
            );

            campaignImages.splice(index, 1);

            if (campaignImages.length) {
                showCampaignImage(
                    Math.min(index, campaignImages.length - 1)
                );
            } else {
                showBook();
            }

            return;
        }

        const previousLink = activeCampaignLink;

        item.image.src = new URL(
            item.url,
            document.baseURI
        ).href;

        item.image.alt = item.alt || "";

        if (item.linkUrl) {
            item.link.href = item.linkUrl;
            item.link.target = "_blank";
            item.link.rel = "noopener noreferrer";
            item.link.style.pointerEvents = "auto";

        } else {
            item.link.removeAttribute("href");
            item.link.removeAttribute("target");
            item.link.removeAttribute("rel");
            item.link.style.pointerEvents = "none";
        }

        if (
            currentHeroView === "campaign" &&
            previousLink &&
            previousLink !== item.link
        ) {
            item.link.hidden = false;
            item.link.style.opacity = "0";

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    previousLink.style.opacity = "0";
                    item.link.style.opacity = "1";
                });
            });

            activeCampaignLink = item.link;

            setTimeout(() => {
                previousLink.hidden = true;
                previousLink.style.opacity = "";
                item.link.style.opacity = "";

            }, 1000);

        } else {
            campaignMainLink.hidden =
                item.link !== campaignMainLink;

            campaignSupportingLink.hidden =
                item.link !== campaignSupportingLink;

            item.link.style.opacity = "";
            activeCampaignLink = item.link;
        }

        fadeToView("campaign");

        rotationTimer = setTimeout(() => {

            if (index + 1 < campaignImages.length) {
                showCampaignImage(index + 1);
            } else {
                showBook();
            }

        }, BOOK_DURATION);
    }

    /* -----------------------------------------
       INITIALISE HERO
    ----------------------------------------- */

    bookStage.hidden = false;
    foundersPoster.hidden = true;
    campaignBox.hidden = true;

    bookStage.classList.remove("tk-hero-fading");
    foundersPoster.classList.remove("tk-hero-fading");
    campaignBox.classList.remove("tk-hero-fading");

    currentHeroView = "book";

    loadHeroCampaign();

    showBook(FIRST_BOOK_DURATION);

})();
