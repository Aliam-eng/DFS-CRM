"use client";

import { useEffect, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Skeleton,
  useColorModeValue,
} from "@chakra-ui/react";

interface HistoryEntry {
  id: string;
  action: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  notes: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
}



function getActionBadgeColor(action: string, notes?: string | null): string {
  if (notes) {
    const lower = notes.toLowerCase();
    if (lower.includes("decision: approved")) return "green";
    if (lower.includes("decision: rejected")) return "red";
  }
  if (action === "SUBMITTED" || action === "RESUBMITTED") return "blue";
  if (action === "CREATED") return "gray";
  if (action === "UPDATED") return "yellow";
  if (action === "COMPLIANCE_REVIEWED" || action === "OPERATIONS_REVIEWED") return "blue";
  return "gray";
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ");
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "(empty)";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

export function KycHistory({ kycId }: { kycId: string }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const changesBg = useColorModeValue("gray.50", "gray.700");
  const oldValueColor = useColorModeValue("red.600", "red.300");
  const newValueColor = useColorModeValue("green.600", "green.300");

  useEffect(() => {
    fetch(`/api/kyc/${kycId}/history`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [kycId]);

  const toggleChanges = (id: string) => {
    setExpandedChanges((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
        <Skeleton h="20px" w="128px" mb={4} />
        <VStack spacing={3} align="stretch">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h="48px" borderRadius="md" />
          ))}
        </VStack>
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
        <Text fontSize="sm" fontWeight="semibold" mb={2}>Edit History</Text>
        <Text fontSize="sm" color={mutedColor}>No history recorded yet.</Text>
      </Box>
    );
  }

  return (
    <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
      <Text fontSize="md" fontWeight="semibold" mb={4}>Edit History</Text>
      <VStack spacing={0} align="stretch">
        {history.map((entry, index) => (
          <Box key={entry.id}>
            <HStack spacing={3} align="flex-start" py={3}>
              {/* Timeline connector */}
              <Box position="relative" minW="3px" alignSelf="stretch">
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={`${getActionBadgeColor(entry.action, entry.notes)}.400`}
                  mt={1.5}
                  mx="auto"
                />
                {index < history.length - 1 && (
                  <Box
                    position="absolute"
                    left="50%"
                    top="14px"
                    bottom="-12px"
                    w="2px"
                    bg={borderColor}
                    transform="translateX(-50%)"
                  />
                )}
              </Box>

              {/* Content */}
              <Box flex={1}>
                <HStack spacing={2} mb={1} flexWrap="wrap">
                  <Badge colorScheme={getActionBadgeColor(entry.action, entry.notes)} fontSize="xs">
                    {formatAction(entry.action)}
                  </Badge>
                  <Text fontSize="xs" color={mutedColor}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </Text>
                </HStack>

                <Text fontSize="sm" color={mutedColor}>
                  {entry.user.firstName} {entry.user.lastName}{" "}
                  <Badge variant="outline" fontSize="2xs" ml={1}>
                    {entry.user.role.replace(/_/g, " ")}
                  </Badge>
                </Text>

                {entry.notes && (
                  <Text fontSize="sm" mt={1}>
                    {entry.notes}
                  </Text>
                )}

                {entry.changes && Object.keys(entry.changes).length > 0 && (
                  <Box mt={2}>
                    <Text
                      fontSize="xs"
                      color="blue.500"
                      cursor="pointer"
                      _hover={{ textDecoration: "underline" }}
                      onClick={() => toggleChanges(entry.id)}
                    >
                      {expandedChanges.has(entry.id) ? "Hide changes" : `Show ${Object.keys(entry.changes).length} field change(s)`}
                    </Text>
                    {expandedChanges.has(entry.id) && (
                      <Box mt={2} p={3} bg={changesBg} borderRadius="md" fontSize="sm">
                        <VStack spacing={1} align="stretch">
                          {Object.entries(entry.changes).map(([field, diff]) => (
                            <HStack key={field} spacing={2} flexWrap="wrap">
                              <Text fontWeight="medium" minW="120px">{field}:</Text>
                              <Text color={oldValueColor}>{formatValue(diff.old)}</Text>
                              <Text color={mutedColor}>&rarr;</Text>
                              <Text color={newValueColor}>{formatValue(diff.new)}</Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </HStack>
            {index < history.length - 1 && <Divider />}
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
