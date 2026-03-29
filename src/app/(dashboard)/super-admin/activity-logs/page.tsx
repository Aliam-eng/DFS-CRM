"use client";

import { useEffect, useState } from "react";
import {
  Heading,
  Text,
  VStack,
  Flex,
  Input,
  useColorModeValue,
} from "@chakra-ui/react";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDebounce } from "@/hooks/use-debounce";

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    fetch(`/api/admin/activity-logs?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || []);
        setTotal(d.total || 0);
        setLoading(false);
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(); }, [debouncedSearch, page, limit]);

  const columns: Column<ActivityLog>[] = [
    {
      key: "user",
      label: "User",
      render: (log) => (
        <VStack align="start" spacing={0}>
          <Text fontWeight="medium">{log.user.firstName} {log.user.lastName}</Text>
          <Text fontSize="xs" color={mutedColor}>{log.user.email}</Text>
        </VStack>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (log) => <StatusBadge status={log.action} />,
    },
    {
      key: "details",
      label: "Details",
      render: (log) => (
        <Text fontSize="sm" maxW="300px" noOfLines={2}>
          {log.details || "-"}
        </Text>
      ),
    },
    {
      key: "ipAddress",
      label: "IP Address",
      render: (log) => (
        <Text fontSize="sm" color={mutedColor}>
          {log.ipAddress || "-"}
        </Text>
      ),
    },
    {
      key: "createdAt",
      label: "Date/Time",
      render: (log) => (
        <Text fontSize="xs">
          {new Date(log.createdAt).toLocaleString()}
        </Text>
      ),
    },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <Flex align="center" justify="space-between">
        <Heading size="lg">Activity Logs</Heading>
      </Flex>
      <Flex gap={4} flexWrap="wrap">
        <Input
          placeholder="Search by action or details..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          w={{ base: "full", md: "320px" }}
        />
      </Flex>

      <DataTable
        columns={columns}
        data={logs}
        total={total}
        page={page}
        limit={limit}
        loading={loading}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </VStack>
  );
}
