"use client";

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Flex,
  Text,
  Select,
  Button,
  Skeleton,
  useColorModeValue,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useState } from "react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  emptyMessage?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  total,
  page = 1,
  limit = 10,
  loading = false,
  onPageChange,
  onLimitChange,
  onSort,
  emptyMessage = "No data found.",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("gray.50", "gray.900");
  const evenRowBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const thColor = useColorModeValue("gray.600", "gray.400");

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(newDir);
    onSort?.(key, newDir);
  };

  const totalPages = total ? Math.ceil(total / limit) : 1;

  if (loading) {
    return (
      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              {columns.map((col) => (
                <Th key={col.key}>{col.label}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {Array.from({ length: limit > 5 ? 5 : limit }).map((_, i) => (
              <Tr key={i}>
                {columns.map((col) => (
                  <Td key={col.key}>
                    <Skeleton h="16px" w="80%" />
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500" fontSize="md">
          {emptyMessage}
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="xl">
        <Table variant="simple" size="sm">
          <Thead bg={headerBg}>
            <Tr>
              {columns.map((col) => (
                <Th
                  key={col.key}
                  cursor={col.sortable ? "pointer" : "default"}
                  onClick={() => col.sortable && handleSort(col.key)}
                  userSelect="none"
                  fontSize="xs"
                  fontWeight="600"
                  color={thColor}
                  textTransform="none"
                  letterSpacing="normal"
                >
                  <HStack spacing={1}>
                    <Text>{col.label}</Text>
                    {col.sortable && sortKey === col.key && (
                      <Icon
                        as={sortDir === "asc" ? ChevronUpIcon : ChevronDownIcon}
                        boxSize={4}
                      />
                    )}
                  </HStack>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((item, idx) => (
              <Tr key={(item.id as string) || idx} _even={{ bg: evenRowBg }}>
                {columns.map((col) => (
                  <Td key={col.key} fontSize="sm" py={3}>
                    {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination */}
      {total !== undefined && total > 0 && (
        <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={3} direction={{ base: "column", md: "row" }}>
          <HStack spacing={2}>
            <Text fontSize="sm" color="gray.500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </Text>
            {onLimitChange && (
              <Select
                size="sm"
                w="80px"
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Select>
            )}
          </HStack>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              borderRadius="md"
              isDisabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              Previous
            </Button>
            <Text fontSize="sm" color="gray.500">
              Page {page} of {totalPages}
            </Text>
            <Button
              size="sm"
              variant="outline"
              borderRadius="md"
              isDisabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </Box>
  );
}
