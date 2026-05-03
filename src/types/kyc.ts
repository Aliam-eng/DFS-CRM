export interface BeneficialOwnerInfo {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  idNumber: string;
  passportNumber: string;
  passportExpiryDate: string;
  relationshipToAccountHolder: string;
  ownershipPercentage: string;
}

export interface InstrumentExperience {
  has: boolean;
  years: number | null;
}

export interface InvestmentExperienceData {
  securities: InstrumentExperience;
  futuresCfds: InstrumentExperience;
  options: InstrumentExperience;
  commodities: InstrumentExperience;
  bonds: InstrumentExperience;
  forex: InstrumentExperience;
}

export interface KycDocument {
  id: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  side: string | null;
  uploadedAt: string;
}

export interface KycReviewRecord {
  id: string;
  reviewType: string;
  decision: string;
  notes: string | null;
  amlReportPath: string | null;
  reviewedAt: string;
  reviewer: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface KycDetail {
  id: string;
  userId: string;
  status: string;

  // Part A: Personal Information
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  mothersFullName: string | null;
  placeOfBirth: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  otherNationality: string | null;
  idNumber: string | null;
  idIssueDate: string | null;
  passportNumber: string | null;
  passportExpiryDate: string | null;
  maritalStatus: string | null;
  spouseFullName: string | null;
  spouseProfession: string | null;
  numberOfDependents: number | null;
  phoneNumber: string | null;
  emailAddress: string | null;

  // Part B: Residential Address
  homeStatus: string | null;
  primaryCountry: string | null;
  primaryCity: string | null;
  primaryArea: string | null;
  primaryStreet: string | null;
  primaryBuilding: string | null;
  primaryFloor: string | null;
  primaryApartment: string | null;
  hasSecondaryAddress: boolean | null;
  secondaryHomeStatus: string | null;
  secondaryCountry: string | null;
  secondaryCity: string | null;
  secondaryArea: string | null;
  secondaryStreet: string | null;
  secondaryBuilding: string | null;
  secondaryFloor: string | null;
  secondaryApartment: string | null;

  // Part C: Occupation & Employment
  employmentCategory: string | null;
  currentProfession: string | null;
  institutionName: string | null;
  natureOfBusiness: string | null;
  lengthOfEmployment: string | null;
  institutionPhone: string | null;
  institutionEmail: string | null;
  personalInstitutionEmail: string | null;
  institutionWebsite: string | null;
  previousProfession: string | null;
  universityName: string | null;
  major: string | null;
  expectedGraduationYear: number | null;
  isDirectorOfListed: boolean | null;
  directorCompanyName: string | null;
  directorStockExchange: string | null;
  directorPosition: string | null;
  directorAppointmentDate: string | null;

  // Part D: Communication Preferences
  preferEmail: boolean | null;
  preferSMS: boolean | null;
  preferWhatsApp: boolean | null;
  preferOther: boolean | null;
  preferOtherDetails: string | null;

  // Part E: Financial Information
  annualIncomeRange: string | null;
  sourceOfFunds: string[] | null;
  sourceOfFundsOther: string | null;
  estimatedNetWorth: string | null;
  sourceOfWealth: string[] | null;
  sourceOfWealthOther: string | null;
  hasOtherBankAccounts: boolean | null;
  otherBankCountry: string | null;
  isUsPerson: boolean | null;

  // Part F: Beneficial Owner
  isActingOnBehalf: boolean | null;
  beneficialOwner: BeneficialOwnerInfo | null;

  // Part G: Investment Profile
  investmentStrategy: string | null;
  investmentObjective: string | null;
  investmentObjectiveOther: string | null;
  riskTolerance: string | null;

  // Part H: Investment Experience
  investmentExperience: InvestmentExperienceData | null;

  // Part I: General Compliance
  isAssociatedWithListed: boolean | null;
  associatedListedDetails: string | null;
  hasInsideInformation: boolean | null;
  insideInformationDetails: string | null;

  // Part J: PEP Declaration
  pepStatus: string | null;
  pepDetails: string | null;

  // Declaration
  declarationAccepted: boolean | null;
  declarationFullName: string | null;
  declarationDate: string | null;

  // Regulatory Reservation Clause
  regulatoryClauseAccepted: boolean | null;
  regulatoryClauseFullName: string | null;

  // Client Agreement (electronic signature via OTP)
  agreementAccepted: boolean | null;
  agreementFullName: string | null;
  agreementSignedAt: string | null;
  agreementOtpVerifiedAt: string | null;
  agreementSignatureIp: string | null;

  // Tracking
  currentStep: number | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  documents: KycDocument[];
  reviews: KycReviewRecord[];
}
