import crypto from "crypto";
import { prisma } from "./prisma";
import { WebhookEvent, Prisma } from "@prisma/client";

const DEFAULT_TIMEOUT_MS = 10_000;

export function generateSecret(): string {
  // 32 random bytes → 64-char hex; opaque enough for HMAC + readable in UI
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Dispatches a webhook event to every active subscriber.
 *
 * Fire-and-forget: callers do NOT await the HTTP round-trips, they only
 * await the lookup + payload build. Each delivery is logged to the
 * webhook_deliveries table so Super Admin can inspect failures and
 * optionally resend.
 *
 * Never throws: webhook failures must not break the triggering business
 * action (e.g. compliance approval).
 */
export async function dispatchWebhook(
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { event, active: true },
    });
    if (webhooks.length === 0) return;

    const payload = {
      event,
      occurredAt: new Date().toISOString(),
      data,
    };

    // Fire each delivery independently — a slow or down endpoint must
    // not block delivery to other subscribers.
    for (const webhook of webhooks) {
      void deliverOne(webhook.id, webhook.url, webhook.secret, event, payload);
    }
  } catch (err) {
    console.error("dispatchWebhook lookup/payload build failed:", err);
  }
}

async function deliverOne(
  webhookId: string,
  url: string,
  secret: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const started = Date.now();
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;
  let success = false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DFS-Event": event,
        "X-DFS-Signature": `sha256=${signature}`,
        "User-Agent": "DFS-CRM-Webhook/1.0",
      },
      body,
      signal: controller.signal,
    });
    responseStatus = res.status;
    responseBody = (await res.text().catch(() => "")).slice(0, 2000);
    success = res.ok;
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : String(err);
  } finally {
    clearTimeout(timeout);
  }

  const durationMs = Date.now() - started;

  try {
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload: payload as Prisma.InputJsonValue,
        responseStatus,
        responseBody,
        errorMessage,
        success,
        durationMs,
      },
    });
  } catch (err) {
    console.error("Failed to log webhook delivery:", err);
  }
}

/**
 * Re-send a previously logged delivery (used by the admin UI
 * "Resend" button). Uses the stored payload, hits the webhook's
 * CURRENT url + secret.
 */
export async function resendDelivery(deliveryId: string): Promise<boolean> {
  const d = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhook: true },
  });
  if (!d) return false;
  await deliverOne(
    d.webhook.id,
    d.webhook.url,
    d.webhook.secret,
    d.event,
    d.payload as Record<string, unknown>,
  );
  return true;
}

/**
 * Builds the full KYC payload for KYC_FINAL_APPROVED.
 */
export async function buildKycFinalApprovedPayload(kycId: string): Promise<Record<string, unknown> | null> {
  const kyc = await prisma.kycSubmission.findUnique({
    where: { id: kycId },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true },
      },
      documents: {
        select: { id: true, documentType: true, fileName: true, side: true, uploadedAt: true },
      },
      reviews: {
        include: { reviewer: { select: { firstName: true, lastName: true, role: true } } },
        orderBy: { reviewedAt: "asc" },
      },
    },
  });
  if (!kyc) return null;

  return {
    clientId: kyc.user.id,
    email: kyc.user.email,
    firstName: kyc.user.firstName,
    lastName: kyc.user.lastName,
    phone: kyc.user.phone,
    registeredAt: kyc.user.createdAt,
    status: kyc.status,
    kycSubmissionId: kyc.id,
    submittedAt: kyc.submittedAt,
    approvedAt: new Date(),
    kyc: {
      // Part A — Personal
      firstName: kyc.firstName,
      middleName: kyc.middleName,
      lastName: kyc.lastName,
      mothersFullName: kyc.mothersFullName,
      placeOfBirth: kyc.placeOfBirth,
      dateOfBirth: kyc.dateOfBirth,
      gender: kyc.gender,
      maritalStatus: kyc.maritalStatus,
      spouseFullName: kyc.spouseFullName,
      spouseProfession: kyc.spouseProfession,
      numberOfDependents: kyc.numberOfDependents,
      nationality: kyc.nationality,
      otherNationality: kyc.otherNationality,
      idNumber: kyc.idNumber,
      idIssueDate: kyc.idIssueDate,
      passportNumber: kyc.passportNumber,
      passportExpiryDate: kyc.passportExpiryDate,
      phoneNumber: kyc.phoneNumber,
      emailAddress: kyc.emailAddress,
      // Part B — Address
      homeStatus: kyc.homeStatus,
      primaryCountry: kyc.primaryCountry,
      primaryCity: kyc.primaryCity,
      primaryArea: kyc.primaryArea,
      primaryStreet: kyc.primaryStreet,
      primaryBuilding: kyc.primaryBuilding,
      primaryFloor: kyc.primaryFloor,
      primaryApartment: kyc.primaryApartment,
      hasSecondaryAddress: kyc.hasSecondaryAddress,
      secondaryHomeStatus: kyc.secondaryHomeStatus,
      secondaryCountry: kyc.secondaryCountry,
      secondaryCity: kyc.secondaryCity,
      secondaryArea: kyc.secondaryArea,
      secondaryStreet: kyc.secondaryStreet,
      secondaryBuilding: kyc.secondaryBuilding,
      secondaryFloor: kyc.secondaryFloor,
      secondaryApartment: kyc.secondaryApartment,
      // Part C — Employment
      employmentCategory: kyc.employmentCategory,
      currentProfession: kyc.currentProfession,
      institutionName: kyc.institutionName,
      natureOfBusiness: kyc.natureOfBusiness,
      lengthOfEmployment: kyc.lengthOfEmployment,
      institutionPhone: kyc.institutionPhone,
      institutionEmail: kyc.institutionEmail,
      personalInstitutionEmail: kyc.personalInstitutionEmail,
      institutionWebsite: kyc.institutionWebsite,
      previousProfession: kyc.previousProfession,
      universityName: kyc.universityName,
      major: kyc.major,
      expectedGraduationYear: kyc.expectedGraduationYear,
      isDirectorOfListed: kyc.isDirectorOfListed,
      directorCompanyName: kyc.directorCompanyName,
      directorStockExchange: kyc.directorStockExchange,
      directorPosition: kyc.directorPosition,
      directorAppointmentDate: kyc.directorAppointmentDate,
      // Part D — Communication
      preferEmail: kyc.preferEmail,
      preferSMS: kyc.preferSMS,
      preferWhatsApp: kyc.preferWhatsApp,
      preferOther: kyc.preferOther,
      preferOtherDetails: kyc.preferOtherDetails,
      // Part E — Financial
      annualIncomeRange: kyc.annualIncomeRange,
      sourceOfFunds: kyc.sourceOfFunds,
      sourceOfFundsOther: kyc.sourceOfFundsOther,
      estimatedNetWorth: kyc.estimatedNetWorth,
      sourceOfWealth: kyc.sourceOfWealth,
      sourceOfWealthOther: kyc.sourceOfWealthOther,
      hasOtherBankAccounts: kyc.hasOtherBankAccounts,
      otherBankCountry: kyc.otherBankCountry,
      isUsPerson: kyc.isUsPerson,
      // Part F — Beneficial Owner
      isActingOnBehalf: kyc.isActingOnBehalf,
      beneficialOwner: kyc.beneficialOwner,
      // Part G — Investment Profile
      investmentStrategy: kyc.investmentStrategy,
      investmentObjective: kyc.investmentObjective,
      investmentObjectiveOther: kyc.investmentObjectiveOther,
      riskTolerance: kyc.riskTolerance,
      // Part H — Investment Experience
      investmentExperience: kyc.investmentExperience,
      // Part I — General Compliance
      isAssociatedWithListed: kyc.isAssociatedWithListed,
      associatedListedDetails: kyc.associatedListedDetails,
      hasInsideInformation: kyc.hasInsideInformation,
      insideInformationDetails: kyc.insideInformationDetails,
      // Part J — PEP
      pepStatus: kyc.pepStatus,
      pepIsSelf: kyc.pepIsSelf,
      pepIsFamily: kyc.pepIsFamily,
      pepDetails: kyc.pepDetails,
      // Agreement + signatures
      declarationAccepted: kyc.declarationAccepted,
      declarationFullName: kyc.declarationFullName,
      declarationDate: kyc.declarationDate,
      regulatoryClauseAccepted: kyc.regulatoryClauseAccepted,
      regulatoryClauseFullName: kyc.regulatoryClauseFullName,
      agreementAccepted: kyc.agreementAccepted,
      agreementFullName: kyc.agreementFullName,
      agreementSignedAt: kyc.agreementSignedAt,
      agreementSignatureIp: kyc.agreementSignatureIp,
      tradingCompany: kyc.tradingCompany,
      tradingCommission: kyc.tradingCommission,
    },
    documents: kyc.documents.map((d) => ({
      id: d.id,
      type: d.documentType,
      fileName: d.fileName,
      side: d.side,
      uploadedAt: d.uploadedAt,
    })),
    reviews: kyc.reviews.map((r) => ({
      type: r.reviewType,
      decision: r.decision,
      reviewer: `${r.reviewer.firstName} ${r.reviewer.lastName}`,
      role: r.reviewer.role,
      reviewedAt: r.reviewedAt,
      notes: r.notes,
    })),
  };
}
