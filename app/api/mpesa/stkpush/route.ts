import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, amount, accountReference } = await req.json();

    if (!phoneNumber || !amount || !accountReference) {
      return NextResponse.json(
        { error: "Phone number, amount, and account reference are required." },
        { status: 400 }
      );
    }

    // Standardize phone number to 254XXXXXXXXX format
    let formattedPhone = phoneNumber.trim().replace("+", "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    }

    // =========================================================================
    // DARAJA MPESA INTEGRATION PLACEHOLDER
    // Note: Replace process.env values with your live Daraja API credentials
    // =========================================================================
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;
    const shortcode = process.env.MPESA_SHORTCODE || "174379"; // Default Daraja Sandbox Business Shortcode

    // If sandbox credentials aren't supplied yet, simulate success response for frontend testing
    if (!consumerKey || !consumerSecret || !passkey) {
      console.log(
        `[STK Push Simulated] Initiating KSh ${amount} payment for ${accountReference} to ${formattedPhone}`
      );

      return NextResponse.json({
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing",
        MerchantRequestID: "SIMULATED-REQ-ID-" + Date.now(),
        CheckoutRequestID: "SIMULATED-CHK-ID-" + Date.now(),
        CustomerMessage: `Success. Prompt sent to ${formattedPhone}. Enter M-Pesa PIN to complete payment.`,
      });
    }

    // 1. Fetch OAuth Access Token from Safaricom
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const tokenRes = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Generate Password & Timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
      "base64"
    );

    // 3. Initiate Express STK Push
    const stkRes = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(amount),
          PartyA: formattedPhone,
          PartyB: shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL || "https://prop-manager-frontend.vercel.app"}/api/mpesa/webhook`,
          AccountReference: accountReference,
          TransactionDesc: `Rent/Utility Payment for ${accountReference}`,
        }),
      }
    );

    const stkData = await stkRes.json();
    return NextResponse.json(stkData);
  } catch (err: any) {
    console.error("STK Push Route Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initiate M-Pesa payment." },
      { status: 500 }
    );
  }
}