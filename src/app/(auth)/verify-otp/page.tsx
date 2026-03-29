"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  VStack,
  Box,
  HStack,
  PinInput,
  PinInputField,
  useToast,
  useColorModeValue,
  Spinner,
  Flex,
} from "@chakra-ui/react";

function VerifyOtpContent() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const errorBg = useColorModeValue("red.50", "red.900");
  const errorColor = useColorModeValue("red.600", "red.200");
  const successBg = useColorModeValue("green.50", "green.900");
  const successColor = useColorModeValue("green.700", "green.200");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, purpose: "EMAIL_VERIFICATION" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
      setSuccess("Email verified! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "EMAIL_VERIFICATION" }),
      });
      setResendTimer(60);
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email",
        status: "success",
        duration: 3000,
      });
    } catch {
      /* ignore */
    }
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
          Verify Email
        </Heading>
        <Text fontSize="sm" color={mutedColor} mt={1}>
          Enter the 6-digit code sent to {email}
        </Text>
      </CardHeader>
      <CardBody p={6}>
        <form onSubmit={handleVerify}>
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
            {success && (
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
                {success}
              </Box>
            )}

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

            <Button
              type="submit"
              size="lg"
              w="full"
              fontWeight="600"
              isLoading={loading}
              loadingText="Verifying..."
              isDisabled={code.length !== 6}
            >
              Verify
            </Button>

            <Box textAlign="center">
              <Button
                type="button"
                variant="ghost"
                isDisabled={resendTimer > 0}
                onClick={handleResend}
                fontSize="sm"
                fontWeight="500"
              >
                {resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : "Resend OTP"}
              </Button>
            </Box>
          </VStack>
        </form>
      </CardBody>
    </Card>
  );
}

function LoadingFallback() {
  const cardBg = useColorModeValue("white", "gray.800");

  return (
    <Card bg={cardBg} shadow="xl" borderRadius="xl">
      <CardBody p={8}>
        <Flex justify="center" align="center">
          <Spinner mr={3} />
          <Text>Loading...</Text>
        </Flex>
      </CardBody>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
