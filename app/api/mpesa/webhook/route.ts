import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize admin-level Supabase client for backend API processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let mpesaCode = "";
    let amount = 0;
    let phoneNumber = "";
    let accountReference = "";

    // 1. Parse Payload Strategy: Standard Daraja STK Push Callback Structure
    if (body.Body?.stkCallback) {
      const callback = body.Body.stkCallback;

      if (callback.ResultCode !== 0) {
        // Transaction failed or cancelled by user
        return NextResponse.json(
          { ResultCode: 0, ResultDesc: "Accepted failed transaction log" },
          { status: 200 }
        );
      }

      const items = callback.CallbackMetadata?.Item || [];
      for (const item of items) {
        if (item.Name === "MpesaReceiptNumber") mpesaCode = String(item.Value);
        if (item.Name === "Amount") amount = Number(item.Value);
        if (item.Name === "PhoneNumber") phoneNumber = String(item.Value);
      }
      accountReference = body.accountReference || "";
    } 
    // 2. Parse Payload Strategy: Standard C2B Payment Validation/Confirmation Payload
    else if (body.TransID) {
      mpesaCode = body.TransID;
      amount = Number(body.TransAmount || 0);
      phoneNumber = body.MSISDN || "";
      accountReference = body.BillRefNumber || "";
    } else {
      return NextResponse.json(
        { error: "Invalid M-Pesa payload schema" },
        { status: 400 }
      );
    }

    if (!mpesaCode || amount <= 0) {
      return NextResponse.json(
        { error: "Missing essential transaction fields" },
        { status: 400 }
      );
    }

    // 3. Execute atomic reconciliation via database RPC
    const { data: result, error: rpcError } = await supabaseAdmin.rpc(
      "process_mpesa_payment",
      {
        p_mpesa_code: mpesaCode,
        p_phone_number: phoneNumber,
        p_amount: amount,
        p_account_reference: accountReference,
        p_raw_payload: body,
      }
    );

    if (rpcError) {
      console.error("M-Pesa Reconciliation RPC Error:", rpcError);
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: "Internal Database Processing Error" },
        { status: 500 }
      );
    }

    // Safaricom Daraja expects standard C2B JSON response
    return NextResponse.json(
      {
        ResultCode: 0,
        ResultDesc: "Payment processed successfully",
        Data: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Webhook Internal Server Error:", error);
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "Internal Server Error" },
      { status: 500 }
    );
  }
}