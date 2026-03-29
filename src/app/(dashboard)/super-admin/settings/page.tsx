"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Divider,
  Button,
  Icon,
  Spinner,
  Badge,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  Settings,
  Database,
  Mail,
  Users,
  Activity,
  Server,
  FileText,
  Bell,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SystemStats {
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  kyc: {
    total: number;
    byStatus: Record<string, number>;
  };
  totalDocuments: number;
  totalNotifications: number;
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Clients",
  COMPLIANCE: "Compliance",
  OPERATIONS: "Operations",
  ADMIN: "Admins",
  SUPER_ADMIN: "Super Admins",
};

const KYC_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  COMPLIANCE_APPROVED: "Compliance Approved",
  COMPLIANCE_REJECTED: "Compliance Rejected",
  OPERATIONS_APPROVED: "Operations Approved",
  OPERATIONS_REJECTED: "Operations Rejected",
};

const KYC_STATUS_COLORS: Record<string, string> = {
  DRAFT: "gray",
  SUBMITTED: "blue",
  COMPLIANCE_APPROVED: "teal",
  COMPLIANCE_REJECTED: "red",
  OPERATIONS_APPROVED: "green",
  OPERATIONS_REJECTED: "orange",
};

export default function SettingsPage() {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const subtleBg = useColorModeValue("gray.50", "gray.700");

  const router = useRouter();
  const toast = useToast();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/system-stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch {
      toast({
        title: "Error loading system stats",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedUsers() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      if (!res.ok) throw new Error("Seed failed");
      toast({
        title: "Demo users seeded successfully",
        status: "success",
        duration: 3000,
      });
      fetchStats();
    } catch {
      toast({
        title: "Seed failed or endpoint not available",
        status: "warning",
        duration: 3000,
      });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack spacing={3}>
        <Icon as={Settings} boxSize={6} />
        <Heading size="lg">System Settings</Heading>
      </HStack>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* System Information */}
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
          shadow="sm"
        >
          <HStack spacing={2} mb={4}>
            <Icon as={Server} boxSize={5} color="blue.500" />
            <Heading size="sm">System Information</Heading>
          </HStack>
          <Divider mb={4} />
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Text color={mutedColor} fontSize="sm">Platform</Text>
              <Text fontWeight="semibold">DFS CRM</Text>
            </HStack>
            <HStack justify="space-between">
              <Text color={mutedColor} fontSize="sm">Version</Text>
              <Badge colorScheme="blue" variant="subtle">v2.0.0</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text color={mutedColor} fontSize="sm">Environment</Text>
              <Badge colorScheme="green" variant="subtle">Production</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text color={mutedColor} fontSize="sm">Next.js</Text>
              <Text fontWeight="semibold">14.2.35</Text>
            </HStack>
            <HStack justify="space-between">
              <Text color={mutedColor} fontSize="sm">Database</Text>
              <Text fontWeight="semibold">PostgreSQL</Text>
            </HStack>
          </VStack>
        </Box>

        {/* SMTP Configuration */}
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
          shadow="sm"
        >
          <HStack spacing={2} mb={4}>
            <Icon as={Mail} boxSize={5} color="purple.500" />
            <Heading size="sm">SMTP Configuration</Heading>
          </HStack>
          <Divider mb={4} />
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Text color={mutedColor} fontSize="sm">SMTP Configured</Text>
              <Badge colorScheme="green" variant="subtle">Yes</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text color={mutedColor} fontSize="sm">SMTP Host</Text>
              <Text fontWeight="semibold" fontSize="sm">smtp.******.com</Text>
            </HStack>
            <HStack justify="space-between">
              <Text color={mutedColor} fontSize="sm">SMTP Port</Text>
              <Text fontWeight="semibold">587</Text>
            </HStack>
            <HStack justify="space-between">
              <Text color={mutedColor} fontSize="sm">Auth Method</Text>
              <Text fontWeight="semibold">Credentials</Text>
            </HStack>
            <HStack justify="space-between">
              <Text color={mutedColor} fontSize="sm">TLS</Text>
              <Badge colorScheme="green" variant="subtle">Enabled</Badge>
            </HStack>
          </VStack>
        </Box>

        {/* Database Statistics */}
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
          shadow="sm"
          gridColumn={{ lg: "span 2" }}
        >
          <HStack spacing={2} mb={4}>
            <Icon as={Database} boxSize={5} color="teal.500" />
            <Heading size="sm">Database Statistics</Heading>
          </HStack>
          <Divider mb={4} />

          {loading ? (
            <HStack justify="center" py={8}>
              <Spinner size="lg" color="teal.500" />
              <Text color={mutedColor}>Loading statistics...</Text>
            </HStack>
          ) : stats ? (
            <VStack align="stretch" spacing={5}>
              {/* Summary row */}
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <Box bg={subtleBg} p={4} borderRadius="md" textAlign="center">
                  <Icon as={Users} boxSize={5} color="blue.500" mb={1} />
                  <Text fontSize="2xl" fontWeight="bold">{stats.users.total}</Text>
                  <Text fontSize="xs" color={mutedColor}>Total Users</Text>
                </Box>
                <Box bg={subtleBg} p={4} borderRadius="md" textAlign="center">
                  <Icon as={FileText} boxSize={5} color="teal.500" mb={1} />
                  <Text fontSize="2xl" fontWeight="bold">{stats.kyc.total}</Text>
                  <Text fontSize="xs" color={mutedColor}>KYC Submissions</Text>
                </Box>
                <Box bg={subtleBg} p={4} borderRadius="md" textAlign="center">
                  <Icon as={Shield} boxSize={5} color="orange.500" mb={1} />
                  <Text fontSize="2xl" fontWeight="bold">{stats.totalDocuments}</Text>
                  <Text fontSize="xs" color={mutedColor}>Documents</Text>
                </Box>
                <Box bg={subtleBg} p={4} borderRadius="md" textAlign="center">
                  <Icon as={Bell} boxSize={5} color="purple.500" mb={1} />
                  <Text fontSize="2xl" fontWeight="bold">{stats.totalNotifications}</Text>
                  <Text fontSize="xs" color={mutedColor}>Notifications</Text>
                </Box>
              </SimpleGrid>

              {/* Users by role */}
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={2}>Users by Role</Text>
                <SimpleGrid columns={{ base: 2, md: 5 }} spacing={2}>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <HStack
                      key={role}
                      bg={subtleBg}
                      px={3}
                      py={2}
                      borderRadius="md"
                      justify="space-between"
                    >
                      <Text fontSize="xs" color={mutedColor}>{label}</Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {stats.users.byRole[role] || 0}
                      </Text>
                    </HStack>
                  ))}
                </SimpleGrid>
              </Box>

              {/* KYC by status */}
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={2}>KYC by Status</Text>
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                  {Object.entries(KYC_STATUS_LABELS).map(([status, label]) => (
                    <HStack
                      key={status}
                      bg={subtleBg}
                      px={3}
                      py={2}
                      borderRadius="md"
                      justify="space-between"
                    >
                      <Badge
                        colorScheme={KYC_STATUS_COLORS[status] || "gray"}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {label}
                      </Badge>
                      <Text fontSize="sm" fontWeight="bold">
                        {stats.kyc.byStatus[status] || 0}
                      </Text>
                    </HStack>
                  ))}
                </SimpleGrid>
              </Box>
            </VStack>
          ) : (
            <Text color={mutedColor}>Failed to load statistics.</Text>
          )}
        </Box>

        {/* Quick Actions */}
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
          shadow="sm"
          gridColumn={{ lg: "span 2" }}
        >
          <HStack spacing={2} mb={4}>
            <Icon as={Activity} boxSize={5} color="orange.500" />
            <Heading size="sm">Quick Actions</Heading>
          </HStack>
          <Divider mb={4} />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Button
              leftIcon={<Icon as={Users} boxSize={4} />}
              colorScheme="blue"
              variant="outline"
              onClick={() => router.push("/super-admin/users")}
            >
              User Management
            </Button>
            <Button
              leftIcon={<Icon as={Activity} boxSize={4} />}
              colorScheme="teal"
              variant="outline"
              onClick={() => router.push("/super-admin/activity-logs")}
            >
              Activity Logs
            </Button>
            <Button
              leftIcon={<Icon as={Database} boxSize={4} />}
              colorScheme="purple"
              variant="outline"
              isLoading={seeding}
              loadingText="Seeding..."
              onClick={handleSeedUsers}
            >
              Seed Demo Users
            </Button>
          </SimpleGrid>
        </Box>
      </SimpleGrid>
    </VStack>
  );
}
