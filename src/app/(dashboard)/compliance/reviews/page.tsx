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
  Input,
  Select,
  useColorModeValue,
} from "@chakra-ui/react";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { useDebounce } from "@/hooks/use-debounce";

interface Submission { id: string; status: string; submittedAt: string; user: { firstName: string; lastName: string; email: string } }

export default function ComplianceReviewsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [status, setStatus] = useState("SUBMITTED");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kyc?status=${status}&search=${debouncedSearch}&limit=50`)
      .then((r) => r.json())
      .then((d) => { setSubmissions(d.submissions || []); setLoading(false); });
  }, [status, debouncedSearch]);

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">KYC Reviews</Heading>
      <Flex gap={4} flexWrap="wrap">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} w={{ base: "full", md: "192px" }}>
          <option value="SUBMITTED">Pending Review</option>
          <option value="COMPLIANCE_APPROVED">Approved</option>
          <option value="COMPLIANCE_REJECTED">Rejected</option>
        </Select>
        <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} w={{ base: "full", md: "320px" }} />
      </Flex>
      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
        <Box px={5} pt={5} pb={2}>
          <Heading size="sm">Submissions ({submissions.length})</Heading>
        </Box>
        <Box px={5} pb={5}>
          {loading ? <TableSkeleton /> : submissions.length === 0 ? <Text color={mutedColor}>No submissions found.</Text> : (
            <VStack spacing={2} align="stretch">
              {submissions.map((s) => (
                <Flex key={s.id} align="center" justify="space-between" p={3} borderWidth="1px" borderColor={borderColor} borderRadius="lg" _hover={{ bg: hoverBg }} transition="background 0.2s">
                  <Box>
                    <Text fontWeight="medium">{s.user.firstName} {s.user.lastName}</Text>
                    <Text fontSize="sm" color={mutedColor}>{s.user.email}</Text>
                    {s.submittedAt && <Text fontSize="xs" color={mutedColor}>Submitted: {new Date(s.submittedAt).toLocaleString()}</Text>}
                  </Box>
                  <HStack spacing={3}>
                    <StatusBadge status={s.status} />
                    <Link href={`/compliance/reviews/${s.id}`}><Button size="sm" colorScheme="brand">Review</Button></Link>
                  </HStack>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      </Box>
    </VStack>
  );
}
