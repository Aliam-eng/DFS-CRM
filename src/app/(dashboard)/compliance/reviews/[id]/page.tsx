"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  Button,
  Textarea,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Divider,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  Link as ChakraLink,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Download } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailSkeleton } from "@/components/shared/loading-skeletons";
import { KycHistory } from "@/components/shared/kyc-history";
import { generateKycPdf } from "@/lib/kyc-pdf";
import type { KycDetail, InvestmentExperienceData, BeneficialOwnerInfo } from "@/types/kyc";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <Box>
      <Text as="strong" fontSize="xs" textTransform="uppercase" color="gray.500">{label}</Text>
      <Text fontSize="sm">{value || "-"}</Text>
    </Box>
  );
}

function BoolField({ label, value }: { label: string; value: boolean | null | undefined }) {
  return <Field label={label} value={value === true ? "Yes" : value === false ? "No" : "-"} />;
}

export default function ComplianceReviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [kyc, setKyc] = useState<KycDetail | null>(null);
  const [decision, setDecision] = useState("");
  const [notes, setNotes] = useState("");
  const [amlFile, setAmlFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const mutedBg = useColorModeValue("gray.50", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/kyc/${id}`).then((r) => {
      if (!r.ok) { setNotFound(true); return null; }
      return r.json();
    }).then((data) => { if (data) setKyc(data); });
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    const fd = new FormData();
    fd.append("decision", decision);
    if (notes) fd.append("notes", notes);
    if (amlFile) fd.append("amlReport", amlFile);
    const res = await fetch(`/api/kyc/${id}/compliance-review`, { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      toast({ title: "Review Failed", description: data.error, status: "error", duration: 3000 });
      setSubmitting(false);
      setShowConfirm(false);
      return;
    }
    toast({ title: `KYC ${decision === "APPROVED" ? "Approved" : "Rejected"}`, status: decision === "APPROVED" ? "success" : "info", duration: 3000 });
    router.push("/compliance/reviews");
    router.refresh();
  };

  if (notFound) return (
    <Flex direction="column" align="center" justify="center" h="256px" gap={4}>
      <Text fontSize="lg" fontWeight="medium">KYC submission not found</Text>
      <Button variant="outline" onClick={() => router.push("/compliance/reviews")}>Back to Reviews</Button>
    </Flex>
  );

  if (!kyc) return <DetailSkeleton />;

  const canReview = kyc.status === "OPERATIONS_APPROVED";
  const operationsReview = kyc.reviews.find((r) => r.reviewType === "OPERATIONS");
  const investmentExp = kyc.investmentExperience as InvestmentExperienceData | null;
  const bo = kyc.beneficialOwner as BeneficialOwnerInfo | null;
  const fmt = (s: string | null) => s ? s.replace(/_/g, " ") : "-";
  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString() : "-";

  return (
    <Box maxW="4xl" mx="auto">
      <VStack spacing={5} align="stretch">
        <Flex align="center" justify="space-between">
          <Heading size="lg">KYC Review</Heading>
          <HStack spacing={3}>
            <Button size="sm" variant="outline" leftIcon={<Icon as={Download} boxSize={4} />} onClick={() => generateKycPdf(kyc).save(`KYC-${kyc.id}.pdf`)}>
              Export PDF
            </Button>
            <StatusBadge status={kyc.status} />
          </HStack>
        </Flex>

        {error && <Alert status="error" borderRadius="md"><AlertIcon />{error}</Alert>}

        {/* Operations Approval (read-only) */}
        {operationsReview && (
          <Box borderWidth="1px" borderLeftWidth="4px" borderLeftColor="green.400" borderColor={borderColor} bg={mutedBg} borderRadius="lg" p={4}>
            <HStack justify="space-between" mb={2}>
              <Heading size="sm">Operations Review</Heading>
              <StatusBadge status={operationsReview.decision} />
            </HStack>
            <VStack spacing={1} align="stretch" fontSize="sm">
              <Text><Text as="strong">Reviewed by:</Text> {operationsReview.reviewer.firstName} {operationsReview.reviewer.lastName}</Text>
              <Text><Text as="strong">Date:</Text> {new Date(operationsReview.reviewedAt).toLocaleString()}</Text>
              {operationsReview.notes && <Text><Text as="strong">Notes:</Text> {operationsReview.notes}</Text>}
            </VStack>
          </Box>
        )}

        {/* Client Info */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Client Information</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
            <Field label="Account Name" value={`${kyc.user.firstName} ${kyc.user.lastName}`} />
            <Field label="Email" value={kyc.user.email} />
            <Field label="Phone" value={kyc.user.phone} />
            <Field label="Submitted" value={kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleString() : "-"} />
          </SimpleGrid>
        </Box>

        {/* Part A: Personal */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Part A: Personal Information</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} fontSize="sm">
            <Field label="First Name" value={kyc.firstName} />
            <Field label="Middle Name (Father)" value={kyc.middleName} />
            <Field label="Last Name" value={kyc.lastName} />
            <Field label="Mother's Full Name" value={kyc.mothersFullName} />
            <Field label="Place of Birth" value={kyc.placeOfBirth} />
            <Field label="Date of Birth" value={fmtDate(kyc.dateOfBirth)} />
            <Field label="Gender" value={kyc.gender} />
            <Field label="Nationality" value={kyc.nationality} />
            <Field label="Other Nationality" value={kyc.otherNationality} />
            <Field label="Phone" value={kyc.phoneNumber} />
            <Field label="Email" value={kyc.emailAddress} />
            <Field label="Marital Status" value={kyc.maritalStatus} />
            <Field label="Spouse Name" value={kyc.spouseFullName} />
            <Field label="Spouse Profession" value={kyc.spouseProfession} />
            <Field label="Dependents (under 21)" value={kyc.numberOfDependents} />
          </SimpleGrid>
        </Box>

        {/* Part B: Address */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Part B: Residential Address</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
            <Field label="Country" value={kyc.primaryCountry} />
            <Field label="City" value={kyc.primaryCity} />
            <Field label="Area" value={kyc.primaryArea} />
            <Field label="Street" value={kyc.primaryStreet} />
            <Field label="Home Status" value={kyc.homeStatus} />
          </SimpleGrid>
          {kyc.hasSecondaryAddress && (
            <>
              <Divider my={3} />
              <Text fontSize="sm" fontWeight="semibold" mb={3}>Secondary/Overseas Address</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
                <Field label="Country" value={kyc.secondaryCountry} />
                <Field label="City" value={kyc.secondaryCity} />
                <Field label="Home Status" value={kyc.secondaryHomeStatus} />
              </SimpleGrid>
            </>
          )}
        </Box>

        {/* Part C: Employment */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Part C: Occupation & Employment</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
            <Field label="Employment Status" value={fmt(kyc.employmentCategory)} />
            <Field label="Profession" value={kyc.currentProfession} />
            <Field label="Institution" value={kyc.institutionName} />
            <Field label="Nature of Business" value={kyc.natureOfBusiness} />
            <Field label="Length of Employment" value={kyc.lengthOfEmployment} />
            <Field label="Previous Profession" value={kyc.previousProfession} />
            <Field label="University" value={kyc.universityName} />
            <Field label="Major" value={kyc.major} />
            <BoolField label="Director of Listed Company" value={kyc.isDirectorOfListed} />
            {kyc.isDirectorOfListed && <Field label="Company" value={kyc.directorCompanyName} />}
          </SimpleGrid>
        </Box>

        {/* Parts D+E: Financial */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Parts D & E: Communication & Financial</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} fontSize="sm" mb={3}>
            <Box>
              <Text as="strong" fontSize="xs" textTransform="uppercase" color="gray.500">Communication</Text>
              <HStack spacing={2} mt={1} flexWrap="wrap">
                {kyc.preferEmail && <Badge>Email</Badge>}
                {kyc.preferSMS && <Badge>SMS</Badge>}
                {kyc.preferWhatsApp && <Badge>WhatsApp</Badge>}
                {kyc.preferOther && <Badge>{kyc.preferOtherDetails || "Other"}</Badge>}
              </HStack>
            </Box>
            <Field label="Annual Income" value={fmt(kyc.annualIncomeRange)} />
            <Field label="Source of Funds" value={(kyc.sourceOfFunds as string[])?.join(", ") || "-"} />
            <Field label="Net Worth" value={fmt(kyc.estimatedNetWorth)} />
            <Field label="Source of Wealth" value={(kyc.sourceOfWealth as string[])?.join(", ") || "-"} />
            <BoolField label="US Person" value={kyc.isUsPerson} />
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm" mt={3}>
            <BoolField label="Has Other Bank Accounts" value={kyc.hasOtherBankAccounts} />
            {kyc.hasOtherBankAccounts && <Field label="Other Bank Country" value={kyc.otherBankCountry} />}
          </SimpleGrid>
        </Box>

        {/* Part F: Beneficial Owner */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Part F: Beneficial Owner</Heading>
          <BoolField label="Acting on Behalf" value={kyc.isActingOnBehalf} />
          {kyc.isActingOnBehalf && bo && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm" mt={3}>
              <Field label="Full Name" value={bo.fullName} />
              <Field label="Nationality" value={bo.nationality} />
              <Field label="ID Number" value={bo.idNumber} />
              <Field label="Relationship" value={bo.relationshipToAccountHolder} />
              <Field label="Ownership %" value={bo.ownershipPercentage} />
            </SimpleGrid>
          )}
        </Box>

        {/* Parts G+H: Investment */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Parts G & H: Investment Profile & Experience</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} fontSize="sm">
            <Field label="Strategy" value={kyc.investmentStrategy} />
            <Field label="Objective" value={fmt(kyc.investmentObjective)} />
            <Field label="Risk Tolerance" value={kyc.riskTolerance} />
          </SimpleGrid>
          {investmentExp && (
            <Box mt={3} overflowX="auto">
              <Text fontSize="xs" fontWeight="bold" mb={1}>Experience:</Text>
              <Table size="sm" variant="simple">
                <Thead><Tr><Th>Instrument</Th><Th>Experience</Th><Th>Years</Th></Tr></Thead>
                <Tbody>
                  {Object.entries(investmentExp).map(([key, val]) => (
                    <Tr key={key}><Td>{key}</Td><Td>{val.has ? "Yes" : "No"}</Td><Td>{val.years ?? "-"}</Td></Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>

        {/* Parts I+J: Compliance */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Parts I & J: Compliance & Declarations</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
            <BoolField label="Compliance Declaration" value={kyc.isAssociatedWithListed} />
            {kyc.isAssociatedWithListed && <Field label="Details" value={kyc.associatedListedDetails} />}
            <Field label="PEP Status" value={fmt(kyc.pepStatus)} />
            {(kyc.pepStatus === "IS_PEP" || kyc.pepStatus === "PEP_FAMILY_ASSOCIATE") && <Field label="PEP Details" value={kyc.pepDetails} />}
          </SimpleGrid>
        </Box>

        {/* Documents */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Documents</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Field label="ID Type" value={kyc.passportNumber ? "Passport" : kyc.idNumber ? "National ID" : "-"} />
            <Field label="ID/Passport Number" value={kyc.passportNumber || kyc.idNumber} />
            <Field label={kyc.passportNumber ? "Passport Expiry" : "ID Issue Date"} value={kyc.passportNumber ? fmtDate(kyc.passportExpiryDate) : fmtDate(kyc.idIssueDate)} />
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {kyc.documents.map((doc) => {
              const isImage = doc.mimeType?.startsWith("image/");
              return (
                <Box key={doc.id} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
                  {isImage && (
                    <Box bg={mutedBg} p={2}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/files/${doc.filePath}`} alt={doc.fileName} style={{ width: "100%", height: "192px", objectFit: "contain", borderRadius: "4px" }} />
                    </Box>
                  )}
                  <ChakraLink href={`/api/files/${doc.filePath}`} isExternal>
                    <HStack spacing={2} p={3} _hover={{ bg: hoverBg }}>
                      <Text fontSize="sm" fontWeight="medium">{doc.documentType.replace(/_/g, " ")}{doc.side ? ` (${doc.side})` : ""}</Text>
                      <Text fontSize="xs" color={mutedColor}>{doc.fileName}</Text>
                    </HStack>
                  </ChakraLink>
                </Box>
              );
            })}
          </SimpleGrid>
        </Box>

        {/* Declaration */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Client Declaration</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
            <BoolField label="Declaration Accepted" value={kyc.declarationAccepted} />
            <Field label="Signed Name" value={kyc.declarationFullName} />
            <Field label="Declaration Date" value={fmtDate(kyc.declarationDate)} />
          </SimpleGrid>
        </Box>

        {/* Review Action */}
        {canReview && (
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="sm" mb={4}>Review Decision</Heading>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Decision *</FormLabel>
                <RadioGroup value={decision} onChange={setDecision}>
                  <Stack direction="row" spacing={6} mt={2}>
                    <Radio value="APPROVED"><Text color="green.500" fontWeight="medium">Approve</Text></Radio>
                    <Radio value="REJECTED"><Text color="red.500" fontWeight="medium">Reject</Text></Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
              <FormControl>
                <FormLabel>Notes {decision === "REJECTED" ? "*" : "(optional)"}</FormLabel>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter review notes..." />
              </FormControl>
              <FormControl>
                <FormLabel>AML Report (optional)</FormLabel>
                <Input type="file" accept=".pdf,.jpg,.png" onChange={(e) => setAmlFile(e.target.files?.[0] || null)} variant="unstyled" pt={1} />
              </FormControl>
              <Divider />
              <Button colorScheme="brand" isDisabled={!decision || (decision === "REJECTED" && !notes)} onClick={() => setShowConfirm(true)}>
                Submit Review
              </Button>
            </VStack>
          </Box>
        )}

        {/* Review History */}
        {kyc.reviews.length > 0 && (
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="sm" mb={4}>Review History</Heading>
            <VStack spacing={2} align="stretch">
              {kyc.reviews.map((r) => (
                <Box key={r.id} p={3} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                  <Flex align="center" justify="space-between">
                    <Text fontSize="sm" fontWeight="medium">{r.reviewType} - {r.reviewer.firstName} {r.reviewer.lastName}</Text>
                    <StatusBadge status={r.decision} />
                  </Flex>
                  {r.notes && <Text fontSize="sm" color={mutedColor} mt={1}>{r.notes}</Text>}
                  <Text fontSize="xs" color={mutedColor} mt={1}>{new Date(r.reviewedAt).toLocaleString()}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        {/* Edit History */}
        <KycHistory kycId={kyc.id} />

        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleSubmit}
          title={`Confirm ${decision === "APPROVED" ? "Approval" : "Rejection"}`}
          message={`Are you sure you want to ${decision === "APPROVED" ? "approve" : "reject"} this KYC application?`}
          confirmText={`Confirm ${decision === "APPROVED" ? "Approval" : "Rejection"}`}
          cancelText="Cancel"
          colorScheme={decision === "APPROVED" ? "green" : "red"}
          isLoading={submitting}
        />
      </VStack>
    </Box>
  );
}
