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
    function () {

        hideInstitutionField();

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
                CONFIG.WEB_APP_URL +
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


    const institution =
        document
            .getElementById("institution")
            .value;


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
    // Disable Button
    // ----------------------------------------

    button.disabled =
        true;

    button.innerHTML =
        "Preparing Checkout...";


    try {

        // ------------------------------------
        // Send Registration
        // ------------------------------------

        const response =
            await fetch(
                CONFIG.API_URL + "/register",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

 body: JSON.stringify({
    action: "register",
    name: name,
    contact: contact,
    email: email,
    institutionType: institutionType,
    institution: institution
})

                }
            );


        const result =
            await response.json();


        // ------------------------------------
        // Registration Failed
        // ------------------------------------

        if (!result.success) {

            alert(
                result.message
            );

            button.disabled =
                false;

            button.innerHTML =
                "Continue to Secure Checkout";

            return;

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


        button.disabled =
            false;


        button.innerHTML =
            "Continue to Secure Checkout";

    }

}