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
import { ShieldCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { useDebounce } from "@/hooks/use-debounce";

interface ClientUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function ClientVerificationPage() {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [target, setTarget] = useState<ClientUser | null>(null);
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

  const handleVerify = async () => {
    if (!target) return;
    setBusyId(target.id);
    const res = await fetch(`/api/operations/pending-users/${target.id}/activate`, {
      method: "POST",
    });
    setBusyId(null);
    setTarget(null);
    if (!res.ok) {
      const d = await res.json();
      toast({ title: "Verification failed", description: d.error, status: "error", duration: 3000 });
      return;
    }
    toast({ title: "User verified", status: "success", duration: 3000 });
    fetchUsers();
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg">Client Verification</Heading>
        <Text color={mutedColor} mt={1}>
          Manually verify and activate clients who cannot receive their OTP email.
        </Text>
      </Box>

      <Flex gap={4} flexWrap="wrap">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} w={{ base: "full", md: "260px" }}>
          <option value="PENDING">Pending Verification</option>
          <option value="SUSPENDED">Suspended / Deactivated</option>
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
                const needsAction = !u.emailVerified || u.status !== "ACTIVE";
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
                        <Badge
                          colorScheme={u.status === "ACTIVE" ? "green" : u.status === "PENDING_VERIFICATION" ? "orange" : "gray"}
                          fontSize="xs"
                        >
                          {u.status.replace(/_/g, " ")}
                        </Badge>
                        <Text fontSize="xs" color={mutedColor}>
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </Text>
                      </HStack>
                    </Box>
                    <HStack spacing={3}>
                      {needsAction && (
                        <Button
                          size="sm"
                          colorScheme="brand"
                          leftIcon={<ShieldCheck size={16} />}
                          isLoading={busyId === u.id}
                          onClick={() => setTarget(u)}
                        >
                          {u.emailVerified ? "Activate" : "Verify Email"}
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
        isOpen={!!target}
        onClose={() => setTarget(null)}
        onConfirm={handleVerify}
        title={target?.emailVerified ? "Activate Client" : "Verify Client Email"}
        message={
          target
            ? target.emailVerified
              ? `Reactivate ${target.firstName} ${target.lastName}? They will be able to log in immediately.`
              : `Mark ${target.firstName} ${target.lastName}'s email (${target.email}) as verified? This bypasses the OTP verification step and keeps the account active.`
            : ""
        }
        confirmText={target?.emailVerified ? "Activate" : "Verify Email"}
        cancelText="Cancel"
        colorScheme="green"
        isLoading={busyId !== null}
      />
    </VStack>
  );
}
