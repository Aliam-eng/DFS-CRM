import jsPDF from "jspdf";
import type { KycDetail, InvestmentExperienceData, BeneficialOwnerInfo } from "@/types/kyc";
import {
  CLIENT_DECLARATION_EN_PARAGRAPHS,
  CLIENT_DECLARATION_AR_PARAGRAPHS,
  REGULATORY_RESERVATION_CLAUSE_EN,
  REGULATORY_RESERVATION_CLAUSE_AR,
  CLIENT_AGREEMENT_AR,
  type LegalParagraph,
} from "@/lib/kyc-legal-texts";

export function printSignedDocs(kyc: KycDetail): void {
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow pop-ups to print signed documents."); return; }

  const esc = (s: string | null | undefined) =>
    (s ?? "-").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const fmtD = (s: string | null | undefined) => s ? new Date(s).toLocaleDateString() : "-";
  const fmtDT = (s: string | null | undefined) => s ? new Date(s).toLocaleString() : "-";

  const structuredParas = (items: LegalParagraph[], rtl: boolean) =>
    items.map(p => {
      const cls = [rtl ? "ar" : "", p.bold ? "bold" : ""].filter(Boolean).join(" ");
      return `<p${cls ? ` class="${cls}"` : ""}>${esc(p.text)}</p>`;
    }).join("\n");

  const plainParas = (text: string) =>
    text.split(/\n\n+/).map(block => {
      const lines = block.trim().split("\n").map(l => esc(l)).filter(Boolean);
      return `<p class="ar">${lines.join("<br>")}</p>`;
    }).join("\n");

  const clientName = `${kyc.user.firstName} ${kyc.user.lastName}`;
  const idType = kyc.passportNumber ? "Passport" : "National ID";
  const idNum = kyc.passportNumber || kyc.idNumber || "-";
  const birthInfo = [kyc.placeOfBirth, kyc.dateOfBirth ? new Date(kyc.dateOfBirth).toLocaleDateString() : null].filter(Boolean).join(", ") || "-";
  const address = [kyc.primaryBuilding, kyc.primaryStreet, kyc.primaryArea, kyc.primaryCity, kyc.primaryCountry].filter(Boolean).join(", ") || "-";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Signed Documents – ${esc(clientName)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,"Helvetica Neue",sans-serif;color:#111;padding:40px;max-width:820px;margin:0 auto;font-size:10.5pt;line-height:1.7}
h1{color:#21d94f;font-size:20pt;margin-bottom:6px}
.meta{color:#555;font-size:9pt;border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:28px}
h2{color:#21d94f;font-size:12pt;border-bottom:2px solid #21d94f;padding-bottom:4px;margin:36px 0 16px}
p{margin-bottom:8px}
.bold{font-weight:bold}
.lang-tag{font-size:8pt;color:#6b7280;font-style:italic;margin-bottom:6px;display:block}
.ar{font-family:"Traditional Arabic","Arabic Typesetting","Scheherazade New","Arial Unicode MS",serif}
.ar-block{direction:rtl;text-align:right;border-top:1px dashed #d1d5db;padding-top:14px;margin-top:14px}
.sig-box{background:#f9fafb;border:1px solid #d1d5db;border-radius:6px;padding:14px 18px;margin-top:16px}
.field{display:flex;gap:8px;margin-bottom:6px;font-size:10pt}
.field-lbl{font-weight:bold;color:#555;min-width:240px;flex-shrink:0}
.id-box{background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:14px 18px;margin-bottom:16px}
.id-box h3{font-size:10pt;margin-bottom:10px;color:#166534}
hr.light{border:none;border-top:1px solid #e5e7eb;margin:10px 0}
@media print{body{padding:20px;font-size:10pt}h2{page-break-before:avoid}}
</style>
</head>
<body>
<h1>DFS &mdash; Signed Documents</h1>
<div class="meta">
  Client: <strong>${esc(clientName)}</strong> &nbsp;|&nbsp;
  Email: ${esc(kyc.user.email)} &nbsp;|&nbsp;
  KYC ID: ${esc(kyc.id)}<br>
  Generated: ${new Date().toLocaleString()}
</div>

<h2>1. Client Declaration &amp; Undertaking / إقرار وتعهد العميل</h2>
<span class="lang-tag">English</span>
${structuredParas(CLIENT_DECLARATION_EN_PARAGRAPHS, false)}
<div class="ar-block">
<span class="lang-tag">العربية</span>
${structuredParas(CLIENT_DECLARATION_AR_PARAGRAPHS, true)}
</div>
<div class="sig-box">
  <div class="field"><span class="field-lbl">Accepted / قُبلت:</span><span>${kyc.declarationAccepted ? "Yes ✓ / نعم" : "No"}</span></div>
  <div class="field"><span class="field-lbl">Signed by / الاسم الكامل:</span><span>${esc(kyc.declarationFullName)}</span></div>
  <div class="field"><span class="field-lbl">Date / التاريخ:</span><span>${fmtD(kyc.declarationDate)}</span></div>
</div>

<h2>2. Regulatory Reservation Clause / شرط التحفظ التنظيمي</h2>
<span class="lang-tag">English</span>
<p>${esc(REGULATORY_RESERVATION_CLAUSE_EN)}</p>
<div class="ar-block">
<span class="lang-tag">العربية</span>
<p class="ar">${esc(REGULATORY_RESERVATION_CLAUSE_AR)}</p>
</div>
<div class="sig-box">
  <div class="field"><span class="field-lbl">Accepted / قُبلت:</span><span>${kyc.regulatoryClauseAccepted ? "Yes ✓ / نعم" : "No"}</span></div>
  <div class="field"><span class="field-lbl">Signed by / الاسم الكامل:</span><span>${esc(kyc.regulatoryClauseFullName)}</span></div>
</div>

<h2>3. Client Agreement / اتفاقية العميل</h2>
<div class="id-box">
  <h3>Client Identification / مستند التعريف</h3>
  <div class="field"><span class="field-lbl">Full Name / الاسم الكامل:</span><span>${esc(kyc.agreementFullName || kyc.declarationFullName)}</span></div>
  <div class="field"><span class="field-lbl">Nationality / الجنسية:</span><span>${esc(kyc.nationality)}</span></div>
  <div class="field"><span class="field-lbl">${esc(idType)} / مستند التعريف:</span><span>${esc(idNum)}</span></div>
  <div class="field"><span class="field-lbl">Place &amp; Date of Birth / محل وتاريخ الولادة:</span><span>${esc(birthInfo)}</span></div>
  <div class="field"><span class="field-lbl">Address / العنوان:</span><span>${esc(address)}</span></div>
</div>
<div class="ar-block">
<span class="lang-tag">نص الاتفاقية الكاملة</span>
${plainParas(CLIENT_AGREEMENT_AR)}
</div>
<div class="sig-box">
  <div class="field"><span class="field-lbl">Trading Partner / الشركة:</span><span>${esc(kyc.tradingCompany)}</span></div>
  <div class="field"><span class="field-lbl">Commission Tier / العمولة:</span><span>${esc(kyc.tradingCommission)}</span></div>
  <hr class="light">
  <div class="field"><span class="field-lbl">Agreement Accepted / قُبلت الاتفاقية:</span><span>${kyc.agreementAccepted ? "Yes ✓ / نعم" : "No"}</span></div>
  <div class="field"><span class="field-lbl">Signed by / الاسم الكامل:</span><span>${esc(kyc.agreementFullName)}</span></div>
  <div class="field"><span class="field-lbl">Date &amp; Time / تاريخ ووقت التوقيع:</span><span>${fmtDT(kyc.agreementSignedAt)}</span></div>
</div>

<script>window.onload=()=>{window.focus();window.print();};</script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 6;
const SECTION_GAP = 10;

const GREEN = "#21d94f";

function fmt(s: string | null | undefined): string {
  return s ? s.replace(/_/g, " ") : "-";
}

function fmtDate(s: string | null | undefined): string {
  return s ? new Date(s).toLocaleDateString() : "-";
}

function fmtDateTime(s: string | null | undefined): string {
  return s ? new Date(s).toLocaleString() : "-";
}

function boolStr(v: boolean | null | undefined): string {
  return v === true ? "Yes" : v === false ? "No" : "-";
}

export function generateKycPdf(kyc: KycDetail): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN;

  function checkPage(needed: number = 20) {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function addHeader(text: string) {
    checkPage(20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(GREEN);
    doc.text(text, MARGIN, y);
    y += 2;
    doc.setDrawColor(GREEN);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += LINE_HEIGHT;
    doc.setTextColor("#000000");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  }

  function addFieldInline(label: string, value: string | number | null | undefined) {
    checkPage(LINE_HEIGHT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#333333");
    doc.text(`${label}: `, MARGIN, y);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#000000");
    const val = value != null && value !== "" ? String(value) : "-";
    const remaining = CONTENT_WIDTH - labelWidth;
    const lines = doc.splitTextToSize(val, remaining > 30 ? remaining : CONTENT_WIDTH);
    if (remaining > 30) {
      doc.text(lines[0], MARGIN + labelWidth, y);
      y += LINE_HEIGHT;
      for (let i = 1; i < lines.length; i++) {
        checkPage(LINE_HEIGHT);
        doc.text(lines[i], MARGIN, y);
        y += LINE_HEIGHT;
      }
    } else {
      y += LINE_HEIGHT;
      doc.text(lines, MARGIN, y);
      y += lines.length * LINE_HEIGHT;
    }
  }

  function addBoolField(label: string, value: boolean | null | undefined) {
    addFieldInline(label, boolStr(value));
  }

  function addGap(size: number = SECTION_GAP) {
    y += size;
  }

  function addParagraph(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#000000");
    // Split on blank lines so paragraph breaks are preserved
    const paragraphs = text.split(/\n\s*\n/);
    for (let p = 0; p < paragraphs.length; p++) {
      const para = paragraphs[p].replace(/\s*\n\s*/g, " ").trim();
      if (!para) continue;
      const lines = doc.splitTextToSize(para, CONTENT_WIDTH);
      for (const line of lines) {
        checkPage(LINE_HEIGHT);
        doc.text(line, MARGIN, y);
        y += LINE_HEIGHT;
      }
      if (p < paragraphs.length - 1) {
        y += LINE_HEIGHT / 2;
      }
    }
  }

  function addStructuredParagraphs(paragraphs: LegalParagraph[]) {
    doc.setFontSize(9);
    doc.setTextColor("#000000");
    for (let p = 0; p < paragraphs.length; p++) {
      const para = paragraphs[p];
      const text = para.text.replace(/\s*\n\s*/g, " ").trim();
      if (!text) continue;
      doc.setFont("helvetica", para.bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
      for (const line of lines) {
        checkPage(LINE_HEIGHT);
        doc.text(line, MARGIN, y);
        y += LINE_HEIGHT;
      }
      if (p < paragraphs.length - 1) {
        y += LINE_HEIGHT / 2;
      }
    }
    doc.setFont("helvetica", "normal");
  }

  // ── Title ──
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(GREEN);
  doc.text("DFS - KYC Application", MARGIN, y);
  y += 10;

  // Client summary
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#000000");
  addFieldInline("Client", `${kyc.user.firstName} ${kyc.user.lastName}`);
  addFieldInline("Email", kyc.user.email);
  addFieldInline("Phone", kyc.user.phone);
  addFieldInline("Submission Date", kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleString() : "-");
  addFieldInline("Status", fmt(kyc.status));
  addFieldInline("KYC ID", kyc.id);
  addGap();

  // ── Part A: Personal Information ──
  addHeader("Part A: Personal Information");
  addFieldInline("First Name", kyc.firstName);
  addFieldInline("Middle Name (Father)", kyc.middleName);
  addFieldInline("Last Name", kyc.lastName);
  addFieldInline("Mother's Full Name", kyc.mothersFullName);
  addFieldInline("Place of Birth", kyc.placeOfBirth);
  addFieldInline("Date of Birth", fmtDate(kyc.dateOfBirth));
  addFieldInline("Gender", kyc.gender);
  addFieldInline("Nationality", kyc.nationality);
  addFieldInline("Other Nationality", kyc.otherNationality);
  addFieldInline("ID Number", kyc.idNumber);
  addFieldInline("ID Issue Date", fmtDate(kyc.idIssueDate));
  addFieldInline("Passport Number", kyc.passportNumber);
  addFieldInline("Passport Expiry", fmtDate(kyc.passportExpiryDate));
  addFieldInline("Marital Status", kyc.maritalStatus);
  addFieldInline("Spouse Full Name", kyc.spouseFullName);
  addFieldInline("Spouse Profession", kyc.spouseProfession);
  addFieldInline("Number of Dependents", kyc.numberOfDependents);
  addFieldInline("Phone", kyc.phoneNumber);
  addFieldInline("Email", kyc.emailAddress);
  addGap();

  // ── Part B: Residential Address ──
  addHeader("Part B: Residential Address");
  addFieldInline("Home Status", kyc.homeStatus);
  addFieldInline("Country", kyc.primaryCountry);
  addFieldInline("City", kyc.primaryCity);
  addFieldInline("Area", kyc.primaryArea);
  addFieldInline("Street", kyc.primaryStreet);
  addFieldInline("Building", kyc.primaryBuilding);
  addFieldInline("Floor", kyc.primaryFloor);
  addFieldInline("Apartment", kyc.primaryApartment);
  if (kyc.hasSecondaryAddress) {
    addGap(4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#333333");
    checkPage(LINE_HEIGHT);
    doc.text("Secondary / Overseas Address", MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#000000");
    addFieldInline("Home Status", kyc.secondaryHomeStatus);
    addFieldInline("Country", kyc.secondaryCountry);
    addFieldInline("City", kyc.secondaryCity);
    addFieldInline("Area", kyc.secondaryArea);
    addFieldInline("Street", kyc.secondaryStreet);
    addFieldInline("Building", kyc.secondaryBuilding);
    addFieldInline("Floor", kyc.secondaryFloor);
    addFieldInline("Apartment", kyc.secondaryApartment);
  }
  addGap();

  // ── Part C: Occupation & Employment ──
  addHeader("Part C: Occupation & Employment");
  addFieldInline("Employment Category", fmt(kyc.employmentCategory));
  addFieldInline("Current Profession", kyc.currentProfession);
  addFieldInline("Institution Name", kyc.institutionName);
  addFieldInline("Nature of Business", kyc.natureOfBusiness);
  addFieldInline("Length of Employment", kyc.lengthOfEmployment);
  addFieldInline("Institution Phone", kyc.institutionPhone);
  addFieldInline("Institution Email", kyc.institutionEmail);
  addFieldInline("Personal/Institution Email", kyc.personalInstitutionEmail);
  addFieldInline("Institution Website", kyc.institutionWebsite);
  addFieldInline("Previous Profession", kyc.previousProfession);
  addFieldInline("University", kyc.universityName);
  addFieldInline("Major", kyc.major);
  addFieldInline("Expected Graduation Year", kyc.expectedGraduationYear);
  addBoolField("Director of Listed Company", kyc.isDirectorOfListed);
  if (kyc.isDirectorOfListed) {
    addFieldInline("Company Name", kyc.directorCompanyName);
    addFieldInline("Stock Exchange", kyc.directorStockExchange);
    addFieldInline("Position", kyc.directorPosition);
    addFieldInline("Appointment Date", fmtDate(kyc.directorAppointmentDate));
  }
  addGap();

  // ── Part D: Communication Preferences ──
  addHeader("Part D: Communication Preferences");
  const commPrefs: string[] = [];
  if (kyc.preferEmail) commPrefs.push("Email");
  if (kyc.preferSMS) commPrefs.push("SMS");
  if (kyc.preferWhatsApp) commPrefs.push("WhatsApp");
  if (kyc.preferOther) commPrefs.push(kyc.preferOtherDetails || "Other");
  addFieldInline("Preferred Methods", commPrefs.length > 0 ? commPrefs.join(", ") : "-");
  addGap();

  // ── Part E: Financial Information ──
  addHeader("Part E: Financial Information");
  addFieldInline("Annual Income Range", fmt(kyc.annualIncomeRange));
  addFieldInline("Source of Funds", (kyc.sourceOfFunds as string[])?.join(", ") || "-");
  if (kyc.sourceOfFundsOther) addFieldInline("Source of Funds (Other)", kyc.sourceOfFundsOther);
  addFieldInline("Estimated Net Worth", fmt(kyc.estimatedNetWorth));
  addFieldInline("Source of Wealth", (kyc.sourceOfWealth as string[])?.join(", ") || "-");
  if (kyc.sourceOfWealthOther) addFieldInline("Source of Wealth (Other)", kyc.sourceOfWealthOther);
  addBoolField("Has Other Bank Accounts", kyc.hasOtherBankAccounts);
  if (kyc.hasOtherBankAccounts) addFieldInline("Other Bank Country", kyc.otherBankCountry);
  addBoolField("US Person", kyc.isUsPerson);
  addGap();

  // ── Part F: Beneficial Owner ──
  addHeader("Part F: Beneficial Owner");
  addBoolField("Acting on Behalf of Another", kyc.isActingOnBehalf);
  if (kyc.isActingOnBehalf) {
    // beneficialOwner is stored as { owners: BoEntry[] } (new) or flat BoEntry (legacy)
    const boRaw = kyc.beneficialOwner as (BeneficialOwnerInfo & { owners?: BeneficialOwnerInfo[] }) | null;
    const owners: BeneficialOwnerInfo[] = boRaw
      ? (boRaw.owners ?? (boRaw.fullName ? [boRaw as BeneficialOwnerInfo] : []))
      : [];
    owners.forEach((owner, idx) => {
      if (owners.length > 1) {
        checkPage(LINE_HEIGHT);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor("#333333");
        doc.text(`Beneficial Owner ${idx + 1}`, MARGIN, y);
        y += LINE_HEIGHT;
        doc.setFont("helvetica", "normal");
        doc.setTextColor("#000000");
      }
      addFieldInline("Full Name", owner.fullName);
      addFieldInline("Date of Birth", fmtDate(owner.dateOfBirth));
      addFieldInline("Nationality", owner.nationality);
      addFieldInline("ID Number", owner.idNumber);
      addFieldInline("Passport Number", owner.passportNumber);
      addFieldInline("Passport Expiry", fmtDate(owner.passportExpiryDate));
      addFieldInline("Relationship", owner.relationshipToAccountHolder);
      addFieldInline("Ownership %", owner.ownershipPercentage);
    });
    if (owners.length === 0) addFieldInline("Beneficial Owner", "Not provided");
  }
  addGap();

  // ── Part G: Investment Profile ──
  addHeader("Part G: Investment Profile");
  addFieldInline("Investment Strategy", kyc.investmentStrategy);
  addFieldInline("Investment Objective", fmt(kyc.investmentObjective));
  if (kyc.investmentObjectiveOther) addFieldInline("Objective (Other)", kyc.investmentObjectiveOther);
  addFieldInline("Risk Tolerance", kyc.riskTolerance);
  addGap();

  // ── Part H: Investment Experience ──
  addHeader("Part H: Investment Experience");
  const investmentExp = kyc.investmentExperience as InvestmentExperienceData | null;
  if (investmentExp) {
    // Table header
    checkPage(LINE_HEIGHT * (Object.keys(investmentExp).length + 2));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Instrument", MARGIN, y);
    doc.text("Experience", MARGIN + 60, y);
    doc.text("Years", MARGIN + 100, y);
    y += LINE_HEIGHT;
    doc.setDrawColor("#cccccc");
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y - 2, MARGIN + CONTENT_WIDTH, y - 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const [key, val] of Object.entries(investmentExp)) {
      checkPage(LINE_HEIGHT);
      doc.text(key, MARGIN, y);
      doc.text(val.has ? "Yes" : "No", MARGIN + 60, y);
      doc.text(val.years != null ? String(val.years) : "-", MARGIN + 100, y);
      y += LINE_HEIGHT;
    }
  } else {
    addFieldInline("Experience", "Not provided");
  }
  addGap();

  // ── Part I: General Compliance ──
  addHeader("Part I: General Compliance");
  addBoolField("Associated with Listed Company", kyc.isAssociatedWithListed);
  if (kyc.isAssociatedWithListed && kyc.associatedListedDetails) {
    addFieldInline("Details", kyc.associatedListedDetails);
  }
  addBoolField("Has Inside Information", kyc.hasInsideInformation);
  if (kyc.hasInsideInformation && kyc.insideInformationDetails) {
    addFieldInline("Details", kyc.insideInformationDetails);
  }
  addGap();

  // ── Part J: PEP Declaration ──
  addHeader("Part J: PEP Declaration");
  {
    const opts: string[] = [];
    if (kyc.pepStatus === "NOT_PEP") opts.push("NOT a Politically Exposed Person");
    if (kyc.pepIsSelf) opts.push("Is a Politically Exposed Person");
    if (kyc.pepIsFamily) opts.push("Family member or close associate of a PEP");
    addFieldInline("PEP Declaration", opts.length ? opts.join(" + ") : fmt(kyc.pepStatus));
    if (kyc.pepDetails) addFieldInline("PEP Details", kyc.pepDetails);
  }
  addGap();

  // ── Client Declaration & Undertaking ──
  addHeader("Client Declaration & Undertaking");
  addStructuredParagraphs(CLIENT_DECLARATION_EN_PARAGRAPHS);
  addGap(4);
  addBoolField("Accepted", kyc.declarationAccepted);
  addFieldInline("Signed by", kyc.declarationFullName);
  addFieldInline("Date", fmtDate(kyc.declarationDate));
  addGap();

  // ── Regulatory Reservation Clause ──
  addHeader("Regulatory Reservation Clause");
  addParagraph(REGULATORY_RESERVATION_CLAUSE_EN);
  addGap(4);
  addBoolField("Accepted", kyc.regulatoryClauseAccepted);
  addFieldInline("Signed by", kyc.regulatoryClauseFullName);
  addGap();

  // ── Client Agreement ──
  addHeader("Client Agreement");
  addParagraph("(Arabic agreement text was displayed and accepted in the application. English translation pending.)");
  addGap(4);
  addFieldInline("Trading partner", kyc.tradingCompany);
  addFieldInline("Commission tier", kyc.tradingCommission);
  addBoolField("Accepted", kyc.agreementAccepted);
  addFieldInline("Signed by", kyc.agreementFullName);
  addFieldInline("Date", fmtDateTime(kyc.agreementSignedAt));
  if (kyc.agreementSignatureIp) addFieldInline("Signature IP", kyc.agreementSignatureIp);
  addGap();

  // ── Review History ──
  if (kyc.reviews && kyc.reviews.length > 0) {
    addHeader("Review History");
    for (const review of kyc.reviews) {
      checkPage(LINE_HEIGHT * 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor("#333333");
      doc.text(`${review.reviewType} Review - ${review.decision}`, MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor("#000000");
      doc.text(`Reviewer: ${review.reviewer.firstName} ${review.reviewer.lastName} (${review.reviewer.role})`, MARGIN, y);
      y += LINE_HEIGHT;
      doc.text(`Date: ${new Date(review.reviewedAt).toLocaleString()}`, MARGIN, y);
      y += LINE_HEIGHT;
      if (review.notes) {
        const noteLines = doc.splitTextToSize(`Notes: ${review.notes}`, CONTENT_WIDTH);
        for (const line of noteLines) {
          checkPage(LINE_HEIGHT);
          doc.text(line, MARGIN, y);
          y += LINE_HEIGHT;
        }
      }
      y += 4;
      doc.setDrawColor("#eeeeee");
      doc.setLineWidth(0.2);
      doc.line(MARGIN, y - 2, MARGIN + CONTENT_WIDTH, y - 2);
    }
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor("#999999");
    doc.setFont("helvetica", "normal");
    doc.text(`DFS - KYC Application | Page ${i} of ${totalPages}`, MARGIN, PAGE_HEIGHT - 10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: "right" });
  }

  return doc;
}

export function printKycPdf(kyc: KycDetail): void {
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow pop-ups to print the KYC."); return; }

  const esc = (s: string | number | null | undefined) =>
    (s == null || s === "" ? "-" : String(s))
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const fmtD = (s: string | null | undefined) => s ? new Date(s).toLocaleDateString() : "-";
  const fmtDT = (s: string | null | undefined) => s ? new Date(s).toLocaleString() : "-";
  const yn = (v: boolean | null | undefined) => v === true ? "Yes / نعم" : v === false ? "No / لا" : "-";
  const fmtEnum = (s: string | null | undefined) => s ? s.replace(/_/g, " ") : "-";

  const row = (label: string, value: string | number | null | undefined) =>
    `<tr><th>${label}</th><td>${esc(value)}</td></tr>`;

  const commPrefs: string[] = [];
  if (kyc.preferEmail) commPrefs.push("Email");
  if (kyc.preferSMS) commPrefs.push("SMS");
  if (kyc.preferWhatsApp) commPrefs.push("WhatsApp");
  if (kyc.preferOther) commPrefs.push(kyc.preferOtherDetails || "Other");

  const boRaw = kyc.beneficialOwner as (BeneficialOwnerInfo & { owners?: BeneficialOwnerInfo[] }) | null;
  const owners: BeneficialOwnerInfo[] = boRaw
    ? (boRaw.owners ?? (boRaw.fullName ? [boRaw as BeneficialOwnerInfo] : []))
    : [];

  const investmentExp = kyc.investmentExperience as InvestmentExperienceData | null;

  const pepOpts: string[] = [];
  if (kyc.pepStatus === "NOT_PEP") pepOpts.push("NOT a Politically Exposed Person");
  if (kyc.pepIsSelf) pepOpts.push("Is a Politically Exposed Person");
  if (kyc.pepIsFamily) pepOpts.push("Family member or close associate of a PEP");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>KYC – ${esc(kyc.user.firstName + " " + kyc.user.lastName)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,"Helvetica Neue","Traditional Arabic","Arabic Typesetting","Arial Unicode MS",sans-serif;color:#111;padding:30px;max-width:900px;margin:0 auto;font-size:10pt;line-height:1.55}
h1{color:#21d94f;font-size:18pt;margin-bottom:4px}
.meta{color:#555;font-size:9pt;border-bottom:1px solid #e5e7eb;padding-bottom:10px;margin-bottom:20px}
h2{color:#21d94f;font-size:11pt;border-bottom:2px solid #21d94f;padding-bottom:3px;margin:22px 0 10px}
table{width:100%;border-collapse:collapse;margin-bottom:8px}
th,td{padding:5px 8px;border:1px solid #e5e7eb;text-align:left;vertical-align:top;font-size:9.5pt}
th{background:#f9fafb;font-weight:600;color:#374151;width:34%}
td{background:#fff;word-break:break-word}
.subhead{font-weight:bold;color:#555;margin:10px 0 5px;font-size:10pt}
.review{background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:10px 12px;margin-bottom:8px;font-size:9pt}
.review .rtype{font-weight:bold;color:#21d94f}
@media print{body{padding:15px;font-size:9.5pt}h2{page-break-after:avoid}table{page-break-inside:avoid}}
</style>
</head>
<body>
<h1>DFS &mdash; KYC Application</h1>
<div class="meta">
  Client: <strong>${esc(kyc.user.firstName + " " + kyc.user.lastName)}</strong> &nbsp;|&nbsp;
  Email: ${esc(kyc.user.email)} &nbsp;|&nbsp;
  Phone: ${esc(kyc.user.phone)}<br>
  Status: ${esc(fmtEnum(kyc.status))} &nbsp;|&nbsp;
  Submitted: ${fmtDT(kyc.submittedAt)} &nbsp;|&nbsp;
  KYC ID: ${esc(kyc.id)}<br>
  Generated: ${new Date().toLocaleString()}
</div>

<h2>Part A: Personal Information / المعلومات الشخصية</h2>
<table>
${row("First Name / الاسم الأول", kyc.firstName)}
${row("Middle Name (Father) / اسم الأب", kyc.middleName)}
${row("Last Name / الشهرة", kyc.lastName)}
${row("Mother's Full Name / اسم الأم", kyc.mothersFullName)}
${row("Place of Birth / مكان الولادة", kyc.placeOfBirth)}
${row("Date of Birth / تاريخ الولادة", fmtD(kyc.dateOfBirth))}
${row("Gender / الجنس", kyc.gender)}
${row("Nationality / الجنسية", kyc.nationality)}
${row("Other Nationality / جنسية أخرى", kyc.otherNationality)}
${row("ID Number / رقم الهوية", kyc.idNumber)}
${row("ID Issue Date / تاريخ إصدار الهوية", fmtD(kyc.idIssueDate))}
${row("Passport Number / رقم جواز السفر", kyc.passportNumber)}
${row("Passport Expiry / تاريخ انتهاء الجواز", fmtD(kyc.passportExpiryDate))}
${row("Marital Status / الحالة الاجتماعية", kyc.maritalStatus)}
${row("Spouse Full Name / اسم الزوج/ة", kyc.spouseFullName)}
${row("Spouse Profession / مهنة الزوج/ة", kyc.spouseProfession)}
${row("Number of Dependents / عدد المعالين", kyc.numberOfDependents)}
${row("Phone / الهاتف", kyc.phoneNumber)}
${row("Email / البريد الإلكتروني", kyc.emailAddress)}
</table>

<h2>Part B: Residential Address / العنوان</h2>
<div class="subhead">Primary Address / العنوان الأساسي</div>
<table>
${row("Home Status / السكن", kyc.homeStatus)}
${row("Country / الدولة", kyc.primaryCountry)}
${row("City / المدينة", kyc.primaryCity)}
${row("Area / المنطقة", kyc.primaryArea)}
${row("Street / الشارع", kyc.primaryStreet)}
${row("Building / المبنى", kyc.primaryBuilding)}
${row("Floor / الطابق", kyc.primaryFloor)}
${row("Apartment / الشقة", kyc.primaryApartment)}
</table>
${kyc.hasSecondaryAddress ? `
<div class="subhead">Secondary / Overseas Address</div>
<table>
${row("Home Status", kyc.secondaryHomeStatus)}
${row("Country", kyc.secondaryCountry)}
${row("City", kyc.secondaryCity)}
${row("Area", kyc.secondaryArea)}
${row("Street", kyc.secondaryStreet)}
${row("Building", kyc.secondaryBuilding)}
${row("Floor", kyc.secondaryFloor)}
${row("Apartment", kyc.secondaryApartment)}
</table>` : ""}

<h2>Part C: Occupation &amp; Employment / المهنة والعمل</h2>
<table>
${row("Employment Category / فئة التوظيف", fmtEnum(kyc.employmentCategory))}
${row("Current Profession / المهنة الحالية", kyc.currentProfession)}
${row("Institution Name / اسم المؤسسة", kyc.institutionName)}
${row("Nature of Business / طبيعة العمل", kyc.natureOfBusiness)}
${row("Length of Employment / مدة العمل", kyc.lengthOfEmployment)}
${row("Institution Phone / هاتف المؤسسة", kyc.institutionPhone)}
${row("Institution Email", kyc.institutionEmail)}
${row("Personal/Institution Email", kyc.personalInstitutionEmail)}
${row("Institution Website", kyc.institutionWebsite)}
${row("Previous Profession / المهنة السابقة", kyc.previousProfession)}
${row("University / الجامعة", kyc.universityName)}
${row("Major / التخصص", kyc.major)}
${row("Expected Graduation Year / سنة التخرج المتوقعة", kyc.expectedGraduationYear)}
${row("Director of Listed Company / مدير في شركة مدرجة", yn(kyc.isDirectorOfListed))}
${kyc.isDirectorOfListed ? `
${row("Company Name / اسم الشركة", kyc.directorCompanyName)}
${row("Stock Exchange / البورصة", kyc.directorStockExchange)}
${row("Position / المنصب", kyc.directorPosition)}
${row("Appointment Date / تاريخ التعيين", fmtD(kyc.directorAppointmentDate))}` : ""}
</table>

<h2>Part D: Communication Preferences / تفضيلات التواصل</h2>
<table>
${row("Preferred Methods / الوسائل المفضلة", commPrefs.length ? commPrefs.join(", ") : "-")}
</table>

<h2>Part E: Financial Information / المعلومات المالية</h2>
<table>
${row("Annual Income Range / الدخل السنوي", fmtEnum(kyc.annualIncomeRange))}
${row("Source of Funds / مصدر الأموال", (kyc.sourceOfFunds as string[])?.join(", ") || "-")}
${kyc.sourceOfFundsOther ? row("Source of Funds (Other)", kyc.sourceOfFundsOther) : ""}
${row("Estimated Net Worth / صافي الثروة", fmtEnum(kyc.estimatedNetWorth))}
${row("Source of Wealth / مصدر الثروة", (kyc.sourceOfWealth as string[])?.join(", ") || "-")}
${kyc.sourceOfWealthOther ? row("Source of Wealth (Other)", kyc.sourceOfWealthOther) : ""}
${row("Has Other Bank Accounts / حسابات بنكية أخرى", yn(kyc.hasOtherBankAccounts))}
${kyc.hasOtherBankAccounts ? row("Other Bank Country", kyc.otherBankCountry) : ""}
${row("US Person", yn(kyc.isUsPerson))}
</table>

<h2>Part F: Beneficial Owner / المالك المنتفع</h2>
<table>
${row("Acting on Behalf of Another / يتصرف بالنيابة", yn(kyc.isActingOnBehalf))}
</table>
${kyc.isActingOnBehalf && owners.length ? owners.map((o, i) => `
<div class="subhead">${owners.length > 1 ? `Beneficial Owner ${i + 1}` : "Beneficial Owner / المالك المنتفع"}</div>
<table>
${row("Full Name / الاسم الكامل", o.fullName)}
${row("Date of Birth / تاريخ الولادة", fmtD(o.dateOfBirth))}
${row("Nationality / الجنسية", o.nationality)}
${row("ID Number / رقم الهوية", o.idNumber)}
${row("Passport Number / رقم الجواز", o.passportNumber)}
${row("Passport Expiry / تاريخ الانتهاء", fmtD(o.passportExpiryDate))}
${row("Relationship / صلة القرابة", o.relationshipToAccountHolder)}
${row("Ownership % / نسبة الملكية", o.ownershipPercentage)}
</table>`).join("") : ""}

<h2>Part G: Investment Profile / الملف الاستثماري</h2>
<table>
${row("Investment Strategy / الاستراتيجية", kyc.investmentStrategy)}
${row("Investment Objective / الهدف الاستثماري", fmtEnum(kyc.investmentObjective))}
${kyc.investmentObjectiveOther ? row("Objective (Other)", kyc.investmentObjectiveOther) : ""}
${row("Risk Tolerance / تحمل المخاطر", kyc.riskTolerance)}
</table>

<h2>Part H: Investment Experience / الخبرة الاستثمارية</h2>
${investmentExp ? `
<table>
<tr><th>Instrument / الأداة</th><th>Experience / الخبرة</th><th>Years / السنوات</th></tr>
${Object.entries(investmentExp).map(([k, v]) =>
  `<tr><td>${esc(k)}</td><td>${v.has ? "Yes / نعم" : "No / لا"}</td><td>${esc(v.years != null ? String(v.years) : "-")}</td></tr>`
).join("")}
</table>` : `<table>${row("Experience", "Not provided")}</table>`}

<h2>Part I: General Compliance / الامتثال العام</h2>
<table>
${row("Associated with Listed Company / مرتبط بشركة مدرجة", yn(kyc.isAssociatedWithListed))}
${kyc.isAssociatedWithListed && kyc.associatedListedDetails ? row("Details / التفاصيل", kyc.associatedListedDetails) : ""}
${row("Has Inside Information / لديه معلومات داخلية", yn(kyc.hasInsideInformation))}
${kyc.hasInsideInformation && kyc.insideInformationDetails ? row("Details / التفاصيل", kyc.insideInformationDetails) : ""}
</table>

<h2>Part J: PEP Declaration / الشخص المعرّض سياسياً</h2>
<table>
${row("PEP Declaration / الإقرار", pepOpts.length ? pepOpts.join(" + ") : fmtEnum(kyc.pepStatus))}
${kyc.pepDetails ? row("PEP Details / التفاصيل", kyc.pepDetails) : ""}
</table>

<h2>Client Declaration &amp; Undertaking / إقرار وتعهد العميل</h2>
<table>
${row("Accepted / قُبلت", yn(kyc.declarationAccepted))}
${row("Signed by / الاسم الكامل", kyc.declarationFullName)}
${row("Date / التاريخ", fmtD(kyc.declarationDate))}
</table>

<h2>Regulatory Reservation Clause / شرط التحفظ التنظيمي</h2>
<table>
${row("Accepted / قُبلت", yn(kyc.regulatoryClauseAccepted))}
${row("Signed by / الاسم الكامل", kyc.regulatoryClauseFullName)}
</table>

<h2>Client Agreement / اتفاقية العميل</h2>
<table>
${row("Trading Partner / الشركة", kyc.tradingCompany)}
${row("Commission Tier / العمولة", kyc.tradingCommission)}
${row("Accepted / قُبلت", yn(kyc.agreementAccepted))}
${row("Signed by / الاسم الكامل", kyc.agreementFullName)}
${row("Date / تاريخ التوقيع", fmtDT(kyc.agreementSignedAt))}
${kyc.agreementSignatureIp ? row("Signature IP", kyc.agreementSignatureIp) : ""}
</table>

${kyc.reviews && kyc.reviews.length > 0 ? `
<h2>Review History / سجل المراجعة</h2>
${kyc.reviews.map(r => `
<div class="review">
  <div><span class="rtype">${esc(r.reviewType)} Review &mdash; ${esc(r.decision)}</span></div>
  <div>Reviewer: ${esc(r.reviewer.firstName + " " + r.reviewer.lastName)} (${esc(r.reviewer.role)})</div>
  <div>Date: ${fmtDT(r.reviewedAt)}</div>
  ${r.notes ? `<div>Notes: ${esc(r.notes)}</div>` : ""}
</div>`).join("")}` : ""}

<script>window.onload=()=>{window.focus();window.print();};</script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}
