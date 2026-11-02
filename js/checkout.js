
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
            amount: Number(session.razorpay.amount),
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


// Android native checkout pending-payment marker
const TEXLEARN_PENDING_NATIVE_PAYMENT_KEY =
    "texlearn_pending_native_payment";

function getPendingNativePayment() {
    try {
        const raw = sessionStorage.getItem(
            TEXLEARN_PENDING_NATIVE_PAYMENT_KEY
        );

        return raw ? JSON.parse(raw) : null;

    } catch (error) {
        console.error("Unable to read pending native payment:", error);
        return null;
    }
}

function savePendingNativePayment(session) {
    try {
        sessionStorage.setItem(
            TEXLEARN_PENDING_NATIVE_PAYMENT_KEY,
            JSON.stringify({
                customerID: session.customerID,
                token: session.token,
                orderID: session.razorpay.orderID,
                amount: Number(session.razorpay.amount),
                startedAt: new Date().toISOString()
            })
        );

    } catch (error) {
        console.error("Unable to save pending native payment:", error);
    }
}

function clearPendingNativePayment() {
    try {
        sessionStorage.removeItem(
            TEXLEARN_PENDING_NATIVE_PAYMENT_KEY
        );

    } catch (error) {
        console.error("Unable to clear pending native payment:", error);
    }
}



async function recoverNativePayment(session, paymentButton) {

    const pending = getPendingNativePayment();

    if (!pending) return false;

    // Require the original payment identity.
    if (
        !pending.customerID ||
        !pending.token ||
        !pending.orderID
    ) {
        console.error(
            "Pending native payment marker is incomplete."
        );

        setPaymentButtonBusy(
            paymentButton,
            "Contact Support"
        );

        alert(
            "Your previous payment session needs verification. " +
            "Please contact support before attempting another payment."
        );

        return false;
    }

    // Always recover the original customer, not a newer checkout session.
    const recoverySession = {
        customerID: pending.customerID,
        token: pending.token
    };

    if (window.__texlearnNativeRecoveryInProgress) {
        return false;
    }

    window.__texlearnNativeRecoveryInProgress = true;

    setPaymentButtonBusy(
        paymentButton,
        "Checking Payment Status..."
    );

    try {

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
                            customerID: recoverySession.customerID,
                            token: recoverySession.token
                        })
                    }
                );

                const result = await response.json();

                console.log(
                    "Native payment recovery:",
                    attempt,
                    result
                );

                if (
                    response.ok &&
                    result.success === true &&
                    result.paid === true &&
                    result.paymentID
                ) {

                    clearPendingNativePayment();

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

                    return true;
                }

            } catch (error) {

                console.error(
                    "Native recovery attempt failed:",
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

        restorePaymentButton(
            paymentButton,
            "Check Payment Status"
        );

        alert(
            "Your previous payment is still unconfirmed.\n\n" +
            "Please check again or contact support. " +
            "Do not start another payment until the previous attempt is resolved."
        );

        return false;

    } finally {

        window.__texlearnNativeRecoveryInProgress = false;
    }
}





async function resumePendingBrowserRecovery(session, paymentButton) {

    if (window.__texlearnPendingRecoveryInProgress) return;

    const pendingPayment = getPendingBrowserPayment();

    if (!pendingPayment) return;

    // The saved pending attempt must contain its original identity.
    if (
        !pendingPayment.customerID ||
        !pendingPayment.token ||
        !pendingPayment.orderID
    ) {
        console.error(
            "Pending payment marker is incomplete. Manual review required."
        );

        if (paymentButton) {
            setPaymentButtonBusy(
                paymentButton,
                "Contact Support"
            );
        }

        alert(
            "We found an incomplete previous payment record. " +
            "Please contact support before attempting another payment."
        );

        return;
    }

    // Use the original checkout identity, not the current session.
    const recoverySession = {
        customerID: pendingPayment.customerID,
        token: pendingPayment.token
    };

    window.__texlearnPendingRecoveryInProgress = true;

    if (paymentButton) {
        setPaymentButtonBusy(
            paymentButton,
            "Checking Payment Status..."
        );
    }

    console.warn(
        "Checking the original pending payment:",
        pendingPayment.customerID,
        pendingPayment.orderID
    );

    try {

        const recovered = await recoverBrowserPayment(
            recoverySession
        );

        if (recovered) return;

        // Keep the unresolved marker.
        // Do not permit a new payment while its status is unknown.

        if (paymentButton) {
            paymentButton.disabled = false;
            paymentButton.style.opacity = "1";
            paymentButton.style.cursor = "pointer";
            paymentButton.textContent = "Check Payment Status";
        }

        alert(
            "Your previous payment status is still unconfirmed.\n\n" +
            "We checked the original payment attempt, but could not " +
            "confirm its result. Please check again or contact support " +
            "before making another payment."
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

    // Recover an unresolved native payment using its original marker.
    if (getPendingNativePayment()) {
        console.warn(
            "Checkout session missing. Recovering pending native payment."
        );

        setTimeout(function () {
            recoverNativePayment(null, paymentButton);
        }, 0);

        return;
    }

    // Recover an unresolved browser payment using its original marker.
    if (getPendingBrowserPayment()) {
        console.warn(
            "Checkout session missing. Recovering pending browser payment."
        );

        setTimeout(function () {
            resumePendingBrowserRecovery(null, paymentButton);
        }, 0);

        return;
    }

    // No pending payment exists, so disable checkout.
    paymentButton.disabled = true;
    return;
}

    let session;

  try {
    session = JSON.parse(storedSession);

} catch (error) {

    console.error("Invalid checkoutSession:", error);

    if (getPendingNativePayment()) {
        setTimeout(function () {
            recoverNativePayment(null, paymentButton);
        }, 0);
        return;
    }

    if (getPendingBrowserPayment()) {
        setTimeout(function () {
            resumePendingBrowserRecovery(null, paymentButton);
        }, 0);
        return;
    }

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

    if (getPendingNativePayment()) {
        setTimeout(function () {
            recoverNativePayment(null, paymentButton);
        }, 0);
        return;
    }

    if (getPendingBrowserPayment()) {
        setTimeout(function () {
            resumePendingBrowserRecovery(null, paymentButton);
        }, 0);
        return;
    }

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


    // Resume unresolved Android native payment recovery.
if (
    getPendingNativePayment() &&
    window.TEXLearnNative &&
    typeof window.TEXLearnNative.openCheckout === "function"
) {
    setTimeout(function () {
        recoverNativePayment(session, paymentButton);
    }, 0);
}


   paymentButton.addEventListener("click", function () {

    if (
        window.TEXLearnNative &&
        typeof window.TEXLearnNative.openCheckout === "function"
    ) {

        if (getPendingNativePayment()) {
            recoverNativePayment(session, paymentButton);
            return;
        }

        openNativeRazorpayCheckout(session, paymentButton);
        return;
    }

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
    if (!button) return;

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
        savePendingNativePayment(session);

window.TEXLearnNative.openCheckout(
    JSON.stringify(options)
);

        } catch (error) {

        console.error("Native checkout launch failed:", error);

        clearPendingNativePayment();

        restorePaymentButton(paymentButton);

        alert("Unable to open payment. Please try again.");
    }
}



window.onNativeRazorpaySuccess = function (response) {

    console.log("Native Razorpay success callback:", response);

    const paymentButton =
        document.getElementById("paymentButton");

    if (
        !response ||
        !response.razorpay_payment_id ||
        !response.razorpay_order_id ||
        !response.razorpay_signature
    ) {
        setPaymentButtonBusy(paymentButton, "Contact Support");

        alert(
            "Payment response is incomplete. " +
            "Please contact support before retrying."
        );
        return;
    }

    const pending = getPendingNativePayment();

    let verificationSession;

    // Prefer the original pending-payment marker.
    // It remains usable even if checkoutSession is missing.
    if (pending) {

        const pendingAmount = Number(pending.amount);

        if (
            !pending.customerID ||
            !pending.token ||
            !pending.orderID ||
            !Number.isFinite(pendingAmount) ||
            pendingAmount <= 0
        ) {
            setPaymentButtonBusy(paymentButton, "Contact Support");

            alert(
                "Your original payment details are incomplete. " +
                "Please contact support before retrying."
            );
            return;
        }

        // Never verify against a different Razorpay order.
        if (
            String(response.razorpay_order_id) !==
            String(pending.orderID)
        ) {
            console.error("Native payment order mismatch.", {
                responseOrderID: response.razorpay_order_id,
                pendingOrderID: pending.orderID
            });

            setPaymentButtonBusy(paymentButton, "Contact Support");

            alert(
                "The payment order does not match your original checkout. " +
                "Your payment details have been preserved. " +
                "Please contact support before retrying."
            );
            return;
        }

        // Reconstruct verification details from the original marker.
        verificationSession = {
            customerID: pending.customerID,
            token: pending.token,
            razorpay: {
                orderID: pending.orderID,
                amount: pendingAmount
            }
        };

    } else {

        // No pending marker: use the current checkout session.
        const storedSession =
            sessionStorage.getItem("checkoutSession");

        if (!storedSession) {
            setPaymentButtonBusy(paymentButton, "Contact Support");

            alert(
                "Your checkout session has expired and no original " +
                "payment record is available. Please contact support."
            );
            return;
        }

        try {
            verificationSession = JSON.parse(storedSession);
        } catch (error) {
            console.error("Unable to read checkout session:", error);

            setPaymentButtonBusy(paymentButton, "Contact Support");

            alert(
                "Unable to read your checkout session. " +
                "Please contact support."
            );
            return;
        }

        if (
            !verificationSession.customerID ||
            !verificationSession.razorpay ||
            !verificationSession.razorpay.orderID ||
            !verificationSession.razorpay.amount ||
            String(response.razorpay_order_id) !==
            String(verificationSession.razorpay.orderID)
        ) {
            setPaymentButtonBusy(paymentButton, "Contact Support");

            alert(
                "The payment does not match your current checkout session. " +
                "Please contact support before retrying."
            );
            return;
        }
    }

    // Continue through the existing server-side verification.
    verifyPayment(
        response,
        verificationSession,
        paymentButton
    );
};



window.onNativeRazorpayError = async function (message) {

    console.error(
        "Native Razorpay checkout error:",
        message
    );

    const paymentButton =
        document.getElementById("paymentButton");

    const pending = getPendingNativePayment();

    // If an original payment attempt exists,
    // check its status before allowing another payment.
    if (pending) {

        await recoverNativePayment(
            null,
            paymentButton
        );

        return;
    }

    // No pending payment exists.
    restorePaymentButton(
        paymentButton,
        "Continue to Payment"
    );

    alert(
        "The payment process could not be completed.\n\n" +
        "If money was deducted, please contact support " +
        "before attempting another payment.\n\n" +
        "Details: " + String(message || "Unknown error")
    );
};


/*************************************************
 Browser UPI Return — Payment Recovery
*************************************************/


async function recoverBrowserPayment(session) {

    const pending = getPendingBrowserPayment();

    const recoverySession = pending
        ? {
            customerID: pending.customerID,
            token: pending.token
        }
        : session;

    logBrowserPaymentEvent("RECOVERY_FUNCTION_ENTERED", {
        hasCustomerID: Boolean(recoverySession?.customerID),
        hasToken: Boolean(recoverySession?.token),
        recoveringPendingCustomer: Boolean(pending)
    });

    if (
        !recoverySession?.customerID ||
        !recoverySession?.token
    ) {
        console.error("Browser recovery: session incomplete.");
        return false;
    }

    for (let attempt = 1; attempt <= 10; attempt++) {

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
                        customerID: recoverySession.customerID,
                        token: recoverySession.token
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
                customerID: recoverySession.customerID,
                httpStatus: response.status,
                success: result.success,
                paid: result.paid,
                paymentIDPresent: Boolean(result.paymentID)
            });

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
            await new Promise(resolve =>
                setTimeout(resolve, 2000)
            );
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
        clearPendingNativePayment();

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
