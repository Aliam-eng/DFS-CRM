"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Icon,
  Badge,
  Divider,
  Skeleton,
  useColorModeValue,
} from "@chakra-ui/react";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { KycHistory } from "@/components/shared/kyc-history";
import { generateKycPdf } from "@/lib/kyc-pdf";
import { CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react";

interface Review { id: string; reviewType: string; decision: string; notes?: string; amlReportPath?: string; reviewedAt: string; reviewer: { firstName: string; lastName: string; role: string } }
interface KycData { id: string; status: string; submittedAt?: string; createdAt: string; reviews: Review[]; documents: { id: string; documentType: string; fileName: string; side?: string }[] }

export default function KycStatusPage() {
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResubmitConfirm, setShowResubmitConfirm] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const mutedBg = useColorModeValue("gray.100", "gray.700");

  useEffect(() => {
    fetch("/api/kyc").then((r) => r.json()).then((d) => {
      if (d.submissions?.length > 0) {
        fetch(`/api/kyc/${d.submissions[0].id}`).then((r) => r.json()).then(setKyc);
      }
      setLoading(false);
    });
  }, []);

  const handleResubmit = async () => {
    if (!kyc) return;
    await fetch(`/api/kyc/${kyc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: undefined }) });
    window.location.href = "/client/kyc";
  };

  if (loading) return (
    <Box maxW="3xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Skeleton h="36px" w="256px" borderRadius="md" />
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Flex align="center" justify="space-between" mb={4}>
            <Skeleton h="20px" w="128px" />
            <Skeleton h="24px" w="96px" borderRadius="full" />
          </Flex>
          <VStack spacing={4} align="stretch">
            {[1, 2, 3].map((i) => (
              <HStack key={i} spacing={3} align="flex-start">
                <Skeleton h="32px" w="32px" borderRadius="full" />
                <Box>
                  <Skeleton h="16px" w="160px" mb={1} />
                  <Skeleton h="12px" w="96px" />
                </Box>
              </HStack>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );

  if (!kyc) return (
    <Box textAlign="center" py={12}>
      <Text color={mutedColor} mb={4}>No KYC application found.</Text>
      <Link href="/client/kyc"><Button colorScheme="brand">Start KYC Application</Button></Link>
    </Box>
  );

  const isRejected = kyc.status === "COMPLIANCE_REJECTED" || kyc.status === "OPERATIONS_REJECTED";

  return (
    <Box maxW="3xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Flex align="center" justify="space-between">
          <Heading size="lg">KYC Application Status</Heading>
          <Button size="sm" variant="outline" leftIcon={<Icon as={Download} boxSize={4} />} onClick={() => generateKycPdf(kyc as unknown as import("@/types/kyc").KycDetail).save(`KYC-${kyc.id}.pdf`)}>
            Export PDF
          </Button>
        </Flex>

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <Box px={5} pt={5} pb={2}>
            <Flex align="center" justify="space-between">
              <Heading size="sm">Current Status</Heading>
              <StatusBadge status={kyc.status} />
            </Flex>
          </Box>
          <Box px={5} pb={5}>
            <VStack spacing={4} align="stretch" mt={2}>
              <TimelineItem icon={<Icon as={FileText} boxSize={4} />} title="Application Created" date={new Date(kyc.createdAt).toLocaleString()} status="done" />
              {kyc.submittedAt && <TimelineItem icon={<Icon as={Clock} boxSize={4} />} title="Submitted for Review" date={new Date(kyc.submittedAt).toLocaleString()} status="done" />}

              {kyc.reviews.map((review) => (
                <Box key={review.id}>
                  <TimelineItem
                    icon={review.decision === "APPROVED" ? <Icon as={CheckCircle} boxSize={4} color="green.500" /> : <Icon as={XCircle} boxSize={4} color="red.500" />}
                    title={`${review.reviewType === "COMPLIANCE" ? "Compliance" : "Operations"} Review: ${review.decision}`}
                    date={new Date(review.reviewedAt).toLocaleString()}
                    status={review.decision === "APPROVED" ? "done" : "rejected"}
                  />
                  {review.notes && (
                    <Box ml={8} mt={1} p={3} bg={mutedBg} borderRadius="md" fontSize="sm">
                      <Text as="strong">Notes:</Text> {review.notes}
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>

            {isRejected && (
              <>
                <Divider my={4} />
                <Flex justify="center">
                  <Button colorScheme="brand" onClick={() => setShowResubmitConfirm(true)}>Edit &amp; Resubmit</Button>
                </Flex>
              </>
            )}
          </Box>
        </Box>

        <ConfirmDialog
          isOpen={showResubmitConfirm}
          onClose={() => setShowResubmitConfirm(false)}
          onConfirm={handleResubmit}
          title="Confirm Resubmission"
          message="This will reopen your KYC application for editing. You can update your information and documents before resubmitting for review. Are you sure you want to proceed?"
          confirmText="Yes, Edit & Resubmit"
          cancelText="Cancel"
        />

        {/* Edit History */}
        <KycHistory kycId={kyc.id} />

        {/* Documents */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <Box px={5} pt={5} pb={2}>
            <Heading size="sm">Uploaded Documents</Heading>
          </Box>
          <Box px={5} pb={5}>
            {kyc.documents.length === 0 ? <Text fontSize="sm" color={mutedColor}>No documents</Text> : (
              <VStack spacing={2} align="stretch">
                {kyc.documents.map((doc) => (
                  <Flex key={doc.id} align="center" justify="space-between" p={2} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                    <HStack spacing={2}>
                      <Icon as={FileText} boxSize={4} color={mutedColor} />
                      <Text fontSize="sm">{doc.fileName}</Text>
                      <Badge variant="outline" fontSize="xs">{doc.documentType.replace(/_/g, " ")}{doc.side ? ` (${doc.side})` : ""}</Badge>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
        </Box>
      </VStack>
    </Box>
  );
}

function TimelineItem({ icon, title, date, status }: { icon: React.ReactNode; title: string; date: string; status: string }) {
  const doneBg = useColorModeValue("green.50", "green.900");
  const rejectedBg = useColorModeValue("red.50", "red.900");
  const defaultBg = useColorModeValue("gray.100", "gray.700");

  const bg = status === "done" ? doneBg : status === "rejected" ? rejectedBg : defaultBg;

  return (
    <HStack spacing={3} align="flex-start">
      <Box mt={0.5} p={1} borderRadius="full" bg={bg}>{icon}</Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium">{title}</Text>
        <Text fontSize="xs" color="gray.500">{date}</Text>
      </Box>
    </HStack>
  );
}
