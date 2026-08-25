"use client";

import { useState } from "react";
import {
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";

export const INTERNAL_STATES = [
  "NEW",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "WAITING_TEAM",
  "ON_HOLD",
  "ESCALATED",
  "DONE",
] as const;

export type InternalState = typeof INTERNAL_STATES[number];

export const INTERNAL_STATE_LABELS: Record<InternalState, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  WAITING_CLIENT: "Waiting on Client",
  WAITING_TEAM: "Waiting on Team",
  ON_HOLD: "On Hold",
  ESCALATED: "Escalated",
  DONE: "Done",
};

export const INTERNAL_STATE_COLORS: Record<InternalState, string> = {
  NEW: "gray",
  IN_PROGRESS: "blue",
  WAITING_CLIENT: "orange",
  WAITING_TEAM: "purple",
  ON_HOLD: "gray",
  ESCALATED: "red",
  DONE: "green",
};

export function formatInternalState(v: string | null | undefined): string {
  if (!v) return "New";
  return INTERNAL_STATE_LABELS[v as InternalState] || v.replace(/_/g, " ");
}

export function InternalStateBadge({ value }: { value: string | null | undefined }) {
  const state = (value || "NEW") as InternalState;
  const color = INTERNAL_STATE_COLORS[state] || "gray";
  return (
    <Badge colorScheme={color} textTransform="none">
      {INTERNAL_STATE_LABELS[state] || state.replace(/_/g, " ")}
    </Badge>
  );
}

export function InternalStateSelector({
  kycId,
  value,
  onChange,
}: {
  kycId: string;
  value: string | null | undefined;
  onChange?: (next: InternalState) => void;
}) {
  const [current, setCurrent] = useState<InternalState>((value || "NEW") as InternalState);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const pick = async (next: InternalState) => {
    if (next === current) return;
    setSaving(true);
    const previous = current;
    setCurrent(next); // optimistic
    const res = await fetch(`/api/kyc/${kycId}/internal-state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalState: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      toast({ title: "Failed to update state", description: err.error, status: "error", duration: 3000 });
      setCurrent(previous); // revert
      return;
    }
    onChange?.(next);
    toast({
      title: `State set to ${INTERNAL_STATE_LABELS[next]}`,
      status: "success",
      duration: 1800,
    });
  };

  const color = INTERNAL_STATE_COLORS[current] || "gray";

  return (
    <Menu>
      <MenuButton
        as={Button}
        size="sm"
        variant="outline"
        colorScheme={color}
        rightIcon={<Icon as={ChevronDown} boxSize={4} />}
        isLoading={saving}
        loadingText="Saving..."
      >
        Internal: {INTERNAL_STATE_LABELS[current]}
      </MenuButton>
      <MenuList>
        {INTERNAL_STATES.map((s) => (
          <MenuItem key={s} onClick={() => pick(s)}>
            <Badge colorScheme={INTERNAL_STATE_COLORS[s]} mr={2} textTransform="none">
              {INTERNAL_STATE_LABELS[s]}
            </Badge>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
