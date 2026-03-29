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
  Icon,
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
import { Users, FileText, Shield, Settings, TrendingUp, Clock } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";

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
  usersByRole: Record<string, number>;
}

export default function SuperAdminDashboard() {
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

  const roleColors: Record<string, string> = {
    CLIENT: "blue.400",
    COMPLIANCE: "orange.400",
    OPERATIONS: "purple.400",
    ADMIN: "teal.400",
    SUPER_ADMIN: "red.400",
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg">Super Admin Dashboard</Heading>
        <Text fontSize="sm" color="gray.500">System-wide overview and management</Text>
      </Box>

      {/* Stat Cards */}
      <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide">Overview</Text>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} iconColor="gray.400" />
        <StatCard label="Total Clients" value={stats.totalClients} icon={Users} iconColor="blue.400" />
        <StatCard label="Total KYC" value={stats.totalKycs} icon={FileText} iconColor="gray.400" />
        <StatCard label="Fully Approved" value={stats.kycByStatus.opsApproved} icon={Shield} iconColor="green.500" valueColor="green.500" />
        <StatCard label="Approval Rate" value={`${approvalPct}%`} icon={TrendingUp} iconColor="green.500" valueColor="green.500" />
      </SimpleGrid>

      {/* Turnaround */}
      <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide">Performance</Text>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <StatCard label="Avg Compliance Turnaround" value={`${analytics?.avgTurnaround.compliance || 0} days`} icon={Clock} iconColor="orange.400" />
        <StatCard label="Avg Operations Turnaround" value={`${analytics?.avgTurnaround.operations || 0} days`} icon={Clock} iconColor="blue.400" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* KYC Trend */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5}>
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

        {/* Users by Role */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5}>
          <Heading size="sm" mb={4}>Users by Role</Heading>
          {analytics?.usersByRole ? (
            <SimpleBarChart
              data={Object.entries(analytics.usersByRole).map(([role, count]) => ({
                label: (ROLE_LABELS as Record<string, string>)[role] || role,
                value: count,
                color: roleColors[role] || "gray.400",
              }))}
              height={180}
            />
          ) : (
            <Flex h="180px" align="center" justify="center">
              <Text fontSize="sm" color={mutedColor}>Loading...</Text>
            </Flex>
          )}
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* KYC Pipeline */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5}>
          <Heading size="sm" mb={4}>KYC Pipeline</Heading>
          <VStack spacing={2} align="stretch" fontSize="sm">
            <Flex justify="space-between"><Text>Draft</Text><Text>{stats.kycByStatus.draft}</Text></Flex>
            <Flex justify="space-between"><Text>Pending Compliance</Text><Text color="yellow.500">{stats.kycByStatus.submitted}</Text></Flex>
            <Flex justify="space-between"><Text>Pending Operations</Text><Text color="blue.500">{stats.kycByStatus.complianceApproved}</Text></Flex>
            <Flex justify="space-between"><Text>Approved</Text><Text color="green.500">{stats.kycByStatus.opsApproved}</Text></Flex>
            <Flex justify="space-between"><Text>Rejected (Compliance)</Text><Text color="red.500">{stats.kycByStatus.complianceRejected}</Text></Flex>
            <Flex justify="space-between"><Text>Rejected (Operations)</Text><Text color="red.500">{stats.kycByStatus.opsRejected}</Text></Flex>
          </VStack>
        </Box>

        {/* Recent Reviews */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5}>
          <Heading size="sm" mb={4}>Recent Reviews</Heading>
          {analytics?.recentReviews && analytics.recentReviews.length > 0 ? (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Client</Th>
                    <Th>Reviewer</Th>
                    <Th>Decision</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {analytics.recentReviews.slice(0, 5).map((r, i) => (
                    <Tr key={i}>
                      <Td fontSize="sm">{r.clientName}</Td>
                      <Td fontSize="sm">{r.reviewer}</Td>
                      <Td><StatusBadge status={r.decision} /></Td>
                      <Td fontSize="sm">{new Date(r.date).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Text fontSize="sm" color={mutedColor}>No reviews yet</Text>
          )}
        </Box>
      </SimpleGrid>

      {/* Top Reviewers */}
      {analytics?.topReviewers && analytics.topReviewers.length > 0 && (
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5}>
          <Heading size="sm" mb={4}>Top Reviewers</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
            {analytics.topReviewers.map((r, i) => (
              <Flex key={i} justify="space-between" align="center" p={3} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                <Box>
                  <Text fontSize="sm" fontWeight="medium">{r.name}</Text>
                  <Text fontSize="xs" color={mutedColor}>{r.role}</Text>
                </Box>
                <HStack spacing={3}>
                  <Box textAlign="center">
                    <Text fontSize="xs" color={mutedColor}>Total</Text>
                    <Text fontSize="sm" fontWeight="bold">{r.reviews}</Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="xs" color="green.500">OK</Text>
                    <Text fontSize="sm" fontWeight="bold" color="green.500">{r.approved}</Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="xs" color="red.500">Rej</Text>
                    <Text fontSize="sm" fontWeight="bold" color="red.500">{r.rejected}</Text>
                  </Box>
                </HStack>
              </Flex>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Quick Actions */}
      <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide">Quick Actions</Text>
      <Flex gap={4} flexWrap="wrap">
        <Link href="/super-admin/users">
          <Button variant="outline" leftIcon={<Icon as={Users} boxSize={4} />}>Manage Users</Button>
        </Link>
        <Link href="/super-admin/kyc">
          <Button variant="outline" leftIcon={<Icon as={FileText} boxSize={4} />}>All KYC</Button>
        </Link>
        <Link href="/super-admin/settings">
          <Button variant="outline" leftIcon={<Icon as={Settings} boxSize={4} />}>Settings</Button>
        </Link>
      </Flex>
    </VStack>
  );
}
