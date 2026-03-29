"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Stack,
  Flex,
  Button,
  Badge,
  Icon,
  Input,
  FormControl,
  FormLabel,
  Spinner,
  Divider,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { User, Lock, Save } from "lucide-react";

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const labelColor = useColorModeValue("gray.600", "gray.300");
  const readOnlyBg = useColorModeValue("gray.50", "gray.700");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhone(data.phone || "");
    } catch {
      toast({
        title: "Error",
        description: "Failed to load profile",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }
      const updated = await res.json();
      setProfile(updated);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update profile",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "All password fields are required",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 6 characters",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully",
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to change password",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box maxW="2xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Heading size="lg">My Profile</Heading>

        {/* Profile Info Card */}
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          overflow="hidden"
        >
          <Box px={5} pt={5} pb={2}>
            <HStack spacing={2}>
              <Icon as={User} boxSize={5} />
              <Heading size="sm">Profile Information</Heading>
              {profile?.role && (
                <Badge colorScheme="blue" ml={2}>
                  {profile.role.replace(/_/g, " ")}
                </Badge>
              )}
            </HStack>
            {profile?.createdAt && (
              <Text fontSize="xs" color={mutedColor} mt={1}>
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </Text>
            )}
          </Box>
          <Box px={5} pb={5} pt={3}>
            <VStack spacing={4} align="stretch">
              <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" color={labelColor}>
                    First Name
                  </FormLabel>
                  <Input
                    size="md"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color={labelColor}>
                    Last Name
                  </FormLabel>
                  <Input
                    size="md"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </FormControl>
              </Stack>
              <FormControl>
                <FormLabel fontSize="sm" color={labelColor}>
                  Email
                </FormLabel>
                <Input size="md" value={profile?.email || ""} isReadOnly bg={readOnlyBg} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={labelColor}>
                  Phone
                </FormLabel>
                <Input
                  size="md"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </FormControl>
              <Flex justify="flex-end">
                <Button
                  colorScheme="blue"
                  size="md"
                  leftIcon={<Icon as={Save} boxSize={4} />}
                  onClick={handleSaveProfile}
                  isLoading={isSaving}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </Flex>
            </VStack>
          </Box>
        </Box>

        {/* Change Password Card */}
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          overflow="hidden"
        >
          <Box px={5} pt={5} pb={2}>
            <HStack spacing={2}>
              <Icon as={Lock} boxSize={5} />
              <Heading size="sm">Change Password</Heading>
            </HStack>
          </Box>
          <Divider borderColor={borderColor} />
          <Box px={5} pb={5} pt={4}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontSize="sm" color={labelColor}>
                  Current Password
                </FormLabel>
                <Input
                  type="password"
                  size="md"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={labelColor}>
                  New Password
                </FormLabel>
                <Input
                  type="password"
                  size="md"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={labelColor}>
                  Confirm New Password
                </FormLabel>
                <Input
                  type="password"
                  size="md"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </FormControl>
              <Flex justify="flex-end">
                <Button
                  colorScheme="blue"
                  size="md"
                  leftIcon={<Icon as={Lock} boxSize={4} />}
                  onClick={handleChangePassword}
                  isLoading={isChangingPassword}
                  loadingText="Changing..."
                >
                  Change Password
                </Button>
              </Flex>
            </VStack>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
}
