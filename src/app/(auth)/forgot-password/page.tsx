"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Box,
  Flex,
  HStack,
  PinInput,
  PinInputField,
  Link as ChakraLink,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const errorBg = useColorModeValue("red.50", "red.900");
  const errorColor = useColorModeValue("red.600", "red.200");
  const successBg = useColorModeValue("green.50", "green.900");
  const successColor = useColorModeValue("green.700", "green.200");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const linkColor = useColorModeValue("brand.600", "brand.300");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        setLoading(false);
        return;
      }
      toast({
        title: "Code Sent",
        description: "Check your email for the reset code",
        status: "success",
        duration: 3000,
      });
      setStep("code");
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
      toast({
        title: "Password Reset",
        description: "Your password has been reset successfully",
        status: "success",
        duration: 3000,
      });
      setStep("done");
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  };

  const handlePinChange = (value: string) => {
    setCode(value);
  };

  return (
    <Card bg={cardBg} shadow="xl" borderRadius="xl">
      <CardHeader textAlign="center" pb={0}>
        <Flex justify="center" mb={2}>
          <img src="/logo-dark.svg" alt="DFS" style={{ height: "56px" }} />
        </Flex>
        <Heading size="md" fontWeight="bold" color="brand.600">
          Reset Password
        </Heading>
        <Text fontSize="sm" color={mutedColor} mt={1}>
          {step === "email" && "Enter your email to receive a reset code"}
          {step === "code" && `Enter the code sent to ${email}`}
          {step === "done" && "Password reset successful!"}
        </Text>
      </CardHeader>
      <CardBody p={6}>
        {step === "email" && (
          <form onSubmit={handleSendCode}>
            <VStack spacing={5}>
              {error && (
                <Box
                  w="full"
                  bg={errorBg}
                  color={errorColor}
                  fontSize="sm"
                  p={3}
                  borderRadius="md"
                  borderLeft="4px solid"
                  borderLeftColor="red.500"
                >
                  {error}
                </Box>
              )}

              <FormControl isRequired>
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input
                  id="email"
                  type="email"
                  size="lg"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>

              <Button
                type="submit"
                size="lg"
                w="full"
                fontWeight="600"
                isLoading={loading}
                loadingText="Sending..."
              >
                Send Reset Code
              </Button>

              <Text fontSize="sm" color={mutedColor} textAlign="center">
                <ChakraLink as={NextLink} href="/login" fontSize="sm" fontWeight="500" color={linkColor} _hover={{ textDecoration: "underline" }}>
                  Back to Login
                </ChakraLink>
              </Text>
            </VStack>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleResetPassword}>
            <VStack spacing={5}>
              {error && (
                <Box
                  w="full"
                  bg={errorBg}
                  color={errorColor}
                  fontSize="sm"
                  p={3}
                  borderRadius="md"
                  borderLeft="4px solid"
                  borderLeftColor="red.500"
                >
                  {error}
                </Box>
              )}

              <FormControl isRequired>
                <FormLabel>Reset Code</FormLabel>
                <HStack justify="center" spacing={3}>
                  <PinInput
                    size="lg"
                    value={code}
                    onChange={handlePinChange}
                    otp
                    placeholder=""
                  >
                    <PinInputField w="50px" h="50px" fontSize="xl" />
                    <PinInputField w="50px" h="50px" fontSize="xl" />
                    <PinInputField w="50px" h="50px" fontSize="xl" />
                    <PinInputField w="50px" h="50px" fontSize="xl" />
                    <PinInputField w="50px" h="50px" fontSize="xl" />
                    <PinInputField w="50px" h="50px" fontSize="xl" />
                  </PinInput>
                </HStack>
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="newPassword">New Password</FormLabel>
                <Input
                  id="newPassword"
                  type="password"
                  size="lg"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="confirmPassword">
                  Confirm Password
                </FormLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  size="lg"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </FormControl>

              <Button
                type="submit"
                size="lg"
                w="full"
                fontWeight="600"
                isLoading={loading}
                loadingText="Resetting..."
                isDisabled={code.length !== 6}
              >
                Reset Password
              </Button>
            </VStack>
          </form>
        )}

        {step === "done" && (
          <VStack spacing={5} textAlign="center">
            <Box
              w="full"
              bg={successBg}
              color={successColor}
              fontSize="sm"
              p={3}
              borderRadius="md"
              borderLeft="4px solid"
              borderLeftColor="green.500"
            >
              Your password has been reset. Redirecting to login...
            </Box>
            <ChakraLink as={NextLink} href="/login">
              <Button variant="outline" size="lg">Go to Login</Button>
            </ChakraLink>
          </VStack>
        )}
      </CardBody>
    </Card>
  );
}
