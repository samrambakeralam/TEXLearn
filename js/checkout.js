
/*************************************************
 SAMRAMBA KERALAM 2030
 GitHub + Android Native Checkout
*************************************************/

// Browser-only marker for an unresolved Razorpay checkout. It survives a
// page reload/app switch, unlike window.__texlearnBrowserReturnState.
const TEXLEARN_PENDING_BROWSER_PAYMENT_KEY = "texlearn_pending_browser_payment";


/*************************************************
 TEXLearn Asynchronous Android Payment Bridge
*************************************************/

const TEXLEARN_BRIDGE_TIMEOUT_MS = 15000;

const texlearnBridgeRequests = new Map();

let texlearnBridgeRequestCounter = 0;

function handleTEXLearnBridgeMessage(event) {
    try {
        const response = JSON.parse(event.data);

        if (!response || !response.requestId) {
            return;
        }

        const pending = texlearnBridgeRequests.get(
            response.requestId
        );

        if (!pending) {
            return;
        }

        clearTimeout(pending.timeout);

        texlearnBridgeRequests.delete(response.requestId);

        if (response.success !== true) {
            pending.reject(
                new Error(
                    response.error ||
                    "Android payment bridge request failed."
                )
            );
            return;
        }

        pending.resolve(response.result ?? null);

    } catch (error) {
        console.error(
            "Invalid Android bridge response:",
            error
        );
    }
}

function requestTEXLearnBridge(action, payload = {}) {
    return new Promise((resolve, reject) => {

        const bridge = window.TEXLearnBridge;

        if (
            !bridge ||
            typeof bridge.postMessage !== "function"
        ) {
            reject(
                new Error("Android payment bridge is unavailable.")
            );
            return;
        }

        const requestId =
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${++texlearnBridgeRequestCounter}`;

        const timeout = setTimeout(() => {
            texlearnBridgeRequests.delete(requestId);

            reject(
                new Error(
                    `Android bridge timed out: ${action}`
                )
            );
        }, TEXLEARN_BRIDGE_TIMEOUT_MS);

        texlearnBridgeRequests.set(requestId, {
            resolve,
            reject,
            timeout
        });

        try {
            bridge.postMessage(
                JSON.stringify({
                    requestId,
                    action,
                    payload
                })
            );

        } catch (error) {
            clearTimeout(timeout);
            texlearnBridgeRequests.delete(requestId);
            reject(error);
        }
    });
}

// Register the Android response listener once.
if (
    window.TEXLearnBridge &&
    typeof window.TEXLearnBridge.addEventListener === "function"
) {
    window.TEXLearnBridge.addEventListener(
        "message",
        handleTEXLearnBridgeMessage
    );

    console.log(
        "TEXLearn asynchronous Android bridge listener registered."
    );
}


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
    sessionStorage.removeItem(
        TEXLEARN_PENDING_BROWSER_PAYMENT_KEY
    );

    return !sessionStorage.getItem(
        TEXLEARN_PENDING_BROWSER_PAYMENT_KEY
    );
}



// Android checkout pending-payment marker
const TEXLEARN_PENDING_NATIVE_PAYMENT_KEY =
    "texlearn_pending_native_payment";

function isNativeAndroidCheckout() {
    return !!(
        window.TEXLearnBridge &&
        typeof window.TEXLearnBridge.postMessage === "function" &&
        typeof window.TEXLearnBridge.addEventListener === "function"
    );
}

async function getPendingNativePayment() {

    if (isNativeAndroidCheckout()) {
        // A bridge failure must throw, never be treated as no pending payment.
        const result = await requestTEXLearnBridge(
            "getPendingPayment"
        );

        if (result !== null && result !== undefined) {
            return typeof result === "string"
                ? JSON.parse(result)
                : result;
        }
    }

    // Browser / legacy fallback.
    const raw = sessionStorage.getItem(
        TEXLEARN_PENDING_NATIVE_PAYMENT_KEY
    );

    return raw ? JSON.parse(raw) : null;
}

async function savePendingNativePayment(session) {

    const pending = {
        customerID: session.customerID,
        token: session.token,
        orderID: session.razorpay.orderID,
        amount: Number(session.razorpay.amount),
        startedAt: new Date().toISOString()
    };

    if (isNativeAndroidCheckout()) {

        await requestTEXLearnBridge(
            "savePendingPayment",
            pending
        );

        return true;
    }

    // Browser / legacy fallback.
    sessionStorage.setItem(
        TEXLEARN_PENDING_NATIVE_PAYMENT_KEY,
        JSON.stringify(pending)
    );

    return true;
}

async function clearPendingNativePayment() {

    if (isNativeAndroidCheckout()) {
        await requestTEXLearnBridge(
            "clearPendingPayment"
        );
    }

    // Remove the browser / legacy marker only after native success.
    sessionStorage.removeItem(
        TEXLEARN_PENDING_NATIVE_PAYMENT_KEY
    );
}



async function recoverNativePayment(session, paymentButton) {

    let pending;

    try {
        pending = await getPendingNativePayment();

    } catch (error) {

        console.error(
            "Unable to retrieve pending native payment:",
            error
        );

        setPaymentButtonBusy(
            paymentButton,
            "Check Payment Status"
        );

        alert(
            "We could not retrieve your previous payment details.\n\n" +
            "Please check your connection and try checking the payment status again. " +
            "Do not start another payment until this is resolved."
        );

        return false;
    }

    if (!pending) return false;

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

                // ------------------------------------
                // PAYMENT ALREADY CONFIRMED
                // ------------------------------------

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

                    try {
                        await clearPendingNativePayment();

                    } catch (clearError) {

                        console.error(
                            "Payment confirmed, but pending marker cleanup failed:",
                            clearError
                        );
                    }

                    window.location.href = "/success.html";

                    return true;
                }

                // ------------------------------------
                // SERVER CONFIRMS SAFE PAYMENT RETRY
                // ------------------------------------

                if (
                    response.ok &&
                    result.success === true &&
                    result.paid === false &&
                    result.retryAllowed === true &&
                    result.paymentState === "RETRY_ALLOWED"
                ) {

                    const retryRazorpay = result.razorpay;

                    const retryAmount = Number(
                        retryRazorpay?.amount
                    );

                    if (
                        !retryRazorpay ||
                        !retryRazorpay.orderID ||
                        !retryRazorpay.key ||
                        !retryRazorpay.currency ||
                        String(retryRazorpay.orderID) !==
                            String(pending.orderID) ||
                        !Number.isFinite(retryAmount) ||
                        retryAmount <= 0 ||
                        retryAmount !== Number(pending.amount)
                    ) {

                        throw new Error(
                            "Server retry details do not match the original payment order."
                        );
                    }

                    // Preserve the existing checkout information when available.
                    const updatedSession =
                        session && typeof session === "object"
                            ? session
                            : {};

                    updatedSession.customerID =
                        pending.customerID;

                    updatedSession.token =
                        pending.token;

                    updatedSession.razorpay = retryRazorpay;

                    // Save the confirmed retry session before removing
                    // the original pending-payment marker.
                    sessionStorage.setItem(
                        "checkoutSession",
                        JSON.stringify(updatedSession)
                    );

                    try {

                        await clearPendingNativePayment();

                    } catch (clearError) {

                        console.error(
                            "Safe retry confirmed, but pending marker cleanup failed:",
                            clearError
                        );

                        restorePaymentButton(
                            paymentButton,
                            "Check Payment Status"
                        );

                        alert(
                            "The server confirmed that payment can be retried, " +
                            "but we could not clear the previous payment record. " +
                            "Please check payment status again."
                        );

                        return false;
                    }

                    console.log(
                        "Safe payment retry confirmed. Original Razorpay order retained:",
                        retryRazorpay.orderID
                    );

                    // If checkoutSession was missing, initialization
                    // previously stopped before attaching the click handler.
                    // Reload so checkout initializes normally.
                    if (!session) {
                        window.location.reload();
                        return true;
                    }

                    restorePaymentButton(
                        paymentButton,
                        "Continue to Payment"
                    );

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
    "PAYMENT RECOVERY DIAGNOSTIC\n\n" +
    (
        window.__texlearnLastRecoveryMessage ||
        "No response received from recovery server."
    )
);
    } finally {

        window.__texlearnPendingRecoveryInProgress = false;

    }
}




document.addEventListener("DOMContentLoaded", async function () {

    console.log("CHECKOUT.JS LOADED");

    const paymentButton =
        document.getElementById("paymentButton");

    if (!paymentButton) {
        console.error("Payment button not found.");
        return;
    }

    const nativeCheckout = isNativeAndroidCheckout();

    // Retrieve the pending native payment before deciding whether
    // another payment can be started.
    let pendingNativePayment = null;

    try {
        pendingNativePayment = await getPendingNativePayment();

    } catch (error) {

        console.error(
            "Unable to check pending native payment during initialization:",
            error
        );

        setPaymentButtonBusy(
            paymentButton,
            "Check Payment Status"
        );

        alert(
            "We could not check your previous payment status.\n\n" +
            "Please try again. Do not start another payment until " +
            "the previous payment status has been checked."
        );

        return;
    }

    const storedSession =
        sessionStorage.getItem("checkoutSession");

    if (!storedSession) {

        console.error("checkoutSession not found.");

        if (pendingNativePayment) {
            console.warn(
                "Checkout session missing. Recovering pending native payment."
            );

            await recoverNativePayment(null, paymentButton);
            return;
        }

        if (getPendingBrowserPayment()) {
            console.warn(
                "Checkout session missing. Recovering pending browser payment."
            );

            await resumePendingBrowserRecovery(null, paymentButton);
            return;
        }

        paymentButton.disabled = true;
        return;
    }

    let session;

    try {
        session = JSON.parse(storedSession);

    } catch (error) {

        console.error("Invalid checkoutSession:", error);

        if (pendingNativePayment) {
            await recoverNativePayment(null, paymentButton);
            return;
        }

        if (getPendingBrowserPayment()) {
            await resumePendingBrowserRecovery(null, paymentButton);
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

        if (pendingNativePayment) {
            await recoverNativePayment(null, paymentButton);
            return;
        }

        if (getPendingBrowserPayment()) {
            await resumePendingBrowserRecovery(null, paymentButton);
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

    // Resume browser payment recovery only outside native Android.
    const pendingBrowserPayment = getPendingBrowserPayment();

    if (pendingBrowserPayment && !nativeCheckout) {
        await resumePendingBrowserRecovery(
            session,
            paymentButton
        );
    }

    // Resume unresolved Android payment recovery.
    if (pendingNativePayment && nativeCheckout) {
        await recoverNativePayment(
            session,
            paymentButton
        );
    }

    paymentButton.addEventListener("click", async function () {

        if (nativeCheckout) {

            let pending;

            try {
                pending = await getPendingNativePayment();

            } catch (error) {

                console.error(
                    "Unable to check pending native payment before checkout:",
                    error
                );

                setPaymentButtonBusy(
                    paymentButton,
                    "Check Payment Status"
                );

                alert(
                    "We could not check your previous payment status. " +
                    "Please try again before starting another payment."
                );

                return;
            }

            if (pending) {
                await recoverNativePayment(
                    session,
                    paymentButton
                );

                return;
            }

            openNativeRazorpayCheckout(
                session,
                paymentButton
            );

            return;
        }

        if (getPendingBrowserPayment()) {
            await resumePendingBrowserRecovery(
                session,
                paymentButton
            );

            return;
        }

        openRazorpayCheckout(
            session,
            paymentButton
        );
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


async function openNativeRazorpayCheckout(session, paymentButton) {

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

        // Persist the original payment identity before opening Razorpay.
        await savePendingNativePayment(session);

        setPaymentButtonBusy(
            paymentButton,
            "Opening Secure Payment..."
        );

        // Send the Razorpay options through the asynchronous Android bridge.
        await requestTEXLearnBridge(
            "openCheckout",
            options
        );

        console.log(
            "Native Razorpay checkout launch acknowledged by Android."
        );

    } catch (error) {

        console.error(
            "Native checkout launch or bridge communication failed:",
            error
        );

        // Preserve the pending marker. A timeout does not prove that
        // Razorpay was never opened or that payment was not completed.
        setPaymentButtonBusy(
            paymentButton,
            "Check Payment Status"
        );

        alert(
            "We could not confirm that the payment window opened.\n\n" +
            "Your payment attempt has been preserved. " +
            "Please check its status before attempting another payment."
        );
    }
}



window.onNativeRazorpaySuccess = async function (response) {

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

    let pending;

    try {
        pending = await getPendingNativePayment();
    } catch (error) {
        console.error(
            "Unable to retrieve original native payment record:",
            error
        );

        setPaymentButtonBusy(paymentButton, "Check Payment Status");

        alert(
            "We received a payment response, but could not retrieve " +
            "your original payment record.\n\n" +
            "Your payment details have not been cleared. " +
            "Please check payment status or contact support before retrying."
        );
        return;
    }

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
    await verifyPayment(
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

    let pending;

    try {
        pending = await getPendingNativePayment();
    } catch (error) {
        console.error(
            "Unable to retrieve pending payment after native checkout error:",
            error
        );

        setPaymentButtonBusy(paymentButton, "Check Payment Status");

        alert(
            "We could not retrieve your original payment record.\n\n" +
            "If money was deducted, do not attempt another payment. " +
            "Please check payment status or contact support."
        );
        return;
    }

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

    const paymentButton =
        document.getElementById("paymentButton");

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

            window.__texlearnLastRecoveryMessage =
                result.message || "No message returned by server";

            console.log("PAYMENT RECOVERY SERVER RESPONSE:", result);

            logBrowserPaymentEvent("RECOVERY_RESPONSE", {
                attempt,
                httpStatus: response.status,
                success: result.success,
                paid: result.paid,
                retryAllowed: result.retryAllowed,
                paymentState: result.paymentState,
                hasPaymentID: Boolean(result.paymentID)
            });

            if (window.__texlearnBrowserVerificationStarted) {
                return false;
            }

            // PAYMENT ALREADY CONFIRMED
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

                logBrowserPaymentEvent(
                    "RECOVERY_REDIRECT_TO_SUCCESS"
                );

                window.location.href = "/success.html";

                return true;
            }

            // SERVER CONFIRMS THAT THE ORIGINAL ORDER CAN BE RETRIED
            if (
                response.ok &&
                result.success === true &&
                result.paid === false &&
                result.retryAllowed === true &&
                result.paymentState === "RETRY_ALLOWED"
            ) {

                const retryRazorpay = result.razorpay;

                const retryAmount = Number(
                    retryRazorpay?.amount
                );

                const pendingAmount = Number(
                    pending?.amount
                );

                if (
                    !pending ||
                    !pending.orderID ||
                    !Number.isFinite(pendingAmount) ||
                    pendingAmount <= 0 ||
                    !retryRazorpay?.orderID ||
                    !retryRazorpay?.key ||
                    !retryRazorpay?.currency ||
                    String(retryRazorpay.orderID) !==
                        String(pending.orderID) ||
                    !Number.isFinite(retryAmount) ||
                    retryAmount !== pendingAmount
                ) {
                    throw new Error(
                        "Retry details do not match the original pending order."
                    );
                }

                // Restore the complete original checkout session.
                const storedSession =
                    sessionStorage.getItem("checkoutSession");

                if (!storedSession) {
                    throw new Error(
                        "Original checkout session is missing. Safe retry cannot be restored."
                    );
                }

                let updatedSession;

                try {
                    updatedSession = JSON.parse(storedSession);
                } catch (error) {
                    throw new Error(
                        "Original checkout session is invalid."
                    );
                }

                if (
                    String(updatedSession.customerID) !==
                        String(pending.customerID) ||
                    updatedSession.token !== pending.token ||
                    !updatedSession.razorpay ||
                    String(updatedSession.razorpay.orderID) !==
                        String(pending.orderID) ||
                    Number(updatedSession.razorpay.amount) !==
                        pendingAmount
                ) {
                    throw new Error(
                        "Stored checkout session does not match the original pending order."
                    );
                }

                // Keep the same order; update only verified Razorpay details.
                updatedSession.razorpay = retryRazorpay;

                sessionStorage.setItem(
                    "checkoutSession",
                    JSON.stringify(updatedSession)
                );

                                if (!clearPendingBrowserPayment()) {
                    console.error(
                        "Safe retry confirmed, but pending payment marker could not be cleared."
                    );

                    logBrowserPaymentEvent(
                        "SAFE_RETRY_MARKER_CLEANUP_FAILED",
                        {
                            orderID: retryRazorpay.orderID
                        }
                    );

                    restorePaymentButton(
                        paymentButton,
                        "Check Payment Status"
                    );

                    return false;
                }

                logBrowserPaymentEvent(
                    "SAFE_RETRY_CONFIRMED",
                    {
                        orderID: retryRazorpay.orderID
                    }
                );

                restorePaymentButton(
                    paymentButton,
                    "Continue to Payment"
                );

                return true;
            }

        } catch (error) {

            console.error(
                "Browser recovery attempt failed:",
                attempt,
                error
            );

            window.__texlearnLastRecoveryMessage =
                error.message || "Payment recovery failed.";
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

                if (
                    state.verificationStarted ||
                    state.recoveryStarted ||
                    window.__texlearnBrowserVerificationStarted
                ) {
                    return;
                }

                // Automatically check the original order after dismissal.
                state.recoveryStarted = true;

                setPaymentButtonBusy(
                    paymentButton,
                    "Checking Payment Status..."
                );

                logBrowserPaymentEvent(
                    "AUTOMATIC_DISMISS_RECOVERY_STARTED"
                );

                recoverBrowserPayment(session)
                    .then(function (recovered) {
                        if (recovered) {
                            return;
                        }

                        restorePaymentButton(
                            paymentButton,
                            getPendingBrowserPayment()
                                ? "Check Payment Status"
                                : "Continue to Payment"
                        );

                        logBrowserPaymentEvent(
                            "AUTOMATIC_DISMISS_RECOVERY_UNRESOLVED"
                        );
                    })
                    .catch(function (error) {
                        console.error(
                            "Automatic dismissal recovery failed:",
                            error
                        );

                        restorePaymentButton(
                            paymentButton,
                            "Check Payment Status"
                        );
                    })
                    .finally(function () {
                        state.recoveryStarted = false;
                    });
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

        // Server has confirmed the payment.
        sessionStorage.setItem(
            "paymentResult",
            JSON.stringify(result)
        );

        // Clear the browser recovery marker.
        clearPendingBrowserPayment();

        // Native marker cleanup is separate from payment verification.
        // A cleanup failure must not undo or misreport a verified payment.
        try {
            await clearPendingNativePayment();

        } catch (clearError) {
            console.error(
                "Payment verified, but pending native marker cleanup failed:",
                clearError
            );
        }

        window.location.href = "/success.html";

    } catch (error) {
        console.error("Payment verification error:", error);

    restorePaymentButton(
    paymentButton,
    (
        isNativeAndroidCheckout() ||
        getPendingBrowserPayment()
    )
        ? "Check Payment Status"
        : "Continue to Payment"
);

        alert(
            (error.message || "Payment verification failed.") +
            " If money was deducted, please check your payment status before retrying."
        );
    }
}

