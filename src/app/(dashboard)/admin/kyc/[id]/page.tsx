"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  Divider,
  Icon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Link as ChakraLink,
  useColorModeValue,
} from "@chakra-ui/react";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailSkeleton } from "@/components/shared/loading-skeletons";
import { KycHistory } from "@/components/shared/kyc-history";
import { StaffDocumentUpload } from "@/components/shared/staff-document-upload";
import { CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react";
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

export default function AdminKycDetailPage() {
  const { id } = useParams();
  const [kyc, setKyc] = useState<KycDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const mutedBg = useColorModeValue("gray.100", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const loadKyc = () => {
    fetch(`/api/kyc/${id}`).then((r) => {
      if (!r.ok) { setNotFound(true); return null; }
      return r.json();
    }).then((data) => { if (data) setKyc(data); });
  };

  useEffect(() => {
    loadKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (notFound) return (
    <Flex direction="column" align="center" justify="center" h="256px" gap={4}>
      <Text fontSize="lg" fontWeight="medium">KYC submission not found</Text>
    </Flex>
  );

  if (!kyc) return <DetailSkeleton />;

  const investmentExp = kyc.investmentExperience as InvestmentExperienceData | null;
  const bo = kyc.beneficialOwner as BeneficialOwnerInfo | null;
  const fmt = (s: string | null) => s ? s.replace(/_/g, " ") : "-";
  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString() : "-";

  return (
    <Box maxW="4xl" mx="auto">
      <VStack spacing={5} align="stretch">
        <Flex align="center" justify="space-between">
          <Heading size="lg">KYC Audit Detail</Heading>
          <HStack spacing={3}>
            <Button size="sm" variant="outline" leftIcon={<Icon as={Download} boxSize={4} />} onClick={() => generateKycPdf(kyc).save(`KYC-${kyc.id}.pdf`)}>
              Export PDF
            </Button>
            <StatusBadge status={kyc.status} />
          </HStack>
        </Flex>

        {/* Client Info */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Client Information</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
            <Field label="Account Name" value={`${kyc.user.firstName} ${kyc.user.lastName}`} />
            <Field label="Email" value={kyc.user.email} />
            <Field label="Phone" value={kyc.user.phone} />
            <Field label="Created" value={new Date(kyc.createdAt).toLocaleString()} />
            <Field label="Submitted" value={kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleString() : "-"} />
          </SimpleGrid>
        </Box>

        {/* Part A: Personal */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Part A: Personal Information</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} fontSize="sm">
            <Field label="First Name" value={kyc.firstName} />
            <Field label="Middle Name" value={kyc.middleName} />
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
            <Field label="Dependents" value={kyc.numberOfDependents} />
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
              <Text fontSize="xs" fontWeight="bold" mb={2}>Secondary / Overseas Address</Text>
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
            <Field label="Category" value={fmt(kyc.employmentCategory)} />
            <Field label="Profession" value={kyc.currentProfession} />
            <Field label="Institution" value={kyc.institutionName} />
            <Field label="Nature of Business" value={kyc.natureOfBusiness} />
            <Field label="Length of Employment" value={kyc.lengthOfEmployment} />
            <Field label="Institution Phone" value={kyc.institutionPhone} />
            <Field label="Institution Email" value={kyc.institutionEmail} />
            <Field label="Institution Website" value={kyc.institutionWebsite} />
            {kyc.previousProfession && <Field label="Previous Profession" value={kyc.previousProfession} />}
            {kyc.universityName && <Field label="University" value={kyc.universityName} />}
            {kyc.major && <Field label="Major" value={kyc.major} />}
            {kyc.expectedGraduationYear && <Field label="Graduation Year" value={kyc.expectedGraduationYear} />}
            <BoolField label="Director of Listed Company" value={kyc.isDirectorOfListed} />
            {kyc.isDirectorOfListed && (
              <>
                <Field label="Company Name" value={kyc.directorCompanyName} />
                <Field label="Stock Exchange" value={kyc.directorStockExchange} />
                <Field label="Position" value={kyc.directorPosition} />
              </>
            )}
          </SimpleGrid>
        </Box>

        {/* Parts D+E: Communication & Financial */}
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

        {/* Part F+G+H: Investment */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Parts F, G & H: Investment</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} fontSize="sm">
            <BoolField label="Acting on Behalf" value={kyc.isActingOnBehalf} />
            {bo && (
              <>
                <Field label="Beneficial Owner" value={bo.fullName} />
                <Field label="BO Nationality" value={bo.nationality} />
                <Field label="BO Relationship" value={bo.relationshipToAccountHolder} />
                <Field label="BO Ownership %" value={bo.ownershipPercentage} />
              </>
            )}
            <Field label="Strategy" value={kyc.investmentStrategy} />
            <Field label="Objective" value={fmt(kyc.investmentObjective)} />
            <Field label="Risk Tolerance" value={kyc.riskTolerance} />
          </SimpleGrid>
          {investmentExp && (
            <Box mt={3} overflowX="auto">
              <Text fontSize="xs" fontWeight="bold" mb={1}>Investment Experience:</Text>
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
            {kyc.associatedListedDetails && <Field label="Details" value={kyc.associatedListedDetails} />}
            <Field label="PEP Status" value={fmt(kyc.pepStatus)} />
            {kyc.pepDetails && <Field label="PEP Details" value={kyc.pepDetails} />}
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
                      <Icon as={FileText} boxSize={4} />
                      <Text fontSize="sm">{doc.documentType.replace(/_/g, " ")}{doc.side ? ` (${doc.side})` : ""} - {doc.fileName}</Text>
                    </HStack>
                  </ChakraLink>
                </Box>
              );
            })}
          </SimpleGrid>
        </Box>

        {/* Staff Document Upload */}
        <StaffDocumentUpload kycId={kyc.id} onUploaded={loadKyc} />

        {/* Review Audit Trail */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Review Audit Trail</Heading>
          <VStack spacing={4} align="stretch">
            <HStack spacing={3} align="flex-start">
              <Box mt={0.5} p={1} borderRadius="full" bg="blue.100">
                <Icon as={FileText} boxSize={4} color="blue.500" />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium">KYC Created</Text>
                <Text fontSize="xs" color={mutedColor}>{new Date(kyc.createdAt).toLocaleString()}</Text>
              </Box>
            </HStack>
            {kyc.submittedAt && (
              <HStack spacing={3} align="flex-start">
                <Box mt={0.5} p={1} borderRadius="full" bg="blue.100">
                  <Icon as={Clock} boxSize={4} color="blue.500" />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium">Submitted for Review</Text>
                  <Text fontSize="xs" color={mutedColor}>{new Date(kyc.submittedAt).toLocaleString()}</Text>
                </Box>
              </HStack>
            )}
            {kyc.reviews.map((review, i) => {
              const prevDate = i === 0 ? kyc.submittedAt : kyc.reviews[i - 1]?.reviewedAt;
              const elapsed = prevDate ? Math.round((new Date(review.reviewedAt).getTime() - new Date(prevDate).getTime()) / 60000) : null;
              return (
                <HStack key={review.id} spacing={3} align="flex-start">
                  <Box mt={0.5} p={1} borderRadius="full" bg={review.decision === "APPROVED" ? "green.100" : "red.100"}>
                    {review.decision === "APPROVED" ? <Icon as={CheckCircle} boxSize={4} color="green.500" /> : <Icon as={XCircle} boxSize={4} color="red.500" />}
                  </Box>
                  <Box flex={1}>
                    <HStack spacing={2}>
                      <Text fontSize="sm" fontWeight="medium">{review.reviewType} Review: {review.decision}</Text>
                      {elapsed !== null && <Text fontSize="xs" color={mutedColor}>({elapsed < 60 ? `${elapsed}m` : `${Math.round(elapsed / 60)}h ${elapsed % 60}m`} elapsed)</Text>}
                    </HStack>
                    <Text fontSize="xs" color={mutedColor}>By {review.reviewer.firstName} {review.reviewer.lastName} ({review.reviewer.role})</Text>
                    <Text fontSize="xs" color={mutedColor}>{new Date(review.reviewedAt).toLocaleString()}</Text>
                    {review.notes && <Box mt={1} p={2} bg={mutedBg} borderRadius="md" fontSize="sm">{review.notes}</Box>}
                    {review.amlReportPath && <ChakraLink href={`/api/files/${review.amlReportPath}`} isExternal fontSize="xs" color="blue.500" _hover={{ textDecoration: "underline" }}>Download AML Report</ChakraLink>}
                    <Divider mt={3} />
                  </Box>
                </HStack>
              );
            })}
          </VStack>
        </Box>

        {/* Edit History */}
        <KycHistory kycId={kyc.id} />
      </VStack>
    </Box>
  );
}
