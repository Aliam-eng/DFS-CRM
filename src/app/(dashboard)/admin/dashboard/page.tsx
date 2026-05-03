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
  SimpleGrid,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
} from "@chakra-ui/react";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SimpleBarChart } from "@/components/shared/simple-bar-chart";
import { AdminDashboardSkeleton } from "@/components/shared/loading-skeletons";
import { Users, FileText, ClipboardCheck, CheckCircle, TrendingUp, Clock } from "lucide-react";

interface Stats {
  totalClients: number;
  totalKycs: number;
  totalUsers: number;
  kycByStatus: { draft: number; submitted: number; complianceApproved: number; complianceRejected: number; opsApproved: number; opsRejected: number };
}

interface Analytics {
  kycTrend: { date: string; count: number }[];
  approvalRate: { approved: number; rejected: number; pending: number };
  avgTurnaround: { compliance: number; operations: number };
  topReviewers: { name: string; role: string; reviews: number; approved: number; rejected: number }[];
  recentReviews: { clientName: string; reviewer: string; decision: string; reviewType: string; date: string }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    fetch("/api/dashboard/stats").then((r) => r.json()).then(setStats);
    fetch("/api/dashboard/analytics").then((r) => r.json()).then(setAnalytics);
  }, []);

  if (!stats) return <AdminDashboardSkeleton />;

  const totalDecided = (analytics?.approvalRate.approved || 0) + (analytics?.approvalRate.rejected || 0);
  const approvalPct = totalDecided > 0 ? Math.round((analytics!.approvalRate.approved / totalDecided) * 100) : 0;

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Admin Dashboard</Heading>

      {/* Stat Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <StatCard label="Total Clients" value={stats.totalClients} icon={Users} iconColor="gray.400" />
        <StatCard label="Total KYC" value={stats.totalKycs} icon={FileText} iconColor="gray.400" />
        <StatCard label="Pending Operations" value={stats.kycByStatus.submitted} icon={ClipboardCheck} iconColor="yellow.500" valueColor="yellow.500" />
        <StatCard label="Pending Compliance" value={stats.kycByStatus.opsApproved} icon={CheckCircle} iconColor="blue.500" valueColor="blue.500" />
      </SimpleGrid>

      {/* Approval Rate + Turnaround */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <StatCard label="Approval Rate" value={`${approvalPct}%`} icon={TrendingUp} iconColor="green.500" valueColor="green.500" />
        <StatCard label="Total Approved" value={analytics?.approvalRate.approved || 0} icon={CheckCircle} iconColor="green.500" />
        <StatCard label="Avg Compliance Time" value={`${analytics?.avgTurnaround.compliance || 0}d`} icon={Clock} iconColor="orange.400" />
        <StatCard label="Avg Operations Time" value={`${analytics?.avgTurnaround.operations || 0}d`} icon={Clock} iconColor="blue.400" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* KYC Submissions Trend */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>KYC Submissions (Last 30 Days)</Heading>
          {analytics?.kycTrend && analytics.kycTrend.length > 0 ? (
            <SimpleBarChart
              data={analytics.kycTrend.slice(-15).map((t) => ({
                label: t.date.slice(5),
                value: t.count,
              }))}
              height={180}
            />
          ) : (
            <Flex h="180px" align="center" justify="center">
              <Text fontSize="sm" color={mutedColor}>No submissions in the last 30 days</Text>
            </Flex>
          )}
        </Box>

        {/* KYC Breakdown */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>KYC Pipeline</Heading>
          <VStack spacing={2} align="stretch" fontSize="sm">
            <Flex justify="space-between"><Text>Draft</Text><Text fontWeight="medium">{stats.kycByStatus.draft}</Text></Flex>
            <Flex justify="space-between"><Text>Pending Operations</Text><Text fontWeight="medium" color="yellow.500">{stats.kycByStatus.submitted}</Text></Flex>
            <Flex justify="space-between"><Text>Pending Compliance</Text><Text fontWeight="medium" color="orange.500">{stats.kycByStatus.opsApproved}</Text></Flex>
            <Flex justify="space-between"><Text>Ops Rejected</Text><Text fontWeight="medium" color="red.500">{stats.kycByStatus.opsRejected}</Text></Flex>
            <Flex justify="space-between"><Text>Fully Approved</Text><Text fontWeight="medium" color="green.500">{stats.kycByStatus.complianceApproved}</Text></Flex>
            <Flex justify="space-between"><Text>Compliance Rejected</Text><Text fontWeight="medium" color="red.500">{stats.kycByStatus.complianceRejected}</Text></Flex>
          </VStack>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Recent Reviews */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Recent Reviews</Heading>
          {analytics?.recentReviews && analytics.recentReviews.length > 0 ? (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Client</Th>
                    <Th>Reviewer</Th>
                    <Th>Type</Th>
                    <Th>Decision</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {analytics.recentReviews.slice(0, 5).map((r, i) => (
                    <Tr key={i}>
                      <Td fontSize="xs">{r.clientName}</Td>
                      <Td fontSize="xs">{r.reviewer}</Td>
                      <Td fontSize="xs">{r.reviewType}</Td>
                      <Td><StatusBadge status={r.decision} /></Td>
                      <Td fontSize="xs">{new Date(r.date).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Text fontSize="sm" color={mutedColor}>No reviews yet</Text>
          )}
        </Box>

        {/* Top Reviewers */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <Heading size="sm" mb={4}>Top Reviewers</Heading>
          {analytics?.topReviewers && analytics.topReviewers.length > 0 ? (
            <VStack spacing={3} align="stretch">
              {analytics.topReviewers.map((r, i) => (
                <Flex key={i} justify="space-between" align="center" p={3} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">{r.name}</Text>
                    <Text fontSize="xs" color={mutedColor}>{r.role}</Text>
                  </Box>
                  <HStack spacing={3}>
                    <Box textAlign="center">
                      <Text fontSize="xs" color={mutedColor}>Reviews</Text>
                      <Text fontSize="sm" fontWeight="bold">{r.reviews}</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="xs" color="green.500">Approved</Text>
                      <Text fontSize="sm" fontWeight="bold" color="green.500">{r.approved}</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="xs" color="red.500">Rejected</Text>
                      <Text fontSize="sm" fontWeight="bold" color="red.500">{r.rejected}</Text>
                    </Box>
                  </HStack>
                </Flex>
              ))}
            </VStack>
          ) : (
            <Text fontSize="sm" color={mutedColor}>No reviewers yet</Text>
          )}
        </Box>
      </SimpleGrid>

      <Box>
        <Link href="/admin/kyc">
          <Button colorScheme="brand">View All KYC Submissions</Button>
        </Link>
      </Box>
    </VStack>
  );
}
