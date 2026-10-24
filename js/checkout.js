
/*************************************************
 SAMRAMBA KERALAM 2030
 GitHub + Android Native Checkout
*************************************************/

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

    paymentButton.addEventListener("click", function () {
        if (
            window.TEXLearnNative &&
            typeof window.TEXLearnNative.openCheckout === "function"
        ) {
            openNativeRazorpayCheckout(session, paymentButton);
        } else {
            openRazorpayCheckout(session, paymentButton);
        }
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

function restorePaymentButton(button) {
    button.disabled = false;
    button.style.opacity = "1";
    button.style.cursor = "pointer";
    button.textContent = "Continue to Payment";
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
                sessionStorage.setItem(
                    "paymentResult",
                    JSON.stringify({
                        ...result,
                        success: true,
                        recovered: true
                    })
                );

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






/*************************************************
 Existing Browser Checkout — UPI Return Recovery
*************************************************/

function openRazorpayCheckout(session, paymentButton) {
    if (typeof Razorpay === "undefined") {
        console.error("Razorpay SDK not loaded.");
        alert("Payment system is not available. Please try again.");
        return;
    }

    setPaymentButtonBusy(
        paymentButton,
        "Preparing Secure Payment..."
    );

    window.__texlearnBrowserVerificationStarted = false;

    let pageWasHidden = false;
    let recoveryStarted = false;
    let checkoutDismissed = false;

    function cleanupListeners() {
        document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        window.removeEventListener("pageshow", handlePageShow);
    }

    async function checkPaymentAfterReturn() {
       if (
    !pageWasHidden ||
    document.visibilityState !== "visible" ||
    recoveryStarted ||
    window.__texlearnBrowserVerificationStarted
) {
    return;
}

        recoveryStarted = true;

        // Give Razorpay's own success callback time to resume.
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (window.__texlearnBrowserVerificationStarted) {
            cleanupListeners();
            return;
        }

        const recovered = await recoverBrowserPayment(session);

        if (recovered) {
            cleanupListeners();
            return;
        }

       cleanupListeners();

if (!window.__texlearnBrowserVerificationStarted) {
    setPaymentButtonBusy(
        paymentButton,
        "Payment Status Unconfirmed"
    );

    alert(
        "We couldn't confirm your payment yet.\n\n" +
        "If you completed the payment or money was deducted, " +
        "please check your access email or contact support " +
        "before attempting another payment."
    );

    console.warn(
        "Payment remains unconfirmed after browser return. " +
        "The payment button remains disabled to prevent an immediate retry."
    );
}
    }

    function handleVisibilityChange() {
        if (document.visibilityState === "hidden") {
            pageWasHidden = true;
            return;
        }

        if (document.visibilityState === "visible") {
            checkPaymentAfterReturn();
        }
    }

    function handlePageShow() {
        if (pageWasHidden) {
            checkPaymentAfterReturn();
        }
    }

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

    window.addEventListener("pageshow", handlePageShow);

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
            institution:
                session.institutionName ||
                session.institution ||
                ""
        },

        theme: {
            color: "#0A8754"
        },

        readonly: {
            email: true,
            name: true
        },

        handler: function (response) {
            window.__texlearnBrowserVerificationStarted = true;
            cleanupListeners();

            verifyPayment(response, session, paymentButton);
        },

        modal: {
            ondismiss: function () {
                checkoutDismissed = true;

                // Keep recovery listeners if the page switched away
                // to a UPI app and has not yet resumed.
                if (!pageWasHidden) {
                    cleanupListeners();
                }

                if (
    !pageWasHidden &&
    !window.__texlearnBrowserVerificationStarted &&
    !recoveryStarted
) {
    restorePaymentButton(paymentButton);
}
            }
        }
    };

    try {
        const rzp = new Razorpay(options);

        rzp.on("payment.failed", function (response) {
            console.error("Razorpay payment.failed event:", response);

            // If Chrome switched to another app, let the return
            // recovery check the server before declaring failure.
            if (pageWasHidden) {
                checkPaymentAfterReturn();
                return;
            }

            cleanupListeners();
            restorePaymentButton(paymentButton);

            alert(
                "Razorpay reported a payment failure. " +
                "If money was deducted, check your payment status " +
                "before attempting another payment."
            );
        });

        rzp.open();

    } catch (error) {
        cleanupListeners();

        console.error("Unable to open Razorpay checkout:", error);

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

        window.location.href = "/TEXLearn/success.html";

    } catch (error) {
        console.error("Payment verification error:", error);

        restorePaymentButton(paymentButton);

        alert(
            (error.message || "Payment verification failed.") +
            " If money was deducted, please check your payment status before retrying."
        );
    }
}
