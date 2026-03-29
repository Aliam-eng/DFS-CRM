import { KycStatus, UserRole } from "@prisma/client";

export const KYC_TRANSITIONS: Record<KycStatus, KycStatus[]> = {
  DRAFT: [KycStatus.SUBMITTED],
  SUBMITTED: [KycStatus.COMPLIANCE_APPROVED, KycStatus.COMPLIANCE_REJECTED],
  COMPLIANCE_APPROVED: [KycStatus.OPERATIONS_APPROVED, KycStatus.OPERATIONS_REJECTED],
  COMPLIANCE_REJECTED: [KycStatus.DRAFT],
  OPERATIONS_APPROVED: [],
  OPERATIONS_REJECTED: [KycStatus.DRAFT],
};

export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  COMPLIANCE_APPROVED: "Compliance Approved",
  COMPLIANCE_REJECTED: "Compliance Rejected",
  OPERATIONS_APPROVED: "Approved",
  OPERATIONS_REJECTED: "Operations Rejected",
};

export const KYC_STATUS_COLORS: Record<KycStatus, string> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  COMPLIANCE_APPROVED: "warning",
  COMPLIANCE_REJECTED: "destructive",
  OPERATIONS_APPROVED: "success",
  OPERATIONS_REJECTED: "destructive",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: "Client",
  COMPLIANCE: "Compliance",
  OPERATIONS: "Operations",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  CLIENT: "/client/dashboard",
  COMPLIANCE: "/compliance/dashboard",
  OPERATIONS: "/operations/dashboard",
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/super-admin/dashboard",
};

// =============================================
// PART A: Personal Information
// =============================================

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male / ذكر" },
  { value: "FEMALE", label: "Female / أنثى" },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: "SINGLE", label: "Single / أعزب" },
  { value: "MARRIED", label: "Married / متزوج" },
  { value: "DIVORCED", label: "Divorced / مطلّق" },
  { value: "WIDOWED", label: "Widowed / أرمل" },
];

// =============================================
// PART B: Address
// =============================================

export const HOME_STATUS_OPTIONS = [
  { value: "OWNED", label: "Owned / ملك" },
  { value: "RENTED", label: "Rented / إيجار" },
];

// =============================================
// PART C: Employment
// =============================================

export const EMPLOYMENT_CATEGORY_OPTIONS = [
  { value: "EMPLOYED", label: "Employed / موظف" },
  { value: "SELF_EMPLOYED", label: "Self-Employed / أعمل لحسابي الخاص" },
  { value: "BUSINESS_OWNER", label: "Business Owner / صاحب عمل" },
  { value: "RETIRED", label: "Retired / متقاعد" },
  { value: "UNEMPLOYED", label: "Unemployed / عاطل عن العمل" },
  { value: "STUDENT", label: "Student / طالب" },
];

// =============================================
// PART E: Financial Information
// =============================================

export const ANNUAL_INCOME_RANGE_OPTIONS = [
  { value: "BELOW_20K", label: "Below $20,000" },
  { value: "FROM_20K_TO_150K", label: "$20,001 to $150,000" },
  { value: "FROM_150K_TO_500K", label: "$150,001 to $500,000" },
  { value: "FROM_500K_TO_1M", label: "$500,001 to $1,000,000" },
  { value: "ABOVE_1M", label: "Above $1,000,001" },
];

export const NET_WORTH_RANGE_OPTIONS = [
  { value: "BELOW_50K", label: "Below $50,000" },
  { value: "FROM_50K_TO_250K", label: "$50,001 – $250,000" },
  { value: "FROM_250K_TO_1M", label: "$250,001 – $1,000,000" },
  { value: "ABOVE_1M", label: "Above $1,000,000" },
];

export const SOURCE_OF_FUNDS_OPTIONS = [
  { value: "SALARY", label: "Salary / راتب" },
  { value: "BUSINESS_INCOME", label: "Business Income / دخل تجاري" },
  { value: "SAVINGS", label: "Savings / مدخرات" },
  { value: "INHERITANCE", label: "Inheritance / ميراث" },
  { value: "INVESTMENT_RETURNS", label: "Investment Returns / عوائد استثمارية" },
  { value: "OTHER", label: "Other / أخرى" },
];

export const SOURCE_OF_WEALTH_OPTIONS = [
  { value: "EMPLOYMENT_INCOME", label: "Employment Income / دخل من عمل" },
  { value: "BUSINESS_OWNERSHIP", label: "Business Ownership / ملكية شركة" },
  { value: "REAL_ESTATE", label: "Real Estate Investments / استثمارات عقارية" },
  { value: "INVESTMENT_PORTFOLIO", label: "Investment Portfolio / محفظة استثمارية" },
  { value: "INHERITANCE_WEALTH", label: "Inheritance / ميراث" },
  { value: "OTHER_WEALTH", label: "Other / أخرى" },
];

// =============================================
// PART G: Investment Profile
// =============================================

export const INVESTMENT_STRATEGY_OPTIONS = [
  { value: "CONSERVATIVE", label: "Conservative (Low Risk) / محافظة" },
  { value: "MODERATE", label: "Moderate (Medium Risk) / معتدلة" },
  { value: "AGGRESSIVE", label: "Aggressive (High Risk) / متهورة" },
];

export const INVESTMENT_OBJECTIVE_OPTIONS = [
  { value: "CAPITAL_GROWTH", label: "Capital Growth / نمو رأس المال" },
  { value: "INCOME", label: "Income / دخل" },
  { value: "CAPITAL_PROTECTION", label: "Capital Protection / حماية رأس المال" },
  { value: "HEDGING", label: "Hedging / تحوط" },
  { value: "OTHER_OBJECTIVE", label: "Other / أخرى" },
];

export const RISK_TOLERANCE_OPTIONS = [
  { value: "LOW", label: "Low / منخفض" },
  { value: "MEDIUM", label: "Medium / متوسط" },
  { value: "HIGH", label: "High / عالي" },
];

// =============================================
// PART H: Investment Experience
// =============================================

export const INVESTMENT_INSTRUMENT_OPTIONS = [
  { key: "securities", label: "Trading Securities / تداول الأوراق المالية" },
  { key: "futuresCfds", label: "Trading Futures/CFDs / تداول العقود الآجلة" },
  { key: "options", label: "Trading Options / تداول الخيارات" },
  { key: "commodities", label: "Trading Commodities / تداول السلع" },
  { key: "bonds", label: "Trading Bonds / تداول السندات" },
  { key: "forex", label: "Trading Currencies (Forex) / تداول العملات" },
];

// =============================================
// PART J: PEP Declaration
// =============================================

export const PEP_STATUS_OPTIONS = [
  { value: "NOT_PEP", label: "I am NOT a Politically Exposed Person" },
  { value: "IS_PEP", label: "I am a Politically Exposed Person" },
  { value: "PEP_FAMILY_ASSOCIATE", label: "I am a family member or close associate of a PEP" },
];
