import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Service Role client to bypass RLS for automated backend jobs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // 1. Fetch Invoice, Tenant, and Unit Details
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select(`
        id,
        invoice_number,
        balance,
        total_amount,
        billing_month,
        tenants (
          id,
          profiles (
            full_name,
            phone
          ),
          units (
            unit_number,
            properties (
              name
            )
          )
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found or database error" },
        { status: 404 }
      );
    }

    // Extract details safely
    const tenantProfile = (invoice.tenants as any)?.profiles;
    const unitData = (invoice.tenants as any)?.units;

    if (!tenantProfile?.phone) {
      return NextResponse.json(
        { error: "Tenant phone number is missing" },
        { status: 400 }
      );
    }

    // Clean Phone Number for WhatsApp (e.g. convert 0712345678 to 254712345678)
    let formattedPhone = tenantProfile.phone.replace(/[^0-9]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    }

    const tenantName = tenantProfile.full_name || "Valued Tenant";
    const propertyName = unitData?.properties?.name || "Property";
    const unitNumber = unitData?.unit_number || "Unit";
    const balanceDue = Number(invoice.balance).toLocaleString();
    const billingMonth = invoice.billing_month || "Current Month";

    // 2. Format WhatsApp Cloud API Payload
    const whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: {
        name: "invoice_reminder_notification", // Your Meta Approved Template Name
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: tenantName },
              { type: "text", text: propertyName },
              { type: "text", text: unitNumber },
              { type: "text", text: billingMonth },
              { type: "text", text: balanceDue },
            ],
          },
        ],
      },
    };

    // 3. Dispatch to Meta WhatsApp Cloud API
    const whatsappRes = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(whatsappPayload),
      }
    );

    const whatsappData = await whatsappRes.json();

    if (!whatsappRes.ok) {
      console.error("WhatsApp API Error:", whatsappData);
      return NextResponse.json(
        { error: "Failed to deliver WhatsApp message", details: whatsappData },
        { status: 500 }
      );
    }

    // 4. Audit Log Entry in Supabase
    await supabaseAdmin.from("audit_logs").insert({
      action: "WHATSAPP_NOTIFICATION_SENT",
      details: {
        invoice_id: invoiceId,
        recipient_phone: formattedPhone,
        whatsapp_message_id: whatsappData.messages?.[0]?.id,
      },
    });

    return NextResponse.json({
      status: "SUCCESS",
      message: `WhatsApp reminder delivered to ${formattedPhone}`,
      messageId: whatsappData.messages?.[0]?.id,
    });
  } catch (err: any) {
    console.error("WhatsApp Integration Exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}