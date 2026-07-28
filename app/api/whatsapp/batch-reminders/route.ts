import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Fetch all pending/unpaid invoices
    const { data: unpaidInvoices, error } = await supabaseAdmin
      .from("invoices")
      .select("id")
      .gt("balance", 0);

    if (error || !unpaidInvoices) {
      return NextResponse.json({ error: "Failed to fetch unpaid invoices" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const results = [];

    // Dispatch reminders asynchronously
    for (const inv of unpaidInvoices) {
      const res = await fetch(`${appUrl}/api/whatsapp/send-invoice-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: inv.id }),
      });
      results.push({ invoiceId: inv.id, status: res.status });
    }

    return NextResponse.json({
      status: "SUCCESS",
      processedCount: unpaidInvoices.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}