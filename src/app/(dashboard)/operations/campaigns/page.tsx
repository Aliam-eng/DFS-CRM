"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Input,
  Textarea,
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
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Copy, Plus, RefreshCw } from "lucide-react";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { formatDateTime } from "@/lib/date";

interface Campaign {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  signupCount: number;
  creator: string;
  creatorRole: string;
}

const MANAGE_ROLES = ["OPERATIONS", "ADMIN", "SUPER_ADMIN"];

export default function CampaignsPage() {
  const { data: session } = useSession();
  const canManage = session?.user?.role ? MANAGE_ROLES.includes(session.user.role as string) : false;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const headBg = useColorModeValue("gray.50", "gray.900");
  const codeBg = useColorModeValue("gray.100", "gray.700");

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const load = () => {
    setLoading(true);
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast({ title: "Failed to load campaigns", description: d.error, status: "error", duration: 3000 });
          setCampaigns([]);
        } else {
          setCampaigns(d.campaigns || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildLink = (code: string) => `${origin}/register?ref=${code}`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", status: "success", duration: 1500 });
    } catch {
      toast({ title: "Copy failed", status: "error", duration: 2000 });
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", status: "warning", duration: 2000 });
      return;
    }
    setCreating(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() }),
    });
    setCreating(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to create" }));
      toast({ title: "Create failed", description: err.error, status: "error", duration: 3000 });
      return;
    }
    const data = await res.json();
    setForm({ name: "", description: "" });
    onClose();
    toast({
      title: "Campaign created",
      description: `Code: ${data.campaign.code} — link ready to share`,
      status: "success",
      duration: 3500,
    });
    load();
  };

  const handleToggle = async (c: Campaign) => {
    const res = await fetch(`/api/campaigns/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      toast({ title: "Update failed", description: err.error, status: "error", duration: 3000 });
      return;
    }
    load();
  };

  return (
    <VStack spacing={6} align="stretch">
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="lg">Referral Campaigns</Heading>
          <Text fontSize="sm" color={mutedColor} mt={1}>
            Create a shareable link for each partner / marketing channel. Anyone signing up through it is attached to the campaign so you can filter reports by source.
          </Text>
        </Box>
        <HStack spacing={2}>
          <Button variant="outline" size="sm" leftIcon={<Icon as={RefreshCw} boxSize={4} />} onClick={load} isLoading={loading}>
            Refresh
          </Button>
          {canManage && (
            <Button colorScheme="brand" size="sm" leftIcon={<Icon as={Plus} boxSize={4} />} onClick={onOpen}>
              New Campaign
            </Button>
          )}
        </HStack>
      </Flex>

      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
        <Box overflowX="auto">
          {loading ? (
            <Box p={5}><TableSkeleton /></Box>
          ) : campaigns.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color={mutedColor}>No campaigns yet. Create one to start tracking sign-ups by referral link.</Text>
            </Box>
          ) : (
            <Table size="sm">
              <Thead bg={headBg}>
                <Tr>
                  <Th>Name</Th>
                  <Th>Code</Th>
                  <Th>Description</Th>
                  <Th>Sign-ups</Th>
                  <Th>Created By</Th>
                  <Th>Created At</Th>
                  <Th>Link</Th>
                  <Th>Active</Th>
                </Tr>
              </Thead>
              <Tbody>
                {campaigns.map((c) => (
                  <Tr key={c.id} opacity={c.active ? 1 : 0.55}>
                    <Td fontWeight="medium">{c.name}</Td>
                    <Td>
                      <Text as="code" bg={codeBg} px={2} py={0.5} borderRadius="md" fontSize="xs">{c.code}</Text>
                    </Td>
                    <Td fontSize="xs" maxW="260px" whiteSpace="normal">{c.description || "-"}</Td>
                    <Td>
                      <Badge colorScheme={c.signupCount > 0 ? "green" : "gray"}>{c.signupCount}</Badge>
                    </Td>
                    <Td fontSize="xs">
                      {c.creator}
                      {c.creatorRole && <Text as="span" color={mutedColor}> ({c.creatorRole})</Text>}
                    </Td>
                    <Td fontSize="xs">{formatDateTime(c.createdAt)}</Td>
                    <Td>
                      <Button
                        size="xs"
                        variant="outline"
                        leftIcon={<Icon as={Copy} boxSize={3} />}
                        onClick={() => copy(buildLink(c.code))}
                        isDisabled={!c.active}
                      >
                        Copy Link
                      </Button>
                    </Td>
                    <Td>
                      {canManage ? (
                        <Switch isChecked={c.active} onChange={() => handleToggle(c)} colorScheme="green" size="sm" />
                      ) : (
                        <Badge colorScheme={c.active ? "green" : "gray"}>{c.active ? "Active" : "Inactive"}</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Campaign</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="e.g. Nayef partnership, Instagram July"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={120}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description / Why this campaign</FormLabel>
                <Textarea
                  placeholder="Notes about who this link is for and why (visible to staff only)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  maxLength={2000}
                />
              </FormControl>
              <Text fontSize="xs" color={mutedColor}>
                The system will auto-generate a short code and shareable URL. You can copy it from the table.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={creating}>Cancel</Button>
            <Button colorScheme="brand" onClick={handleCreate} isLoading={creating} isDisabled={!form.name.trim()}>
              Create Campaign
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
