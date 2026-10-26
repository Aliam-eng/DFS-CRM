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
  Select,
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
  Code,
  Alert,
  AlertIcon,
  Collapse,
  IconButton,
} from "@chakra-ui/react";
import { Plus, RefreshCw, Trash2, Copy, Send, ChevronDown, ChevronUp } from "lucide-react";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { formatDateTime } from "@/lib/date";

interface Webhook {
  id: string;
  name: string;
  url: string;
  event: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  deliveryCount: number;
  lastDelivery: { success: boolean; responseStatus: number | null; attemptedAt: string } | null;
}

interface Delivery {
  id: string;
  event: string;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  success: boolean;
  attemptedAt: string;
  durationMs: number | null;
  payload: unknown;
}

const EVENT_LABELS: Record<string, string> = {
  KYC_FINAL_APPROVED: "KYC Final Approved (Compliance → Approve)",
};

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", url: "", event: "KYC_FINAL_APPROVED" });
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<{ name: string; secret: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const headBg = useColorModeValue("gray.50", "gray.900");
  const codeBg = useColorModeValue("gray.100", "gray.700");

  const load = () => {
    setLoading(true);
    fetch("/api/webhooks")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast({ title: "Failed to load", description: d.error, status: "error", duration: 3000 });
          setWebhooks([]);
        } else setWebhooks(d.webhooks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", status: "success", duration: 1500 });
    } catch {
      toast({ title: "Copy failed", status: "error", duration: 2000 });
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      toast({ title: "Name + URL required", status: "warning", duration: 2000 });
      return;
    }
    setCreating(true);
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), url: form.url.trim(), event: form.event }),
    });
    setCreating(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      toast({ title: "Create failed", description: err.error, status: "error", duration: 3000 });
      return;
    }
    const data = await res.json();
    onClose();
    setCreatedSecret({ name: data.webhook.name, secret: data.webhook.secret });
    setForm({ name: "", url: "", event: "KYC_FINAL_APPROVED" });
    load();
  };

  const handleToggle = async (w: Webhook) => {
    const res = await fetch(`/api/webhooks/${w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !w.active }),
    });
    if (!res.ok) {
      toast({ title: "Update failed", status: "error", duration: 2500 });
      return;
    }
    load();
  };

  const handleDelete = async (w: Webhook) => {
    if (!confirm(`Delete webhook "${w.name}"? This also removes its delivery history.`)) return;
    const res = await fetch(`/api/webhooks/${w.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "Delete failed", status: "error", duration: 2500 });
      return;
    }
    toast({ title: "Deleted", status: "success", duration: 2000 });
    load();
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setLoadingDeliveries(true);
    const res = await fetch(`/api/webhooks/${id}`);
    const d = await res.json();
    setDeliveries(d.webhook?.deliveries || []);
    setLoadingDeliveries(false);
  };

  const handleResend = async (deliveryId: string) => {
    const res = await fetch(`/api/webhooks/deliveries/${deliveryId}/resend`, { method: "POST" });
    if (!res.ok) {
      toast({ title: "Resend failed", status: "error", duration: 2500 });
      return;
    }
    toast({ title: "Resent", status: "success", duration: 1800 });
    if (expandedId) toggleExpand(expandedId); // reload deliveries by closing + reopening
    setTimeout(() => expandedId && toggleExpand(expandedId), 100);
  };

  return (
    <VStack spacing={6} align="stretch">
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="lg">Outbound Webhooks</Heading>
          <Text fontSize="sm" color={mutedColor} mt={1}>
            Fire a signed JSON POST to an external URL when a KYC lifecycle event occurs. Only Super Admin can manage.
          </Text>
        </Box>
        <HStack spacing={2}>
          <Button variant="outline" size="sm" leftIcon={<Icon as={RefreshCw} boxSize={4} />} onClick={load} isLoading={loading}>Refresh</Button>
          <Button colorScheme="brand" size="sm" leftIcon={<Icon as={Plus} boxSize={4} />} onClick={onOpen}>New Webhook</Button>
        </HStack>
      </Flex>

      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
        <Box overflowX="auto">
          {loading ? (
            <Box p={5}><TableSkeleton /></Box>
          ) : webhooks.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color={mutedColor}>No webhooks configured. Click &quot;New Webhook&quot; to subscribe an external system to KYC events.</Text>
            </Box>
          ) : (
            <Table size="sm">
              <Thead bg={headBg}>
                <Tr>
                  <Th w={6}></Th>
                  <Th>Name</Th>
                  <Th>Event</Th>
                  <Th>URL</Th>
                  <Th>Last Delivery</Th>
                  <Th>Count</Th>
                  <Th>Active</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {webhooks.map((w) => (
                  <>
                    <Tr key={w.id} opacity={w.active ? 1 : 0.55}>
                      <Td>
                        <IconButton
                          aria-label="Toggle deliveries"
                          size="xs"
                          variant="ghost"
                          icon={<Icon as={expandedId === w.id ? ChevronUp : ChevronDown} boxSize={3.5} />}
                          onClick={() => toggleExpand(w.id)}
                        />
                      </Td>
                      <Td fontWeight="medium">{w.name}</Td>
                      <Td><Badge colorScheme="purple" fontSize="xs">{EVENT_LABELS[w.event] || w.event}</Badge></Td>
                      <Td fontSize="xs" maxW="260px" isTruncated>{w.url}</Td>
                      <Td fontSize="xs">
                        {w.lastDelivery ? (
                          <HStack>
                            <Badge colorScheme={w.lastDelivery.success ? "green" : "red"}>
                              {w.lastDelivery.success ? "OK" : "FAIL"}
                            </Badge>
                            {w.lastDelivery.responseStatus != null && <Text>{w.lastDelivery.responseStatus}</Text>}
                            <Text color={mutedColor}>{formatDateTime(w.lastDelivery.attemptedAt)}</Text>
                          </HStack>
                        ) : <Text color={mutedColor}>Never</Text>}
                      </Td>
                      <Td>{w.deliveryCount}</Td>
                      <Td><Switch isChecked={w.active} onChange={() => handleToggle(w)} colorScheme="green" size="sm" /></Td>
                      <Td>
                        <IconButton
                          aria-label="Delete webhook"
                          icon={<Icon as={Trash2} boxSize={3.5} />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(w)}
                        />
                      </Td>
                    </Tr>
                    <Tr key={`${w.id}-deliveries`}>
                      <Td colSpan={8} p={0}>
                        <Collapse in={expandedId === w.id} animateOpacity>
                          <Box p={4} bg={headBg}>
                            <Heading size="xs" mb={3}>Last 50 Deliveries</Heading>
                            {loadingDeliveries ? (
                              <Text fontSize="xs" color={mutedColor}>Loading...</Text>
                            ) : deliveries.length === 0 ? (
                              <Text fontSize="xs" color={mutedColor}>No deliveries yet.</Text>
                            ) : (
                              <Table size="sm" variant="simple">
                                <Thead>
                                  <Tr>
                                    <Th>Attempted</Th>
                                    <Th>Status</Th>
                                    <Th>Response</Th>
                                    <Th>Duration</Th>
                                    <Th></Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {deliveries.map((d) => (
                                    <Tr key={d.id}>
                                      <Td fontSize="xs">{formatDateTime(d.attemptedAt)}</Td>
                                      <Td>
                                        <Badge colorScheme={d.success ? "green" : "red"}>
                                          {d.success ? "OK" : "FAIL"}
                                          {d.responseStatus != null ? ` ${d.responseStatus}` : ""}
                                        </Badge>
                                      </Td>
                                      <Td fontSize="xs" maxW="300px" isTruncated color={d.success ? mutedColor : "red.500"}>
                                        {d.errorMessage || d.responseBody || "-"}
                                      </Td>
                                      <Td fontSize="xs">{d.durationMs != null ? `${d.durationMs}ms` : "-"}</Td>
                                      <Td>
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          leftIcon={<Icon as={Send} boxSize={3} />}
                                          onClick={() => handleResend(d.id)}
                                        >
                                          Resend
                                        </Button>
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            )}
                          </Box>
                        </Collapse>
                      </Td>
                    </Tr>
                  </>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Box>

      {/* Create modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Webhook</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input placeholder="e.g. GIV Trade onboarding" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>URL</FormLabel>
                <Input placeholder="https://api.example.com/kyc-approved" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Event</FormLabel>
                <Select value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })}>
                  {Object.entries(EVENT_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </Select>
              </FormControl>
              <Alert status="info" fontSize="xs" borderRadius="md">
                <AlertIcon />
                A unique HMAC secret will be generated and shown once after creation. Store it in your receiving service to verify the <Code mx={1}>X-DFS-Signature</Code> header.
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={creating}>Cancel</Button>
            <Button colorScheme="brand" onClick={handleCreate} isLoading={creating}>Create</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Secret-shown-once modal */}
      <Modal isOpen={!!createdSecret} onClose={() => setCreatedSecret(null)} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Webhook created — save the secret now</ModalHeader>
          <ModalBody>
            <Alert status="warning" borderRadius="md" mb={4} fontSize="sm">
              <AlertIcon />
              This secret is shown ONLY ONCE. Copy it now and store it in your receiving system. If lost, you must delete and recreate the webhook.
            </Alert>
            <Text fontSize="sm" fontWeight="bold" mb={2}>{createdSecret?.name}</Text>
            <Box bg={codeBg} p={3} borderRadius="md" fontSize="xs" fontFamily="mono" wordBreak="break-all">
              {createdSecret?.secret}
            </Box>
            <Button mt={3} size="sm" leftIcon={<Icon as={Copy} boxSize={4} />} onClick={() => createdSecret && copy(createdSecret.secret)}>
              Copy Secret
            </Button>
            <Text fontSize="xs" color={mutedColor} mt={4}>
              Your service verifies signatures by:
              <br />
              <Code fontSize="xs" display="block" whiteSpace="pre-wrap" p={2} mt={1}>{`const expected = 'sha256=' + crypto\n  .createHmac('sha256', WEBHOOK_SECRET)\n  .update(rawRequestBody)\n  .digest('hex');\nreturn req.headers['x-dfs-signature'] === expected;`}</Code>
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" onClick={() => setCreatedSecret(null)}>I&apos;ve saved it</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
