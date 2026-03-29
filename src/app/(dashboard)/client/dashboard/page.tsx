"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  Button,
  Icon,
  Skeleton,
  VStack,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileText, ArrowRight, CheckCircle, XCircle, Clock } from "lucide-react";

export default function ClientDashboard() {
  const [kyc, setKyc] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => { setKyc(d.kyc); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <VStack spacing={6} align="stretch">
      <Skeleton h="36px" w="192px" borderRadius="md" />
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Skeleton h="20px" w="128px" mb={3} />
          <VStack spacing={3} align="stretch">
            <Skeleton h="16px" w="192px" />
            <Skeleton h="16px" w="128px" />
            <Skeleton h="40px" w="160px" borderRadius="md" />
          </VStack>
        </Box>
      </SimpleGrid>
    </VStack>
  );

  const status = kyc?.status as string | undefined;

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg">My Dashboard</Heading>
        <Text fontSize="sm" color="gray.500">Track your KYC application progress</Text>
      </Box>
      <Box maxW="2xl" mx="auto" w="full">
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" shadow="sm" overflow="hidden">
          <Box px={5} pt={5} pb={2}>
            <HStack spacing={2}>
              <Icon as={FileText} boxSize={5} />
              <Heading size="sm">KYC Status</Heading>
            </HStack>
          </Box>
          <Box px={5} pb={5}>
            {!kyc ? (
              <VStack spacing={4} align="flex-start">
                <Text color={mutedColor}>You haven&apos;t started your KYC application yet.</Text>
                <Link href="/client/kyc">
                  <Button colorScheme="brand" size="md" rightIcon={<Icon as={ArrowRight} boxSize={4} />}>
                    Start KYC Application
                  </Button>
                </Link>
              </VStack>
            ) : (
              <VStack spacing={4} align="flex-start">
                <HStack spacing={2}>
                  <Text fontSize="sm" color={mutedColor}>Current Status:</Text>
                  <StatusBadge status={status || ""} />
                </HStack>
                {status === "DRAFT" && (
                  <Link href="/client/kyc">
                    <Button colorScheme="brand" size="md" rightIcon={<Icon as={ArrowRight} boxSize={4} />}>
                      Continue KYC
                    </Button>
                  </Link>
                )}
                {status === "OPERATIONS_APPROVED" && (
                  <HStack spacing={2} color="green.500">
                    <Icon as={CheckCircle} boxSize={5} />
                    <Text fontWeight="medium">Your KYC is fully approved!</Text>
                  </HStack>
                )}
                {(status === "COMPLIANCE_REJECTED" || status === "OPERATIONS_REJECTED") && (
                  <VStack spacing={2} align="flex-start">
                    <HStack spacing={2} color="red.500">
                      <Icon as={XCircle} boxSize={5} />
                      <Text fontWeight="medium">Your KYC was rejected</Text>
                    </HStack>
                    <Link href="/client/kyc/status">
                      <Button variant="outline">View Details &amp; Resubmit</Button>
                    </Link>
                  </VStack>
                )}
                {(status === "SUBMITTED" || status === "COMPLIANCE_APPROVED") && (
                  <HStack spacing={2} color="yellow.500">
                    <Icon as={Clock} boxSize={5} />
                    <Text>Under review...</Text>
                  </HStack>
                )}
                <Link href="/client/kyc/status">
                  <Button variant="ghost" size="sm" rightIcon={<Icon as={ArrowRight} boxSize={3} />}>
                    View Full Status
                  </Button>
                </Link>
              </VStack>
            )}
          </Box>
        </Box>
      </Box>
    </VStack>
  );
}
