import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service Role Client to write directly to Supabase bypassing RLS on server tasks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ message: "Invalid payload format" }, { status: 400 });
    }

    const { ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID, CallbackMetadata } = stkCallback;

    // Safaricom ResultCode 0 means Success
    if (ResultCode !== 0) {
      console.warn(`M-Pesa STK Push Failed [${ResultCode}]: ${ResultDesc}`);

      // Log failed transaction for audit trail
      await supabaseAdmin.from("payment_logs").insert({
        merchant_request_id: MerchantRequestID,
        checkout_request_id: CheckoutRequestID,
        status: "FAILED",
        failure_reason: ResultDesc,
      });

      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Extract Callback Metadata Parameters
    const items = CallbackMetadata?.Item || [];
    let amount: number = 0;
    let mpesaReceiptNumber: string = "";
    let phoneNumber: string = "";
    let transactionDate: string = "";

    for (const item of items) {
      if (item.Name === "Amount") amount = Number(item.Value);
      if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = String(item.Value);
      if (item.Name === "PhoneNumber") phoneNumber = String(item.Value);
      if (item.Name === "TransactionDate") transactionDate = String(item.Value);
    }

    // 1. Check for Duplicate Receipt Number
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("mpesa_receipt_number", mpesaReceiptNumber)
      .maybeSingle();

    if (existingPayment) {
      console.warn(`Duplicate M-Pesa transaction received: ${mpesaReceiptNumber}`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted Duplicate" });
    }

    // 2. Format phone number to match tenant phone format (e.g. 07XXXXXXXX or 2547XXXXXXXX)
    const formattedPhone = phoneNumber.startsWith("254")
      ? "0" + phoneNumber.slice(3)
      : phoneNumber;

    // 3. Find Tenant by Phone Number
    const { data: tenantProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, tenants(id)")
      .or(`phone.eq.${phoneNumber},phone.eq.${formattedPhone}`)
      .maybeSingle();

    const tenantId = (tenantProfile?.tenants as any)?.[0]?.id || null;

    let targetInvoiceId: string | null = null;

    if (tenantId) {
      // Find oldest active invoice with balance > 0
      const { data: activeInvoice } = await supabaseAdmin
        .from("invoices")
        .select("id, balance, amount_paid, total_amount")
        .eq("tenant_id", tenantId)
        .gt("balance", 0)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (activeInvoice) {
        targetInvoiceId = activeInvoice.id;

        const currentPaid = Number(activeInvoice.amount_paid || 0);
        const currentBalance = Number(activeInvoice.balance || 0);

        const newPaid = currentPaid + amount;
        const newBalance = Math.max(0, currentBalance - amount);
        const newStatus = newBalance === 0 ? "PAID" : "PARTIAL";

        // Update Invoice Record
        await supabaseAdmin
          .from("invoices")
          .update({
            amount_paid: newPaid,
            balance: newBalance,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetInvoiceId);
      }
    }

    // 4. Insert Record into Payments Table
    const { data: newPayment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        mpesa_receipt_number: mpesaReceiptNumber,
        amount,
        phone_number: phoneNumber,
        tenant_id: tenantId,
        invoice_id: targetInvoiceId,
        is_reconciled: targetInvoiceId !== null, // Sent to Unassigned Pool if no invoice matched
        payment_method: "MPESA_EXPRESS",
        raw_callback_payload: body,
      })
      .select("id")
      .single();

    if (paymentError) {
      console.error("Error saving payment to Supabase:", paymentError);
    }

    // 5. Audit Log Entry
    await supabaseAdmin.from("audit_logs").insert({
      action: targetInvoiceId ? "PAYMENT_AUTO_RECONCILED" : "PAYMENT_UNASSIGNED",
      details: {
        receipt: mpesaReceiptNumber,
        amount,
        phone: phoneNumber,
        invoice_id: targetInvoiceId,
      },
    });

    // Safaricom requires a 200 OK response with ResultCode 0
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error: any) {
    console.error("M-Pesa Callback Handling Error:", error);
    // Always return ResultCode 0 to Daraja so it stops retrying the webhook call
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Error Handled Internally" });
  }
}