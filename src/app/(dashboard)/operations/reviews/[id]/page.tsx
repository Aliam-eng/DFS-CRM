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

export default function OperationsReviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [kyc, setKyc] = useState<KycDetail | null>(null);
  const [decision, setDecision] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedBg = useColorModeValue("gray.50", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const complianceBg = useColorModeValue("blue.50", "blue.900");
  const complianceBorderColor = useColorModeValue("blue.200", "blue.700");
  const complianceHeadingColor = useColorModeValue("blue.700", "blue.200");

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
    const res = await fetch(`/api/kyc/${id}/operations-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, notes }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error);
      toast({ title: "Review Failed", description: d.error, status: "error", duration: 3000 });
      setSubmitting(false);
      setShowConfirm(false);
      return;
    }
    toast({ title: `KYC ${decision === "APPROVED" ? "Approved" : "Rejected"}`, status: decision === "APPROVED" ? "success" : "info", duration: 3000 });
    router.push("/operations/reviews");
  };

  if (notFound) return (
    <Flex direction="column" align="center" justify="center" h="256px" gap={4}>
      <Text fontSize="lg" fontWeight="medium">KYC submission not found</Text>
      <Button variant="outline" onClick={() => router.push("/operations/reviews")}>Back to Reviews</Button>
    </Flex>
  );

  if (!kyc) return <DetailSkeleton />;

  const operationsReview = kyc.reviews.find((r) => r.reviewType === "OPERATIONS");
  const complianceReview = kyc.reviews.find((r) => r.reviewType === "COMPLIANCE");
  const canReview = kyc.status === "SUBMITTED";
  const investmentExp = kyc.investmentExperience as InvestmentExperienceData | null;
  const bo = kyc.beneficialOwner as BeneficialOwnerInfo | null;
  const fmt = (s: string | null) => s ? s.replace(/_/g, " ") : "-";
  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString() : "-";

  return (
    <Box maxW="4xl" mx="auto">
      <VStack spacing={5} align="stretch">
        <Flex align="center" justify="space-between">
          <Heading size="lg">Operations Review</Heading>
          <HStack spacing={3}>
            <Button size="sm" variant="outline" leftIcon={<Icon as={Download} boxSize={4} />} onClick={() => generateKycPdf(kyc).save(`KYC-${kyc.id}.pdf`)}>
              Export PDF
            </Button>
            <StatusBadge status={kyc.status} />
          </HStack>
        </Flex>

        {error && <Alert status="error" borderRadius="md"><AlertIcon />{error}</Alert>}

        {/* My Previous Operations Review */}
        {operationsReview && !canReview && (
          <Box bg={mutedBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="sm" mb={4}>My Operations Review</Heading>
            <VStack spacing={2} align="stretch" fontSize="sm">
              <Box><Text as="strong">Reviewer:</Text> {operationsReview.reviewer.firstName} {operationsReview.reviewer.lastName}</Box>
              <HStack><Text as="strong">Decision:</Text> <StatusBadge status={operationsReview.decision} /></HStack>
              <Box><Text as="strong">Date:</Text> {new Date(operationsReview.reviewedAt).toLocaleString()}</Box>
              {operationsReview.notes && <Box><Text as="strong">Notes:</Text> {operationsReview.notes}</Box>}
            </VStack>
          </Box>
        )}

        {/* Compliance Final Review (read-only) */}
        {complianceReview && (
          <Box bg={complianceBg} borderWidth="1px" borderColor={complianceBorderColor} borderRadius="lg" p={5}>
            <Heading size="sm" mb={4} color={complianceHeadingColor}>Compliance Final Review</Heading>
            <VStack spacing={2} align="stretch" fontSize="sm">
              <Box><Text as="strong">Reviewer:</Text> {complianceReview.reviewer.firstName} {complianceReview.reviewer.lastName}</Box>
              <HStack><Text as="strong">Decision:</Text> <StatusBadge status={complianceReview.decision} /></HStack>
              <Box><Text as="strong">Date:</Text> {new Date(complianceReview.reviewedAt).toLocaleString()}</Box>
              {complianceReview.notes && <Box><Text as="strong">Notes:</Text> {complianceReview.notes}</Box>}
              {complianceReview.amlReportPath && (
                <Box><Text as="strong">AML Report:</Text> <ChakraLink href={`/api/files/${complianceReview.amlReportPath}`} isExternal color="blue.500">Download</ChakraLink></Box>
              )}
            </VStack>
          </Box>
        )}

        {/* Client Info */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Client Information</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
            <Field label="Account Name" value={`${kyc.user.firstName} ${kyc.user.lastName}`} />
            <Field label="Email" value={kyc.user.email} />
          </SimpleGrid>
        </Box>

        {/* Part A: Personal */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Part A: Personal Information</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} fontSize="sm">
            <Field label="First Name" value={kyc.firstName} />
            <Field label="Middle Name" value={kyc.middleName} />
            <Field label="Last Name" value={kyc.lastName} />
            <Field label="Date of Birth" value={fmtDate(kyc.dateOfBirth)} />
            <Field label="Gender" value={kyc.gender} />
            <Field label="Nationality" value={kyc.nationality} />
            <Field label="Phone" value={kyc.phoneNumber} />
            <Field label="Email" value={kyc.emailAddress} />
            <Field label="Marital Status" value={kyc.maritalStatus} />
          </SimpleGrid>
        </Box>

        {/* Part B: Address */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Part B: Address</Heading>
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
          <Heading size="sm" mb={4}>Part C: Employment</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
            <Field label="Status" value={fmt(kyc.employmentCategory)} />
            <Field label="Profession" value={kyc.currentProfession} />
            <Field label="Institution" value={kyc.institutionName} />
            <Field label="Nature of Business" value={kyc.natureOfBusiness} />
            <BoolField label="Director of Listed Company" value={kyc.isDirectorOfListed} />
          </SimpleGrid>
        </Box>

        {/* Parts D+E: Financial */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Parts D & E: Communication & Financial</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} fontSize="sm">
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
            <Field label="Source of Funds" value={(kyc.sourceOfFunds as string[])?.join(", ")} />
            <Field label="Net Worth" value={fmt(kyc.estimatedNetWorth)} />
            <Field label="Source of Wealth" value={(kyc.sourceOfWealth as string[])?.join(", ")} />
            <BoolField label="US Person" value={kyc.isUsPerson} />
          </SimpleGrid>
          <Divider my={3} />
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
            <BoolField label="Has Other Bank Accounts" value={kyc.hasOtherBankAccounts} />
            {kyc.hasOtherBankAccounts && <Field label="Other Bank Country" value={kyc.otherBankCountry} />}
          </SimpleGrid>
        </Box>

        {/* Part F+G+H: Investment */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Parts F, G & H: Investment</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} fontSize="sm">
            <BoolField label="Acting on Behalf" value={kyc.isActingOnBehalf} />
            {bo && <Field label="Beneficial Owner" value={bo.fullName} />}
            <Field label="Strategy" value={kyc.investmentStrategy} />
            <Field label="Objective" value={fmt(kyc.investmentObjective)} />
            <Field label="Risk Tolerance" value={kyc.riskTolerance} />
          </SimpleGrid>
          {investmentExp && (
            <Box mt={3} overflowX="auto">
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
          <Heading size="sm" mb={4}>Parts I & J: Compliance</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
            <BoolField label="Compliance Declaration" value={kyc.isAssociatedWithListed} />
            {kyc.isAssociatedWithListed && <Field label="Details" value={kyc.associatedListedDetails} />}
            <Field label="PEP Status" value={fmt(kyc.pepStatus)} />
            {kyc.pepDetails && <Field label="PEP Details" value={kyc.pepDetails} />}
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
              const isImage = doc.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
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
                      <Text fontSize="sm">{doc.documentType.replace(/_/g, " ")}{doc.side ? ` (${doc.side})` : ""} - {doc.fileName}</Text>
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
            <Field label="Date" value={fmtDate(kyc.declarationDate)} />
          </SimpleGrid>
        </Box>

        {/* Operations Decision */}
        {canReview && (
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="sm" mb={4}>Operations Decision</Heading>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Decision *</FormLabel>
                <RadioGroup value={decision} onChange={setDecision}>
                  <Stack direction="row" spacing={6} mt={2}>
                    <Radio value="APPROVED"><Text color="green.500" fontWeight="medium">Approve &amp; Forward to Compliance</Text></Radio>
                    <Radio value="REJECTED"><Text color="red.500" fontWeight="medium">Reject</Text></Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
              <FormControl>
                <FormLabel>Notes {decision === "REJECTED" ? "*" : "(optional)"}</FormLabel>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter notes..." />
              </FormControl>
              <Divider />
              <Button colorScheme="brand" isDisabled={!decision || (decision === "REJECTED" && !notes)} onClick={() => setShowConfirm(true)}>
                Submit Decision
              </Button>
            </VStack>
          </Box>
        )}

        {/* Edit History */}
        <KycHistory kycId={kyc.id} />

        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleSubmit}
          title={`Confirm ${decision === "APPROVED" ? "Approval & Forward" : "Rejection"}`}
          message={decision === "APPROVED" ? "This KYC will be forwarded to Compliance for final review." : "The client will be notified of the rejection."}
          confirmText="Confirm"
          cancelText="Cancel"
          colorScheme={decision === "APPROVED" ? "green" : "red"}
          isLoading={submitting}
        />
      </VStack>
    </Box>
  );
}
