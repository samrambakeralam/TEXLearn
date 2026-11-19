
/* =========================================================
   TEXLEARN GAMIFICATION
   Separate authentication and API integration
========================================================= */

(function () {

    "use strict";

    const API_URL =
    typeof CONFIG !== "undefined"
        ? CONFIG.GAMIFICATION_API_URL || ""
        : "";

    const TOKEN_KEY =
        "texlearn_gamification_session_token";

    const IDENTITY_KEY =
    "texlearn_gamification_library_customer_id";    

    let dashboard = null;


    /* -----------------------------------------------------
       API REQUEST
    ----------------------------------------------------- */

    async function request(endpoint, options = {}) {

        if (!API_URL) {
            throw new Error(
                "Gamification API URL is not configured."
            );
        }

        const response = await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                }
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok) {

            const error = new Error(
                data.message ||
                "Gamification API request failed."
            );

            error.status = response.status;

            throw error;
        }

        return data;
    }


    /* -----------------------------------------------------
       GET STORED GAMIFICATION TOKEN
    ----------------------------------------------------- */

    function getToken() {

        return localStorage.getItem(TOKEN_KEY) || "";

    }


    /* -----------------------------------------------------
       SAVE GAMIFICATION TOKEN
    ----------------------------------------------------- */

    function saveToken(token) {

        if (!token) {
            throw new Error(
                "Gamification session token is missing."
            );
        }

        localStorage.setItem(
            TOKEN_KEY,
            token
        );

    }


    /* -----------------------------------------------------
       EXCHANGE LIBRARY SESSION
    ----------------------------------------------------- */

   async function authenticateWithLibrary(
    librarySessionToken,
    customerID
) {

    if (!librarySessionToken) {
        throw new Error(
            "Verified Library session is required."
        );
    }

    if (!customerID) {
        throw new Error(
            "Verified Library customer ID is required."
        );
    }

    const result = await request(
        "/api/auth/library",
        {
            method: "POST",

            body: JSON.stringify({
                librarySessionToken: librarySessionToken
            })
        }
    );

    if (
        result.success !== true ||
        !result.sessionToken
    ) {
        throw new Error(
            "Gamification authentication failed."
        );
    }

    saveToken(result.sessionToken);

    localStorage.setItem(
        IDENTITY_KEY,
        customerID
    );

    return result;
}


    /* -----------------------------------------------------
       LOAD USER DASHBOARD
    ----------------------------------------------------- */

    async function loadDashboard() {

        const token = getToken();

        if (!token) {
            throw new Error(
                "Gamification session is unavailable."
            );
        }

        return await request(
            "/api/users/me/dashboard",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );

    }


    /* -----------------------------------------------------
       INITIALISE GAMIFICATION
    ----------------------------------------------------- */

    async function initialise(librarySession) {

        dashboard = null;

   if (
    !librarySession ||
    librarySession.success !== true ||
    librarySession.authenticated !== true ||
    librarySession.accountType === "TRIAL" ||
    !librarySession.sessionToken
) {
    return {
        success: false,
        reason: "INELIGIBLE_LIBRARY_SESSION"
    };
}

const customerID = String(
    librarySession.customerID || ""
).trim();

if (!customerID) {
    return {
        success: false,
        reason: "MISSING_LIBRARY_CUSTOMER_ID"
    };
}

        try {

            // Reuse the existing session only for the same Library customer.
const storedCustomerID =
    localStorage.getItem(IDENTITY_KEY) || "";

if (
    getToken() &&
    storedCustomerID === customerID
) {

    try {

        dashboard = await loadDashboard();

        return {
            success: true,
            authenticated: true,
            dashboard: dashboard
        };

    } catch (error) {

        if (error.status !== 401) {
            throw error;
        }

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(IDENTITY_KEY);

    }

} else {

    // Different customer or no identity association:
    // discard the old Gamification session.
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(IDENTITY_KEY);

}

            // Exchange the verified Library session.
            await authenticateWithLibrary(
                librarySession.sessionToken,
                customerID
            );

            dashboard = await loadDashboard();

            return {
                success: true,
                authenticated: true,
                dashboard: dashboard
            };

        } catch (error) {

            console.error(
                "Gamification initialisation failed:",
                error.message
            );

            return {
                success: false,
                reason: "GAMIFICATION_INITIALISATION_FAILED"
            };

        }

    }


    /* -----------------------------------------------------
       PUBLIC API
    ----------------------------------------------------- */

    window.TEXLearnGamification = {

        initialise: initialise,

        getDashboard: function () {
            return dashboard;
        }

    };

})();
