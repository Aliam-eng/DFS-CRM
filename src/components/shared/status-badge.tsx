"use client";

import { Badge } from "@chakra-ui/react";
import { KYC_STATUS_LABELS } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "gray",
  SUBMITTED: "blue",
  COMPLIANCE_APPROVED: "teal",
  COMPLIANCE_REJECTED: "red",
  OPERATIONS_APPROVED: "green",
  OPERATIONS_REJECTED: "red",
  ACTIVE: "green",
  SUSPENDED: "orange",
  PENDING_VERIFICATION: "orange",
  DEACTIVATED: "gray",
  APPROVED: "green",
  REJECTED: "red",
  CLIENT: "blue",
  COMPLIANCE: "purple",
  OPERATIONS: "teal",
  ADMIN: "orange",
  SUPER_ADMIN: "red",
};

export function StatusBadge({ status }: { status: string }) {
  const colorScheme = STATUS_COLORS[status] || "gray";
  const label = KYC_STATUS_LABELS[status as keyof typeof KYC_STATUS_LABELS] || status.replace(/_/g, " ");

  return (
    <Badge colorScheme={colorScheme} fontSize="xs" fontWeight="600" borderRadius="full" px={2.5} py={0.5}>
      {label}
    </Badge>
  );
}
