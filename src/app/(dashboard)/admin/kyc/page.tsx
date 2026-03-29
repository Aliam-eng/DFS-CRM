"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Icon,
  FormControl,
  FormLabel,
  useColorModeValue,
} from "@chakra-ui/react";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { KYC_STATUS_LABELS } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { Download } from "lucide-react";

interface Submission { id: string; status: string; submittedAt: string; createdAt: string; user: { firstName: string; lastName: string; email: string }; reviews: { reviewType: string; decision: string; reviewedAt: string; reviewer: { firstName: string; lastName: string } }[] }

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const limit = 10;
  const debouncedSearch = useDebounce(search, 300);

  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search: debouncedSearch });
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    fetch(`/api/kyc?${params}`).then((r) => r.json()).then((d) => {
      setSubmissions(d.submissions || []);
      setTotal(d.total || 0);
      setLoading(false);
    });
  }, [status, debouncedSearch, page, dateFrom, dateTo]);

  const handleExportCSV = async () => {
    setExporting(true);
    const params = new URLSearchParams({ limit: "10000", search: debouncedSearch });
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await fetch(`/api/kyc?${params}`);
    const data = await res.json();
    const rows: string[][] = [["Client Name", "Email", "Status", "Submitted Date", "Compliance Decision", "Compliance Reviewer", "Compliance Date", "Operations Decision", "Operations Reviewer", "Operations Date"]];

    (data.submissions || []).forEach((s: Submission) => {
      const comp = s.reviews?.find((r) => r.reviewType === "COMPLIANCE");
      const ops = s.reviews?.find((r) => r.reviewType === "OPERATIONS");
      rows.push([
        `${s.user.firstName} ${s.user.lastName}`,
        s.user.email,
        KYC_STATUS_LABELS[s.status as keyof typeof KYC_STATUS_LABELS] || s.status,
        s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "-",
        comp?.decision || "-",
        comp ? `${comp.reviewer.firstName} ${comp.reviewer.lastName}` : "-",
        comp ? new Date(comp.reviewedAt).toLocaleDateString() : "-",
        ops?.decision || "-",
        ops ? `${ops.reviewer.firstName} ${ops.reviewer.lastName}` : "-",
        ops ? new Date(ops.reviewedAt).toLocaleDateString() : "-",
      ]);
    });

    const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kyc-submissions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const columns: Column<Submission>[] = [
    {
      key: "client",
      label: "Client",
      render: (s) => (
        <Box>
          <Text fontWeight="medium">{s.user.firstName} {s.user.lastName}</Text>
        </Box>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (s) => <Text color={mutedColor}>{s.user.email}</Text>,
    },
    {
      key: "status",
      label: "Status",
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: "submittedAt",
      label: "Submitted",
      render: (s) => <Text fontSize="xs">{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "-"}</Text>,
    },
    {
      key: "compliance",
      label: "Compliance",
      render: (s) => {
        const compReview = s.reviews?.find((r) => r.reviewType === "COMPLIANCE");
        return <Text fontSize="xs">{compReview ? `${compReview.decision} by ${compReview.reviewer.firstName} (${new Date(compReview.reviewedAt).toLocaleDateString()})` : "-"}</Text>;
      },
    },
    {
      key: "operations",
      label: "Operations",
      render: (s) => {
        const opsReview = s.reviews?.find((r) => r.reviewType === "OPERATIONS");
        return <Text fontSize="xs">{opsReview ? `${opsReview.decision} by ${opsReview.reviewer.firstName} (${new Date(opsReview.reviewedAt).toLocaleDateString()})` : "-"}</Text>;
      },
    },
    {
      key: "action",
      label: "Action",
      render: (s) => (
        <Link href={`/admin/kyc/${s.id}`}>
          <Button size="sm" variant="outline">View</Button>
        </Link>
      ),
    },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <Flex align="center" justify="space-between">
        <Heading size="lg">All KYC Submissions</Heading>
        <Button variant="outline" onClick={handleExportCSV} isDisabled={exporting} isLoading={exporting} loadingText="Exporting..." leftIcon={<Icon as={Download} boxSize={4} />}>
          Export CSV
        </Button>
      </Flex>
      <Flex gap={4} flexWrap="wrap" align="flex-end">
        <Select value={status} onChange={(e) => { setStatus(e.target.value === "ALL" ? "" : e.target.value); setPage(1); }} w={{ base: "full", md: "208px" }} placeholder="All Statuses">
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="COMPLIANCE_APPROVED">Compliance Approved</option>
          <option value="COMPLIANCE_REJECTED">Compliance Rejected</option>
          <option value="OPERATIONS_APPROVED">Fully Approved</option>
          <option value="OPERATIONS_REJECTED">Ops Rejected</option>
        </Select>
        <Input placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} w={{ base: "full", md: "320px" }} />
        <HStack spacing={2} align="flex-end">
          <FormControl w="160px">
            <FormLabel fontSize="xs" color={mutedColor} mb={1}>From</FormLabel>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} size="sm" />
          </FormControl>
          <FormControl w="160px">
            <FormLabel fontSize="xs" color={mutedColor} mb={1}>To</FormLabel>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} size="sm" />
          </FormControl>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}>Clear</Button>
          )}
        </HStack>
      </Flex>

      <DataTable
        columns={columns}
        data={submissions}
        total={total}
        page={page}
        limit={limit}
        loading={loading}
        onPageChange={setPage}
        emptyMessage="No submissions found."
      />
    </VStack>
  );
}
