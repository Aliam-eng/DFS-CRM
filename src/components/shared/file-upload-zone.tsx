"use client";

import { useRef, useState, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Icon,
  Button,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import { CloudUpload, CheckCircle, FileText, RefreshCw } from "lucide-react";

interface FileUploadZoneProps {
  label: string;
  hint?: string;
  isUploaded: boolean;
  uploadedFileName?: string;
  uploadedFileSize?: number;
  isUploading: boolean;
  accept?: string;
  onFileSelect: (file: File) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadZone({
  label,
  hint = "JPEG, PNG, or PDF. Max 10MB",
  isUploaded,
  uploadedFileName,
  uploadedFileSize,
  isUploading,
  accept = "image/*,.pdf",
  onFileSelect,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const borderDefault = useColorModeValue("gray.300", "gray.600");
  const borderDrag = "brand.500";
  const bgDefault = useColorModeValue("white", "gray.800");
  const bgDrag = useColorModeValue("brand.50", "rgba(59, 103, 190, 0.08)");
  const bgUploaded = useColorModeValue("green.50", "rgba(72, 187, 120, 0.08)");
  const iconColor = useColorModeValue("brand.300", "brand.400");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.600", "gray.300");

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleClick = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (isUploaded && !isUploading) {
    return (
      <Box
        borderWidth="2px"
        borderStyle="solid"
        borderColor="green.300"
        borderRadius="xl"
        bg={bgUploaded}
        p={5}
        textAlign="center"
      >
        <Icon as={CheckCircle} boxSize={8} color="green.500" mb={2} />
        <Text fontSize="sm" fontWeight="medium" color={textColor} mb={1}>
          {label}
        </Text>
        {uploadedFileName && (
          <Flex align="center" justify="center" gap={1.5} mb={1}>
            <Icon as={FileText} boxSize={3.5} color={mutedColor} />
            <Text fontSize="xs" color={mutedColor}>
              {uploadedFileName}
              {uploadedFileSize ? ` (${formatFileSize(uploadedFileSize)})` : ""}
            </Text>
          </Flex>
        )}
        <Button
          size="xs"
          variant="ghost"
          leftIcon={<Icon as={RefreshCw} boxSize={3} />}
          color={mutedColor}
          onClick={handleClick}
          mt={1}
        >
          Re-upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </Box>
    );
  }

  return (
    <Box
      borderWidth="2px"
      borderStyle="dashed"
      borderColor={isDragging ? borderDrag : borderDefault}
      borderRadius="xl"
      bg={isDragging ? bgDrag : bgDefault}
      p={5}
      textAlign="center"
      cursor={isUploading ? "default" : "pointer"}
      transition="all 0.2s ease"
      _hover={!isUploading ? { borderColor: "brand.400", bg: bgDrag } : undefined}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <>
          <Spinner size="md" color="brand.500" mb={2} />
          <Text fontSize="sm" color={mutedColor}>
            Uploading...
          </Text>
        </>
      ) : (
        <>
          <Icon as={CloudUpload} boxSize={10} color={iconColor} mb={2} />
          <Text fontSize="sm" fontWeight="medium" color={textColor} mb={0.5}>
            {label}
          </Text>
          <Text fontSize="xs" color={mutedColor}>
            Drag & drop or click to upload
          </Text>
          <Text fontSize="xs" color={mutedColor} mt={1}>
            {hint}
          </Text>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ display: "none" }}
      />
    </Box>
  );
}
