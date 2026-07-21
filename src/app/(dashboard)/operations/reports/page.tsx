"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Input,
  FormControl,
  FormLabel,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Download, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { formatDateTime } from "@/lib/date";

interface ClientRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  userStatus: string;
  emailVerified: boolean;
  kycStatus: string;
  createdAt: string;
  submittedAt: string | null;
}

export default function ReportsPage() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const iso = (d: Date) => d.toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(iso(monthAgo));
  const [dateTo, setDateTo] = useState(iso(today));
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const headBg = useColorModeValue("gray.50", "gray.900");

  const runReport = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (search) params.set("search", search);
    fetch(`/api/reports/clients?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast({ title: "Failed to load report", description: d.error, status: "error", duration: 4000 });
          setClients([]);
        } else {
          setClients(d.clients || []);
        }
        setLoading(false);
      })
      .catch((e) => {
        toast({ title: "Failed to load report", description: String(e), status: "error", duration: 4000 });
        setLoading(false);
      });
  };

  useEffect(() => {
    runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = () => {
    if (clients.length === 0) return;
    const params = new URLSearchParams({ format: "csv" });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (search) params.set("search", search);
    window.location.href = `/api/reports/clients?${params.toString()}`;
  };

  return (
    <VStack spacing={6} align="stretch">
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="lg">Client Reports</Heading>
          <Text fontSize="sm" color={mutedColor} mt={1}>
            Filter registered clients by date range and export name, email, phone, KYC status, and registration date.
          </Text>
        </Box>
        <HStack spacing={2}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Icon as={RefreshCw} boxSize={4} />}
            onClick={runReport}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button
            colorScheme="brand"
            size="sm"
            leftIcon={<Icon as={Download} boxSize={4} />}
            onClick={handleExport}
            isDisabled={loading || clients.length === 0}
          >
            Export CSV
          </Button>
        </HStack>
      </Flex>

      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
        <Flex gap={4} flexWrap="wrap" align="flex-end">
          <FormControl w={{ base: "full", md: "200px" }}>
            <FormLabel fontSize="sm">Date from (registered)</FormLabel>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </FormControl>
          <FormControl w={{ base: "full", md: "200px" }}>
            <FormLabel fontSize="sm">Date to (registered)</FormLabel>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </FormControl>
          <FormControl w={{ base: "full", md: "260px" }}>
            <FormLabel fontSize="sm">Search (name / email / phone)</FormLabel>
            <Input placeholder="Optional filter..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </FormControl>
          <Button colorScheme="brand" onClick={runReport} isLoading={loading}>
            Run Report
          </Button>
        </Flex>
      </Box>

      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
        <Flex px={5} pt={4} pb={3} align="center" justify="space-between">
          <Heading size="sm">Results ({clients.length})</Heading>
          {clients.length > 0 && (
            <Text fontSize="xs" color={mutedColor}>
              Showing clients registered between {dateFrom} and {dateTo}
            </Text>
          )}
        </Flex>
        <Box overflowX="auto">
          {loading ? (
            <Box p={5}><TableSkeleton /></Box>
          ) : clients.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color={mutedColor}>No clients found in this date range.</Text>
            </Box>
          ) : (
            <Table size="sm">
              <Thead bg={headBg}>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>User Status</Th>
                  <Th>KYC Status</Th>
                  <Th>Registered At</Th>
                  <Th>Submitted At</Th>
                </Tr>
              </Thead>
              <Tbody>
                {clients.map((c) => (
                  <Tr key={c.id}>
                    <Td fontWeight="medium">{c.name}</Td>
                    <Td fontSize="xs">{c.email}</Td>
                    <Td fontSize="xs">{c.phone || "-"}</Td>
                    <Td>
                      <Badge colorScheme={c.userStatus === "ACTIVE" ? "green" : c.userStatus === "SUSPENDED" ? "red" : "gray"}>
                        {c.userStatus}
                      </Badge>
                    </Td>
                    <Td>
                      {c.kycStatus === "NO_KYC" ? (
                        <Badge>NO KYC</Badge>
                      ) : (
                        <StatusBadge status={c.kycStatus} />
                      )}
                    </Td>
                    <Td fontSize="xs">{formatDateTime(c.createdAt)}</Td>
                    <Td fontSize="xs">{c.submittedAt ? formatDateTime(c.submittedAt) : "-"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Box>
    </VStack>
  );
}
