
/* =====================================================
   TEXLEARN — HERO ROTATION
   Website: Book → Campaign Posters → repeat
   Android: Campaign Posters → repeat
===================================================== */

(() => {
    "use strict";

    const HERO_CAMPAIGN_API =
        "https://script.google.com/macros/s/AKfycbxpv1gaF3-kNWsB6Zn5weUkaSPp92m1Yln3xkQ4f_wcKa7JahoaUyKid2BkkuvoEi_X/exec";

    const POSTER_DURATION = 7000;

    const isAppMode =
        document.documentElement.classList.contains("texlearn-app");

    const campaignBox =
        document.getElementById("tkHeroCampaign");

    const campaignSlots = [
        {
            link: document.getElementById("tkCampaignMainLink"),
            image: document.getElementById("tkCampaignMainImage")
        },
        {
            link: document.getElementById("tkCampaignSupportingLink"),
            image: document.getElementById("tkCampaignSupportingImage")
        }
    ];

  if (
    !campaignBox ||
    campaignSlots.some(slot => !slot.link || !slot.image)
) {
    console.warn(
        "TEXLearn hero: Required hero elements not found."
    );
    return;
}

    let currentHeroView = null;
    let rotationTimer = null;

    let campaignImages = [];
    let campaignLoadPromise = null;
    let activeSlotIndex = -1;

 function fadeToView() {
    campaignBox.hidden = false;
    campaignBox.classList.remove("tk-hero-fading");
    currentHeroView = "campaign";
}

    /* -----------------------------------------
       LOAD CAMPAIGN POSTERS
    ----------------------------------------- */

    function loadHeroCampaign() {

        if (campaignLoadPromise) {
            return campaignLoadPromise;
        }

        campaignLoadPromise = (async () => {

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

                        if (
                            !item.posterId ||
                            !item.imageUrl
                        ) {
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
                    .sort((a, b) => {

                        return (
                            Number(a.displayOrder || 999) -
                            Number(b.displayOrder || 999) ||
                            Number(a.posterOrder || 999) -
                            Number(b.posterOrder || 999)
                        );

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
       DISPLAY CAMPAIGN POSTER
    ----------------------------------------- */

    async function showCampaignImage(index = 0) {

        clearTimeout(rotationTimer);
        rotationTimer = null;

      if (!campaignImages.length) {
    campaignBox.hidden = true;
    return;
}

      if (index >= campaignImages.length) {
    index = 0;
}

        const item = campaignImages[index];

        const imageUsable =
            await isCampaignImageUsable(item);

     if (!imageUsable) {

    console.warn(
        "Hero campaign image failed to load:",
        item.imageUrl
    );

    campaignImages.splice(index, 1);

    if (campaignImages.length) {

        showCampaignImage(
            Math.min(index, campaignImages.length - 1)
        );

    } else {

        campaignBox.hidden = true;

    }

    return;
}

        const nextSlotIndex =
            activeSlotIndex === 0 ? 1 : 0;

        const nextSlot =
            campaignSlots[nextSlotIndex];

        const previousSlot =
            activeSlotIndex >= 0
                ? campaignSlots[activeSlotIndex]
                : null;

        nextSlot.link.hidden = false;

        nextSlot.image.src = new URL(
            item.imageUrl,
            document.baseURI
        ).href;

        nextSlot.image.alt = item.imageAlt || "";

        if (item.imageLink) {

            nextSlot.link.href = item.imageLink;
            nextSlot.link.target = "_blank";
            nextSlot.link.rel = "noopener noreferrer";
            nextSlot.link.style.pointerEvents = "auto";

        } else {

            nextSlot.link.removeAttribute("href");
            nextSlot.link.removeAttribute("target");
            nextSlot.link.removeAttribute("rel");
            nextSlot.link.style.pointerEvents = "none";

        }

               if (isAppMode) {

            campaignSlots.forEach(slot => {
                slot.link.classList.remove(
                    "tk-campaign-active",
                    "tk-campaign-exit"
                );
            });

            nextSlot.link.hidden = false;

            if (previousSlot) {
                previousSlot.link.hidden = false;
            }

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {

                    nextSlot.link.classList.add(
                        "tk-campaign-active"
                    );

                    if (previousSlot) {
                        previousSlot.link.classList.add(
                            "tk-campaign-exit"
                        );
                    }

                });
            });

            if (previousSlot) {

                setTimeout(() => {

                    previousSlot.link.hidden = true;

                    previousSlot.link.classList.remove(
                        "tk-campaign-active",
                        "tk-campaign-exit"
                    );

                }, 550);

            }

        } else if (previousSlot && currentHeroView === "campaign") {

            nextSlot.link.style.opacity = "0";

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {

                    previousSlot.link.style.opacity = "0";
                    nextSlot.link.style.opacity = "1";

                });
            });

            setTimeout(() => {

                previousSlot.link.hidden = true;
                previousSlot.link.style.opacity = "";

                nextSlot.link.style.opacity = "";

            }, 1000);

        } else {

            campaignSlots.forEach((slot, slotIndex) => {

                slot.link.hidden =
                    slotIndex !== nextSlotIndex;

                slot.link.style.opacity = "";

            });

        }

        activeSlotIndex = nextSlotIndex;

        fadeToView();

        rotationTimer = setTimeout(() => {

            showCampaignImage(index + 1);

        }, POSTER_DURATION);
    }

    /* -----------------------------------------
       INITIALISE HERO
    ----------------------------------------- */

    campaignSlots.forEach(slot => {

        slot.link.hidden = true;
        slot.link.style.opacity = "";

    });

    campaignBox.hidden = true;
    campaignBox.classList.remove("tk-hero-fading");

    currentHeroView = null;

    loadHeroCampaign().then(() => {

    if (campaignImages.length) {
        showCampaignImage(0);
    } else {
        campaignBox.hidden = true;
        console.warn("TEXLearn hero: No active campaign images.");
    }

});

})();
