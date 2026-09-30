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
                "?action=admintest",
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


        const result =
            await response.json();


        if (!result.success) {

            showMessage(
                result.message ||
                "Unable to add institution.",
                "error"
            );

            return;

        }


        //------------------------------------------------
        // Success
        //------------------------------------------------

        showMessage(

            "Institution added successfully. " +
            "Institution ID: " +
            result.institution.id,

            "success"

        );


        //------------------------------------------------
        // Clear form
        //------------------------------------------------

        form.reset();


        //------------------------------------------------
        // Add new institution to table
        //------------------------------------------------

        if (
            result.institution
        ) {

            addInstitutionToTable(
                result.institution
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