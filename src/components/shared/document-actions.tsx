"use client";

import { useRef, useState } from "react";
import {
  HStack,
  IconButton,
  Tooltip,
  Icon,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { Trash2, RefreshCw } from "lucide-react";

export function DocumentActions({
  kycId,
  docId,
  label,
  onChanged,
}: {
  kycId: string;
  docId: string;
  label: string;
  onChanged: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const pickFile = () => fileInputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/kyc/${kycId}/documents/${docId}`, {
      method: "PATCH",
      body: fd,
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      toast({ title: "Replace failed", description: err.error, status: "error", duration: 3500 });
      return;
    }
    toast({ title: `Replaced ${label}`, status: "success", duration: 2000 });
    onChanged();
  };

  const doDelete = async () => {
    setBusy(true);
    const res = await fetch(`/api/kyc/${kycId}/documents/${docId}`, { method: "DELETE" });
    setBusy(false);
    onClose();
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      toast({ title: "Delete failed", description: err.error, status: "error", duration: 3500 });
      return;
    }
    toast({ title: `Removed ${label}`, status: "success", duration: 2000 });
    onChanged();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={onFile}
        style={{ display: "none" }}
      />
      <HStack spacing={1}>
        <Tooltip label={`Replace ${label} with a new file — logged`}>
          <IconButton
            aria-label="Replace document"
            icon={<Icon as={RefreshCw} boxSize={3.5} />}
            size="xs"
            variant="ghost"
            onClick={pickFile}
            isLoading={busy}
          />
        </Tooltip>
        <Tooltip label={`Remove this ${label} — logged`}>
          <IconButton
            aria-label="Remove document"
            icon={<Icon as={Trash2} boxSize={3.5} />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={onOpen}
            isDisabled={busy}
          />
        </Tooltip>
      </HStack>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Remove {label}?</AlertDialogHeader>
            <AlertDialogBody>
              The document will be removed from the client&apos;s KYC file. The client will be notified and this action is written to the KYC history log. Continue?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
              <Button colorScheme="red" onClick={doDelete} ml={3} isLoading={busy}>
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
