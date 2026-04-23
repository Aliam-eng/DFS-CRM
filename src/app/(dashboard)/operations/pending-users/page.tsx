"use client";

import { useEffect, useState, useCallback } from "react";
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
  Badge,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { UserCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { useDebounce } from "@/hooks/use-debounce";

interface PendingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function PendingUsersPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [toActivate, setToActivate] = useState<PendingUser | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/operations/pending-users?filter=${filter}&search=${debouncedSearch}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [filter, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleActivate = async () => {
    if (!toActivate) return;
    setActivating(toActivate.id);
    const res = await fetch(`/api/operations/pending-users/${toActivate.id}/activate`, {
      method: "POST",
    });
    setActivating(null);
    setToActivate(null);
    if (!res.ok) {
      const d = await res.json();
      toast({ title: "Activation Failed", description: d.error, status: "error", duration: 3000 });
      return;
    }
    toast({ title: "User activated", status: "success", duration: 3000 });
    fetchUsers();
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg">Client Activations</Heading>
        <Text color={mutedColor} mt={1}>Review new sign-ups and activate verified clients.</Text>
      </Box>

      <Flex gap={4} flexWrap="wrap">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} w={{ base: "full", md: "240px" }}>
          <option value="PENDING">Pending Activation</option>
          <option value="ALL">All Clients</option>
        </Select>
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          w={{ base: "full", md: "320px" }}
        />
      </Flex>

      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden">
        <Box px={5} pt={5} pb={2}>
          <Heading size="sm">Clients ({users.length})</Heading>
        </Box>
        <Box px={5} pb={5}>
          {loading ? (
            <TableSkeleton />
          ) : users.length === 0 ? (
            <Text color={mutedColor}>No clients found.</Text>
          ) : (
            <VStack spacing={2} align="stretch">
              {users.map((u) => {
                const isPending = u.status === "PENDING_VERIFICATION";
                return (
                  <Flex
                    key={u.id}
                    align="center"
                    justify="space-between"
                    p={3}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    _hover={{ bg: hoverBg }}
                    transition="background 0.2s"
                  >
                    <Box>
                      <Text fontWeight="medium">
                        {u.firstName} {u.lastName}
                      </Text>
                      <Text fontSize="sm" color={mutedColor}>
                        {u.email}
                        {u.phone ? ` · ${u.phone}` : ""}
                      </Text>
                      <HStack spacing={2} mt={1}>
                        <Badge colorScheme={u.emailVerified ? "green" : "orange"} fontSize="xs">
                          {u.emailVerified ? "Email verified" : "Email unverified"}
                        </Badge>
                        <Text fontSize="xs" color={mutedColor}>
                          Joined {new Date(u.createdAt).toLocaleString()}
                        </Text>
                      </HStack>
                    </Box>
                    <HStack spacing={3}>
                      <Badge
                        colorScheme={u.status === "ACTIVE" ? "green" : u.status === "PENDING_VERIFICATION" ? "orange" : "gray"}
                        fontSize="xs"
                        fontWeight="600"
                        borderRadius="full"
                        px={2.5}
                        py={0.5}
                      >
                        {u.status.replace(/_/g, " ")}
                      </Badge>
                      {isPending && (
                        <Button
                          size="sm"
                          colorScheme="brand"
                          leftIcon={<UserCheck size={16} />}
                          isLoading={activating === u.id}
                          isDisabled={!u.emailVerified}
                          onClick={() => setToActivate(u)}
                          title={u.emailVerified ? "Activate account" : "Waiting for email verification"}
                        >
                          Activate
                        </Button>
                      )}
                    </HStack>
                  </Flex>
                );
              })}
            </VStack>
          )}
        </Box>
      </Box>

      <ConfirmDialog
        isOpen={!!toActivate}
        onClose={() => setToActivate(null)}
        onConfirm={handleActivate}
        title="Activate Client Account"
        message={
          toActivate
            ? `Activate ${toActivate.firstName} ${toActivate.lastName}? They will be able to log in and start their KYC application.`
            : ""
        }
        confirmText="Activate"
        cancelText="Cancel"
        colorScheme="green"
        isLoading={activating !== null}
      />
    </VStack>
  );
}
