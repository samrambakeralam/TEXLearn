/*************************************************
 SAMRAMBA KERALAM 2030
 GitHub Checkout
*************************************************/

document.addEventListener("DOMContentLoaded", function () {

    console.log("CHECKOUT.JS LOADED");

    const paymentButton =
        document.getElementById("paymentButton");

    if (!paymentButton) {
        console.error("Payment button not found.");
        return;
    }

    //------------------------------------------
    // Get Registration Session
    //------------------------------------------

    const storedSession =
        sessionStorage.getItem("checkoutSession");

    if (!storedSession) {

        console.error(
            "checkoutSession not found."
        );

        paymentButton.disabled = true;

        return;
    }

    let session;

    try {

        session =
            JSON.parse(storedSession);

    }
    catch (error) {

        console.error(
            "Invalid checkoutSession:",
            error
        );

        paymentButton.disabled = true;

        return;
    }

    console.log(
        "Checkout session:",
        session
    );


    //------------------------------------------
    // Validate Session
    //------------------------------------------

    if (
        !session.customerID ||
        !session.token ||
        !session.razorpay ||
        !session.razorpay.orderID
    ) {

        console.error(
            "Incomplete checkout session."
        );

        paymentButton.disabled = true;

        return;
    }


    //------------------------------------------
    // Display Real Customer Information
    //------------------------------------------

    const customerName =
        document.getElementById(
            "customerName"
        );

    const customerEmail =
        document.getElementById(
            "customerEmail"
        );

    const customerInstitution =
        document.getElementById(
            "customerInstitution"
        );

    const customerID =
        document.getElementById(
            "customerID"
        );


    if (customerName) {

        customerName.textContent =
            session.name || "";

    }

    if (customerEmail) {

        customerEmail.textContent =
            session.email || "";

    }

    if (customerInstitution) {

        customerInstitution.textContent =
            session.institutionName ||
            session.institution ||
            "";

    }

    if (customerID) {

        customerID.textContent =
            session.customerID;

    }


    //------------------------------------------
    // Payment Button
    //------------------------------------------

    paymentButton.addEventListener(
        "click",
        function () {

            openRazorpayCheckout(
                session,
                paymentButton
            );

        }
    );

});



/*************************************************
 Open Razorpay Checkout
*************************************************/

function openRazorpayCheckout(
    session,
    paymentButton
) {

    if (
        typeof Razorpay ===
        "undefined"
    ) {

        console.error(
            "Razorpay SDK not loaded."
        );

        alert(
            "Payment system is not available. Please try again."
        );

        return;
    }


    //------------------------------------------
    // Disable Button
    //------------------------------------------

    paymentButton.disabled = true;

    paymentButton.style.opacity =
        "0.7";

    paymentButton.style.cursor =
        "not-allowed";

    paymentButton.innerHTML =
        "Preparing Secure Payment...";


    //------------------------------------------
    // Razorpay Options
    //------------------------------------------

    const options = {

        key:
            session.razorpay.key,

        amount:
            session.razorpay.amount,

        currency:
            session.razorpay.currency,

        name:
            "SAMRAMBA KERALAM 2030",

        description:
            "Entrepreneurship Bundle",

        order_id:
            session.razorpay.orderID,

        prefill: {

            name:
                session.name || "",

            email:
                session.email || ""

        },

        notes: {

            customerID:
                session.customerID,

            institution:
                session.institutionName ||
                session.institution ||
                ""

        },

        theme: {

            color:
                "#0A8754"

        },

        readonly: {

            email: true,

            name: true

        },

        handler:
            function (response) {

                verifyPayment(
                    response,
                    session,
                    paymentButton
                );

            },

        modal: {

            ondismiss:
                function () {

                    restorePaymentButton(
                        paymentButton
                    );

                }

        }

    };


    //------------------------------------------
    // Create Razorpay Instance
    //------------------------------------------

    const rzp =
        new Razorpay(options);


    //------------------------------------------
    // Payment Failed
    //------------------------------------------

    rzp.on(
        "payment.failed",
        function (response) {

            console.error(
                "Razorpay payment failed:",
                response
            );

            restorePaymentButton(
                paymentButton
            );

            alert(
                "Payment failed. Please try again."
            );

        }
    );


    //------------------------------------------
    // Open Checkout
    //------------------------------------------

    rzp.open();

}



/*************************************************
 Verify Payment
*************************************************/

async function verifyPayment(
    response,
    session,
    paymentButton
) {

    console.log(
        "Razorpay payment response:",
        response
    );


    //------------------------------------------
    // Disable Button
    //------------------------------------------

    paymentButton.disabled = true;

    paymentButton.innerHTML =
        "Verifying Payment...";


    try {

        //--------------------------------------
        // Build API Request
        //--------------------------------------

        const request = {

            action:
                "VERIFY_PAYMENT",

            paymentData: {

                customerID:
                    session.customerID,

                amount:
                    session.razorpay.amount,

                razorpay_payment_id:
                    response.razorpay_payment_id,

                razorpay_order_id:
                    response.razorpay_order_id,

                razorpay_signature:
                    response.razorpay_signature

            }

        };


        console.log(
            "Sending payment verification:",
            request
        );


        //--------------------------------------
        // Call Apps Script API
        //--------------------------------------

        const apiResponse =
            await fetch(
                CONFIG.WEB_APP_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(request)

                }
            );


        //--------------------------------------
        // Read Response
        //--------------------------------------

        const result =
            await apiResponse.json();


        console.log(
            "Payment verification result:",
            result
        );


        //--------------------------------------
        // Successful Payment
        //--------------------------------------

        if (result.success) {

            sessionStorage.setItem(
                "paymentResult",
                JSON.stringify(result)
            );

            window.location.href =
                "success.html";

            return;

        }


        //--------------------------------------
        // Verification Failed
        //--------------------------------------

        throw new Error(
            result.message ||
            "Payment verification failed."
        );

    }
    catch (error) {

        console.error(
            "Payment verification error:",
            error
        );

        restorePaymentButton(
            paymentButton
        );

        alert(
            error.message ||
            "Payment verification failed."
        );

    }

}



/*************************************************
 Restore Payment Button
*************************************************/

function restorePaymentButton(
    paymentButton
) {

    paymentButton.disabled = false;

    paymentButton.style.opacity =
        "1";

    paymentButton.style.cursor =
        "pointer";

    paymentButton.innerHTML =
        "Continue to Payment";

}