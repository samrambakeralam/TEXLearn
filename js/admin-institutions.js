// ==========================================
// TEXLearn
// Institution Management
// ==========================================

const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbzQFLeWMQAX7gbedsu859N8nEZnGoAFinj4dn1JgpX0La7GSy-2xGHK38MdjcHM2ckk/exec";


const accessCard =
    document.getElementById(
        "accessCard"
    );


const adminContent =
    document.getElementById(
        "adminContent"
    );


const adminKeyInput =
    document.getElementById(
        "adminKey"
    );


const unlockButton =
    document.getElementById(
        "unlockButton"
    );


const accessMessage =
    document.getElementById(
        "accessMessage"
    );


const form =
    document.getElementById(
        "institutionForm"
    );


const addButton =
    document.getElementById(
        "addButton"
    );


const message =
    document.getElementById(
        "message"
    );


const tableBody =
    document.getElementById(
        "institutionTableBody"
    );


// ==========================================
// PRINCIPAL TRIAL ELEMENTS
// ==========================================

const principalTrialForm =
    document.getElementById(
        "principalTrialForm"
    );

const activateTrialButton =
    document.getElementById(
        "activateTrialButton"
    );

const trialMessage =
    document.getElementById(
        "trialMessage"
    );

const trialResult =
    document.getElementById(
        "trialResult"
    );

const trialAccessLink =
    document.getElementById(
        "trialAccessLink"
    );

const copyTrialLinkButton =
    document.getElementById(
        "copyTrialLinkButton"
    );

let adminKey = "";


// ==========================================
// Unlock
// ==========================================

unlockButton.addEventListener(
    "click",
    unlockAdmin
);


adminKeyInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            unlockAdmin();

        }

    }
);


// ==========================================
// Verify Admin Access
// ==========================================

async function unlockAdmin() {

    const key =
        adminKeyInput
            .value
            .trim();


    if (!key) {

        showAccessMessage(
            "Please enter your admin access key.",
            "error"
        );

        return;

    }


    unlockButton.disabled =
        true;

    unlockButton.textContent =
        "Checking...";


    try {

        const response =
            await fetch(
                WEB_APP_URL +
                "?action=admininstitutions",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify({

                            key: key

                        })

                }
            );


        const result =
            await response.json();


        if (
            !result.success
        ) {

            showAccessMessage(
                result.message ||
                "Access denied.",
                "error"
            );

            return;

        }


        //------------------------------------------------
        // Store key only in memory
        //------------------------------------------------

        adminKey =
            key;


        //------------------------------------------------
        // Unlock interface
        //------------------------------------------------

        adminContent.classList.add(
            "unlocked"
        );


        accessCard.style.display =
            "none";


        //------------------------------------------------
        // Display institutions
        //------------------------------------------------

        renderInstitutions(
            result.institutions || []
        );


    }

    catch (error) {

        console.error(
            "Admin verification error:",
            error
        );


        showAccessMessage(
            "Unable to connect to the server.",
            "error"
        );

    }

    finally {

        unlockButton.disabled =
            false;

        unlockButton.textContent =
            "Unlock";

    }

}


// ==========================================
// Add Institution
// ==========================================

form.addEventListener(
    "submit",
    addInstitution
);


async function addInstitution(e) {

    e.preventDefault();


    const name =
        document
            .getElementById(
                "institutionName"
            )
            .value
            .trim();


    const type =
        document
            .getElementById(
                "institutionType"
            )
            .value;


    const status =
        document
            .getElementById(
                "institutionStatus"
            )
            .value;


    if (!name) {

        showMessage(
            "Please enter the institution name.",
            "error"
        );

        return;

    }


    if (!type) {

        showMessage(
            "Please select the institution type.",
            "error"
        );

        return;

    }


    if (!adminKey) {

        showMessage(
            "Admin access is required.",
            "error"
        );

        return;

    }


    addButton.disabled =
        true;

    addButton.textContent =
        "Adding Institution...";


    try {

                const response =
            await fetch(
                WEB_APP_URL +
                "?action=adminaddinstitution",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify({

                            key:
                                adminKey,

                            name:
                                name,

                            type:
                                type,

                            status:
                                status

                        })

                }
            );


        //------------------------------------------------
        // Read server response as text first
        //------------------------------------------------

        const responseText =
            await response.text();


        console.log(
            "ADMIN ADD RESPONSE:",
            responseText
        );


        //------------------------------------------------
        // Parse JSON response
        //------------------------------------------------

        let result;

        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch (parseError) {

            console.error(
                "ADMIN ADD JSON PARSE ERROR:",
                parseError
            );

            console.error(
                "RAW SERVER RESPONSE:",
                responseText
            );

            showMessage(
                "The institution may have been added, but the server response could not be read.",
                "error"
            );

            return;

        }


         if (!result.success) {

            showMessage(
                result.message ||
                "Unable to add institution.",
                "error"
            );

            return;

        }


        //------------------------------------------------
        // SUCCESS
        //------------------------------------------------

        const addedInstitution =
            result.institution;


        if (!addedInstitution) {

            showMessage(
                "Institution was added, but the server did not return the institution details.",
                "error"
            );

            return;

        }


        //------------------------------------------------
        // Show success immediately
        //------------------------------------------------

        showMessage(

            "Institution added successfully. " +
            "Institution ID: " +
            addedInstitution.id,

            "success"

        );


        //------------------------------------------------
        // Clear form
        //------------------------------------------------

        form.reset();


        //------------------------------------------------
        // Update table
        //------------------------------------------------

        try {

            addInstitutionToTable(
                addedInstitution
            );

        } catch (tableError) {

            console.error(
                "Institution added, but table update failed:",
                tableError
            );

        }

    }

    catch (error) {

        console.error(
            "Add institution error:",
            error
        );


        showMessage(
            "Unable to connect to the server.",
            "error"
        );

    }

    finally {

        addButton.disabled =
            false;

        addButton.textContent =
            "Add Institution";

    }

}


// ==========================================
// PRINCIPAL TRIAL ACTIVATION
// ==========================================

principalTrialForm.addEventListener(
    "submit",
    activatePrincipalTrial
);


async function activatePrincipalTrial(e) {

    e.preventDefault();

    const institutionName =
        document.getElementById(
            "trialInstitutionName"
        ).value.trim();

    const principalEmail =
        document.getElementById(
            "trialPrincipalEmail"
        ).value.trim();


    if (!adminKey) {

        showTrialMessage(
            "Admin access is required.",
            "error"
        );

        return;

    }


    if (!institutionName || !principalEmail) {

        showTrialMessage(
            "Please complete both fields.",
            "error"
        );

        return;

    }


    activateTrialButton.disabled = true;

    activateTrialButton.textContent =
        "Activating Trial...";

    trialResult.style.display = "none";


    try {

        const response = await fetch(
            WEB_APP_URL +
            "?action=adminactivateprincipaltrial",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body: JSON.stringify({

                    key: adminKey,

                    institutionName:
                        institutionName,

                    principalEmail:
                        principalEmail

                })

            }
        );


        const responseText =
            await response.text();


        console.log(
            "PRINCIPAL TRIAL RESPONSE:",
            responseText
        );


        let result;

        try {

            result = JSON.parse(
                responseText
            );

        } catch (parseError) {

            console.error(
                "TRIAL JSON PARSE ERROR:",
                parseError
            );

            showTrialMessage(
                "The server returned an invalid response.",
                "error"
            );

            return;

        }


        if (
            !result.success ||
            !result.accessLink
        ) {

            showTrialMessage(
                result.message ||
                "Unable to activate principal trial.",
                "error"
            );

            return;

        }


        // Display generated access link.

        trialAccessLink.textContent =
            result.accessLink;


        trialResult.style.display =
            "block";


        showTrialMessage(
            "Principal trial activated successfully. Trial ID: " +
            result.trialId +
            ". Expires: " +
            new Date(
                result.expiresAt
            ).toLocaleString("en-IN"),
            "success"
        );


        // Clear the form after successful activation.

        principalTrialForm.reset();

    }

    catch (error) {

        console.error(
            "Principal trial activation error:",
            error
        );


        showTrialMessage(
            "Unable to connect to the server.",
            "error"
        );

    }

    finally {

        activateTrialButton.disabled =
            false;

        activateTrialButton.textContent =
            "Activate 72-Hour Trial";

    }

}


// ==========================================
// TRIAL MESSAGE
// ==========================================

function showTrialMessage(
    text,
    type
) {

    trialMessage.textContent = text;

    trialMessage.className =
        "message " + type;

}


// ==========================================
// COPY PRINCIPAL ACCESS LINK
// ==========================================

copyTrialLinkButton.addEventListener(
    "click",
    async function () {

        const link =
            trialAccessLink.textContent.trim();

        if (!link) {
            return;
        }

        try {

            await navigator.clipboard.writeText(
                link
            );

            copyTrialLinkButton.textContent =
                "Copied!";

        }

        catch (error) {

            console.error(
                "Copy link error:",
                error
            );

            showTrialMessage(
                "Unable to copy automatically. Please select and copy the link.",
                "error"
            );

        }

    }
);


// ==========================================
// Render Institution List
// ==========================================

function renderInstitutions(
    institutions
) {

    tableBody.innerHTML =
        "";


    if (
        !institutions ||
        institutions.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty">

                    No institutions found.

                </td>

            </tr>

        `;

        return;

    }


    institutions.forEach(
        function (institution) {

            addInstitutionToTable(
                institution
            );

        }
    );

}


// ==========================================
// Add Institution to Table
// ==========================================

function addInstitutionToTable(
    institution
) {

    const row =
        document.createElement(
            "tr"
        );


    const status =
        String(
            institution.status || ""
        ).trim();


    const statusClass =
        status.toLowerCase() ===
        "active"
            ? "active"
            : "inactive";


    row.innerHTML = `

        <td>
            ${escapeHTML(
                institution.id
            )}
        </td>

        <td>
            ${escapeHTML(
                institution.name
            )}
        </td>

        <td>
            ${escapeHTML(
                institution.type
            )}
        </td>

        <td>

            <span
                class="status ${statusClass}">

                ${escapeHTML(
                    status
                )}

            </span>

        </td>

    `;


    tableBody.appendChild(
        row
    );

}


// ==========================================
// Access Message
// ==========================================

function showAccessMessage(
    text,
    type
) {

    accessMessage.textContent =
        text;

    accessMessage.className =
        "message " + type;

}


// ==========================================
// Form Message
// ==========================================

function showMessage(
    text,
    type
) {

    message.textContent =
        text;

    message.className =
        "message " + type;

}


// ==========================================
// HTML Escape
// ==========================================

function escapeHTML(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}