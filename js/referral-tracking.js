
/* ==========================================
   TEXLEARN — REFERRAL TRACKING
   Last-click, lifetime attribution
========================================== */

(function () {

    "use strict";

    const PARTNER_ID_KEY =
        "texlearn_partner_id";

    const PARTNER_DATE_KEY =
        "texlearn_partner_date";

    // --------------------------------------
    // Read referral parameter
    // --------------------------------------

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const submittedPartnerID =
        (urlParams.get("ref") || "")
            .trim()
            .toUpperCase();

    // --------------------------------------
    // Capture a new referral
    // --------------------------------------

    if (
        /^TXL\d+$/.test(submittedPartnerID)
    ) {

        try {

            localStorage.setItem(
                PARTNER_ID_KEY,
                submittedPartnerID
            );

            localStorage.setItem(
                PARTNER_DATE_KEY,
                new Date().toISOString()
            );

            console.log(
                "TEXLearn referral captured:",
                submittedPartnerID
            );

        } catch (error) {

            console.error(
                "Unable to save referral information:",
                error
            );

        }

    }

    // --------------------------------------
    // Preserve existing referral
    // --------------------------------------

    try {

        const storedPartnerID =
            localStorage.getItem(
                PARTNER_ID_KEY
            );

        console.log(
            "TEXLearn stored referral:",
            storedPartnerID || "No referral"
        );

    } catch (error) {

        console.error(
            "Unable to read referral information:",
            error
        );

    }

})();
