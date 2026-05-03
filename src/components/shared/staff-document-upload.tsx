"use client";

import { useRef, useState } from "react";
import {
  Box,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";

interface StaffDocumentUploadProps {
  kycId: string;
  onUploaded?: () => void;
}

export function StaffDocumentUpload({ kycId, onUploaded }: StaffDocumentUploadProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: "Select a file first", status: "warning", duration: 3000 });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (label.trim()) fd.append("label", label.trim());
      if (notes.trim()) fd.append("notes", notes.trim());

      const res = await fetch(`/api/kyc/${kycId}/staff-documents`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      toast({ title: "Document uploaded", status: "success", duration: 3000 });
      setFile(null);
      setLabel("");
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploaded?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: message, status: "error", duration: 4000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
      <Heading size="sm" mb={4}>Upload Supporting Document</Heading>
      <Text fontSize="xs" color={mutedColor} mb={4}>
        Add a staff-uploaded document to this client&apos;s KYC file. The client will be notified.
      </Text>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>File</FormLabel>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            variant="unstyled"
            pt={1}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Text fontSize="xs" color={mutedColor} mt={1}>PDF, JPG, or PNG. Max 10MB.</Text>
        </FormControl>
        <FormControl>
          <FormLabel>Label (optional)</FormLabel>
          <Input
            placeholder="e.g. KYC Update, Source of Funds proof"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Notes (optional)</FormLabel>
          <Textarea
            placeholder="Internal notes about this upload"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormControl>
        <Button
          colorScheme="brand"
          onClick={handleSubmit}
          isLoading={submitting}
          isDisabled={!file}
          alignSelf="flex-start"
        >
          Upload
        </Button>
      </VStack>
    </Box>
  );
}
