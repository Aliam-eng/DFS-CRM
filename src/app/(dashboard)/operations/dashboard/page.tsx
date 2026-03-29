"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Heading,
  Text,
  VStack,
  Flex,
  SimpleGrid,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SimpleBarChart } from "@/components/shared/simple-bar-chart";
import { ClipboardCheck, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

interface MyStats { total: number; approved: number; rejected: number; avgTime: number }
interface Analytics {
  myStats: MyStats;
  weeklyTrend: { date: string; reviews: number }[];
  recentReviews: { clientName: string; decision: string; date: string }[];
}

export default function OperationsDashboard() {
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, rejectedToday: 0 });
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    fetch("/api/dashboard/stats").then((r) => r.json()).then(setStats);
    fetch("/api/dashboard/analytics").then((r) => r.json()).then(setAnalytics);
  }, []);

  const myApprovalRate = analytics?.myStats.total
    ? Math.round((analytics.myStats.approved / analytics.myStats.total) * 100)
    : 0;

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg">Operations Dashboard</Heading>
        <Text fontSize="sm" color="gray.500">Monitor your operations review activity</Text>
      </Box>

      {/* Today Stats */}
      <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide">Today</Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <StatCard label="Pending Final Approval" value={stats.pending} icon={ClipboardCheck} iconColor="gray.400" />
        <StatCard label="Approved Today" value={stats.approvedToday} icon={CheckCircle} iconColor="green.500" valueColor="green.500" />
        <StatCard label="Rejected Today" value={stats.rejectedToday} icon={XCircle} iconColor="red.500" valueColor="red.500" />
      </SimpleGrid>

      {/* My Performance Stats */}
      <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide">My Performance</Text>
      {analytics?.myStats && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard label="My Total Reviews" value={analytics.myStats.total} icon={ClipboardCheck} iconColor="blue.400" />
          <StatCard label="My Approval Rate" value={`${myApprovalRate}%`} icon={TrendingUp} iconColor="green.500" valueColor="green.500" />
          <StatCard label="My Approvals" value={analytics.myStats.approved} icon={CheckCircle} iconColor="green.500" />
          <StatCard label="Avg Turnaround" value={`${analytics.myStats.avgTime}d`} icon={Clock} iconColor="orange.400" />
        </SimpleGrid>
      )}

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Weekly Review Trend */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5}>
          <Heading size="sm" mb={4}>My Reviews This Week</Heading>
          {analytics?.weeklyTrend ? (
            <SimpleBarChart
              data={analytics.weeklyTrend.map((t) => ({
                label: t.date,
                value: t.reviews,
              }))}
              height={160}
            />
          ) : (
            <Flex h="160px" align="center" justify="center">
              <Text fontSize="sm" color={mutedColor}>Loading...</Text>
            </Flex>
          )}
        </Box>

        {/* Recent Reviews */}
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5}>
          <Heading size="sm" mb={4}>My Recent Reviews</Heading>
          {analytics?.recentReviews && analytics.recentReviews.length > 0 ? (
            <VStack spacing={2} align="stretch">
              {analytics.recentReviews.map((r, i) => (
                <Flex key={i} justify="space-between" align="center" p={3} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">{r.clientName}</Text>
                    <Text fontSize="xs" color={mutedColor}>{new Date(r.date).toLocaleString()}</Text>
                  </Box>
                  <StatusBadge status={r.decision} />
                </Flex>
              ))}
            </VStack>
          ) : (
            <Text fontSize="sm" color={mutedColor}>No reviews yet</Text>
          )}
        </Box>
      </SimpleGrid>

      <Box>
        <Link href="/operations/reviews">
          <Button colorScheme="brand">View All Reviews</Button>
        </Link>
      </Box>
    </VStack>
  );
}
