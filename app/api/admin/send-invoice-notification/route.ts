import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const {
      invoiceId,
      email,
      phone,
      fullName,
      amount,
      dueDate,
      occupiedUnits,
      propertyNames,
    } = await req.json();

    const formattedProps = propertyNames?.length > 0 ? propertyNames.join(', ') : 'Properties';
    const messageBody = `Hello ${fullName}, your subscription invoice #${invoiceId.slice(0, 8)} for ${occupiedUnits} occupied units (${formattedProps}) totaling KES ${amount.toLocaleString()} has been generated. Due date: ${dueDate}.`;

    // 1. Dispatch Email (e.g. Resend, SendGrid, or Nodemailer)
    // await sendEmail({ to: email, subject: 'Subscription Invoice', text: messageBody });

    // 2. Dispatch SMS (e.g. Africa's Talking / Twilio)
    // await sendSms({ to: phone, message: messageBody });

    // 3. Dispatch WhatsApp Message (e.g. WhatsApp Business Cloud API / Meta)
    // await sendWhatsApp({ to: phone, message: messageBody });

    console.log(`[INVOICE DISPATCHED] -> To: ${email} & ${phone} | Body: ${messageBody}`);

    return NextResponse.json({ success: true, message: 'Invoice notifications dispatched successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Notification error' }, { status: 500 });
  }
}