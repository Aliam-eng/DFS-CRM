"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Flex,
  Icon,
  Divider,
  Switch,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Briefcase,
  Upload,
  ClipboardCheck,
  MapPin,
  DollarSign,
  BarChart3,
  Shield,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Users,
  Target,
  Scale,
} from "lucide-react";
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  HOME_STATUS_OPTIONS,
  EMPLOYMENT_CATEGORY_OPTIONS,
  ANNUAL_INCOME_RANGE_OPTIONS,
  NET_WORTH_RANGE_OPTIONS,
  SOURCE_OF_FUNDS_OPTIONS,
  SOURCE_OF_WEALTH_OPTIONS,
  INVESTMENT_STRATEGY_OPTIONS,
  INVESTMENT_OBJECTIVE_OPTIONS,
  RISK_TOLERANCE_OPTIONS,
  INVESTMENT_INSTRUMENT_OPTIONS,
  formatDocumentType,
} from "@/lib/constants";
import { FormStepper } from "@/components/shared/form-stepper";
import { FileUploadZone } from "@/components/shared/file-upload-zone";
import { ReviewSection } from "@/components/shared/review-section";
import { KycFormSkeleton } from "@/components/shared/loading-skeletons";
import {
  CLIENT_DECLARATION_EN_PARAGRAPHS,
  CLIENT_DECLARATION_AR_PARAGRAPHS,
  REGULATORY_RESERVATION_CLAUSE_EN,
  REGULATORY_RESERVATION_CLAUSE_AR,
  CLIENT_AGREEMENT_AR,
} from "@/lib/kyc-legal-texts";
import type {
  InvestmentExperienceData,
  BeneficialOwnerInfo,
} from "@/types/kyc";

/* ─── Step Configuration ─── */

const STEP_CONFIG = [
  { label: "Personal Info", icon: User, description: "Part A: Your identity details" },
  { label: "Address", icon: MapPin, description: "Part B: Residential & overseas address" },
  { label: "Employment", icon: Briefcase, description: "Part C: Occupation & employment status" },
  { label: "Communication", icon: MessageSquare, description: "Part D: Communication preferences" },
  { label: "Financial", icon: DollarSign, description: "Part E: Financial information" },
  { label: "Beneficial Owner", icon: Users, description: "Part F: Beneficial owner declaration" },
  { label: "Investment Profile", icon: Target, description: "Part G: Investment strategy & objectives" },
  { label: "Experience", icon: BarChart3, description: "Part H: Investment experience" },
  { label: "Compliance", icon: Scale, description: "Part I: General compliance questions" },
  { label: "PEP", icon: Shield, description: "Part J: Politically Exposed Person" },
  { label: "Documents", icon: Upload, description: "Upload identity & address documents" },
  { label: "Declaration", icon: ClipboardCheck, description: "Client declaration & regulatory clause" },
  { label: "Client Agreement", icon: FileText, description: "Sign the client agreement (OTP verification)" },
  { label: "Review & Submit", icon: ClipboardCheck, description: "Review and submit your application" },
];

const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -30 : 30, opacity: 0 }),
};

interface StepProps {
  form: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
  errors: Record<string, string>;
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function KycPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [kycId, setKycId] = useState("");
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [docs, setDocs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
  const router = useRouter();
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const warningBg = useColorModeValue("yellow.50", "yellow.900");
  const warningBorder = useColorModeValue("yellow.200", "yellow.700");
  const stepIconBg = useColorModeValue("brand.50", "brand.900");
  const headerGradient = useColorModeValue(
    "linear(to-r, brand.600, navy.500)",
    "linear(to-r, brand.800, navy.700)"
  );

  useEffect(() => {
    const init = async () => {
      const res = await fetch("/api/kyc", { method: "POST" });
      const kyc = await res.json();
      if (!res.ok || !kyc?.id) {
        setError(kyc?.error || `Failed to load KYC (HTTP ${res.status}). Please try again or contact support.`);
        setLoading(false);
        return;
      }
      setKycId(kyc.id);
      // Set boolean defaults to false (No) for Yes/No questions where
      // a default is safe (US-Person already handled at registration,
      // isActingOnBehalf has its own explicit validator). Compliance
      // questions (isAssociatedWithListed, hasInsideInformation) MUST NOT
      // be pre-selected — the UAT requires the client to actively pick.
      const BOOL_DEFAULTS = ["isUsPerson", "hasOtherBankAccounts"];
      for (const key of BOOL_DEFAULTS) {
        if (kyc[key] === null || kyc[key] === undefined) kyc[key] = false;
      }
      // Derive ID document type from existing data
      if (!kyc.idDocumentType) {
        if (kyc.passportNumber) kyc.idDocumentType = "PASSPORT";
        else if (kyc.idNumber) kyc.idDocumentType = "NATIONAL_ID";
        else kyc.idDocumentType = "";
      }
      setForm(kyc);
      const detailRes = await fetch(`/api/kyc/${kyc.id}`);
      const detail = await detailRes.json();
      setDocs(detail.documents || []);
      // Capture registration email/phone for later cross-validation
      if (detail.user) {
        setRegisteredEmail(detail.user.email || "");
        setRegisteredPhone(detail.user.phone || "");
        // Pre-fill KYC email/phone if empty
        if (!kyc.emailAddress && detail.user.email) {
          kyc.emailAddress = detail.user.email;
        }
        if (!kyc.phoneNumber && detail.user.phone) {
          kyc.phoneNumber = detail.user.phone;
        }
        setForm({ ...kyc });
      }
      if (kyc.status !== "DRAFT") {
        router.push("/client/kyc/status");
        return;
      }
      if (kyc.currentStep) setStep(kyc.currentStep);
      setLoading(false);
    };
    init();
  }, [router]);

  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const updateField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field when user types
    if (stepErrors[key]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {};

    const requireString = (field: string, msg: string) => {
      if (!form[field] || !(form[field] as string).trim()) errs[field] = msg;
    };
    switch (step) {
      case 0: // Personal Info
        requireString("firstName", "First name is required");
        requireString("lastName", "Last name is required");
        requireString("middleName", "Father's name is required");
        requireString("mothersFullName", "Mother's full name is required");
        requireString("placeOfBirth", "Place of birth is required");
        requireString("dateOfBirth", "Date of birth is required");
        requireString("gender", "Gender is required");
        requireString("nationality", "Nationality is required");
        requireString("maritalStatus", "Marital status is required");
        if (form.maritalStatus === "MARRIED") {
          requireString("spouseFullName", "Spouse's full name is required");
        }
        // Email/phone in KYC must match registration
        if (form.emailAddress && registeredEmail && (form.emailAddress as string).toLowerCase() !== registeredEmail.toLowerCase()) {
          errs["emailAddress"] = "Email must match the email used at registration";
        }
        if (form.phoneNumber && registeredPhone) {
          const a = (form.phoneNumber as string).replace(/\D/g, "");
          const b = registeredPhone.replace(/\D/g, "");
          if (a && b && a !== b) errs["phoneNumber"] = "Phone must match the phone used at registration";
        }
        break;
      case 1: // Address
        requireString("homeStatus", "Home status is required");
        requireString("primaryCountry", "Country is required");
        requireString("primaryCity", "City is required");
        requireString("primaryArea", "Area / Neighborhood is required");
        requireString("primaryStreet", "Street name & number is required");
        requireString("primaryBuilding", "Building name or number is required");
        requireString("primaryFloor", "Floor number is required");
        break;
      case 2: // Employment
        requireString("employmentCategory", "Employment status is required");
        if (form.employmentCategory === "EMPLOYED" || form.employmentCategory === "SELF_EMPLOYED") {
          requireString("institutionName", "Company / institution name is required");
        }
        if (form.employmentCategory === "STUDENT") {
          requireString("universityName", "University name is required");
        }
        if (form.isDirectorOfListed) {
          requireString("directorCompanyName", "Name of company is required");
          requireString("directorStockExchange", "Stock exchange is required");
          requireString("directorPosition", "Position held is required");
          requireString("directorAppointmentDate", "Date of appointment is required");
        }
        break;
      case 3: // Communication — no required fields
        break;
      case 4: // Financial
        requireString("annualIncomeRange", "Annual income range is required");
        {
          const funds = (form.sourceOfFunds as string[]) || [];
          if (funds.length === 0) errs["sourceOfFunds"] = "At least one source of funds is required";
        }
        requireString("estimatedNetWorth", "Estimated net worth is required");
        {
          const wealth = (form.sourceOfWealth as string[]) || [];
          if (wealth.length === 0) errs["sourceOfWealth"] = "At least one source of wealth is required";
        }
        break;
      case 5: // Beneficial Owner — must explicitly answer Yes/No
        if (form.isActingOnBehalf === undefined || form.isActingOnBehalf === null) {
          errs["isActingOnBehalf"] = "Please answer the beneficial owner question";
        }
        if (form.isActingOnBehalf === true) {
          const raw = (form.beneficialOwner || {}) as Record<string, unknown>;
          const owners = (raw.owners as Record<string, unknown>[]) ||
            (Object.keys(raw).length > 0 && !("owners" in raw) ? [raw] : [{}]);
          if (owners.length === 0) {
            errs["bo_fullName"] = "At least one beneficial owner is required";
          }
          owners.forEach((bo, idx) => {
            const prefix = idx === 0 ? "bo" : `bo_${idx}`;
            if (!bo.fullName) errs[`${prefix}_fullName`] = "Full name is required";
            if (!bo.dateOfBirth) errs[`${prefix}_dateOfBirth`] = "Date of birth is required";
            if (!bo.nationality) errs[`${prefix}_nationality`] = "Nationality is required";
            const idType = bo.idType as string | undefined;
            if (!idType) {
              errs[`${prefix}_id`] = "Select ID or Passport";
            } else if (idType === "ID" && !bo.idNumber) {
              errs[`${prefix}_id`] = "ID number is required";
            } else if (idType === "PASSPORT") {
              if (!bo.passportNumber) errs[`${prefix}_id`] = "Passport number is required";
              if (!bo.passportExpiryDate) {
                errs[`${prefix}_passportExpiry`] = "Passport expiry date is required";
              } else {
                const expiry = new Date(bo.passportExpiryDate as string);
                if (expiry < new Date()) errs[`${prefix}_passportExpiry`] = "Passport is expired";
              }
            }
            if (!bo.relationshipToAccountHolder) errs[`${prefix}_relationship`] = "Relationship is required";
            if (bo.ownershipPercentage === undefined || bo.ownershipPercentage === null || bo.ownershipPercentage === "") {
              errs[`${prefix}_ownership`] = "% Ownership/Control is required";
            }
          });
        }
        break;
      case 6: // Investment Profile
        requireString("investmentStrategy", "Investment strategy is required");
        requireString("investmentObjective", "Investment objective is required");
        requireString("riskTolerance", "Risk tolerance is required");
        break;
      case 7: // Investment Experience — every instrument must be answered, years if Yes
        {
          const exp = (form.investmentExperience || {}) as Record<string, { has?: boolean; years?: number | null }>;
          const INSTRUMENTS: Array<{ key: string; label: string }> = [
            { key: "securities", label: "Trading Securities" },
            { key: "futuresCfds", label: "Trading Futures/CFDs" },
            { key: "options", label: "Trading Options" },
            { key: "commodities", label: "Trading Commodities" },
            { key: "bonds", label: "Trading Bonds" },
            { key: "forex", label: "Trading Currencies (Forex)" },
          ];
          for (const inst of INSTRUMENTS) {
            const entry = exp[inst.key];
            if (!entry || typeof entry.has !== "boolean") {
              errs[`exp_${inst.key}`] = `${inst.label}: please answer Yes or No`;
            } else if (entry.has && (entry.years === null || entry.years === undefined || Number(entry.years) <= 0)) {
              errs[`exp_${inst.key}_years`] = `${inst.label}: years of experience required`;
            }
          }
        }
        break;
      case 8: // Compliance — client must actively answer Yes or No; explanations required when Yes
        if (form.isAssociatedWithListed === undefined || form.isAssociatedWithListed === null) {
          errs["isAssociatedWithListed"] = "Please answer the compliance question";
        }
        if (form.hasInsideInformation === undefined || form.hasInsideInformation === null) {
          errs["hasInsideInformation"] = "Please answer the inside-information question";
        }
        if (form.isAssociatedWithListed) requireString("associatedListedDetails", "Please explain");
        if (form.hasInsideInformation) requireString("insideInformationDetails", "Please explain");
        break;
      case 9: // PEP
        {
          const notPep = form.pepStatus === "NOT_PEP";
          const isSelf = !!form.pepIsSelf;
          const isFamily = !!form.pepIsFamily;
          if (!notPep && !isSelf && !isFamily) {
            errs["pepStatus"] = "Please select a PEP option";
          }
          if (notPep && (isSelf || isFamily)) {
            errs["pepStatus"] = "Option 1 cannot be combined with Option 2 or 3";
          }
          if (isSelf || isFamily) {
            requireString("pepDetails", "Please explain your PEP status");
          }
        }
        break;
      case 10: // Documents
        {
          const idType = form.idDocumentType as string;
          if (!idType) {
            errs["idDocumentType"] = "Please select an identity document type";
          } else if (idType === "PASSPORT") {
            requireString("passportNumber", "Passport number is required");
            if (form.passportExpiryDate) {
              const expiry = new Date(form.passportExpiryDate as string);
              if (expiry < new Date()) errs["passportExpiryDate"] = "Passport has expired";
            }
          } else if (idType === "NATIONAL_ID") {
            requireString("idNumber", "ID number is required");
          }
          const hasIdentity = docs.some(
            (d) => ["PASSPORT", "NATIONAL_ID"].includes(d.documentType as string)
          );
          const hasAddress = docs.some((d) =>
            ["UTILITY_BILL", "BANK_STATEMENT"].includes(d.documentType as string)
          );
          if (!hasIdentity) errs["identityDoc"] = "Identity document upload is required";
          if (!hasAddress) errs["addressDoc"] = "Proof of address is required";
        }
        break;
      case 11: // Declaration + Regulatory Reservation Clause
        if (!form.declarationAccepted) errs["declarationAccepted"] = "Declaration must be accepted";
        requireString("declarationFullName", "Declaration full name is required");
        if (!form.regulatoryClauseAccepted) errs["regulatoryClauseAccepted"] = "Regulatory Reservation Clause must be accepted";
        requireString("regulatoryClauseFullName", "Full name is required for the regulatory clause");
        break;
      case 12: // Client Agreement (name-only signature)
        if (!form.agreementAccepted) errs["agreementAccepted"] = "You must accept the client agreement";
        requireString("agreementFullName", "Full name is required to sign the agreement");
        if (!form.agreementSignedAt) errs["agreementAccepted"] = "Please click 'Sign agreement' to record your signature";
        break;
      case 13: // Review & Submit — final guard, all earlier validations should pass
        if (!form.declarationAccepted) errs["declarationAccepted"] = "Declaration must be accepted";
        if (!form.regulatoryClauseAccepted) errs["regulatoryClauseAccepted"] = "Regulatory clause must be accepted";
        if (!form.agreementAccepted || !form.agreementSignedAt) errs["agreementAccepted"] = "Client agreement must be signed";
        break;
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveStep = async () => {
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = { ...form, currentStep: step };
      const exclude = ["id", "userId", "status", "createdAt", "updatedAt", "submittedAt", "user", "documents", "reviews"];
      for (const key of exclude) delete body[key];
      await fetch(`/api/kyc/${kycId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      setError("Failed to save");
    }
    setSaving(false);
  };

  const nextStep = async () => {
    if (!validateCurrentStep()) {
      toast({ title: "Please fill in all required fields", status: "warning", duration: 3000 });
      return;
    }
    await saveStep();
    setStepErrors({});
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEP_CONFIG.length - 1));
  };

  const prevStep = () => {
    setStepErrors({});
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const uploadFile = async (file: File, category: string, documentType: string, side?: string) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    fd.append("kycSubmissionId", kycId);
    fd.append("documentType", documentType);
    if (side) fd.append("side", side);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const result = await res.json();
      setDocs((prev) => [...prev, { ...result, documentType, side }]);
    }
    setUploading(false);
  };

  const submitKyc = async () => {
    if (!validateCurrentStep()) {
      toast({ title: "Please fill in all required fields", status: "warning", duration: 3000 });
      return;
    }
    setSaving(true);
    setError("");
    await saveStep();
    const res = await fetch(`/api/kyc/${kycId}/submit`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.details ? data.details.join(", ") : data.error;
      setError(errMsg);
      toast({ title: "Submission Failed", description: errMsg, status: "error", duration: 5000 });
      setSaving(false);
      return;
    }
    toast({
      title: "KYC Submitted!",
      description: "Your KYC application has been submitted for review",
      status: "success",
      duration: 3000,
    });
    router.push("/client/kyc/status");
  };

  if (loading) return <KycFormSkeleton />;

  const renderStep = () => {
    const e = stepErrors;
    switch (step) {
      case 0: return <PersonalInfoStep form={form} updateField={updateField} errors={e} />;
      case 1: return <AddressStep form={form} updateField={updateField} errors={e} />;
      case 2: return <OccupationStep form={form} updateField={updateField} errors={e} />;
      case 3: return <CommunicationStep form={form} updateField={updateField} errors={e} />;
      case 4: return <FinancialStep form={form} updateField={updateField} errors={e} />;
      case 5: return <BeneficialOwnerStep form={form} updateField={updateField} errors={e} />;
      case 6: return <InvestmentProfileStep form={form} updateField={updateField} errors={e} />;
      case 7: return <InvestmentExperienceStep form={form} updateField={updateField} errors={e} />;
      case 8: return <ComplianceStep form={form} updateField={updateField} errors={e} />;
      case 9: return <PepStep form={form} updateField={updateField} errors={e} />;
      case 10: return <DocumentsStep form={form} updateField={updateField} docs={docs} uploading={uploading} uploadFile={uploadFile} errors={e} />;
      case 11: return <DeclarationStep form={form} updateField={updateField} errors={e} />;
      case 12: return <ClientAgreementStep form={form} updateField={updateField} errors={e} kycId={kycId} />;
      case 13: return <DeclarationReviewStep form={form} updateField={updateField} docs={docs} warningBg={warningBg} warningBorder={warningBorder} errors={e} />;
      default: return null;
    }
  };

  return (
    <Box maxW="3xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box bgGradient={headerGradient} borderRadius="xl" px={6} py={5} color="white">
          <HStack spacing={3}>
            <Icon as={Shield} boxSize={7} />
            <Box>
              <Heading size="md" color="white">KYC Application</Heading>
              <Text fontSize="sm" opacity={0.85} mt={0.5}>
                Complete your Know Your Customer verification
              </Text>
            </Box>
          </HStack>
        </Box>

        <FormStepper
          steps={STEP_CONFIG.map((s) => ({ label: s.label, icon: s.icon }))}
          activeStep={step}
        />

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <Box px={5} pt={5} pb={2}>
            <HStack spacing={3}>
              <Flex w={10} h={10} borderRadius="lg" bg={stepIconBg} align="center" justify="center" flexShrink={0}>
                <Icon as={STEP_CONFIG[step].icon} boxSize={5} color="brand.500" />
              </Flex>
              <Box>
                <Heading size="sm">{STEP_CONFIG[step].label}</Heading>
                <Text fontSize="sm" color={mutedColor}>{STEP_CONFIG[step].description}</Text>
              </Box>
            </HStack>
          </Box>

          <Box px={5} pb={5} overflow="hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <VStack spacing={4} align="stretch" mt={3}>
                  {renderStep()}
                </VStack>
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>

        <Flex justify="space-between" align="center">
          <Button
            variant="outline"
            onClick={prevStep}
            isDisabled={step === 0}
            leftIcon={<Icon as={ChevronLeft} boxSize={4} />}
          >
            Previous
          </Button>

          <Text fontSize="xs" color={mutedColor} display={{ base: "none", sm: "block" }}>
            Step {step + 1} of {STEP_CONFIG.length}
          </Text>

          {step < STEP_CONFIG.length - 1 ? (
            <Button
              colorScheme="brand"
              onClick={nextStep}
              isDisabled={saving}
              isLoading={saving}
              loadingText="Saving..."
              rightIcon={<Icon as={ChevronRight} boxSize={4} />}
            >
              Save & Continue
            </Button>
          ) : (
            <Button
              colorScheme="brand"
              onClick={submitKyc}
              isDisabled={saving}
              isLoading={saving}
              loadingText="Submitting..."
              bgGradient="linear(to-r, brand.500, navy.500)"
              _hover={{ bgGradient: "linear(to-r, brand.600, navy.600)" }}
            >
              Submit KYC
            </Button>
          )}
        </Flex>
      </VStack>
    </Box>
  );
}

/* ─── Sub-section header ─── */

function SectionHeader({ icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <HStack spacing={2}>
      <Icon as={icon} boxSize={4} color="brand.500" />
      <Text fontSize="sm" fontWeight="semibold" color="brand.600">{label}</Text>
    </HStack>
  );
}

/* ═══════════════════════════════════════════
   STEP 0: PERSONAL INFORMATION (Part A)
   ═══════════════════════════════════════════ */

function PersonalInfoStep({ form, updateField, errors }: StepProps) {
  return (
    <>
      <SectionHeader icon={User} label="Identity / المعلومات الشخصية" />
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isInvalid={!!errors.firstName}>
          <FormLabel>First Name / الاسم الأول *</FormLabel>
          <Input value={(form.firstName as string) || ""} onChange={(e) => updateField("firstName", e.target.value)} />
          <FormErrorMessage>{errors.firstName}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.lastName}>
          <FormLabel>Last Name / الشهرة *</FormLabel>
          <Input value={(form.lastName as string) || ""} onChange={(e) => updateField("lastName", e.target.value)} />
          <FormErrorMessage>{errors.lastName}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isInvalid={!!errors.middleName}>
          <FormLabel>{"Middle Name (Father's Name) / اسم الأب *"}</FormLabel>
          <Input value={(form.middleName as string) || ""} onChange={(e) => updateField("middleName", e.target.value)} />
          <FormErrorMessage>{errors.middleName}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.mothersFullName}>
          <FormLabel>{"Mother's Full Name / اسم الأم وشهرتها *"}</FormLabel>
          <Input value={(form.mothersFullName as string) || ""} onChange={(e) => updateField("mothersFullName", e.target.value)} />
          <FormErrorMessage>{errors.mothersFullName}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isInvalid={!!errors.placeOfBirth}>
          <FormLabel>Place of Birth / مكان الولادة *</FormLabel>
          <Input value={(form.placeOfBirth as string) || ""} onChange={(e) => updateField("placeOfBirth", e.target.value)} placeholder="Place of birth" />
          <FormErrorMessage>{errors.placeOfBirth}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.dateOfBirth}>
          <FormLabel>Date of Birth *</FormLabel>
          <Input type="date" value={(form.dateOfBirth as string)?.split("T")[0] || ""} onChange={(e) => updateField("dateOfBirth", e.target.value)} />
          <FormErrorMessage>{errors.dateOfBirth}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isInvalid={!!errors.gender}>
          <FormLabel>Gender / الجنس *</FormLabel>
          <RadioGroup value={(form.gender as string) || ""} onChange={(v) => updateField("gender", v)}>
            <Stack direction="row" spacing={4}>
              {GENDER_OPTIONS.map((o) => <Radio key={o.value} value={o.value} size="sm">{o.label}</Radio>)}
            </Stack>
          </RadioGroup>
          <FormErrorMessage>{errors.gender}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.maritalStatus}>
          <FormLabel>Marital Status / الحالة الاجتماعية *</FormLabel>
          <Select value={(form.maritalStatus as string) || ""} onChange={(e) => updateField("maritalStatus", e.target.value)} placeholder="Select...">
            {MARITAL_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <FormErrorMessage>{errors.maritalStatus}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>

      <Divider />
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isInvalid={!!errors.nationality}>
          <FormLabel>Nationality / الجنسية *</FormLabel>
          <Input value={(form.nationality as string) || ""} onChange={(e) => updateField("nationality", e.target.value)} />
          <FormErrorMessage>{errors.nationality}</FormErrorMessage>
        </FormControl>
        <FormControl>
          <FormLabel>Other Nationality (if applicable)</FormLabel>
          <Input value={(form.otherNationality as string) || ""} onChange={(e) => updateField("otherNationality", e.target.value)} />
        </FormControl>
      </SimpleGrid>

      <Divider />
      <Alert status="info" borderRadius="md" fontSize="sm">
        <AlertIcon />
        <Box>
          <Text>The Phone/Mobile Number and Email Address provided during registration are permanently linked to your account and cannot be modified through this portal. If you need to update these details, please contact DFS.</Text>
          <Text mt={1} textAlign="right" dir="rtl">رقم الهاتف/الهاتف المحمول وعنوان البريد الإلكتروني اللذان تم إدخالهما عند التسجيل مرتبطان بشكل دائم بحسابكم، ولا يمكن تعديلهما من خلال هذه البوابة. في حال الحاجة إلى تحديث أيٍّ من هذه البيانات، يرجى التواصل مع DFS.</Text>
        </Box>
      </Alert>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>Phone/Mobile Number / رقم الهاتف</FormLabel>
          <Input value={(form.phoneNumber as string) || ""} isReadOnly bg="gray.50" _dark={{ bg: "gray.700" }} placeholder="+961 ..." />
        </FormControl>
        <FormControl>
          <FormLabel>Email Address / عنوان البريد الإلكتروني</FormLabel>
          <Input type="email" value={(form.emailAddress as string) || ""} isReadOnly bg="gray.50" _dark={{ bg: "gray.700" }} />
        </FormControl>
      </SimpleGrid>

      {form.maritalStatus === "MARRIED" && (
        <>
          <Divider />
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.spouseFullName}>
              <FormLabel>{"Spouse's Full Name / الاسم الكامل للزوج *"}</FormLabel>
              <Input value={(form.spouseFullName as string) || ""} onChange={(e) => updateField("spouseFullName", e.target.value)} />
              <FormErrorMessage>{errors.spouseFullName}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>{"Spouse's Profession / مهنة الزوج"}</FormLabel>
              <Input value={(form.spouseProfession as string) || ""} onChange={(e) => updateField("spouseProfession", e.target.value)} />
            </FormControl>
          </SimpleGrid>
        </>
      )}

      <FormControl>
        <FormLabel>Number of Dependents (under 21) / عدد المعالين</FormLabel>
        <Input type="number" min={0} value={(form.numberOfDependents as number) ?? ""} onChange={(e) => updateField("numberOfDependents", e.target.value ? parseInt(e.target.value) : null)} />
      </FormControl>
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 1: RESIDENTIAL ADDRESS (Part B)
   ═══════════════════════════════════════════ */

function AddressStep({ form, updateField, errors }: StepProps) {
  const hasSecondary = form.hasSecondaryAddress as boolean;

  return (
    <>
      <SectionHeader icon={MapPin} label="Permanent Residential Address / العنوان الدائم" />
      <FormControl isInvalid={!!errors.homeStatus}>
        <FormLabel>Home Status / حالة السكن *</FormLabel>
        <RadioGroup value={(form.homeStatus as string) || ""} onChange={(v) => updateField("homeStatus", v)}>
          <Stack direction="row" spacing={4}>
            {HOME_STATUS_OPTIONS.map((o) => <Radio key={o.value} value={o.value} size="sm">{o.label}</Radio>)}
          </Stack>
        </RadioGroup>
        <FormErrorMessage>{errors.homeStatus}</FormErrorMessage>
      </FormControl>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isInvalid={!!errors.primaryCountry}>
          <FormLabel>Country / البلد *</FormLabel>
          <Input value={(form.primaryCountry as string) || ""} onChange={(e) => updateField("primaryCountry", e.target.value)} />
          <FormErrorMessage>{errors.primaryCountry}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.primaryCity}>
          <FormLabel>City / المدينة *</FormLabel>
          <Input value={(form.primaryCity as string) || ""} onChange={(e) => updateField("primaryCity", e.target.value)} />
          <FormErrorMessage>{errors.primaryCity}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isInvalid={!!errors.primaryArea}>
          <FormLabel>Area/Neighborhood / المنطقة *</FormLabel>
          <Input value={(form.primaryArea as string) || ""} onChange={(e) => updateField("primaryArea", e.target.value)} />
          <FormErrorMessage>{errors.primaryArea}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.primaryStreet}>
          <FormLabel>Street Name & Number / اسم الشارع ورقمه *</FormLabel>
          <Input value={(form.primaryStreet as string) || ""} onChange={(e) => updateField("primaryStreet", e.target.value)} />
          <FormErrorMessage>{errors.primaryStreet}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <FormControl isInvalid={!!errors.primaryBuilding}>
          <FormLabel>Building Name or Number / المبنى *</FormLabel>
          <Input value={(form.primaryBuilding as string) || ""} onChange={(e) => updateField("primaryBuilding", e.target.value)} />
          <FormErrorMessage>{errors.primaryBuilding}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.primaryFloor}>
          <FormLabel>Floor Number / الطابق *</FormLabel>
          <Input value={(form.primaryFloor as string) || ""} onChange={(e) => updateField("primaryFloor", e.target.value)} />
          <FormErrorMessage>{errors.primaryFloor}</FormErrorMessage>
        </FormControl>
        <FormControl>
          <FormLabel>Apartment Number / الشقة</FormLabel>
          <Input value={(form.primaryApartment as string) || ""} onChange={(e) => updateField("primaryApartment", e.target.value)} />
        </FormControl>
      </SimpleGrid>

      <Divider />
      <FormControl>
        <FormLabel>Do you have a secondary or overseas address? / هل لديك عنوان ثانٍ أو في الخارج؟</FormLabel>
        <RadioGroup value={hasSecondary === true ? "YES" : hasSecondary === false ? "NO" : ""} onChange={(v) => updateField("hasSecondaryAddress", v === "YES")}>
          <Stack direction="row" spacing={6}>
            <Radio value="YES" size="sm">Yes / نعم</Radio>
            <Radio value="NO" size="sm">No / لا</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      {hasSecondary && (
        <>
          <Divider />
          <SectionHeader icon={MapPin} label="Secondary / Overseas Address / العنوان الثاني أو في الخارج" />
          <FormControl>
            <FormLabel>Home Status / حالة السكن</FormLabel>
            <RadioGroup value={(form.secondaryHomeStatus as string) || ""} onChange={(v) => updateField("secondaryHomeStatus", v)}>
              <Stack direction="row" spacing={4}>
                {HOME_STATUS_OPTIONS.map((o) => <Radio key={o.value} value={o.value} size="sm">{o.label}</Radio>)}
              </Stack>
            </RadioGroup>
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Country / البلد</FormLabel>
              <Input value={(form.secondaryCountry as string) || ""} onChange={(e) => updateField("secondaryCountry", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>City / المدينة</FormLabel>
              <Input value={(form.secondaryCity as string) || ""} onChange={(e) => updateField("secondaryCity", e.target.value)} />
            </FormControl>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Area/Neighborhood / المنطقة</FormLabel>
              <Input value={(form.secondaryArea as string) || ""} onChange={(e) => updateField("secondaryArea", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Street Name & Number / اسم الشارع ورقمه</FormLabel>
              <Input value={(form.secondaryStreet as string) || ""} onChange={(e) => updateField("secondaryStreet", e.target.value)} />
            </FormControl>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl>
              <FormLabel>Building Name or Number / المبنى</FormLabel>
              <Input value={(form.secondaryBuilding as string) || ""} onChange={(e) => updateField("secondaryBuilding", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Floor Number / الطابق</FormLabel>
              <Input value={(form.secondaryFloor as string) || ""} onChange={(e) => updateField("secondaryFloor", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Apartment Number / الشقة</FormLabel>
              <Input value={(form.secondaryApartment as string) || ""} onChange={(e) => updateField("secondaryApartment", e.target.value)} />
            </FormControl>
          </SimpleGrid>
        </>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 2: OCCUPATION & EMPLOYMENT (Part C)
   ═══════════════════════════════════════════ */

function OccupationStep({ form, updateField, errors }: StepProps) {
  const category = form.employmentCategory as string;
  const isWorking = ["EMPLOYED", "SELF_EMPLOYED", "BUSINESS_OWNER"].includes(category);
  const isRetiredOrUnemployed = ["RETIRED", "UNEMPLOYED"].includes(category);
  const isStudent = category === "STUDENT";

  return (
    <>
      <SectionHeader icon={Briefcase} label="1. Employment Status / الوضع المهني" />
      <FormControl isInvalid={!!errors.employmentCategory}>
        <FormLabel>Employment Status *</FormLabel>
        <Select value={category || ""} onChange={(e) => updateField("employmentCategory", e.target.value)} placeholder="Select...">
          {EMPLOYMENT_CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <FormErrorMessage>{errors.employmentCategory}</FormErrorMessage>
      </FormControl>

      {isWorking && (
        <>
          <Divider />
          <SectionHeader icon={Briefcase} label="2. Current Employment Information" />
          <FormControl>
            <FormLabel>Current Profession (Position/Title)</FormLabel>
            <Input value={(form.currentProfession as string) || ""} onChange={(e) => updateField("currentProfession", e.target.value)} />
          </FormControl>
          <FormControl isInvalid={!!errors.institutionName}>
            <FormLabel>Institution/Company Name *</FormLabel>
            <Input value={(form.institutionName as string) || ""} onChange={(e) => updateField("institutionName", e.target.value)} />
            <FormErrorMessage>{errors.institutionName}</FormErrorMessage>
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Nature of Business</FormLabel>
              <Input value={(form.natureOfBusiness as string) || ""} onChange={(e) => updateField("natureOfBusiness", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Length of Employment</FormLabel>
              <Input value={(form.lengthOfEmployment as string) || ""} onChange={(e) => updateField("lengthOfEmployment", e.target.value)} />
            </FormControl>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>{"Institution's Phone/Mobile"}</FormLabel>
              <Input value={(form.institutionPhone as string) || ""} onChange={(e) => updateField("institutionPhone", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Institutional Email Address</FormLabel>
              <Input type="email" value={(form.institutionEmail as string) || ""} onChange={(e) => updateField("institutionEmail", e.target.value)} />
            </FormControl>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Your Institutional Email Address</FormLabel>
              <Input type="email" value={(form.personalInstitutionEmail as string) || ""} onChange={(e) => updateField("personalInstitutionEmail", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Website (if applicable)</FormLabel>
              <Input value={(form.institutionWebsite as string) || ""} onChange={(e) => updateField("institutionWebsite", e.target.value)} />
            </FormControl>
          </SimpleGrid>
        </>
      )}

      {isRetiredOrUnemployed && (
        <>
          <Divider />
          <SectionHeader icon={Briefcase} label="3. Previous Profession" />
          <FormControl>
            <FormLabel>Previous Profession Before Retirement/Unemployment</FormLabel>
            <Input value={(form.previousProfession as string) || ""} onChange={(e) => updateField("previousProfession", e.target.value)} />
          </FormControl>
        </>
      )}

      {isStudent && (
        <>
          <Divider />
          <SectionHeader icon={Briefcase} label="4. Academic Information" />
          <FormControl isInvalid={!!errors.universityName}>
            <FormLabel>University Name *</FormLabel>
            <Input value={(form.universityName as string) || ""} onChange={(e) => updateField("universityName", e.target.value)} />
            <FormErrorMessage>{errors.universityName}</FormErrorMessage>
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Major / التخصص</FormLabel>
              <Input value={(form.major as string) || ""} onChange={(e) => updateField("major", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Expected Year of Graduation</FormLabel>
              <Input type="number" value={(form.expectedGraduationYear as number) ?? ""} onChange={(e) => updateField("expectedGraduationYear", e.target.value ? parseInt(e.target.value) : null)} />
            </FormControl>
          </SimpleGrid>
        </>
      )}

      <Divider />
      <SectionHeader icon={Briefcase} label="5. Director of Listed Company" />
      <FormControl>
        <FormLabel>Are you a director or officer of a publicly listed company?</FormLabel>
        <RadioGroup value={form.isDirectorOfListed === true ? "yes" : form.isDirectorOfListed === false ? "no" : ""} onChange={(v) => updateField("isDirectorOfListed", v === "yes")}>
          <Stack direction="row" spacing={4}>
            <Radio value="yes" size="sm">Yes / نعم</Radio>
            <Radio value="no" size="sm">No / لا</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>
      {form.isDirectorOfListed === true && (
        <>
          <FormControl isInvalid={!!errors.directorCompanyName}>
            <FormLabel>Name of the Company *</FormLabel>
            <Input value={(form.directorCompanyName as string) || ""} onChange={(e) => updateField("directorCompanyName", e.target.value)} />
            <FormErrorMessage>{errors.directorCompanyName}</FormErrorMessage>
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.directorStockExchange}>
              <FormLabel>Stock Exchange *</FormLabel>
              <Input value={(form.directorStockExchange as string) || ""} onChange={(e) => updateField("directorStockExchange", e.target.value)} />
              <FormErrorMessage>{errors.directorStockExchange}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.directorPosition}>
              <FormLabel>Position Held *</FormLabel>
              <Input value={(form.directorPosition as string) || ""} onChange={(e) => updateField("directorPosition", e.target.value)} />
              <FormErrorMessage>{errors.directorPosition}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>
          <FormControl isInvalid={!!errors.directorAppointmentDate}>
            <FormLabel>Date of Appointment *</FormLabel>
            <Input type="date" value={(form.directorAppointmentDate as string)?.split("T")[0] || ""} onChange={(e) => updateField("directorAppointmentDate", e.target.value)} />
            <FormErrorMessage>{errors.directorAppointmentDate}</FormErrorMessage>
          </FormControl>
        </>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 3: COMMUNICATION PREFERENCES (Part D)
   ═══════════════════════════════════════════ */

function CommunicationStep({ form, updateField }: StepProps) {
  return (
    <>
      <SectionHeader icon={MessageSquare} label="Communication Preferences / تفضيلات التواصل" />
      <Text fontSize="sm" color="gray.500">Select your preferred communication methods:</Text>
      <VStack spacing={3} align="stretch">
        <Checkbox isChecked={form.preferEmail as boolean || false} onChange={(e) => updateField("preferEmail", e.target.checked)}>
          Email / البريد الإلكتروني
        </Checkbox>
        <Checkbox isChecked={form.preferSMS as boolean || false} onChange={(e) => updateField("preferSMS", e.target.checked)}>
          SMS (Mobile Number) / الرسائل النصية
        </Checkbox>
        <Checkbox isChecked={form.preferWhatsApp as boolean || false} onChange={(e) => updateField("preferWhatsApp", e.target.checked)}>
          WhatsApp
        </Checkbox>
        <Checkbox isChecked={form.preferOther as boolean || false} onChange={(e) => updateField("preferOther", e.target.checked)}>
          Other (please specify) / أخرى
        </Checkbox>
        {form.preferOther === true && (
          <FormControl pl={6}>
            <Input placeholder="Specify other method..." value={(form.preferOtherDetails as string) || ""} onChange={(e) => updateField("preferOtherDetails", e.target.value)} />
          </FormControl>
        )}
      </VStack>
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 4: FINANCIAL INFORMATION (Part E)
   ═══════════════════════════════════════════ */

function FinancialStep({ form, updateField, errors }: StepProps) {
  const sourceOfFunds = (form.sourceOfFunds as string[]) || [];
  const sourceOfWealth = (form.sourceOfWealth as string[]) || [];

  const toggleFund = (value: string) => {
    const updated = sourceOfFunds.includes(value)
      ? sourceOfFunds.filter((v) => v !== value)
      : [...sourceOfFunds, value];
    updateField("sourceOfFunds", updated);
  };

  const toggleWealth = (value: string) => {
    const updated = sourceOfWealth.includes(value)
      ? sourceOfWealth.filter((v) => v !== value)
      : [...sourceOfWealth, value];
    updateField("sourceOfWealth", updated);
  };

  return (
    <>
      <SectionHeader icon={DollarSign} label="1. Approximate Annual Income (USD)" />
      <FormControl isInvalid={!!errors.annualIncomeRange}>
        <FormLabel>Annual Income *</FormLabel>
        <Select value={(form.annualIncomeRange as string) || ""} onChange={(e) => updateField("annualIncomeRange", e.target.value)} placeholder="Select range...">
          {ANNUAL_INCOME_RANGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <FormErrorMessage>{errors.annualIncomeRange}</FormErrorMessage>
      </FormControl>

      <Divider />
      <SectionHeader icon={DollarSign} label="2. Source of Funds / مصدر الأموال" />
      <FormControl isInvalid={!!errors.sourceOfFunds}>
        <FormLabel>Source of Funds * (select all that apply)</FormLabel>
        <VStack spacing={2} align="stretch">
          {SOURCE_OF_FUNDS_OPTIONS.map((o) => (
            <Checkbox key={o.value} isChecked={sourceOfFunds.includes(o.value)} onChange={() => toggleFund(o.value)}>
              {o.label}
            </Checkbox>
          ))}
        </VStack>
        <FormErrorMessage>{errors.sourceOfFunds}</FormErrorMessage>
      </FormControl>
      {sourceOfFunds.includes("OTHER") && (
        <FormControl>
          <FormLabel>Please specify</FormLabel>
          <Input value={(form.sourceOfFundsOther as string) || ""} onChange={(e) => updateField("sourceOfFundsOther", e.target.value)} />
        </FormControl>
      )}

      <Divider />
      <SectionHeader icon={DollarSign} label="3. Estimated Net Worth" />
      <FormControl isInvalid={!!errors.estimatedNetWorth}>
        <FormLabel>Net Worth (assets minus liabilities) *</FormLabel>
        <Select value={(form.estimatedNetWorth as string) || ""} onChange={(e) => updateField("estimatedNetWorth", e.target.value)} placeholder="Select range...">
          {NET_WORTH_RANGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <FormErrorMessage>{errors.estimatedNetWorth}</FormErrorMessage>
      </FormControl>

      <Divider />
      <SectionHeader icon={DollarSign} label="4. Source of Wealth / مصدر الثروة" />
      <FormControl isInvalid={!!errors.sourceOfWealth}>
        <FormLabel>Source of Wealth * (select all that apply)</FormLabel>
        <VStack spacing={2} align="stretch">
          {SOURCE_OF_WEALTH_OPTIONS.map((o) => (
            <Checkbox key={o.value} isChecked={sourceOfWealth.includes(o.value)} onChange={() => toggleWealth(o.value)}>
              {o.label}
            </Checkbox>
          ))}
        </VStack>
        <FormErrorMessage>{errors.sourceOfWealth}</FormErrorMessage>
      </FormControl>
      {sourceOfWealth.includes("OTHER_WEALTH") && (
        <FormControl>
          <FormLabel>Please specify</FormLabel>
          <Input value={(form.sourceOfWealthOther as string) || ""} onChange={(e) => updateField("sourceOfWealthOther", e.target.value)} />
        </FormControl>
      )}

      <Divider />
      <SectionHeader icon={DollarSign} label="5. Trading Accounts with Other Financial Institutions" />
      <FormControl>
        <FormLabel>Do you maintain a trading account with other financial institutions? / هل لديك حساب تداول لدى مؤسسات مالية أخرى؟</FormLabel>
        <RadioGroup value={form.hasOtherBankAccounts === true ? "yes" : form.hasOtherBankAccounts === false ? "no" : ""} onChange={(v) => updateField("hasOtherBankAccounts", v === "yes")}>
          <Stack direction="row" spacing={4}>
            <Radio value="yes" size="sm">Yes / نعم</Radio>
            <Radio value="no" size="sm">No / لا</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>
      {form.hasOtherBankAccounts === true && (
        <FormControl>
          <FormLabel>Country / البلد</FormLabel>
          <Input value={(form.otherBankCountry as string) || ""} onChange={(e) => updateField("otherBankCountry", e.target.value)} />
        </FormControl>
      )}

    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 5: BENEFICIAL OWNER (Part F)
   ═══════════════════════════════════════════ */

interface BoEntry {
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  idType?: "ID" | "PASSPORT";
  idNumber?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  relationshipToAccountHolder?: string;
  ownershipPercentage?: string;
}

function BeneficialOwnerStep({ form, updateField, errors }: StepProps) {
  // Backwards compatibility: legacy data is a flat object; new data is { owners: BoEntry[] }
  const raw = (form.beneficialOwner as Record<string, unknown>) || {};
  const isLegacyFlat = raw && !("owners" in raw) && Object.keys(raw).length > 0;
  const owners: BoEntry[] = (raw.owners as BoEntry[]) || (isLegacyFlat ? [raw as unknown as BoEntry] : [{}]);

  const persist = (next: BoEntry[]) => {
    updateField("beneficialOwner", { ...raw, owners: next });
  };
  const updateOwner = (idx: number, key: keyof BoEntry, value: string) => {
    const next = owners.map((o, i) => (i === idx ? { ...o, [key]: value } : o));
    persist(next);
  };
  const addOwner = () => persist([...owners, {}]);
  const removeOwner = (idx: number) => persist(owners.filter((_, i) => i !== idx));

  // The doc inverts the question: "Are you the beneficial owner of the account?"
  // Yes (isActingOnBehalf=false) → END; No (isActingOnBehalf=true) → details required.
  const isOwnAccount = form.isActingOnBehalf === false;

  return (
    <>
      <SectionHeader icon={Users} label="Beneficial Owner / المستفيد الفعلي" />
      <FormControl>
        <FormLabel>Are you the beneficial owner of the account? / هل أنت المستفيد الفعلي من الحساب؟ *</FormLabel>
        <RadioGroup value={form.isActingOnBehalf === false ? "yes" : form.isActingOnBehalf === true ? "no" : ""} onChange={(v) => updateField("isActingOnBehalf", v === "no")}>
          <Stack direction="row" spacing={4}>
            <Radio value="yes" size="sm">Yes / نعم</Radio>
            <Radio value="no" size="sm">No / لا</Radio>
          </Stack>
        </RadioGroup>
        {isOwnAccount && (
          <Text fontSize="xs" color="gray.500" mt={2}>
            No further details needed for this section.
          </Text>
        )}
      </FormControl>

      {form.isActingOnBehalf === true && (
        <VStack align="stretch" spacing={6}>
          {owners.map((owner, idx) => {
            const e = (k: string) => errors[idx === 0 ? `bo_${k}` : `bo_${idx}_${k}`];
            return (
              <Box key={idx} borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4}>
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontSize="sm" fontWeight="medium">Beneficial Owner {idx + 1} Details (all fields required)</Text>
                  {owners.length > 1 && (
                    <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeOwner(idx)}>
                      Remove
                    </Button>
                  )}
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isInvalid={!!e("fullName")}>
                    <FormLabel>Full Name *</FormLabel>
                    <Input value={owner.fullName || ""} onChange={(ev) => updateOwner(idx, "fullName", ev.target.value)} />
                    <FormErrorMessage>{e("fullName")}</FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!e("dateOfBirth")}>
                    <FormLabel>Date of Birth *</FormLabel>
                    <Input type="date" value={owner.dateOfBirth || ""} onChange={(ev) => updateOwner(idx, "dateOfBirth", ev.target.value)} />
                    <FormErrorMessage>{e("dateOfBirth")}</FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!e("nationality")}>
                    <FormLabel>Nationality *</FormLabel>
                    <Input value={owner.nationality || ""} onChange={(ev) => updateOwner(idx, "nationality", ev.target.value)} />
                    <FormErrorMessage>{e("nationality")}</FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!e("id")}>
                    <FormLabel>ID or Passport *</FormLabel>
                    <Select value={owner.idType || ""} onChange={(ev) => updateOwner(idx, "idType", ev.target.value)} placeholder="Select...">
                      <option value="ID">National ID</option>
                      <option value="PASSPORT">Passport</option>
                    </Select>
                    <FormErrorMessage>{e("id")}</FormErrorMessage>
                  </FormControl>
                  {owner.idType === "ID" && (
                    <FormControl isInvalid={!!e("id")}>
                      <FormLabel>ID Number *</FormLabel>
                      <Input value={owner.idNumber || ""} onChange={(ev) => updateOwner(idx, "idNumber", ev.target.value)} />
                    </FormControl>
                  )}
                  {owner.idType === "PASSPORT" && (
                    <>
                      <FormControl isInvalid={!!e("id")}>
                        <FormLabel>Passport Number *</FormLabel>
                        <Input value={owner.passportNumber || ""} onChange={(ev) => updateOwner(idx, "passportNumber", ev.target.value)} />
                      </FormControl>
                      <FormControl isInvalid={!!e("passportExpiry")}>
                        <FormLabel>Passport Expiry Date *</FormLabel>
                        <Input type="date" value={owner.passportExpiryDate || ""} onChange={(ev) => updateOwner(idx, "passportExpiryDate", ev.target.value)} />
                        <FormErrorMessage>{e("passportExpiry")}</FormErrorMessage>
                      </FormControl>
                    </>
                  )}
                  <FormControl isInvalid={!!e("relationship")}>
                    <FormLabel>Relationship to Account Holder *</FormLabel>
                    <Input value={owner.relationshipToAccountHolder || ""} onChange={(ev) => updateOwner(idx, "relationshipToAccountHolder", ev.target.value)} />
                    <FormErrorMessage>{e("relationship")}</FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!e("ownership")}>
                    <FormLabel>% Ownership or Control *</FormLabel>
                    <Input type="number" min={0} max={100} value={owner.ownershipPercentage || ""} onChange={(ev) => updateOwner(idx, "ownershipPercentage", ev.target.value)} />
                    <FormErrorMessage>{e("ownership")}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>
              </Box>
            );
          })}
          <Button size="sm" variant="outline" leftIcon={<Icon as={Users} boxSize={4} />} onClick={addOwner} alignSelf="flex-start">
            Add Another Beneficial Owner
          </Button>
        </VStack>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 6: INVESTMENT PROFILE (Part G)
   ═══════════════════════════════════════════ */

function InvestmentProfileStep({ form, updateField, errors }: StepProps) {
  return (
    <>
      <SectionHeader icon={Target} label="1. Investment Strategy / إستراتيجية الاستثمار" />
      <FormControl isInvalid={!!errors.investmentStrategy}>
        <RadioGroup value={(form.investmentStrategy as string) || ""} onChange={(v) => updateField("investmentStrategy", v)}>
          <Stack spacing={2}>
            {INVESTMENT_STRATEGY_OPTIONS.map((o) => <Radio key={o.value} value={o.value} size="sm">{o.label}</Radio>)}
          </Stack>
        </RadioGroup>
        <FormErrorMessage>{errors.investmentStrategy}</FormErrorMessage>
      </FormControl>

      <Divider />
      <SectionHeader icon={Target} label="2. Investment Objective / هدف الاستثمار" />
      <FormControl isInvalid={!!errors.investmentObjective}>
        <Select value={(form.investmentObjective as string) || ""} onChange={(e) => updateField("investmentObjective", e.target.value)} placeholder="Select...">
          {INVESTMENT_OBJECTIVE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <FormErrorMessage>{errors.investmentObjective}</FormErrorMessage>
      </FormControl>
      {form.investmentObjective === "OTHER_OBJECTIVE" && (
        <FormControl>
          <Input placeholder="Please specify..." value={(form.investmentObjectiveOther as string) || ""} onChange={(e) => updateField("investmentObjectiveOther", e.target.value)} />
        </FormControl>
      )}

      <Divider />
      <SectionHeader icon={Target} label="3. Speculative Risk Tolerance" />
      <FormControl isInvalid={!!errors.riskTolerance}>
        <RadioGroup value={(form.riskTolerance as string) || ""} onChange={(v) => updateField("riskTolerance", v)}>
          <Stack direction="row" spacing={4}>
            {RISK_TOLERANCE_OPTIONS.map((o) => <Radio key={o.value} value={o.value} size="sm">{o.label}</Radio>)}
          </Stack>
        </RadioGroup>
        <FormErrorMessage>{errors.riskTolerance}</FormErrorMessage>
      </FormControl>

    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 7: INVESTMENT EXPERIENCE (Part H)
   ═══════════════════════════════════════════ */

function InvestmentExperienceStep({ form, updateField, errors }: StepProps) {
  const defaultExp: InvestmentExperienceData = {
    securities: { has: false, years: null },
    futuresCfds: { has: false, years: null },
    options: { has: false, years: null },
    commodities: { has: false, years: null },
    bonds: { has: false, years: null },
    forex: { has: false, years: null },
  };
  const exp = (form.investmentExperience as InvestmentExperienceData) || defaultExp;

  const updateExp = (key: string, field: string, value: unknown) => {
    const current = { ...defaultExp, ...exp };
    const item = { ...(current as Record<string, { has: boolean; years: number | null }>)[key] };
    (item as Record<string, unknown>)[field] = value;
    if (field === "has" && !value) item.years = null;
    updateField("investmentExperience", { ...current, [key]: item });
  };

  const hasAnyError = Object.keys(errors).some((k) => k.startsWith("exp_"));

  return (
    <>
      <SectionHeader icon={BarChart3} label="Investment Experience / الخبرة في الاستثمار" />
      <Text fontSize="sm" color="gray.500">Do you have investment experience? * (please answer for every instrument)</Text>

      <Box overflowX="auto">
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Instrument</Th>
              <Th textAlign="center">Yes</Th>
              <Th textAlign="center">No</Th>
              <Th>Years of Experience</Th>
            </Tr>
          </Thead>
          <Tbody>
            {INVESTMENT_INSTRUMENT_OPTIONS.map((inst) => {
              const item = (exp as unknown as Record<string, { has: boolean; years: number | null }>)[inst.key] || { has: false, years: null };
              const rowErr = errors[`exp_${inst.key}`] || errors[`exp_${inst.key}_years`];
              return (
                <Tr key={inst.key}>
                  <Td fontSize="sm">
                    {inst.label} *
                    {rowErr && <Text fontSize="xs" color="red.500" mt={1}>{rowErr}</Text>}
                  </Td>
                  <Td textAlign="center">
                    <Radio isChecked={item.has === true} onChange={() => updateExp(inst.key, "has", true)} size="sm" value="yes" />
                  </Td>
                  <Td textAlign="center">
                    <Radio isChecked={item.has === false} onChange={() => updateExp(inst.key, "has", false)} size="sm" value="no" />
                  </Td>
                  <Td>
                    {item.has && (
                      <Input size="sm" type="number" min={1} w="80px" value={item.years ?? ""} onChange={(e) => updateExp(inst.key, "years", e.target.value ? parseInt(e.target.value) : null)} placeholder="Years *" />
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
      {hasAnyError && (
        <Alert status="error" borderRadius="md" mt={2}>
          <AlertIcon />
          <Text fontSize="sm">Please answer Yes/No for every instrument. If Yes, the years of experience field is required.</Text>
        </Alert>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 8: GENERAL COMPLIANCE (Part I)
   ═══════════════════════════════════════════ */

function ComplianceStep({ form, updateField, errors }: StepProps) {
  return (
    <>
      <SectionHeader icon={Scale} label="General Compliance Questions / أسئلة عامة للإمتثال" />

      <FormControl>
        <FormLabel fontSize="sm">
          Are you, your spouse, or any relative living in the same household: an employee, principal, owner of more than 10% equity interest, or an associated person of a publicly listed company?
        </FormLabel>
        <Text fontSize="xs" color="gray.500" mb={2}>
          هل أنت أو زوجك/زوجتك أو أي قريب يقيم معك في نفس المنزل: موظف أو شريك أو مالك لأكثر من 10٪ من الحصص في شركة مدرجة في البورصة؟
        </Text>
        <RadioGroup value={form.isAssociatedWithListed === true ? "yes" : "no"} onChange={(v) => updateField("isAssociatedWithListed", v === "yes")}>
          <Stack direction="row" spacing={4}>
            <Radio value="yes" size="sm">Yes / نعم</Radio>
            <Radio value="no" size="sm">No / لا</Radio>
          </Stack>
        </RadioGroup>
        {form.isAssociatedWithListed === true && (
          <FormControl isInvalid={!!errors.associatedListedDetails} mt={2}>
            <Textarea placeholder="Please explain * / يرجى التوضيح" value={(form.associatedListedDetails as string) || ""} onChange={(e) => updateField("associatedListedDetails", e.target.value)} />
            <FormErrorMessage>{errors.associatedListedDetails}</FormErrorMessage>
          </FormControl>
        )}
      </FormControl>

      <Divider />

      <FormControl>
        <FormLabel fontSize="sm">
          Do you have access to non-public or inside information from any entity listed on a stock exchange?
        </FormLabel>
        <Text fontSize="xs" color="gray.500" mb={2}>
          هل لديك حق الوصول إلى معلومات غير علنية أو داخلية لأي كيان مدرج في البورصة؟
        </Text>
        <RadioGroup value={form.hasInsideInformation === true ? "yes" : "no"} onChange={(v) => updateField("hasInsideInformation", v === "yes")}>
          <Stack direction="row" spacing={4}>
            <Radio value="yes" size="sm">Yes / نعم</Radio>
            <Radio value="no" size="sm">No / لا</Radio>
          </Stack>
        </RadioGroup>
        {form.hasInsideInformation === true && (
          <FormControl isInvalid={!!errors.insideInformationDetails} mt={2}>
            <Textarea placeholder="Please explain * / يرجى التوضيح" value={(form.insideInformationDetails as string) || ""} onChange={(e) => updateField("insideInformationDetails", e.target.value)} />
            <FormErrorMessage>{errors.insideInformationDetails}</FormErrorMessage>
          </FormControl>
        )}
      </FormControl>
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 9: PEP DECLARATION (Part J)
   ═══════════════════════════════════════════ */

function PepStep({ form, updateField, errors }: StepProps) {
  const isNotPep = form.pepStatus === "NOT_PEP";
  const isSelfPep = !!form.pepIsSelf;
  const isFamilyPep = !!form.pepIsFamily;

  const setNotPep = (checked: boolean) => {
    if (checked) {
      updateField("pepStatus", "NOT_PEP");
      updateField("pepIsSelf", false);
      updateField("pepIsFamily", false);
      updateField("pepDetails", "");
    } else {
      updateField("pepStatus", null);
    }
  };

  const setSelfPep = (checked: boolean) => {
    updateField("pepIsSelf", checked);
    if (checked) {
      // Selecting Option 2 clears the NOT_PEP selection
      if (form.pepStatus === "NOT_PEP") updateField("pepStatus", null);
      if (!form.pepStatus || form.pepStatus === "NOT_PEP") updateField("pepStatus", "IS_PEP");
    } else if (!isFamilyPep) {
      updateField("pepStatus", null);
    }
  };

  const setFamilyPep = (checked: boolean) => {
    updateField("pepIsFamily", checked);
    if (checked) {
      if (form.pepStatus === "NOT_PEP") updateField("pepStatus", null);
      if (!form.pepStatus || form.pepStatus === "NOT_PEP") updateField("pepStatus", "PEP_FAMILY_ASSOCIATE");
    } else if (!isSelfPep) {
      updateField("pepStatus", null);
    }
  };

  const showExplain = isSelfPep || isFamilyPep;

  return (
    <>
      <SectionHeader icon={Shield} label="Politically Exposed Person (PEP) / شخص مكشوف سياسياً" />
      <Alert status="info" borderRadius="md" fontSize="xs">
        <AlertIcon />
        <Box>
          <Text>Choose Option 1 by itself, OR choose Option 2 and/or Option 3 together. Option 1 cannot be combined with the others.</Text>
          <Text mt={1} textAlign="right" dir="rtl">اختر الخيار 1 وحده، أو اختر الخيار 2 و/أو الخيار 3 معاً. لا يمكن دمج الخيار 1 مع الخيارات الأخرى.</Text>
        </Box>
      </Alert>

      <FormControl isInvalid={!!errors.pepStatus}>
        <VStack spacing={3} align="stretch">
          <Checkbox
            isChecked={isNotPep}
            isDisabled={isSelfPep || isFamilyPep}
            onChange={(e) => setNotPep(e.target.checked)}
          >
            <Text fontSize="sm">I declare that I am NOT a Politically Exposed Person / أُصرّح بأنني لستُ شخصاً مكشوفاً سياسياً</Text>
          </Checkbox>
          <Checkbox
            isChecked={isSelfPep}
            isDisabled={isNotPep}
            onChange={(e) => setSelfPep(e.target.checked)}
          >
            <Text fontSize="sm">I declare that I am a Politically Exposed Person / أُصرّح بأنني شخص مكشوف سياسياً</Text>
          </Checkbox>
          <Checkbox
            isChecked={isFamilyPep}
            isDisabled={isNotPep}
            onChange={(e) => setFamilyPep(e.target.checked)}
          >
            <Text fontSize="sm">I confirm that I am a family member or close associate of a Politically Exposed Person / أؤكّد بأنني أحد أفراد عائلة أو معاون مقرّب لشخص مكشوف سياسياً</Text>
          </Checkbox>
        </VStack>
        <FormErrorMessage>{errors.pepStatus}</FormErrorMessage>
      </FormControl>

      {showExplain && (
        <FormControl isInvalid={!!errors.pepDetails}>
          <FormLabel>Please explain *</FormLabel>
          <Textarea value={(form.pepDetails as string) || ""} onChange={(e) => updateField("pepDetails", e.target.value)} />
          <FormErrorMessage>{errors.pepDetails}</FormErrorMessage>
        </FormControl>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 10: DOCUMENTS
   ═══════════════════════════════════════════ */

interface DocStepProps {
  form: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
  docs: Record<string, unknown>[];
  uploading: boolean;
  uploadFile: (file: File, category: string, documentType: string, side?: string) => void;
  errors: Record<string, string>;
}

function DocumentsStep({ form, updateField, docs, uploading, uploadFile, errors }: DocStepProps) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const [additionalDocType, setAdditionalDocType] = useState("");

  const idType = (form.idDocumentType as string) || "";

  const hasIdFront = docs.some(
    (d) => d.side === "front" && ["PASSPORT", "NATIONAL_ID"].includes(d.documentType as string)
  );
  const hasIdBack = docs.some(
    (d) => d.side === "back" && ["PASSPORT", "NATIONAL_ID"].includes(d.documentType as string)
  );
  const hasProofOfAddress = docs.some((d) =>
    ["UTILITY_BILL", "BANK_STATEMENT"].includes(d.documentType as string)
  );
  const hasAdditionalDoc = docs.some((d) =>
    ["DRIVING_LICENCE", "CIVIL_EXTRACT", "RESIDENCE_PERMIT", "OTHER"].includes(d.documentType as string)
  );

  const idFrontDoc = docs.find(
    (d) => d.side === "front" && ["PASSPORT", "NATIONAL_ID"].includes(d.documentType as string)
  );
  const idBackDoc = docs.find(
    (d) => d.side === "back" && ["PASSPORT", "NATIONAL_ID"].includes(d.documentType as string)
  );
  const addressDoc = docs.find((d) =>
    ["UTILITY_BILL", "BANK_STATEMENT"].includes(d.documentType as string)
  );
  const additionalDoc = docs.find((d) =>
    ["DRIVING_LICENCE", "CIVIL_EXTRACT", "RESIDENCE_PERMIT", "OTHER"].includes(d.documentType as string)
  );

  return (
    <VStack spacing={6} align="stretch">
      {/* Section 1: Identity Document Type Selection */}
      <Box>
        <SectionHeader icon={FileText} label="Identity Document *" />

        <FormControl isInvalid={!!errors.idDocumentType} mb={4}>
          <FormLabel>Select Identity Document Type / نوع وثيقة الهوية *</FormLabel>
          <RadioGroup value={idType} onChange={(v) => updateField("idDocumentType", v)}>
            <Stack direction="row" spacing={6}>
              <Radio value="PASSPORT" size="sm">Passport / جواز السفر</Radio>
              <Radio value="NATIONAL_ID" size="sm">National ID / الهوية الوطنية</Radio>
            </Stack>
          </RadioGroup>
          <FormErrorMessage>{errors.idDocumentType}</FormErrorMessage>
        </FormControl>

        {idType === "PASSPORT" && (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <FormControl isInvalid={!!errors.passportNumber}>
              <FormLabel>Passport Number / رقم جواز السفر *</FormLabel>
              <Input value={(form.passportNumber as string) || ""} onChange={(e) => updateField("passportNumber", e.target.value)} />
              <FormErrorMessage>{errors.passportNumber}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.passportExpiryDate}>
              <FormLabel>Passport Expiry Date</FormLabel>
              <Input type="date" value={(form.passportExpiryDate as string)?.split("T")[0] || ""} onChange={(e) => updateField("passportExpiryDate", e.target.value)} />
              <FormErrorMessage>{errors.passportExpiryDate}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>
        )}

        {idType === "NATIONAL_ID" && (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <FormControl isInvalid={!!errors.idNumber}>
              <FormLabel>ID Number / رقم الهوية *</FormLabel>
              <Input value={(form.idNumber as string) || ""} onChange={(e) => updateField("idNumber", e.target.value)} />
              <FormErrorMessage>{errors.idNumber}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>ID Issue Date</FormLabel>
              <Input type="date" value={(form.idIssueDate as string)?.split("T")[0] || ""} onChange={(e) => updateField("idIssueDate", e.target.value)} />
            </FormControl>
          </SimpleGrid>
        )}

        {idType && (
          <>
            <Text fontSize="xs" color={mutedColor} mt={1} mb={1}>
              Upload a clear copy of your {idType === "PASSPORT" ? "passport (main page with photo and the page with mother's details)" : "national ID (front and back)"}
            </Text>
            {errors.identityDoc && <Text fontSize="xs" color="red.500" mb={2}>{errors.identityDoc}</Text>}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FileUploadZone
                label={idType === "PASSPORT" ? "Main page (with photo)" : "Front Side"}
                isUploaded={hasIdFront}
                uploadedFileName={idFrontDoc?.fileName as string}
                uploadedFileSize={idFrontDoc?.fileSize as number}
                isUploading={uploading}
                onFileSelect={(f) => uploadFile(f, "kyc-documents", idType, "front")}
              />
              <FileUploadZone
                label={idType === "PASSPORT" ? "Page with mother's details" : "Back Side"}
                isUploaded={hasIdBack}
                uploadedFileName={idBackDoc?.fileName as string}
                uploadedFileSize={idBackDoc?.fileSize as number}
                isUploading={uploading}
                onFileSelect={(f) => uploadFile(f, "kyc-documents", idType, "back")}
              />
            </SimpleGrid>
          </>
        )}
      </Box>

      {/* Section 2: Proof of Address */}
      <Box>
        <SectionHeader icon={MapPin} label="Proof of Residential Address *" />
        <Text fontSize="xs" color={mutedColor} mt={1} mb={1}>
          Utility bill or bank statement (not older than 3 months)
        </Text>
        {errors.addressDoc && <Text fontSize="xs" color="red.500" mb={2}>{errors.addressDoc}</Text>}
        <FileUploadZone
          label="Proof of Address"
          isUploaded={hasProofOfAddress}
          uploadedFileName={addressDoc?.fileName as string}
          uploadedFileSize={addressDoc?.fileSize as number}
          isUploading={uploading}
          onFileSelect={(f) => uploadFile(f, "proof-of-address", "UTILITY_BILL")}
        />
      </Box>

      {/* Section 3: Additional Document (optional) */}
      <Box>
        <SectionHeader icon={Upload} label="Additional Document (Optional)" />
        <Text fontSize="xs" color={mutedColor} mt={1} mb={1}>
          Upload any additional supporting document if applicable
        </Text>
        <FormControl mb={3}>
          <FormLabel>Document Type</FormLabel>
          <Select value={additionalDocType} onChange={(e) => setAdditionalDocType(e.target.value)} placeholder="Select document type...">
            <option value="DRIVING_LICENCE">Driving License / رخصة قيادة</option>
            <option value="CIVIL_EXTRACT">Civil Extract / إخراج قيد</option>
            <option value="RESIDENCE_PERMIT">Residence Permit / إقامة</option>
            <option value="OTHER">Other / أخرى</option>
          </Select>
        </FormControl>
        {additionalDocType && (
          <FileUploadZone
            label={
              additionalDocType === "DRIVING_LICENCE" ? "Driving License" :
              additionalDocType === "CIVIL_EXTRACT" ? "Civil Extract" :
              additionalDocType === "RESIDENCE_PERMIT" ? "Residence Permit" :
              "Other Document"
            }
            isUploaded={hasAdditionalDoc}
            uploadedFileName={additionalDoc?.fileName as string}
            uploadedFileSize={additionalDoc?.fileSize as number}
            isUploading={uploading}
            onFileSelect={(f) => uploadFile(f, "kyc-documents", additionalDocType)}
          />
        )}
      </Box>
    </VStack>
  );
}

/* ═══════════════════════════════════════════
   STEP 11: DECLARATION & REVIEW
   ═══════════════════════════════════════════ */

interface DeclarationReviewStepProps extends StepProps {
  docs: Record<string, unknown>[];
  warningBg: string;
  warningBorder: string;
}

/* ═══════════════════════════════════════════
   STEP 11: DECLARATION + REGULATORY CLAUSE
   ═══════════════════════════════════════════ */

function DeclarationStep({ form, updateField, errors }: StepProps) {
  return (
    <VStack spacing={4} align="stretch">
      <Box p={5} borderWidth="1px" borderRadius="lg" fontSize="sm">
        <Heading size="sm" mb={3} color="brand.600">
          Client Declaration &amp; Undertaking
        </Heading>
        <VStack spacing={2} align="stretch" mb={4}>
          {CLIENT_DECLARATION_EN_PARAGRAPHS.map((p, i) => (
            <Text key={i} fontSize="xs" color="gray.700" lineHeight="tall" fontWeight={p.bold ? "bold" : "normal"}>
              {p.text}
            </Text>
          ))}
        </VStack>
        <Divider my={3} />
        <Heading size="sm" mb={3} color="brand.600" textAlign="right" dir="rtl">
          إقرار وتعهد العميل
        </Heading>
        <VStack spacing={2} align="stretch" dir="rtl">
          {CLIENT_DECLARATION_AR_PARAGRAPHS.map((p, i) => (
            <Text key={i} fontSize="xs" color="gray.600" lineHeight="tall" fontWeight={p.bold ? "bold" : "normal"}>
              {p.text}
            </Text>
          ))}
        </VStack>

        <VStack spacing={3} align="stretch" mt={4}>
          <FormControl isInvalid={!!errors.declarationAccepted}>
            <Checkbox
              isChecked={form.declarationAccepted as boolean || false}
              onChange={(e) => {
                updateField("declarationAccepted", e.target.checked);
                if (e.target.checked) updateField("declarationDate", new Date().toISOString());
              }}
              colorScheme="brand"
            >
              <Text fontSize="sm" fontWeight="medium">I accept this declaration / أوافق على هذا الإقرار *</Text>
            </Checkbox>
            <FormErrorMessage>{errors.declarationAccepted}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.declarationFullName}>
            <FormLabel>Full Name (as signature) *</FormLabel>
            <Input
              value={(form.declarationFullName as string) || ""}
              onChange={(e) => updateField("declarationFullName", e.target.value)}
              placeholder="First Name / Father's Name / Family Name"
            />
            <FormErrorMessage>{errors.declarationFullName}</FormErrorMessage>
          </FormControl>
        </VStack>
      </Box>

      <Box p={5} borderWidth="1px" borderColor="orange.200" borderRadius="lg" fontSize="sm" bg="orange.50">
        <Heading size="sm" mb={3} color="orange.700">
          Regulatory Reservation Clause / بند احتياطي تنظيمي
        </Heading>
        <Text fontSize="xs" color="gray.700" lineHeight="tall" mb={3}>
          {REGULATORY_RESERVATION_CLAUSE_EN}
        </Text>
        <Divider my={3} />
        <Text fontSize="xs" color="gray.600" lineHeight="tall" dir="rtl" mb={4}>
          {REGULATORY_RESERVATION_CLAUSE_AR}
        </Text>

        <VStack spacing={3} align="stretch">
          <FormControl isInvalid={!!errors.regulatoryClauseAccepted}>
            <Checkbox
              isChecked={form.regulatoryClauseAccepted as boolean || false}
              onChange={(e) => updateField("regulatoryClauseAccepted", e.target.checked)}
              colorScheme="orange"
            >
              <Text fontSize="sm" fontWeight="medium">I accept the Regulatory Reservation Clause / أوافق على بند التحفظ التنظيمي *</Text>
            </Checkbox>
            <FormErrorMessage>{errors.regulatoryClauseAccepted}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.regulatoryClauseFullName}>
            <FormLabel>Full Name (as signature) *</FormLabel>
            <Input
              value={(form.regulatoryClauseFullName as string) || ""}
              onChange={(e) => updateField("regulatoryClauseFullName", e.target.value)}
              placeholder="First Name / Father's Name / Family Name"
            />
            <FormErrorMessage>{errors.regulatoryClauseFullName}</FormErrorMessage>
          </FormControl>
        </VStack>
      </Box>
    </VStack>
  );
}

/* ═══════════════════════════════════════════
   STEP 12: CLIENT AGREEMENT (name-only signature)
   ═══════════════════════════════════════════ */

interface ClientAgreementStepProps extends StepProps {
  kycId: string;
}

// Available trading partners and commission tiers — kept as arrays even though
// only one option each is offered today, so the UAT spec ("dropdown menu, even
// if there is one selection for the time being") is satisfied without code
// changes when more options are added later.
const TRADING_COMPANY_OPTIONS = [
  { value: "GIVTRADE", label: "GIV Trade" },
];

const COMMISSION_OPTIONS = [
  { value: "7_USD", label: "USD $7 per standard contract / one lot" },
];

function ClientAgreementStep({ form, updateField, errors }: ClientAgreementStepProps) {
  const isSigned = !!form.agreementSignedAt;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(isSigned);
  const handleAgreementScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
      setScrolledToEnd(true);
    }
  };

  // Pull the client's identifying details from the KYC form so they can be
  // displayed inline inside the agreement (مستند التعريف).
  const idType: string =
    (form.idDocumentType as string) ||
    (form.passportNumber ? "PASSPORT" : form.idNumber ? "NATIONAL_ID" : "");
  const idLabel = idType === "PASSPORT" ? "جواز السفر" : idType === "NATIONAL_ID" ? "الهوية الوطنية" : "—";
  const idNumberValue = (form.passportNumber as string) || (form.idNumber as string) || "—";

  const fullNameValue = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ") || "—";
  const nationalityValue = (form.nationality as string) || "—";
  const placeOfBirthValue = (form.placeOfBirth as string) || "—";
  const dobValue = form.dateOfBirth ? new Date(form.dateOfBirth as string).toLocaleDateString() : "—";
  const addressValue =
    [form.primaryStreet, form.primaryArea, form.primaryCity, form.primaryCountry]
      .filter(Boolean)
      .join("، ") || "—";

  // Default selections for the new dropdowns
  if (!form.tradingCompany) updateField("tradingCompany", TRADING_COMPANY_OPTIONS[0].value);
  if (!form.tradingCommission) updateField("tradingCommission", COMMISSION_OPTIONS[0].value);

  // Default declarationDate / agreement date should reflect when the client
  // arrives at this step.
  const todayLocale = new Date().toLocaleDateString();

  const handleSign = () => {
    const now = new Date().toISOString();
    updateField("agreementSignedAt", now);
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box ref={scrollRef} onScroll={handleAgreementScroll} p={5} borderWidth="1px" borderRadius="lg" fontSize="sm" maxH="500px" overflowY="auto">
        <Heading size="sm" mb={3} color="brand.600" textAlign="right" dir="rtl">
          اتفاقية العميل
        </Heading>

        <Box dir="rtl" mb={3} p={3} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
          <Text fontSize="xs" color="gray.700" lineHeight="tall">
            <Text as="span" fontWeight="bold">الاسم الكامل:</Text> {fullNameValue}
            <br />
            <Text as="span" fontWeight="bold">الجنسية:</Text> {nationalityValue}
            <br />
            <Text as="span" fontWeight="bold">مستند التعريف:</Text> {idLabel} — {idNumberValue}
            <br />
            <Text as="span" fontWeight="bold">محل وتاريخ الولادة:</Text> {placeOfBirthValue} — {dobValue}
            <br />
            <Text as="span" fontWeight="bold">العنوان:</Text> {addressValue}
            <br />
            <Text as="span" fontWeight="bold">التاريخ:</Text> {todayLocale}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4} dir="rtl">
          <FormControl>
            <FormLabel fontSize="xs">اختار الفريق الثاني فتح حساب لدى شركة</FormLabel>
            <Select
              value={(form.tradingCompany as string) || TRADING_COMPANY_OPTIONS[0].value}
              isDisabled={isSigned}
              onChange={(e) => updateField("tradingCompany", e.target.value)}
            >
              {TRADING_COMPANY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs">قيمة العمولة عن كل عملية</FormLabel>
            <Select
              value={(form.tradingCommission as string) || COMMISSION_OPTIONS[0].value}
              isDisabled={isSigned}
              onChange={(e) => updateField("tradingCommission", e.target.value)}
            >
              {COMMISSION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>

        <Divider my={3} />
        <Text whiteSpace="pre-wrap" fontSize="xs" color="gray.600" lineHeight="tall" dir="rtl">
          {CLIENT_AGREEMENT_AR}
        </Text>
      </Box>

      {!scrolledToEnd && !isSigned && (
        <Alert status="warning" borderRadius="md" fontSize="sm">
          <AlertIcon />
          <Box>
            <Text>Please scroll to the end of the agreement above before signing.</Text>
            <Text mt={1} textAlign="right" dir="rtl">يرجى التمرير إلى نهاية الاتفاقية أعلاه قبل التوقيع.</Text>
          </Box>
        </Alert>
      )}

      <Box p={5} borderWidth="1px" borderColor={isSigned ? "green.200" : "blue.200"} borderRadius="lg" bg={isSigned ? "green.50" : "blue.50"} opacity={scrolledToEnd || isSigned ? 1 : 0.5} pointerEvents={scrolledToEnd || isSigned ? "auto" : "none"}>
        <Heading size="sm" mb={3} textAlign="right" dir="rtl">
          التوقيع الإلكتروني
        </Heading>

        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.agreementAccepted}>
            <Checkbox
              isChecked={form.agreementAccepted as boolean || false}
              isDisabled={isSigned || !scrolledToEnd}
              onChange={(e) => updateField("agreementAccepted", e.target.checked)}
              colorScheme="brand"
            >
              <Text fontSize="sm" fontWeight="medium" dir="rtl">
                لقد قرأت وفهمت كامل هذه الاتفاقية بشكل نافٍ للجهالة وأعفي الفريق الأول من أية مسؤولية ناتجة عن عدم فهمي لأي بند من بنودها.
              </Text>
            </Checkbox>
            <FormErrorMessage>{errors.agreementAccepted}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.agreementFullName}>
            <FormLabel>Full Name (as signature) / الاسم الكامل (كتوقيع) *</FormLabel>
            <Input
              value={(form.agreementFullName as string) || ""}
              isDisabled={isSigned || !scrolledToEnd}
              onChange={(e) => updateField("agreementFullName", e.target.value)}
              placeholder="First Name / Father's Name / Family Name"
            />
            <FormErrorMessage>{errors.agreementFullName}</FormErrorMessage>
          </FormControl>

          <Text fontSize="xs" color="gray.600">
            <strong>Date / التاريخ:</strong> {form.agreementSignedAt ? new Date(form.agreementSignedAt as string).toLocaleString() : todayLocale}
          </Text>

          {!isSigned && (
            <Button
              colorScheme="brand"
              isDisabled={!scrolledToEnd || !form.agreementAccepted || !form.agreementFullName}
              onClick={handleSign}
            >
              Sign agreement / توقيع الاتفاقية
            </Button>
          )}

          {isSigned && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontSize="sm" fontWeight="bold">Agreement signed</Text>
                <Text fontSize="xs">
                  Signed by {form.agreementFullName as string} on {new Date(form.agreementSignedAt as string).toLocaleString()}.
                </Text>
              </Box>
            </Alert>
          )}
        </VStack>
      </Box>
    </VStack>
  );
}

/* ═══════════════════════════════════════════
   STEP 13: REVIEW & SUBMIT
   ═══════════════════════════════════════════ */

// Look up bilingual label (EN / AR) from an OPTIONS array by enum value
function optLabel(options: { value: string; label: string }[], value: unknown): string {
  if (value == null || value === "") return "-";
  const found = options.find((o) => o.value === value);
  return found ? found.label : String(value).replace(/_/g, " ");
}

function multiOptLabels(options: { value: string; label: string }[], values: unknown): string {
  const arr = Array.isArray(values) ? values : [];
  if (!arr.length) return "-";
  return arr.map((v) => optLabel(options, v)).join(", ");
}

function yn(v: unknown): string {
  if (v === true) return "Yes / نعم";
  if (v === false) return "No / لا";
  return "-";
}

function fmtDate(v: unknown): string {
  if (!v || typeof v !== "string") return "-";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function fmtDateTime(v: unknown): string {
  if (!v || typeof v !== "string") return "-";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "-";
  return `${fmtDate(v)} ${d.toLocaleTimeString()}`;
}

function DeclarationReviewStep({ form, docs, warningBg, warningBorder }: DeclarationReviewStepProps) {
  const isMarried = form.maritalStatus === "MARRIED";
  const isEmployed = form.employmentCategory === "EMPLOYED" || form.employmentCategory === "SELF_EMPLOYED" || form.employmentCategory === "BUSINESS_OWNER";
  const isRetiredOrUnemployed = form.employmentCategory === "RETIRED" || form.employmentCategory === "UNEMPLOYED";
  const isStudent = form.employmentCategory === "STUDENT";

  // Beneficial owner list (supports new {owners:[]} format and legacy flat object)
  const boRaw = form.beneficialOwner as (BeneficialOwnerInfo & { owners?: BeneficialOwnerInfo[] }) | null;
  const owners: BeneficialOwnerInfo[] = boRaw
    ? (boRaw.owners ?? (boRaw.fullName ? [boRaw as BeneficialOwnerInfo] : []))
    : [];

  const investmentExp = (form.investmentExperience as InvestmentExperienceData | null) || null;

  const commPrefs: string[] = [];
  if (form.preferEmail) commPrefs.push("Email / بريد إلكتروني");
  if (form.preferSMS) commPrefs.push("SMS / رسائل نصية");
  if (form.preferWhatsApp) commPrefs.push("WhatsApp / واتساب");
  if (form.preferOther) commPrefs.push(`${(form.preferOtherDetails as string) || "Other / أخرى"}`);

  const pepOpts: string[] = [];
  if (form.pepStatus === "NOT_PEP") pepOpts.push("NOT a PEP / لست شخصاً مكشوفاً سياسياً");
  if (form.pepIsSelf) pepOpts.push("Is a PEP / شخص مكشوف سياسياً");
  if (form.pepIsFamily) pepOpts.push("Family / associate of a PEP / أحد أفراد عائلة أو مقرّب لشخص مكشوف سياسياً");

  return (
    <VStack spacing={4} align="stretch">
      <ReviewSection
        icon={User}
        title="PART A: PERSONAL INFORMATION / المعلومات الشخصية"
        accentColor="brand.500"
        fields={[
          { label: "First Name / الاسم الأول", value: (form.firstName as string) || "-" },
          { label: "Last Name / الشهرة", value: (form.lastName as string) || "-" },
          { label: "Middle Name (Father's Name) / اسم الأب", value: (form.middleName as string) || "-" },
          { label: "Mother's Full Name / اسم الأم وشهرتها", value: (form.mothersFullName as string) || "-" },
          { label: "Place of Birth / مكان الولادة", value: (form.placeOfBirth as string) || "-" },
          { label: "Date of Birth / تاريخ الولادة", value: fmtDate(form.dateOfBirth) },
          { label: "Gender / الجنس", value: optLabel(GENDER_OPTIONS, form.gender) },
          { label: "Marital Status / الحالة الاجتماعية", value: optLabel(MARITAL_STATUS_OPTIONS, form.maritalStatus) },
          ...(isMarried ? [
            { label: "Spouse Full Name / اسم الزوج/ة", value: (form.spouseFullName as string) || "-" },
            { label: "Spouse Profession / مهنة الزوج/ة", value: (form.spouseProfession as string) || "-" },
          ] : []),
          { label: "Number of Dependents / عدد المعالين", value: form.numberOfDependents != null ? String(form.numberOfDependents) : "-" },
          { label: "Nationality / الجنسية", value: (form.nationality as string) || "-" },
          { label: "Other Nationality / جنسية أخرى", value: (form.otherNationality as string) || "-" },
          { label: "ID Number / رقم الهوية", value: (form.idNumber as string) || "-" },
          { label: "ID Issue Date / تاريخ إصدار الهوية", value: fmtDate(form.idIssueDate) },
          { label: "Passport Number / رقم جواز السفر", value: (form.passportNumber as string) || "-" },
          { label: "Passport Expiry Date / تاريخ انتهاء الجواز", value: fmtDate(form.passportExpiryDate) },
          { label: "Phone / الهاتف", value: (form.phoneNumber as string) || "-" },
          { label: "Email / البريد الإلكتروني", value: (form.emailAddress as string) || "-" },
        ]}
      />
      <ReviewSection
        icon={MapPin}
        title="PART B: PERMANENT RESIDENTIAL ADDRESS AND OVERSEAS ADDRESS (IF APPLICABLE) / عنوان السكن الدائم والعنوان في الخارج (إذا وجد)"
        accentColor="brand.500"
        fields={[
          { label: "Home Status / السكن", value: optLabel(HOME_STATUS_OPTIONS, form.homeStatus) },
          { label: "Country / الدولة", value: (form.primaryCountry as string) || "-" },
          { label: "City / المدينة", value: (form.primaryCity as string) || "-" },
          { label: "Area / المنطقة", value: (form.primaryArea as string) || "-" },
          { label: "Street / الشارع", value: (form.primaryStreet as string) || "-" },
          { label: "Building / المبنى", value: (form.primaryBuilding as string) || "-" },
          { label: "Floor / الطابق", value: (form.primaryFloor as string) || "-" },
          { label: "Apartment / الشقة", value: (form.primaryApartment as string) || "-" },
          ...(form.hasSecondaryAddress === true ? [
            { label: "Secondary Home Status / السكن (الثاني)", value: optLabel(HOME_STATUS_OPTIONS, form.secondaryHomeStatus) },
            { label: "Secondary Country / الدولة (الثانية)", value: (form.secondaryCountry as string) || "-" },
            { label: "Secondary City / المدينة (الثانية)", value: (form.secondaryCity as string) || "-" },
            { label: "Secondary Area / المنطقة (الثانية)", value: (form.secondaryArea as string) || "-" },
            { label: "Secondary Street / الشارع (الثاني)", value: (form.secondaryStreet as string) || "-" },
            { label: "Secondary Building / المبنى (الثاني)", value: (form.secondaryBuilding as string) || "-" },
            { label: "Secondary Floor / الطابق (الثاني)", value: (form.secondaryFloor as string) || "-" },
            { label: "Secondary Apartment / الشقة (الثانية)", value: (form.secondaryApartment as string) || "-" },
          ] : []),
        ]}
      />
      <ReviewSection
        icon={Briefcase}
        title="PART C: OCCUPATION AND EMPLOYMENT STATUS / المهنة والحالة الوظيفية"
        accentColor="navy.500"
        fields={[
          { label: "Employment Status / الوضع المهني", value: optLabel(EMPLOYMENT_CATEGORY_OPTIONS, form.employmentCategory) },
          ...(isEmployed ? [
            { label: "Current Profession / المهنة الحالية", value: (form.currentProfession as string) || "-" },
            { label: "Institution / Company Name / اسم المؤسسة", value: (form.institutionName as string) || "-" },
            { label: "Nature of Business / طبيعة العمل", value: (form.natureOfBusiness as string) || "-" },
            { label: "Length of Employment / مدة العمل", value: (form.lengthOfEmployment as string) || "-" },
            { label: "Institution Phone / هاتف المؤسسة", value: (form.institutionPhone as string) || "-" },
            { label: "Institution Email / بريد المؤسسة", value: (form.institutionEmail as string) || "-" },
            { label: "Your Institutional Email / بريدك المؤسسي", value: (form.personalInstitutionEmail as string) || "-" },
            { label: "Website / الموقع الإلكتروني", value: (form.institutionWebsite as string) || "-" },
          ] : []),
          ...(isRetiredOrUnemployed ? [
            { label: "Previous Profession / المهنة السابقة", value: (form.previousProfession as string) || "-" },
          ] : []),
          ...(isStudent ? [
            { label: "University / الجامعة", value: (form.universityName as string) || "-" },
            { label: "Major / التخصص", value: (form.major as string) || "-" },
            { label: "Expected Graduation Year / سنة التخرج المتوقعة", value: form.expectedGraduationYear != null ? String(form.expectedGraduationYear) : "-" },
          ] : []),
          { label: "Director of Listed Company / مدير في شركة مدرجة", value: yn(form.isDirectorOfListed) },
          ...(form.isDirectorOfListed === true ? [
            { label: "Company Name / اسم الشركة", value: (form.directorCompanyName as string) || "-" },
            { label: "Stock Exchange / البورصة", value: (form.directorStockExchange as string) || "-" },
            { label: "Position / المنصب", value: (form.directorPosition as string) || "-" },
            { label: "Appointment Date / تاريخ التعيين", value: fmtDate(form.directorAppointmentDate) },
          ] : []),
        ]}
      />
      <ReviewSection
        icon={MessageSquare}
        title="PART D: COMMUNICATION PREFERENCES / تفضيلات التواصل"
        accentColor="green.500"
        fields={[
          { label: "Preferred Methods / الوسائل المفضلة", value: commPrefs.length ? commPrefs.join(", ") : "-", colSpan: 2 },
        ]}
      />
      <ReviewSection
        icon={DollarSign}
        title="PART E: FINANCIAL INFORMATION / المعلومات المالية"
        accentColor="green.500"
        fields={[
          { label: "Approximate Annual Income (in USD) / الدخل السنوي التقريبي", value: optLabel(ANNUAL_INCOME_RANGE_OPTIONS, form.annualIncomeRange) },
          { label: "Source of Funds / مصدر الأموال", value: multiOptLabels(SOURCE_OF_FUNDS_OPTIONS, form.sourceOfFunds) },
          ...(form.sourceOfFundsOther ? [
            { label: "Source of Funds (Other) / مصدر آخر للأموال", value: (form.sourceOfFundsOther as string) },
          ] : []),
          { label: "Estimated Net Worth / صافي الثروة التقديري", value: optLabel(NET_WORTH_RANGE_OPTIONS, form.estimatedNetWorth) },
          { label: "Source of Wealth / مصدر الثروة", value: multiOptLabels(SOURCE_OF_WEALTH_OPTIONS, form.sourceOfWealth) },
          ...(form.sourceOfWealthOther ? [
            { label: "Source of Wealth (Other) / مصدر آخر للثروة", value: (form.sourceOfWealthOther as string) },
          ] : []),
          { label: "Has Other Bank Accounts / حسابات بنكية أخرى", value: yn(form.hasOtherBankAccounts) },
          ...(form.hasOtherBankAccounts ? [
            { label: "Other Bank Country / دولة البنك الآخر", value: (form.otherBankCountry as string) || "-" },
          ] : []),
          { label: "US Person / مواطن أمريكي", value: yn(form.isUsPerson) },
        ]}
      />
      <ReviewSection
        icon={Users}
        title="PART F: BENEFICIAL OWNER / المستفيد الفعلي"
        accentColor="purple.500"
        fields={[
          { label: "Are you the Beneficial Owner? / هل أنت المستفيد الفعلي؟", value: form.isActingOnBehalf === true ? "No — someone else / لا، شخص آخر" : form.isActingOnBehalf === false ? "Yes / نعم" : "-", colSpan: 2 },
        ]}
      />
      {form.isActingOnBehalf === true && owners.length > 0 && owners.map((o, i) => (
        <ReviewSection
          key={i}
          icon={Users}
          title={owners.length > 1 ? `Beneficial Owner ${i + 1} / المستفيد الفعلي ${i + 1}` : "Beneficial Owner Details / تفاصيل المستفيد الفعلي"}
          accentColor="purple.400"
          fields={[
            { label: "Full Name / الاسم الكامل", value: o.fullName || "-" },
            { label: "Date of Birth / تاريخ الولادة", value: fmtDate(o.dateOfBirth) },
            { label: "Nationality / الجنسية", value: o.nationality || "-" },
            { label: "ID Number / رقم الهوية", value: o.idNumber || "-" },
            { label: "Passport Number / رقم الجواز", value: o.passportNumber || "-" },
            { label: "Passport Expiry / تاريخ انتهاء الجواز", value: fmtDate(o.passportExpiryDate) },
            { label: "Relationship / صلة القرابة", value: o.relationshipToAccountHolder || "-" },
            { label: "% Ownership / نسبة الملكية", value: o.ownershipPercentage || "-" },
          ]}
        />
      ))}
      <ReviewSection
        icon={Target}
        title="PART G: INVESTMENT PROFILE / الملف الاستثماري"
        accentColor="purple.500"
        fields={[
          { label: "Investment Strategy / استراتيجية الاستثمار", value: optLabel(INVESTMENT_STRATEGY_OPTIONS, form.investmentStrategy) },
          { label: "Investment Objective / هدف الاستثمار", value: optLabel(INVESTMENT_OBJECTIVE_OPTIONS, form.investmentObjective) },
          ...(form.investmentObjectiveOther ? [
            { label: "Objective (Other) / هدف آخر", value: (form.investmentObjectiveOther as string) },
          ] : []),
          { label: "Speculative Risk Tolerance / مدى تحمل المخاطر التكهنية", value: optLabel(RISK_TOLERANCE_OPTIONS, form.riskTolerance) },
        ]}
      />
      <Box bg="white" borderWidth="1px" borderRadius="lg" borderTopWidth="3px" borderTopColor="purple.500" p={4}>
        <HStack spacing={3} mb={3}>
          <Flex w={8} h={8} borderRadius="md" bg="purple.50" align="center" justify="center">
            <Icon as={BarChart3} boxSize={4} color="purple.500" />
          </Flex>
          <Text fontSize="sm" fontWeight="semibold">PART H: INVESTMENT EXPERIENCE / الخبرة في الاستثمار</Text>
        </HStack>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Instrument / الأداة</Th>
              <Th>Experience / الخبرة</Th>
              <Th>Years / السنوات</Th>
            </Tr>
          </Thead>
          <Tbody>
            {INVESTMENT_INSTRUMENT_OPTIONS.map(({ key, label }) => {
              const v = investmentExp?.[key as keyof InvestmentExperienceData];
              return (
                <Tr key={key}>
                  <Td fontSize="xs">{label}</Td>
                  <Td fontSize="xs">{v?.has === true ? "Yes / نعم" : v?.has === false ? "No / لا" : "-"}</Td>
                  <Td fontSize="xs">{v?.years != null ? String(v.years) : "-"}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
      <ReviewSection
        icon={Scale}
        title="PART I: GENERAL COMPLIANCE QUESTIONS / أسئلة عامة للتوافق التنظيمي"
        accentColor="red.500"
        fields={[
          { label: "Associated with a listed company / مرتبط بشركة مدرجة", value: yn(form.isAssociatedWithListed) },
          ...(form.isAssociatedWithListed ? [
            { label: "If yes, please explain / في حال الإجابة بنعم، يرجى التوضيح", value: (form.associatedListedDetails as string) || "-", colSpan: 2 },
          ] : []),
          { label: "Access to non-public / inside information / لديك معلومات داخلية", value: yn(form.hasInsideInformation) },
          ...(form.hasInsideInformation ? [
            { label: "If yes, please explain / في حال الإجابة بنعم، يرجى التوضيح", value: (form.insideInformationDetails as string) || "-", colSpan: 2 },
          ] : []),
        ]}
      />
      <ReviewSection
        icon={Shield}
        title="PART J: POLITICALLY EXPOSED PERSON (PEP) / شخص مكشوف سياسياً"
        accentColor="red.500"
        fields={[
          { label: "PEP Declaration / الإقرار", value: pepOpts.length ? pepOpts.join(" + ") : "-", colSpan: 2 },
          ...(form.pepDetails ? [
            { label: "PEP Details / التفاصيل", value: (form.pepDetails as string), colSpan: 2 },
          ] : []),
        ]}
      />
      <ReviewSection
        icon={FileText}
        title="Documents / المستندات"
        accentColor="teal.500"
        fields={[
          { label: "ID Type / نوع الوثيقة", value: form.idDocumentType === "PASSPORT" ? "Passport / جواز سفر" : form.idDocumentType === "NATIONAL_ID" ? "National ID / بطاقة هوية" : "-" },
          { label: "ID / Passport Number / الرقم", value: (form.passportNumber as string) || (form.idNumber as string) || "-" },
          { label: "Issue / Expiry Date / تاريخ الإصدار أو الانتهاء", value: fmtDate(form.idIssueDate) !== "-" ? fmtDate(form.idIssueDate) : fmtDate(form.passportExpiryDate) },
          { label: "Uploaded Documents / المستندات المرفوعة", value: `${docs.length}`, colSpan: 2 },
        ]}
      />
      {docs.length > 0 && (
        <Box bg="white" borderWidth="1px" borderRadius="lg" p={4} fontSize="sm">
          <Text fontSize="xs" textTransform="uppercase" color="gray.500" mb={2}>
            Files / الملفات
          </Text>
          <VStack align="stretch" spacing={1}>
            {docs.map((d, i) => (
              <Text key={i} fontSize="xs" color="gray.600">
                • {formatDocumentType(d.documentType as string)}{d.side ? ` (${d.side})` : ""} — {(d.fileName as string) || ""}
              </Text>
            ))}
          </VStack>
        </Box>
      )}
      <ReviewSection
        icon={ClipboardCheck}
        title="Signatures / التوقيعات"
        accentColor="green.500"
        fields={[
          { label: "Client Declaration / إقرار العميل", value: form.declarationAccepted ? `Accepted by ${form.declarationFullName || "-"} on ${fmtDate(form.declarationDate)}` : "Not accepted / لم يُقبل" },
          { label: "Regulatory Reservation Clause / بند احتياطي تنظيمي", value: form.regulatoryClauseAccepted ? `Accepted by ${form.regulatoryClauseFullName || "-"}` : "Not accepted / لم يُقبل" },
          { label: "Trading Partner (Second Party) / الشركة", value: (form.tradingCompany as string) || "-" },
          { label: "Commission Tier / العمولة", value: (form.tradingCommission as string) || "-" },
          { label: "Client Agreement / اتفاقية العميل", value: (form.agreementAccepted && form.agreementSignedAt) ? `Signed by ${form.agreementFullName || "-"} on ${fmtDateTime(form.agreementSignedAt)}` : "Not signed / غير موقعة", colSpan: 2 },
        ]}
      />

      <Box bg={warningBg} borderWidth="1px" borderColor={warningBorder} p={4} borderRadius="lg" fontSize="sm">
        <HStack spacing={2}>
          <Icon as={AlertTriangle} boxSize={4} color="yellow.500" flexShrink={0} />
          <Text fontWeight="medium">
            Please review all information carefully. Once submitted, you cannot edit until the review is complete.
            <br />
            يرجى مراجعة جميع المعلومات بعناية. بعد الإرسال، لا يمكنك التعديل حتى تكتمل المراجعة.
          </Text>
        </HStack>
      </Box>
    </VStack>
  );
}
