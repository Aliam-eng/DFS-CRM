"use client";

import { useEffect, useState } from "react";
import {
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  SimpleGrid,
  Button,
  Input,
  Select,
  Icon,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ROLE_LABELS } from "@/lib/constants";
import { Plus, Edit2, Trash2, KeyRound } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDebounce } from "@/hooks/use-debounce";

interface User { id: string; email: string; firstName: string; lastName: string; phone?: string; role: string; status: string; createdAt: string }

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: "", password: "", firstName: "", lastName: "", role: "COMPLIANCE", phone: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "", status: "" });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const limit = 10;
  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const resetModal = useDisclosure();

  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search: debouncedSearch });
    if (roleFilter) params.set("role", roleFilter);
    fetch(`/api/admin/users?${params}`).then((r) => r.json()).then((d) => { setUsers(d.users || []); setTotal(d.total || 0); setLoading(false); });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUsers(); }, [roleFilter, debouncedSearch, page]);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) });
    if (!res.ok) { const d = await res.json(); setCreateError(d.error); toast({ title: "Failed", description: d.error, status: "error", duration: 3000 }); setCreating(false); return; }
    toast({ title: "User Created", description: `${newUser.firstName} ${newUser.lastName} has been created`, status: "success", duration: 3000 });
    onClose();
    setNewUser({ email: "", password: "", firstName: "", lastName: "", role: "COMPLIANCE", phone: "" });
    setCreating(false);
    fetchUsers();
  };

  const handleStatusChange = async (userId: string, status: string) => {
    await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    toast({ title: "User Updated", description: `User status changed to ${status}`, status: "success", duration: 3000 });
    fetchUsers();
  };

  const handleEditOpen = (user: User) => {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      status: user.status || "",
    });
    setEditError("");
    editModal.onOpen();
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setEditing(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setEditError(d.error);
        toast({ title: "Failed", description: d.error, status: "error", duration: 3000 });
        setEditing(false);
        return;
      }
      toast({ title: "User Updated", description: `${editForm.firstName} ${editForm.lastName} has been updated`, status: "success", duration: 3000 });
      editModal.onClose();
      setEditUser(null);
      setEditing(false);
      fetchUsers();
    } catch {
      setEditError("An unexpected error occurred");
      toast({ title: "Failed", description: "An unexpected error occurred", status: "error", duration: 3000 });
      setEditing(false);
    }
  };

  const handleDeleteOpen = (user: User) => {
    setDeleteUser(user);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: "Failed", description: d.error, status: "error", duration: 3000 });
        setDeleting(false);
        return;
      }
      toast({ title: "User Deleted", description: `${deleteUser.firstName} ${deleteUser.lastName} has been deleted`, status: "success", duration: 3000 });
      deleteModal.onClose();
      setDeleteUser(null);
      setDeleting(false);
      fetchUsers();
    } catch {
      toast({ title: "Failed", description: "An unexpected error occurred", status: "error", duration: 3000 });
      setDeleting(false);
    }
  };

  const handleResetOpen = (user: User) => {
    setResetUser(user);
    setResetPassword("");
    setResetError("");
    resetModal.onOpen();
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    if (resetPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }
    setResetting(true);
    setResetError("");
    try {
      const res = await fetch(`/api/admin/users/${resetUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPassword }),
      });
      if (!res.ok) {
        const d = await res.json();
        setResetError(d.error || "Failed to reset password");
        toast({ title: "Failed", description: d.error, status: "error", duration: 3000 });
        setResetting(false);
        return;
      }
      toast({ title: "Password Reset", description: `Password for ${resetUser.firstName} ${resetUser.lastName} has been reset`, status: "success", duration: 3000 });
      resetModal.onClose();
      setResetUser(null);
      setResetPassword("");
      setResetting(false);
    } catch {
      setResetError("An unexpected error occurred");
      toast({ title: "Failed", description: "An unexpected error occurred", status: "error", duration: 3000 });
      setResetting(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      label: "Name",
      render: (u) => <Text fontWeight="medium">{u.firstName} {u.lastName}</Text>,
    },
    {
      key: "email",
      label: "Email",
      render: (u) => <Text color={mutedColor}>{u.email}</Text>,
    },
    {
      key: "role",
      label: "Role",
      render: (u) => <StatusBadge status={u.role} />,
    },
    {
      key: "status",
      label: "Status",
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (u) => <Text fontSize="xs">{new Date(u.createdAt).toLocaleDateString()}</Text>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <HStack spacing={2} flexWrap="wrap">
          <Button size="sm" variant="outline" leftIcon={<Icon as={Edit2} boxSize={3} />} onClick={() => handleEditOpen(u)}>Edit</Button>
          {u.status === "ACTIVE" ? (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange(u.id, "SUSPENDED")}>Suspend</Button>
          ) : u.status === "SUSPENDED" ? (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange(u.id, "ACTIVE")}>Activate</Button>
          ) : null}
          <Button size="sm" variant="outline" leftIcon={<Icon as={KeyRound} boxSize={3} />} onClick={() => handleResetOpen(u)}>Reset Password</Button>
          {u.role !== "SUPER_ADMIN" && (
            <Button size="sm" variant="outline" colorScheme="red" leftIcon={<Icon as={Trash2} boxSize={3} />} onClick={() => handleDeleteOpen(u)}>Delete</Button>
          )}
        </HStack>
      ),
    },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <Flex align="center" justify="space-between">
        <Heading size="lg">User Management</Heading>
        <Button colorScheme="brand" onClick={onOpen} leftIcon={<Icon as={Plus} boxSize={4} />}>Create User</Button>
      </Flex>
      <Flex gap={4} flexWrap="wrap">
        <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value === "ALL" ? "" : e.target.value); setPage(1); }} w={{ base: "full", md: "192px" }} placeholder="All Roles">
          <option value="ALL">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} w={{ base: "full", md: "320px" }} />
      </Flex>

      <DataTable
        columns={columns}
        data={users}
        total={total}
        page={page}
        limit={limit}
        loading={loading}
        onPageChange={setPage}
      />

      {/* Create User Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Internal User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {createError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {createError}
                </Alert>
              )}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>First Name</FormLabel>
                  <Input value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel>Last Name</FormLabel>
                  <Input value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="COMPLIANCE">Compliance</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>Cancel</Button>
            <Button
              colorScheme="brand"
              onClick={handleCreate}
              isDisabled={creating || !newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName}
              isLoading={creating}
              loadingText="Creating..."
            >
              Create User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {editError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {editError}
                </Alert>
              )}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>First Name</FormLabel>
                  <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel>Last Name</FormLabel>
                  <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Role</FormLabel>
                  <Select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                    <option value="CLIENT">Client</option>
                    <option value="COMPLIANCE">Compliance</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DEACTIVATED">Deactivated</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={editModal.onClose}>Cancel</Button>
            <Button
              colorScheme="brand"
              onClick={handleEdit}
              isDisabled={editing || !editForm.email || !editForm.firstName || !editForm.lastName}
              isLoading={editing}
              loadingText="Saving..."
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => { deleteModal.onClose(); setDeleteUser(null); }}
        onConfirm={handleDelete}
        title="Delete User"
        message={deleteUser ? `Are you sure you want to delete ${deleteUser.firstName} ${deleteUser.lastName} (${deleteUser.email})? This action cannot be undone and will remove all associated data.` : ""}
        confirmText="Delete"
        colorScheme="red"
        isLoading={deleting}
      />

      {/* Reset Password Modal */}
      <Modal isOpen={resetModal.isOpen} onClose={() => { resetModal.onClose(); setResetUser(null); setResetPassword(""); setResetError(""); }} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Password{resetUser ? ` - ${resetUser.firstName} ${resetUser.lastName}` : ""}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {resetError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {resetError}
                </Alert>
              )}
              <FormControl>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={() => { resetModal.onClose(); setResetUser(null); setResetPassword(""); setResetError(""); }}>Cancel</Button>
            <Button
              colorScheme="brand"
              onClick={handleResetPassword}
              isDisabled={resetting || resetPassword.length < 6}
              isLoading={resetting}
              loadingText="Resetting..."
            >
              Reset Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
