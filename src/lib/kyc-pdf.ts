import jsPDF from "jspdf";
import type { KycDetail, InvestmentExperienceData, BeneficialOwnerInfo } from "@/types/kyc";

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
    const bo = kyc.beneficialOwner as BeneficialOwnerInfo | null;
    if (bo) {
      addFieldInline("Full Name", bo.fullName);
      addFieldInline("Date of Birth", fmtDate(bo.dateOfBirth));
      addFieldInline("Nationality", bo.nationality);
      addFieldInline("ID Number", bo.idNumber);
      addFieldInline("Passport Number", bo.passportNumber);
      addFieldInline("Passport Expiry", fmtDate(bo.passportExpiryDate));
      addFieldInline("Relationship", bo.relationshipToAccountHolder);
      addFieldInline("Ownership %", bo.ownershipPercentage);
    }
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
  addFieldInline("PEP Status", fmt(kyc.pepStatus));
  if (kyc.pepDetails) addFieldInline("PEP Details", kyc.pepDetails);
  addGap();

  // ── Declaration ──
  addHeader("Client Declaration");
  addBoolField("Declaration Accepted", kyc.declarationAccepted);
  addFieldInline("Signed Name", kyc.declarationFullName);
  addFieldInline("Declaration Date", fmtDate(kyc.declarationDate));
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
