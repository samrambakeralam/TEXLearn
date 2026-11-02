// ==========================================
// Registration
// ==========================================

console.log("REGISTER.JS LOADED");

const form =
    document.getElementById("registrationForm");

const button =
    document.getElementById("continueButton");

const institutionTypeSelect =
    document.getElementById("institutionType");

const institutionGroup =
    document.getElementById("institutionGroup");

const institutionSelect =
    document.getElementById("institution");


// ==========================================
// Form Submit
// ==========================================

form.addEventListener(
    "submit",
    registerCustomer
);


// ==========================================
// Institution Type Change
// ==========================================

institutionTypeSelect.addEventListener(
    "change",
    function () {

        const type =
            institutionTypeSelect.value;

        if (type === "SCHOOL") {

            showInstitutionField();

            loadInstitutions("SCHOOL");

        }

        else if (type === "COLLEGE") {

            showInstitutionField();

            loadInstitutions("COLLEGE");

        }

        else if (type === "OTHERS") {

            hideInstitutionField();

        }

        else {

            hideInstitutionField();

        }

    }
);


// ==========================================
// Initial State
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        hideInstitutionField();

        await restoreRegistrationDraft();

    }
);


// ==========================================
// Show Institution Field
// ==========================================

function showInstitutionField() {

    institutionGroup.style.display =
        "";

    institutionSelect.required =
        true;

}


// ==========================================
// Hide Institution Field
// ==========================================

function hideInstitutionField() {

    institutionGroup.style.display =
        "none";

    institutionSelect.required =
        false;

    institutionSelect.value =
        "";

}

// ==========================================
// Restore Previous Registration Details
// ==========================================

async function restoreRegistrationDraft() {

    const savedDraft =
        sessionStorage.getItem("texlearn_registration_draft");

    if (!savedDraft) {
        return;
    }

    try {

        const draft = JSON.parse(savedDraft);

        document.getElementById("name").value =
            draft.name || "";

        document.getElementById("contact").value =
            draft.contact || "";

        document.getElementById("email").value =
            draft.email || "";

        institutionTypeSelect.value =
            draft.institutionType || "";

        if (
            draft.institutionType === "SCHOOL" ||
            draft.institutionType === "COLLEGE"
        ) {

            showInstitutionField();

            await loadInstitutions(draft.institutionType);

            institutionSelect.value =
                draft.institution || "";

        } else {

            hideInstitutionField();

        }

        console.log(
            "Previous registration details restored."
        );

    } catch (error) {

        console.error(
            "Unable to restore registration details:",
            error
        );

    }
}


// ==========================================
// Load Institutions
// ==========================================

async function loadInstitutions(type) {

    institutionSelect.innerHTML = "";

    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent =
        type === "SCHOOL"
            ? "Choose Your School"
            : "Choose Your College";

    institutionSelect.appendChild(
        defaultOption
    );


    try {

        const response =
    await fetch(
        CONFIG.WEBAPP_URL +
        "?action=institutions&type=" +
        encodeURIComponent(type)
    );


        const result =
            await response.json();


        if (
            !result.success ||
            !Array.isArray(result.institutions)
        ) {

            throw new Error(
                "Unable to load institutions."
            );

        }

        result.institutions.forEach(
            function (institution) {

                console.log(
                    "INSTITUTION RECEIVED:",
                    institution
                );


                const option =
                    document.createElement("option");


                option.value =
                    institution.id;


                option.textContent =
                    institution.name;


                institutionSelect.appendChild(
                    option
                );

            }
        );


    }

    catch (error) {

        console.error(
            "Institution loading failed:",
            error
        );


        institutionSelect.innerHTML = "";


        const errorOption =
            document.createElement("option");


        errorOption.value = "";


        errorOption.textContent =
            "Unable to load institutions";


        institutionSelect.appendChild(
            errorOption
        );

    }

}


// ==========================================
// Registration
// ==========================================

async function registerCustomer(e) {

    e.preventDefault();


    // ----------------------------------------
    // Get Form Values
    // ----------------------------------------

    const name =
        document
            .getElementById("name")
            .value
            .trim();


    const contact =
        document
            .getElementById("contact")
            .value
            .trim();


    const email =
        document
            .getElementById("email")
            .value
            .trim();


    const institutionType =
        document
            .getElementById("institutionType")
            .value;


    const institutionSelect =
    document.getElementById("institution");

const institution =
    institutionSelect
        ? institutionSelect.value.trim()
        : "";


        console.log(
    "REGISTRATION INSTITUTION DEBUG:",
    {
        institutionType:
            institutionType,
        institution:
            institution,
        selectedIndex:
            institutionSelect
                ? institutionSelect.selectedIndex
                : -1,
        selectedText:
            institutionSelect &&
            institutionSelect.selectedIndex >= 0
                ? institutionSelect.options[
                    institutionSelect.selectedIndex
                  ].textContent
                : ""
    }
);


    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (name === "") {

        alert(
            "Please enter your full name."
        );

        return;

    }


    if (contact === "") {

        alert(
            "Please enter your contact number."
        );

        return;

    }


    if (email === "") {

        alert(
            "Please enter your email address."
        );

        return;

    }


    if (institutionType === "") {

        alert(
            "Please choose your institution type."
        );

        return;

    }


    if (
        (
            institutionType === "SCHOOL" ||
            institutionType === "COLLEGE"
        ) &&
        institution === ""
    ) {

        alert(
            "Please choose your institution."
        );

        return;

    }


    // ----------------------------------------
// Save Registration Details for Recovery
// ----------------------------------------

sessionStorage.setItem(
    "texlearn_registration_draft",
    JSON.stringify({
        name: name,
        contact: contact,
        email: email,
        institutionType: institutionType,
        institution: institution
    })
);


    // ----------------------------------------
    // Disable Button
    // ----------------------------------------

    button.disabled =
        true;

    button.innerHTML =
        "Preparing Checkout...";


    try {

        
        // ------------------------------------
        // Identify an Existing Checkout Session
        // ------------------------------------

        let retrySession = null;

        const browserPendingRaw =
            sessionStorage.getItem("texlearn_pending_browser_payment");

        const nativePendingRaw =
            sessionStorage.getItem("texlearn_pending_native_payment");

        const checkoutSessionRaw =
            sessionStorage.getItem("checkoutSession");

        let browserPending = null;
        let nativePending = null;
        let previousCheckout = null;

        try {

            browserPending = browserPendingRaw
                ? JSON.parse(browserPendingRaw)
                : null;

            nativePending = nativePendingRaw
                ? JSON.parse(nativePendingRaw)
                : null;

            previousCheckout = checkoutSessionRaw
                ? JSON.parse(checkoutSessionRaw)
                : null;

        } catch (error) {

            alert(
                "Previous checkout information could not be read. " +
                "Please contact support before trying again."
            );

            button.disabled = false;
            button.innerHTML = "Continue to Secure Checkout";

            return;
        }


        // ------------------------------------
        // Check for Conflicting Pending Sessions
        // ------------------------------------

        if (
            browserPending &&
            nativePending &&
            (
                browserPending.customerID !== nativePending.customerID ||
                browserPending.orderID !== nativePending.orderID
            )
        ) {

            alert(
                "More than one pending payment session was found. " +
                "Please contact support before trying again."
            );

            button.disabled = false;
            button.innerHTML = "Continue to Secure Checkout";

            return;
        }


        // ------------------------------------
        // Prefer the Original Pending Payment
        // ------------------------------------

        const pendingSession =
            browserPending || nativePending;

        if (pendingSession) {

            if (
                !pendingSession.customerID ||
                !pendingSession.token ||
                !pendingSession.orderID
            ) {

                alert(
                    "The previous payment session is incomplete. " +
                    "Please contact support before trying again."
                );

                button.disabled = false;
                button.innerHTML = "Continue to Secure Checkout";

                return;
            }

            retrySession = pendingSession;

        } else if (previousCheckout) {

            if (
                previousCheckout.customerID &&
                previousCheckout.token &&
                previousCheckout.razorpay &&
                previousCheckout.razorpay.orderID
            ) {

                retrySession = previousCheckout;

            }

        }


        // ------------------------------------
        // Get Referral Partner ID
        // ------------------------------------

        const partnerID =
            (localStorage.getItem("texlearn_partner_id") || "")
                .trim()
                .toUpperCase();

        console.log(
            "REGISTRATION PARTNER ID:",
            partnerID || "No referral"
        );

        console.log(
            "EXISTING CHECKOUT SESSION:",
            retrySession ? "Found" : "Not found"
        );


        // ------------------------------------
        // Prepare Registration Request
        // ------------------------------------

        const formData =
            new URLSearchParams();

        formData.append(
            "action",
            retrySession
                ? "update_pending_registration"
                : "register"
        );

        formData.append("name", name);
        formData.append("contact", contact);
        formData.append("email", email);
        formData.append("institutionType", institutionType);
        formData.append("institution", institution);


        // ------------------------------------
        // Add Existing Customer Credentials
        // Only for a payment retry
        // ------------------------------------

        if (retrySession) {

            formData.append(
                "customerID",
                retrySession.customerID
            );

            formData.append(
                "token",
                retrySession.token
            );

        } else {

            formData.append(
                "partnerID",
                partnerID
            );

        }


        // ------------------------------------
        // Send Registration Request
        // ------------------------------------

        const response =
            await fetch(
                CONFIG.WEBAPP_URL,
                {
                    method: "POST",
                    body: formData
                }
            );


        const rawResponse =
            await response.text();

        console.log(
            "REGISTRATION HTTP STATUS:",
            response.status
        );

        console.log(
            "REGISTRATION RAW RESPONSE:",
            rawResponse
        );

        const result =
            JSON.parse(rawResponse);


        // ------------------------------------
        // Payment Already Confirmed
        // ------------------------------------

        if (result.paid === true) {

            alert(
                "Your previous payment has already been confirmed. " +
                "Please do not make another payment. " +
                "If you have not received access, contact support."
            );

            button.disabled = false;
            button.innerHTML = "Continue to Secure Checkout";

            return;
        }


        // ------------------------------------
        // Registration Failed
        // ------------------------------------

        if (!result.success) {

            alert(
                result.message ||
                "Unable to continue registration. Please try again."
            );

            button.disabled = false;

            button.innerHTML =
                "Continue to Secure Checkout";

            return;
        }


        // ------------------------------------
        // Validate Retry Checkout Details
        // ------------------------------------

        if (
            retrySession &&
            (
                result.retryAllowed !== true ||
                result.paymentState !== "RETRY_ALLOWED" ||
                !result.razorpay ||
                !result.razorpay.orderID ||
                !Number(result.razorpay.amount)
            )
        ) {

            alert(
                result.message ||
                "The previous payment cannot safely be retried yet. " +
                "Please contact support."
            );

            button.disabled = false;
            button.innerHTML = "Continue to Secure Checkout";

            return;
        }


        // ------------------------------------
        // Clear Old Pending Markers
        // Only after Server Confirms Safe Retry
        // ------------------------------------

        if (retrySession) {

            sessionStorage.removeItem(
                "texlearn_pending_browser_payment"
            );

            sessionStorage.removeItem(
                "texlearn_pending_native_payment"
            );

        }


        // ------------------------------------
        // Save Checkout Session
        // ------------------------------------

        sessionStorage.setItem(
            "checkoutSession",
            JSON.stringify(result)
        );


        // ------------------------------------
        // Continue to Checkout
        // ------------------------------------

        window.location.href =
            "checkout.html";


    }

    catch (error) {

        console.error(
            "Registration error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );

        button.disabled = false;

        button.innerHTML =
            "Continue to Secure Checkout";

    }

}
