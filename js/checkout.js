
/*************************************************
 SAMRAMBA KERALAM 2030
 GitHub + Android Native Checkout
*************************************************/

// Browser-only marker for an unresolved Razorpay checkout. It survives a
// page reload/app switch, unlike window.__texlearnBrowserReturnState.
const TEXLEARN_PENDING_BROWSER_PAYMENT_KEY = "texlearn_pending_browser_payment";

function getPendingBrowserPayment() {
    try {
        const raw = sessionStorage.getItem(TEXLEARN_PENDING_BROWSER_PAYMENT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error("Unable to read pending browser payment marker:", error);
        return null;
    }
}

function savePendingBrowserPayment(session) {
    try {
        sessionStorage.setItem(TEXLEARN_PENDING_BROWSER_PAYMENT_KEY, JSON.stringify({
            customerID: session.customerID,
            token: session.token,
            orderID: session.razorpay.orderID,
            startedAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error("Unable to persist pending browser payment:", error);
    }
}

function clearPendingBrowserPayment() {
    try {
        sessionStorage.removeItem(TEXLEARN_PENDING_BROWSER_PAYMENT_KEY);
    } catch (error) {
        console.error("Unable to clear pending browser payment marker:", error);
    }
}

async function resumePendingBrowserRecovery(session, paymentButton) {
    if (window.__texlearnPendingRecoveryInProgress) return;
    if (!getPendingBrowserPayment()) return;

    window.__texlearnPendingRecoveryInProgress = true;
    if (paymentButton) setPaymentButtonBusy(paymentButton, "Checking Payment Status...");
    console.warn("An unresolved browser payment was found; checking server status before allowing another payment.");

    try {
        const recovered = await recoverBrowserPayment(session);
        if (recovered) return; // recoverBrowserPayment redirects on confirmed payment.

        // Do not permit a second charge while the server cannot confirm the
        // previous attempt. The same button becomes a safe status-check action.
        if (paymentButton) {
            paymentButton.disabled = false;
            paymentButton.style.opacity = "1";
            paymentButton.style.cursor = "pointer";
            paymentButton.textContent = "Check Payment Status";
        }
        alert(
            "Your previous payment status is still unconfirmed.\n\n" +
            "We have not confirmed whether it succeeded. Please use Check Payment Status or contact support before making another payment."
        );
    } finally {
        window.__texlearnPendingRecoveryInProgress = false;
    }
}

document.addEventListener("DOMContentLoaded", function () {

    console.log("CHECKOUT.JS LOADED");

    const paymentButton =
        document.getElementById("paymentButton");

    if (!paymentButton) {
        console.error("Payment button not found.");
        return;
    }

    const storedSession =
        sessionStorage.getItem("checkoutSession");

    if (!storedSession) {
        console.error("checkoutSession not found.");
        paymentButton.disabled = true;
        return;
    }

    let session;

    try {
        session = JSON.parse(storedSession);
    } catch (error) {
        console.error("Invalid checkoutSession:", error);
        paymentButton.disabled = true;
        return;
    }

    if (
        !session.customerID ||
        !session.token ||
        !session.razorpay ||
        !session.razorpay.orderID ||
        !session.razorpay.key ||
        !session.razorpay.amount ||
        !session.razorpay.currency
    ) {
        console.error("Incomplete checkout session.");
        paymentButton.disabled = true;
        return;
    }

    const customerName =
        document.getElementById("customerName");

    const customerEmail =
        document.getElementById("customerEmail");

    const customerInstitution =
        document.getElementById("customerInstitution");

    const customerID =
        document.getElementById("customerID");

    if (customerName) {
        customerName.textContent = session.name || "";
    }

    if (customerEmail) {
        customerEmail.textContent = session.email || "";
    }

    if (customerInstitution) {
        customerInstitution.textContent =
            session.institutionName ||
            session.institution ||
            "";
    }

    if (customerID) {
        customerID.textContent = session.customerID;
    }

    // If this page was recreated during a UPI handoff, resume status recovery
    // from the persisted marker instead of relying on lost in-memory state.
    const pendingBrowserPayment = getPendingBrowserPayment();
    if (pendingBrowserPayment && !(window.TEXLearnNative && typeof window.TEXLearnNative.openCheckout === "function")) {
        setTimeout(function () {
            resumePendingBrowserRecovery(session, paymentButton);
        }, 0);
    }

    paymentButton.addEventListener("click", function () {
        if (
            window.TEXLearnNative &&
            typeof window.TEXLearnNative.openCheckout === "function"
        ) {
            openNativeRazorpayCheckout(session, paymentButton);
            return;
        }

        // An unresolved attempt must be checked with the server first; never
        // open Razorpay again merely because the user returned to this page.
        if (getPendingBrowserPayment()) {
            resumePendingBrowserRecovery(session, paymentButton);
            return;
        }

        openRazorpayCheckout(session, paymentButton);
    });

});


/*************************************************
 Button Helpers
*************************************************/

function setPaymentButtonBusy(button, text) {
    button.disabled = true;
    button.style.opacity = "0.7";
    button.style.cursor = "not-allowed";
    button.textContent = text;
}

function restorePaymentButton(button, label = "Continue to Payment") {
    if (!button) return;
    button.disabled = false;
    button.style.opacity = "1";
    button.style.cursor = "pointer";
    button.textContent = label;
}


/*************************************************
 Native Android Checkout
*************************************************/

function openNativeRazorpayCheckout(session, paymentButton) {

    setPaymentButtonBusy(
        paymentButton,
        "Opening Secure Payment..."
    );

    const options = {
        key: session.razorpay.key,
        amount: Number(session.razorpay.amount),
        currency: session.razorpay.currency,
        name: "SAMRAMBA KERALAM 2030",
        description: "Entrepreneurship Bundle",
        order_id: session.razorpay.orderID,

        prefill: {
            name: session.name || "",
            email: session.email || "",
            contact: session.contact || ""
        },

        notes: {
            customerID: session.customerID,
            institution:
                session.institutionName ||
                session.institution ||
                ""
        },

        theme: {
            color: "#0A8754"
        }
    };

    try {
        window.TEXLearnNative.openCheckout(
            JSON.stringify(options)
        );
    } catch (error) {
        console.error("Native checkout launch failed:", error);
        // Native checkout does not create a browser pending-payment marker.
        // Leave browser recovery state untouched.
        restorePaymentButton(paymentButton);
        alert("Unable to open payment. Please try again.");
    }
}


/*************************************************
 Native SDK Callbacks
*************************************************/

window.onNativeRazorpaySuccess = function (response) {

    console.log("Native Razorpay success callback:", response);

    const paymentButton =
        document.getElementById("paymentButton");

    const storedSession =
        sessionStorage.getItem("checkoutSession");

    if (!storedSession) {
        alert("Your checkout session has expired. Contact support before retrying.");
        return;
    }

    let session;

    try {
        session = JSON.parse(storedSession);
    } catch (error) {
        alert("Unable to read your checkout session. Contact support.");
        return;
    }

    if (
        !response ||
        !response.razorpay_payment_id ||
        !response.razorpay_order_id ||
        !response.razorpay_signature
    ) {
        restorePaymentButton(paymentButton);
        alert("Payment response is incomplete. Please contact support before retrying.");
        return;
    }

    verifyPayment(response, session, paymentButton);
};



window.onNativeRazorpayError = async function (message) {
    console.error("Native Razorpay checkout error:", message);

    const paymentButton =
        document.getElementById("paymentButton");

    const storedSession =
        sessionStorage.getItem("checkoutSession");

    let session = null;

    try {
        session = storedSession
            ? JSON.parse(storedSession)
            : null;
    } catch (error) {
        console.error("Unable to read checkout session:", error);
    }

    if (session && session.customerID && session.token) {
        // Allow time for the webhook to update the payment record.
        for (let attempt = 1; attempt <= 5; attempt++) {
            try {
                const response = await fetch(
                    CONFIG.API_URL + "/payment-recovery",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            customerID: session.customerID,
                            token: session.token
                        })
                    }
                );

                const result = await response.json();

                console.log(
                    "Payment recovery attempt:",
                    attempt,
                    {
                        httpStatus: response.status,
                        success: result.success,
                        paid: result.paid,
                        paymentIDPresent: Boolean(result.paymentID)
                    }
                );

                if (
                    response.ok &&
                    result.success === true &&
                    result.paid === true &&
                    result.paymentID
                ) {
                    sessionStorage.setItem(
                        "paymentResult",
                        JSON.stringify({
                            ...result,
                            success: true,
                            recovered: true
                        })
                    );

                    window.location.href =
                        "/TEXLearn/success.html";
                    return;
                }
            } catch (error) {
                console.error(
                    "Payment recovery attempt failed:",
                    attempt,
                    error
                );
            }

            if (attempt < 5) {
                await new Promise(resolve =>
                    setTimeout(resolve, 2000)
                );
            }
        }
    }

    if (paymentButton) {
        restorePaymentButton(paymentButton);
    }

    alert(
        "We couldn't confirm your payment status yet. " +
        "Please check your access email or contact support " +
        "before attempting another payment."
    );
};




/*************************************************
 Browser UPI Return — Payment Recovery
*************************************************/

async function recoverBrowserPayment(session) {

logBrowserPaymentEvent("RECOVERY_FUNCTION_ENTERED", {
    hasCustomerID: Boolean(session?.customerID),
    hasToken: Boolean(session?.token)
});

    if (!session?.customerID || !session?.token) {
        console.error("Browser recovery: checkout session incomplete.");
        return false;
    }

    for (let attempt = 1; attempt <= 10; attempt++) {
        // Normal Razorpay verification always takes priority.
        if (window.__texlearnBrowserVerificationStarted) {
            return false;
        }

        try {
            const response = await fetch(
                CONFIG.API_URL + "/payment-recovery",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        customerID: session.customerID,
                        token: session.token
                    })
                }
            );

            const result = await response.json();


            logBrowserPaymentEvent("RECOVERY_RESPONSE", {
    attempt: attempt,
    httpStatus: response.status,
    success: result.success,
    paid: result.paid,
    hasPaymentID: Boolean(result.paymentID)
});

            console.log("Browser payment recovery:", {
                attempt: attempt,
                httpStatus: response.status,
                success: result.success,
                paid: result.paid,
                paymentIDPresent: Boolean(result.paymentID)
            });

            // Check again because the normal Razorpay handler
            // might have started while the request was in flight.
            if (window.__texlearnBrowserVerificationStarted) {
                return false;
            }

            if (
                response.ok &&
                result.success === true &&
                result.paid === true &&
                result.paymentID
            ) {
                clearPendingBrowserPayment();
                sessionStorage.setItem(
                    "paymentResult",
                    JSON.stringify({
                        ...result,
                        success: true,
                        recovered: true
                    })
                );

                logBrowserPaymentEvent("RECOVERY_REDIRECT_TO_SUCCESS");

                window.location.href = "/TEXLearn/success.html";
                return true;
            }
        } catch (error) {
            console.error(
                "Browser recovery attempt failed:",
                attempt,
                error
            );
        }

        if (attempt < 10) {
    await new Promise(resolve => setTimeout(resolve, 2000));
}
    }

    console.log(
        "Browser recovery ended without confirmed payment."
    );

    return false;
}


function logBrowserPaymentEvent(event, details = {}) {
    const key = "texlearn_upi_return_diagnostics";
    let records = [];

    try {
        records = JSON.parse(
            sessionStorage.getItem(key) || "[]"
        );
    } catch (error) {
        records = [];
    }

    records.push({
        event,
        time: new Date().toISOString(),
        visibility: document.visibilityState,
        url: location.href,
        details
    });

    // Keep the latest 100 records.
    records = records.slice(-100);

    try {
        sessionStorage.setItem(key, JSON.stringify(records));
    } catch (error) {
        console.error("Unable to save payment diagnostics:", error);
    }

    console.log("[TEXLearn UPI Diagnostic]", event, details);
}



/*************************************************
 Existing Browser Checkout — UPI Return Recovery
*************************************************/

function openRazorpayCheckout(session, paymentButton) {
    if (typeof Razorpay === "undefined") {
        console.error("Razorpay SDK not loaded.");
        alert("Payment system is not available. Please try again.");
        return;
    }

    setPaymentButtonBusy(paymentButton, "Preparing Secure Payment...");

    // Keep one shared monitor for the lifetime of this checkout page.
    // A later checkout attempt updates this state instead of replacing
    // the browser lifecycle listeners from the previous attempt.
    let state = window.__texlearnBrowserReturnState;
    if (!state) {
        state = {
            session: null,
            paymentButton: null,
            pageWasHidden: false,
            recoveryStarted: false,
            verificationStarted: false,
            listenersInstalled: false
        };
        window.__texlearnBrowserReturnState = state;
    }

    // A new user-initiated checkout starts a fresh attempt. Clear stale
    // lifecycle flags left by a previous dismissed/unconfirmed attempt.
    // The button is disabled while recovery is actively running, so this
    // reset is reached only when another checkout can be started.
    state.session = session;
    state.paymentButton = paymentButton;
    state.pageWasHidden = false;
    state.recoveryStarted = false;
    state.verificationStarted = false;
    window.__texlearnBrowserVerificationStarted = false;
    logBrowserPaymentEvent("NEW_CHECKOUT_ATTEMPT_STATE_RESET");

    async function checkPaymentAfterReturn(source) {
        logBrowserPaymentEvent("RETURN_CHECK_CALLED", {
            source: source,
            pageWasHidden: state.pageWasHidden,
            recoveryStarted: state.recoveryStarted,
            verificationStarted: state.verificationStarted ||
                window.__texlearnBrowserVerificationStarted
        });

        if (
            !state.pageWasHidden ||
            document.visibilityState !== "visible" ||
            state.recoveryStarted ||
            state.verificationStarted ||
            window.__texlearnBrowserVerificationStarted
        ) {
            return;
        }

        // Consume this hidden→visible transition before awaiting anything,
        // so visibilitychange and pageshow cannot start parallel recoveries.
        state.pageWasHidden = false;
        state.recoveryStarted = true;
        setPaymentButtonBusy(state.paymentButton, "Verifying Payment...");
        logBrowserPaymentEvent("RETURN_VERIFICATION_UI_SHOWN", {
            source: source,
            visibilityState: document.visibilityState
        });

        console.log("[UPI RETURN DEBUG] Recovery started after returning from UPI.");

        // Give Razorpay's own success callback a brief chance to resume.
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (state.verificationStarted || window.__texlearnBrowserVerificationStarted) {
            state.recoveryStarted = false;
            return;
        }

        const recovered = await recoverBrowserPayment(state.session);
        if (recovered) return;

        state.recoveryStarted = false;

        if (!state.verificationStarted && !window.__texlearnBrowserVerificationStarted) {
            restorePaymentButton(
                state.paymentButton,
                getPendingBrowserPayment() ? "Check Payment Status" : "Continue to Payment"
            );
            logBrowserPaymentEvent("RECOVERY_UNCONFIRMED_BUTTON_RESTORED", {
                source: source
            });
            alert(
                "We couldn't confirm your payment yet.\n\n" +
                "If you completed the payment or money was deducted, " +
                "please check your access email or contact support " +
                "before attempting another payment."
            );
        }
    }

    function handleVisibilityChange() {
        logBrowserPaymentEvent("VISIBILITY_CHANGE", {
            visibilityState: document.visibilityState,
            pageWasHidden: state.pageWasHidden,
            recoveryStarted: state.recoveryStarted
        });

        if (document.visibilityState === "hidden") {
            state.pageWasHidden = true;
            return;
        }
        if (document.visibilityState === "visible") {
            checkPaymentAfterReturn("visibilitychange");
        }
    }

    function handlePageShow() {
        logBrowserPaymentEvent("PAGESHOW", {
            visibilityState: document.visibilityState,
            pageWasHidden: state.pageWasHidden,
            recoveryStarted: state.recoveryStarted
        });
        if (state.pageWasHidden) checkPaymentAfterReturn("pageshow");
    }

    if (!state.listenersInstalled) {
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("pageshow", handlePageShow);
        state.listenersInstalled = true;
        logBrowserPaymentEvent("PERSISTENT_RETURN_LISTENERS_INSTALLED");
    }

    const options = {
        key: session.razorpay.key,
        amount: session.razorpay.amount,
        currency: session.razorpay.currency,
        name: "SAMRAMBA KERALAM 2030",
        description: "Entrepreneurship Bundle",
        order_id: session.razorpay.orderID,

        prefill: {
            name: session.name || "",
            email: session.email || ""
        },

        notes: {
            customerID: session.customerID,
            institution: session.institutionName || session.institution || ""
        },

        theme: { color: "#0A8754" },

        readonly: { email: true, name: true },

        handler: function (response) {
            logBrowserPaymentEvent("RAZORPAY_SUCCESS_HANDLER", {
                hasPaymentID: Boolean(response?.razorpay_payment_id),
                hasOrderID: Boolean(response?.razorpay_order_id),
                hasSignature: Boolean(response?.razorpay_signature)
            });
            state.verificationStarted = true;
            window.__texlearnBrowserVerificationStarted = true;
            logBrowserPaymentEvent("VERIFY_PAYMENT_STARTED");
            verifyPayment(response, session, paymentButton);
        },

        modal: {
            ondismiss: function () {
                logBrowserPaymentEvent("RAZORPAY_MODAL_DISMISSED", {
                    pageWasHidden: state.pageWasHidden,
                    recoveryStarted: state.recoveryStarted,
                    verificationStarted: state.verificationStarted,
                    visibilityState: document.visibilityState
                });

                // Intentionally keep the single shared lifecycle listeners.
                // Chrome may deliver the app-switch visibility event late.
                if (!state.verificationStarted && !state.recoveryStarted) {
                    // A dismissal does not prove the payment failed: the UPI
                    // app may have completed payment before Razorpay dismissed.
                    // Keep the pending marker and label the next action clearly.
                    restorePaymentButton(
                        paymentButton,
                        getPendingBrowserPayment() ? "Check Payment Status" : "Continue to Payment"
                    );
                    logBrowserPaymentEvent("DISMISS_BUTTON_RESTORED_LISTENERS_KEPT", {
                        visibilityState: document.visibilityState,
                        pageWasHidden: state.pageWasHidden
                    });
                }
            }
        }
    };

    try {
        const rzp = new Razorpay(options);
        rzp.on("payment.failed", function (response) {
            console.error("Razorpay payment.failed event:", response);
            logBrowserPaymentEvent("RAZORPAY_PAYMENT_FAILED", {
                pageWasHidden: state.pageWasHidden,
                visibilityState: document.visibilityState
            });

            if (state.pageWasHidden) {
                checkPaymentAfterReturn("payment.failed");
                return;
            }

            restorePaymentButton(
                paymentButton,
                getPendingBrowserPayment() ? "Check Payment Status" : "Continue to Payment"
            );
            alert(
                "Razorpay reported a payment failure. " +
                "If money was deducted, check your payment status " +
                "before attempting another payment."
            );
        });
        // Persist the pending attempt before opening the modal. This marker
        // survives page recreation while the in-memory monitor does not.
        savePendingBrowserPayment(session);
        rzp.open();
    } catch (error) {
        console.error("Unable to open Razorpay checkout:", error);
        logBrowserPaymentEvent("RAZORPAY_OPEN_ERROR", {
            message: String(error?.message || error)
        });
        // This catch is reached when Razorpay construction/opening throws
        // synchronously. No usable checkout was opened, so remove the marker
        // created immediately before rzp.open().
        clearPendingBrowserPayment();
        restorePaymentButton(paymentButton);
        alert("Unable to open payment. Please try again.");
    }
}


/*************************************************
 Verify Payment — Existing Cloudflare Endpoint
*************************************************/

async function verifyPayment(response, session, paymentButton) {

    setPaymentButtonBusy(
        paymentButton,
        "Verifying Payment..."
    );

    try {
        const paymentData = {
            customerID: session.customerID,
            amount: session.razorpay.amount,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
        };

        const apiResponse = await fetch(
            CONFIG.API_URL + "/verify-payment",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(paymentData)
            }
        );

        const result = await apiResponse.json();

        console.log("Payment verification result:", result);

        if (!apiResponse.ok || !result.success) {
            throw new Error(
                result.message || "Payment verification failed."
            );
        }

        sessionStorage.setItem(
            "paymentResult",
            JSON.stringify(result)
        );
        clearPendingBrowserPayment();

        window.location.href = "/TEXLearn/success.html";

    } catch (error) {
        console.error("Payment verification error:", error);

        restorePaymentButton(
            paymentButton,
            getPendingBrowserPayment() ? "Check Payment Status" : "Continue to Payment"
        );

        alert(
            (error.message || "Payment verification failed.") +
            " If money was deducted, please check your payment status before retrying."
        );
    }
}
