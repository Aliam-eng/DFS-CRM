"use client";

import { useEffect, useState } from "react";
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
  PEP_STATUS_OPTIONS,
} from "@/lib/constants";
import { FormStepper } from "@/components/shared/form-stepper";
import { FileUploadZone } from "@/components/shared/file-upload-zone";
import { ReviewSection } from "@/components/shared/review-section";
import { KycFormSkeleton } from "@/components/shared/loading-skeletons";
import type {
  InvestmentExperienceData,
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
      setKycId(kyc.id);
      // Set boolean defaults to false (No) if not already set
      const BOOL_DEFAULTS = ["isUsPerson", "isActingOnBehalf", "isAssociatedWithListed", "hasOtherBankAccounts"];
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
        requireString("placeOfBirth", "Place of birth is required");
        requireString("dateOfBirth", "Date of birth is required");
        requireString("gender", "Gender is required");
        requireString("nationality", "Nationality is required");
        requireString("maritalStatus", "Marital status is required");
        break;
      case 1: // Address
        requireString("homeStatus", "Home status is required");
        requireString("primaryCountry", "Country is required");
        requireString("primaryCity", "City is required");
        break;
      case 2: // Employment
        requireString("employmentCategory", "Employment status is required");
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
      case 5: // Beneficial Owner
        break;
      case 6: // Investment Profile
        requireString("investmentStrategy", "Investment strategy is required");
        requireString("investmentObjective", "Investment objective is required");
        requireString("riskTolerance", "Risk tolerance is required");
        break;
      case 7: // Investment Experience — no required fields
        break;
      case 8: // Compliance
        break;
      case 9: // PEP
        requireString("pepStatus", "PEP status is required");
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
      case 11: // Declaration
        if (!form.declarationAccepted) errs["declarationAccepted"] = "Declaration must be accepted";
        requireString("declarationFullName", "Declaration full name is required");
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
      case 11: return <DeclarationReviewStep form={form} updateField={updateField} docs={docs} warningBg={warningBg} warningBorder={warningBorder} errors={e} />;
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
        <FormControl>
          <FormLabel>{"Middle Name (Father's Name) / اسم الأب"}</FormLabel>
          <Input value={(form.middleName as string) || ""} onChange={(e) => updateField("middleName", e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>{"Mother's Full Name / اسم الأم وشهرتها"}</FormLabel>
          <Input value={(form.mothersFullName as string) || ""} onChange={(e) => updateField("mothersFullName", e.target.value)} />
        </FormControl>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isInvalid={!!errors.placeOfBirth}>
          <FormLabel>Place and Date of Birth *</FormLabel>
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
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>Phone/Mobile Number / رقم الهاتف</FormLabel>
          <Input value={(form.phoneNumber as string) || ""} onChange={(e) => updateField("phoneNumber", e.target.value)} placeholder="+961 ..." />
        </FormControl>
        <FormControl>
          <FormLabel>Email Address / عنوان البريد الإلكتروني</FormLabel>
          <Input type="email" value={(form.emailAddress as string) || ""} onChange={(e) => updateField("emailAddress", e.target.value)} />
        </FormControl>
      </SimpleGrid>

      {form.maritalStatus === "MARRIED" && (
        <>
          <Divider />
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>{"Spouse's Full Name / الاسم الكامل للزوج"}</FormLabel>
              <Input value={(form.spouseFullName as string) || ""} onChange={(e) => updateField("spouseFullName", e.target.value)} />
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
        <FormControl>
          <FormLabel>Area/Neighborhood / المنطقة</FormLabel>
          <Input value={(form.primaryArea as string) || ""} onChange={(e) => updateField("primaryArea", e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Street Name & Number / اسم الشارع ورقمه</FormLabel>
          <Input value={(form.primaryStreet as string) || ""} onChange={(e) => updateField("primaryStreet", e.target.value)} />
        </FormControl>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <FormControl>
          <FormLabel>Building Name or Number / المبنى</FormLabel>
          <Input value={(form.primaryBuilding as string) || ""} onChange={(e) => updateField("primaryBuilding", e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Floor Number / الطابق</FormLabel>
          <Input value={(form.primaryFloor as string) || ""} onChange={(e) => updateField("primaryFloor", e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Apartment Number / الشقة</FormLabel>
          <Input value={(form.primaryApartment as string) || ""} onChange={(e) => updateField("primaryApartment", e.target.value)} />
        </FormControl>
      </SimpleGrid>

      <Divider />
      <FormControl display="flex" alignItems="center">
        <FormLabel mb={0}>Do you have a secondary or overseas address? / هل لديك عنوان ثانٍ أو في الخارج؟</FormLabel>
        <Switch isChecked={hasSecondary || false} onChange={(e) => updateField("hasSecondaryAddress", e.target.checked)} />
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
          <FormControl>
            <FormLabel>Institution/Company Name</FormLabel>
            <Input value={(form.institutionName as string) || ""} onChange={(e) => updateField("institutionName", e.target.value)} />
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
          <FormControl>
            <FormLabel>University Name</FormLabel>
            <Input value={(form.universityName as string) || ""} onChange={(e) => updateField("universityName", e.target.value)} />
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
          <FormControl>
            <FormLabel>Name of the Company</FormLabel>
            <Input value={(form.directorCompanyName as string) || ""} onChange={(e) => updateField("directorCompanyName", e.target.value)} />
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Stock Exchange</FormLabel>
              <Input value={(form.directorStockExchange as string) || ""} onChange={(e) => updateField("directorStockExchange", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Position Held</FormLabel>
              <Input value={(form.directorPosition as string) || ""} onChange={(e) => updateField("directorPosition", e.target.value)} />
            </FormControl>
          </SimpleGrid>
          <FormControl>
            <FormLabel>Date of Appointment</FormLabel>
            <Input type="date" value={(form.directorAppointmentDate as string)?.split("T")[0] || ""} onChange={(e) => updateField("directorAppointmentDate", e.target.value)} />
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
      <SectionHeader icon={DollarSign} label="5. Accounts with Other Financial Institutions" />
      <FormControl>
        <FormLabel>Do you maintain accounts with other financial institutions?</FormLabel>
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

      <Divider />
      <SectionHeader icon={DollarSign} label="6. US Person / Tax Resident" />
      <FormControl>
        <FormLabel>Are you a U.S. Person or a tax resident in any jurisdiction other than Lebanon?</FormLabel>
        <RadioGroup value={form.isUsPerson === true ? "yes" : "no"} onChange={(v) => updateField("isUsPerson", v === "yes")}>
          <Stack direction="row" spacing={4}>
            <Radio value="yes" size="sm">Yes / نعم</Radio>
            <Radio value="no" size="sm">No / لا</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>
      {form.isUsPerson === true && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">
            Please note that the correspondent institution does not provide services to U.S. persons; therefore, the client relationship cannot be established.
          </Text>
        </Alert>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 5: BENEFICIAL OWNER (Part F)
   ═══════════════════════════════════════════ */

function BeneficialOwnerStep({ form, updateField }: StepProps) {
  const bo = (form.beneficialOwner as Record<string, string>) || {};
  const updateBo = (key: string, value: string) => {
    updateField("beneficialOwner", { ...bo, [key]: value });
  };

  return (
    <>
      <SectionHeader icon={Users} label="Beneficial Owner / المستفيد الفعلي" />
      <FormControl>
        <FormLabel>Are you acting on behalf of another individual or entity?</FormLabel>
        <RadioGroup value={form.isActingOnBehalf === true ? "yes" : "no"} onChange={(v) => updateField("isActingOnBehalf", v === "yes")}>
          <Stack direction="row" spacing={4}>
            <Radio value="yes" size="sm">Yes / نعم</Radio>
            <Radio value="no" size="sm">No / لا</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      {form.isActingOnBehalf === true && (
        <>
          <Divider />
          <Text fontSize="sm" fontWeight="medium">Beneficial Owner Details:</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Full Name</FormLabel>
              <Input value={bo.fullName || ""} onChange={(e) => updateBo("fullName", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Date of Birth</FormLabel>
              <Input type="date" value={bo.dateOfBirth || ""} onChange={(e) => updateBo("dateOfBirth", e.target.value)} />
            </FormControl>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Nationality</FormLabel>
              <Input value={bo.nationality || ""} onChange={(e) => updateBo("nationality", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>ID Number</FormLabel>
              <Input value={bo.idNumber || ""} onChange={(e) => updateBo("idNumber", e.target.value)} />
            </FormControl>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Passport Number</FormLabel>
              <Input value={bo.passportNumber || ""} onChange={(e) => updateBo("passportNumber", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Passport Expiry Date</FormLabel>
              <Input type="date" value={bo.passportExpiryDate || ""} onChange={(e) => updateBo("passportExpiryDate", e.target.value)} />
            </FormControl>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Relationship to Account Holder</FormLabel>
              <Input value={bo.relationshipToAccountHolder || ""} onChange={(e) => updateBo("relationshipToAccountHolder", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>% Ownership or Control</FormLabel>
              <Input value={bo.ownershipPercentage || ""} onChange={(e) => updateBo("ownershipPercentage", e.target.value)} />
            </FormControl>
          </SimpleGrid>
        </>
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

function InvestmentExperienceStep({ form, updateField }: StepProps) {
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

  return (
    <>
      <SectionHeader icon={BarChart3} label="Investment Experience / الخبرة في الاستثمار" />
      <Text fontSize="sm" color="gray.500">Do you have investment experience? (Check all that apply)</Text>

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
              return (
                <Tr key={inst.key}>
                  <Td fontSize="sm">{inst.label}</Td>
                  <Td textAlign="center">
                    <Radio isChecked={item.has === true} onChange={() => updateExp(inst.key, "has", true)} size="sm" value="yes" />
                  </Td>
                  <Td textAlign="center">
                    <Radio isChecked={item.has === false} onChange={() => updateExp(inst.key, "has", false)} size="sm" value="no" />
                  </Td>
                  <Td>
                    {item.has && (
                      <Input size="sm" type="number" min={0} w="80px" value={item.years ?? ""} onChange={(e) => updateExp(inst.key, "years", e.target.value ? parseInt(e.target.value) : null)} />
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 8: GENERAL COMPLIANCE (Part I)
   ═══════════════════════════════════════════ */

function ComplianceStep({ form, updateField }: StepProps) {
  return (
    <>
      <SectionHeader icon={Scale} label="General Compliance Questions / أسئلة عامة للتوافق التنظيمي" />

      <FormControl>
        <FormLabel fontSize="sm">
          Are you, your spouse, or any relative living in the same household: an employee, principal, owner of more than 10% equity interest, or an associated person of a publicly listed company? Or have access to non-public or inside information from any entity listed on a stock exchange?
        </FormLabel>
        <Text fontSize="xs" color="gray.500" mb={2}>
          هل أنت أو زوجك/زوجتك أو أي قريب يقيم معك في نفس المنزل: موظف أو شريك أو مالك لأكثر من 10٪ من الحصص في شركة مدرجة في البورصة، أو لديك حق الوصول إلى معلومات غير علنية أو داخلية لأي كيان مدرج في البورصة؟
        </Text>
        <RadioGroup value={form.isAssociatedWithListed === true ? "yes" : "no"} onChange={(v) => updateField("isAssociatedWithListed", v === "yes")}>
          <Stack direction="row" spacing={4}>
            <Radio value="yes" size="sm">Yes / نعم</Radio>
            <Radio value="no" size="sm">No / لا</Radio>
          </Stack>
        </RadioGroup>
        {form.isAssociatedWithListed === true && (
          <Textarea mt={2} placeholder="If yes, please explain / في حال الإجابة بنعم، يرجى التوضيح" value={(form.associatedListedDetails as string) || ""} onChange={(e) => updateField("associatedListedDetails", e.target.value)} />
        )}
      </FormControl>
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP 9: PEP DECLARATION (Part J)
   ═══════════════════════════════════════════ */

function PepStep({ form, updateField, errors }: StepProps) {
  return (
    <>
      <SectionHeader icon={Shield} label="Politically Exposed Person (PEP) / شخص مكشوف سياسياً" />

      <FormControl isInvalid={!!errors.pepStatus}>
        <RadioGroup value={(form.pepStatus as string) || ""} onChange={(v) => updateField("pepStatus", v)}>
          <Stack spacing={3}>
            {PEP_STATUS_OPTIONS.map((o) => <Radio key={o.value} value={o.value} size="sm">{o.label}</Radio>)}
          </Stack>
        </RadioGroup>
        <FormErrorMessage>{errors.pepStatus}</FormErrorMessage>
      </FormControl>

      {(form.pepStatus === "IS_PEP" || form.pepStatus === "PEP_FAMILY_ASSOCIATE") && (
        <FormControl>
          <FormLabel>Please explain:</FormLabel>
          <Textarea value={(form.pepDetails as string) || ""} onChange={(e) => updateField("pepDetails", e.target.value)} />
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
    ["DRIVING_LICENCE"].includes(d.documentType as string)
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
    ["DRIVING_LICENCE"].includes(d.documentType as string)
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
              Upload a clear copy of your {idType === "PASSPORT" ? "passport" : "national ID"} (front and back)
            </Text>
            {errors.identityDoc && <Text fontSize="xs" color="red.500" mb={2}>{errors.identityDoc}</Text>}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FileUploadZone
                label="Front Side"
                isUploaded={hasIdFront}
                uploadedFileName={idFrontDoc?.fileName as string}
                uploadedFileSize={idFrontDoc?.fileSize as number}
                isUploading={uploading}
                onFileSelect={(f) => uploadFile(f, "kyc-documents", idType, "front")}
              />
              <FileUploadZone
                label="Back Side"
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
          label="Address Document"
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
            <option value="DRIVING_LICENCE">Driving Licence</option>
          </Select>
        </FormControl>
        {additionalDocType && (
          <FileUploadZone
            label={additionalDocType === "DRIVING_LICENCE" ? "Driving Licence" : "Document"}
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

function DeclarationReviewStep({ form, updateField, docs, warningBg, warningBorder, errors }: DeclarationReviewStepProps) {
  return (
    <VStack spacing={4} align="stretch">
      {/* Review sections */}
      <ReviewSection
        icon={User}
        title="Part A: Personal Information"
        accentColor="brand.500"
        fields={[
          { label: "Name", value: `${form.firstName || ""} ${form.middleName || ""} ${form.lastName || ""}`.trim() || "-" },
          { label: "Date of Birth", value: form.dateOfBirth ? new Date(form.dateOfBirth as string).toLocaleDateString() : "-" },
          { label: "Gender", value: (form.gender as string) || "-" },
          { label: "Nationality", value: (form.nationality as string) || "-" },
          { label: "Phone", value: (form.phoneNumber as string) || "-" },
          { label: "Email", value: (form.emailAddress as string) || "-" },
          { label: "Marital Status", value: (form.maritalStatus as string) || "-" },
        ]}
      />

      <ReviewSection
        icon={MapPin}
        title="Part B: Address"
        accentColor="brand.500"
        fields={[
          { label: "Home Status", value: (form.homeStatus as string) || "-" },
          { label: "Country", value: (form.primaryCountry as string) || "-" },
          { label: "City", value: (form.primaryCity as string) || "-" },
          { label: "Area", value: (form.primaryArea as string) || "-" },
          { label: "Street", value: (form.primaryStreet as string) || "-" },
          ...(form.hasSecondaryAddress ? [
            { label: "Secondary Country", value: (form.secondaryCountry as string) || "-" },
            { label: "Secondary City", value: (form.secondaryCity as string) || "-" },
          ] : []),
        ]}
      />

      <ReviewSection
        icon={Briefcase}
        title="Part C: Employment"
        accentColor="navy.500"
        fields={[
          { label: "Status", value: (form.employmentCategory as string)?.replace(/_/g, " ") || "-" },
          { label: "Profession", value: (form.currentProfession as string) || "-" },
          { label: "Company", value: (form.institutionName as string) || "-" },
        ]}
      />

      <ReviewSection
        icon={DollarSign}
        title="Parts D & E: Communication & Financial"
        accentColor="green.500"
        fields={[
          { label: "Annual Income", value: (form.annualIncomeRange as string)?.replace(/_/g, " ") || "-" },
          { label: "Source of Funds", value: ((form.sourceOfFunds as string[]) || []).map((v) => v.replace(/_/g, " ")).join(", ") || "-" },
          { label: "Net Worth", value: (form.estimatedNetWorth as string)?.replace(/_/g, " ") || "-" },
          { label: "Source of Wealth", value: ((form.sourceOfWealth as string[]) || []).map((v) => v.replace(/_/g, " ")).join(", ") || "-" },
          { label: "US Person", value: form.isUsPerson === true ? "Yes" : form.isUsPerson === false ? "No" : "-" },
        ]}
      />

      <ReviewSection
        icon={Target}
        title="Parts F, G & H: Investment"
        accentColor="purple.500"
        fields={[
          { label: "Beneficial Owner", value: form.isActingOnBehalf === true ? "Yes" : "No" },
          { label: "Strategy", value: (form.investmentStrategy as string) || "-" },
          { label: "Objective", value: (form.investmentObjective as string)?.replace(/_/g, " ") || "-" },
          { label: "Risk Tolerance", value: (form.riskTolerance as string) || "-" },
        ]}
      />

      <ReviewSection
        icon={Shield}
        title="Parts I & J: Compliance"
        accentColor="red.500"
        fields={[
          { label: "PEP Status", value: (form.pepStatus as string)?.replace(/_/g, " ") || "-" },
          { label: "Compliance Declaration", value: form.isAssociatedWithListed === true ? "Yes" : form.isAssociatedWithListed === false ? "No" : "-" },
        ]}
      />

      <ReviewSection
        icon={FileText}
        title="Documents"
        accentColor="teal.500"
        fields={[
          { label: "ID Type", value: form.idDocumentType === "PASSPORT" ? "Passport" : form.idDocumentType === "NATIONAL_ID" ? "National ID" : "-" },
          { label: "ID/Passport Number", value: (form.passportNumber as string) || (form.idNumber as string) || "-" },
          { label: "Uploaded Documents", value: `${docs.length} document(s)` },
        ]}
      />

      {/* Declaration */}
      <Divider />
      <Box p={4} borderWidth="1px" borderRadius="lg" fontSize="sm">
        <Heading size="xs" mb={3}>Client Declaration & Undertaking / إقرار وتعهد العميل</Heading>
        <Text fontSize="xs" color="gray.600" mb={2} lineHeight="tall">
          I, the undersigned, hereby declare that all information and documents provided in this Know Your Customer (KYC) form are true, complete, and accurate to the best of my knowledge. I understand that providing false or misleading information may result in the termination of my engagement or relationship with Diligent Financial Services (&ldquo;DFS&rdquo;).
        </Text>
        <Text fontSize="xs" color="gray.600" mb={2} lineHeight="tall">
          I expressly acknowledge and agree to the following: I authorize Diligent Financial Services (&ldquo;DFS&rdquo;) to verify and validate the information and documentation provided, and to collect, process, store, and share my personal data in accordance with applicable data protection laws, solely for regulatory, compliance, and risk management purposes.
        </Text>
        <Text fontSize="xs" color="gray.600" mb={2} lineHeight="tall">
          I confirm that I have carefully read, understood, and accepted the Account Opening Terms and Conditions, the Risk Warning documents, and all other related regulatory disclosures&mdash;whether provided in physical form or made available on the official DFS website.
        </Text>
        <Text fontSize="xs" color="gray.600" mb={2} lineHeight="tall">
          I undertake to comply fully with all applicable laws and regulations issued by the Capital Markets Authority (CMA) and other competent regulatory authorities in Lebanon, as well as all applicable international laws and standards, including those relating to anti-money laundering (AML) and counter-financing of terrorism (CFT).
        </Text>
        <Text fontSize="xs" color="gray.600" mb={2} lineHeight="tall">
          I confirm that I am not subject to any international sanctions, asset freeze, or restrictive measures issued by OFAC, the European Union (EU), the United Nations (UN), or any other competent authority.
        </Text>
        <Text fontSize="xs" color="gray.600" mb={2} lineHeight="tall">
          I undertake to promptly inform Diligent Financial Services (DFS) of any material change to the information provided in this KYC form, including but not limited to changes in my financial situation, employment status, residency, or regulatory status.
        </Text>
        <Text fontSize="xs" color="gray.600" mb={2} lineHeight="tall">
          I acknowledge that DFS provides advisory and arranging services only, and that I fully understand the nature of the advisory and arranging services offered by DFS, including the inherent risks involved&mdash;such as the potential total loss of capital&mdash;and I accept full responsibility for all investment decisions made independently by me, based on the advice or arrangements facilitated by DFS.
        </Text>
        <Text fontSize="xs" color="gray.600" mb={2} lineHeight="tall">
          I confirm that I am at least eighteen (18) years old and legally capable of entering into this agreement, and that I fully understand and accept the risks inherent in financial market activities.
        </Text>
        <Text fontSize="xs" color="gray.600" mb={2} lineHeight="tall">
          This declaration is made voluntarily, with full understanding of its content, legal implications, and the risks and consequences arising from the nature of financial market activities and the advisory and arranging services provided.
        </Text>

        <Heading size="xs" mt={4} mb={2} color="red.600">Regulatory Reservation Clause / بند التحفظ التنظيمي</Heading>
        <Text fontSize="xs" color="gray.600" mb={2} lineHeight="tall">
          I acknowledge and agree that Diligent Financial Services (DFS) may request any additional documentation or information necessary to comply with applicable laws, AML/CFT regulations, or internal risk management requirements, whether before or after establishing the client relationship.
        </Text>

        <Divider my={3} />
        <Text fontSize="xs" color="gray.500" mb={2} lineHeight="tall" dir="rtl">
          أنا الموقّع أدناه، أصرّح بأن جميع المعلومات والمستندات المقدمة في نموذج &quot;اعرف عميلك&quot; (KYC) صحيحة وكاملة ودقيقة بحسب أفضل علمي ومعرفتي. أفهم أن تقديم أي معلومات كاذبة أو مضللة قد يؤدي إلى إنهاء علاقتي أو تعاملي مع شركة الخدمات المالية الدقيقة ش.م.ل. (&laquo;DFS&raquo;).
        </Text>
        <Text fontSize="xs" color="gray.500" mb={2} lineHeight="tall" dir="rtl">
          أوافق صراحةً وأقر بما يلي: أفوّض شركة الخدمات المالية الدقيقة (&laquo;DFS&raquo;) بالتحقق من صحة المعلومات والمستندات المقدمة والتثبّت منها، وبجمع بياناتي الشخصية ومعالجتها وتخزينها ومشاركتها وفقاً لقوانين حماية البيانات المعمول بها، وذلك حصراً لأغراض الامتثال التنظيمي وإدارة المخاطر.
        </Text>
        <Text fontSize="xs" color="gray.500" mb={2} lineHeight="tall" dir="rtl">
          أتعهد بالامتثال الكامل لجميع القوانين واللوائح المعمول بها الصادرة عن هيئة الأسواق المالية (CMA) والسلطات التنظيمية المختصة الأخرى في لبنان، وكذلك جميع القوانين والمعايير الدولية المعمول بها بما في ذلك مكافحة غسل الأموال وتمويل الإرهاب.
        </Text>
        <Text fontSize="xs" color="gray.500" mb={4} lineHeight="tall" dir="rtl">
          أقرّ وأوافق على أنه يحق لشركة الخدمات المالية الدقيقة (DFS) طلب أي وثائق أو معلومات إضافية ضرورية للامتثال للقوانين المعمول بها أو لوائح مكافحة غسل الأموال وتمويل الإرهاب أو متطلبات إدارة المخاطر الداخلية، سواء قبل أو بعد إنشاء علاقة العميل.
        </Text>

        <VStack spacing={3} align="stretch">
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
            <Input value={(form.declarationFullName as string) || ""} onChange={(e) => updateField("declarationFullName", e.target.value)} placeholder="First Name / Father's Name / Family Name" />
            <FormErrorMessage>{errors.declarationFullName}</FormErrorMessage>
          </FormControl>
        </VStack>
      </Box>

      <Box bg={warningBg} borderWidth="1px" borderColor={warningBorder} p={4} borderRadius="lg" fontSize="sm">
        <HStack spacing={2}>
          <Icon as={AlertTriangle} boxSize={4} color="yellow.500" flexShrink={0} />
          <Text fontWeight="medium">
            Please review all information carefully. Once submitted, you cannot edit until the review is complete.
          </Text>
        </HStack>
      </Box>
    </VStack>
  );
}
