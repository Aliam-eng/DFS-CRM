import { z } from "zod";

// =============================================
// Step 0: Personal Information (Part A)
// =============================================
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  mothersFullName: z.string().optional(),
  placeOfBirth: z.string().min(1, "Place of birth is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE"], { error: "Gender is required" }),
  nationality: z.string().min(1, "Nationality is required"),
  otherNationality: z.string().optional(),
  idNumber: z.string().optional(),
  idIssueDate: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiryDate: z.string().optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"], {
    error: "Marital status is required",
  }),
  spouseFullName: z.string().optional(),
  spouseProfession: z.string().optional(),
  numberOfDependents: z.number().min(0).optional().nullable(),
  phoneNumber: z.string().optional(),
  emailAddress: z.string().optional(),
});

// =============================================
// Step 1: Residential Address (Part B)
// =============================================
export const addressSchema = z.object({
  homeStatus: z.enum(["OWNED", "RENTED"], { error: "Home status is required" }),
  primaryCountry: z.string().min(1, "Country is required"),
  primaryCity: z.string().min(1, "City is required"),
  primaryArea: z.string().optional(),
  primaryStreet: z.string().optional(),
  primaryBuilding: z.string().optional(),
  primaryFloor: z.string().optional(),
  primaryApartment: z.string().optional(),
  hasSecondaryAddress: z.boolean().optional(),
  secondaryHomeStatus: z.string().optional(),
  secondaryCountry: z.string().optional(),
  secondaryCity: z.string().optional(),
  secondaryArea: z.string().optional(),
  secondaryStreet: z.string().optional(),
  secondaryBuilding: z.string().optional(),
  secondaryFloor: z.string().optional(),
  secondaryApartment: z.string().optional(),
});

// =============================================
// Step 2: Occupation & Employment (Part C)
// =============================================
export const occupationSchema = z.object({
  employmentCategory: z.string().min(1, "Employment status is required"),
  currentProfession: z.string().optional(),
  institutionName: z.string().optional(),
  natureOfBusiness: z.string().optional(),
  lengthOfEmployment: z.string().optional(),
  institutionPhone: z.string().optional(),
  institutionEmail: z.string().optional(),
  personalInstitutionEmail: z.string().optional(),
  institutionWebsite: z.string().optional(),
  previousProfession: z.string().optional(),
  universityName: z.string().optional(),
  major: z.string().optional(),
  expectedGraduationYear: z.number().optional().nullable(),
  isDirectorOfListed: z.boolean().optional(),
  directorCompanyName: z.string().optional(),
  directorStockExchange: z.string().optional(),
  directorPosition: z.string().optional(),
  directorAppointmentDate: z.string().optional(),
});

// =============================================
// Step 3: Communication Preferences (Part D)
// =============================================
export const communicationSchema = z.object({
  preferEmail: z.boolean().optional(),
  preferSMS: z.boolean().optional(),
  preferWhatsApp: z.boolean().optional(),
  preferOther: z.boolean().optional(),
  preferOtherDetails: z.string().optional(),
});

// =============================================
// Step 4: Financial Information (Part E)
// =============================================
export const financialInfoSchema = z.object({
  annualIncomeRange: z.string().min(1, "Annual income is required"),
  sourceOfFunds: z.array(z.string()).min(1, "At least one source of funds is required"),
  sourceOfFundsOther: z.string().optional(),
  estimatedNetWorth: z.string().min(1, "Net worth is required"),
  sourceOfWealth: z.array(z.string()).min(1, "At least one source of wealth is required"),
  sourceOfWealthOther: z.string().optional(),
  hasOtherBankAccounts: z.boolean({ error: "This declaration is required" }),
  otherBankCountry: z.string().optional(),
  isUsPerson: z.boolean({ error: "US person declaration is required" }),
});

// =============================================
// Step 5: Beneficial Owner (Part F)
// =============================================
export const beneficialOwnerSchema = z.object({
  isActingOnBehalf: z.boolean({ error: "This declaration is required" }),
  beneficialOwner: z.any().optional(),
});

// =============================================
// Step 6: Investment Profile (Part G)
// =============================================
export const investmentProfileSchema = z.object({
  investmentStrategy: z.string().min(1, "Investment strategy is required"),
  investmentObjective: z.string().min(1, "Investment objective is required"),
  investmentObjectiveOther: z.string().optional(),
  riskTolerance: z.string().min(1, "Risk tolerance is required"),
});

// =============================================
// Step 7: Investment Experience (Part H)
// =============================================
export const investmentExperienceSchema = z.object({
  investmentExperience: z.any().optional(),
});

// =============================================
// Step 8: General Compliance (Part I)
// =============================================
export const complianceSchema = z.object({
  isAssociatedWithListed: z.boolean({ error: "This declaration is required" }),
  associatedListedDetails: z.string().optional(),
});

// =============================================
// Step 9: PEP Declaration (Part J)
// =============================================
export const pepSchema = z.object({
  pepStatus: z.enum(["NOT_PEP", "IS_PEP", "PEP_FAMILY_ASSOCIATE"], {
    error: "PEP status is required",
  }),
  pepDetails: z.string().optional(),
});

// =============================================
// Step 11: Declaration
// =============================================
export const declarationSchema = z.object({
  declarationAccepted: z.literal(true, {
    error: "You must accept the declaration",
  }),
  declarationFullName: z.string().min(1, "Full name is required"),
});

// =============================================
// Review Schema (for compliance/operations)
// =============================================
export const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});
