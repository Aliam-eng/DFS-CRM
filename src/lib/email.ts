import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string, purpose: string) {
  const subject =
    purpose === "EMAIL_VERIFICATION"
      ? "DFS - Verify Your Email"
      : purpose === "AGREEMENT_SIGNATURE"
      ? "DFS - Sign Your Client Agreement"
      : "DFS - Password Reset Code";

  const heading =
    purpose === "EMAIL_VERIFICATION"
      ? "Verify Your Email"
      : purpose === "AGREEMENT_SIGNATURE"
      ? "Sign Your Client Agreement"
      : "Reset Your Password";

  const action =
    purpose === "EMAIL_VERIFICATION"
      ? "verify your email address"
      : purpose === "AGREEMENT_SIGNATURE"
      ? "electronically sign your DFS client agreement"
      : "reset your password";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #21d94f; margin: 0;">DFS</h1>
      </div>
      <h2 style="color: #1f2937;">${heading}</h2>
      <p style="color: #4b5563;">Use the following code to ${action}:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #1f2937; border-radius: 8px; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
      <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">DFS Platform</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"DFS" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

const kycStatusMessages: Record<string, { subject: string; heading: string; body: string }> = {
  SUBMITTED: {
    subject: "DFS - KYC Submitted",
    heading: "KYC Application Submitted",
    body: "Your KYC application has been submitted and is now being reviewed by our Operations team.",
  },
  OPERATIONS_APPROVED: {
    subject: "DFS - KYC Moved to Compliance Review",
    heading: "Operations Review Passed",
    body: "Your KYC has passed operations review and is now under final compliance review.",
  },
  OPERATIONS_REJECTED: {
    subject: "DFS - KYC Returned for Revision",
    heading: "KYC Returned for Revision",
    body: "Your KYC has been returned for revision by our Operations team.",
  },
  COMPLIANCE_APPROVED: {
    subject: "DFS - KYC Approved",
    heading: "KYC Fully Approved",
    body: "Your KYC has been fully approved. Welcome to DFS!",
  },
  COMPLIANCE_REJECTED: {
    subject: "DFS - KYC Rejected",
    heading: "KYC Returned for Revision",
    body: "Your KYC has been returned for revision by our Compliance team.",
  },
};

export async function sendKycStatusEmail(to: string, clientName: string, status: string, notes?: string) {
  const config = kycStatusMessages[status];
  if (!config) {
    console.error(`Unknown KYC status for email: ${status}`);
    return false;
  }

  const notesSection = notes
    ? `<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #92400e; margin: 0; font-weight: bold;">Reason:</p>
        <p style="color: #92400e; margin: 5px 0 0 0;">${notes}</p>
      </div>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #21d94f; margin: 0;">DFS</h1>
      </div>
      <h2 style="color: #1f2937;">${config.heading}</h2>
      <p style="color: #4b5563;">Dear ${clientName},</p>
      <p style="color: #4b5563;">${config.body}</p>
      ${notesSection}
      <p style="color: #6b7280; font-size: 14px;">You can check your KYC status anytime by logging into your DFS account.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">DFS Platform</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"DFS" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: config.subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send KYC status email:", error);
    return false;
  }
}
