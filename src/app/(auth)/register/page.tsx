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
  SimpleGrid,
  Link as ChakraLink,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const errorBg = useColorModeValue("red.50", "red.900");
  const errorColor = useColorModeValue("red.600", "red.200");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const linkColor = useColorModeValue("brand.600", "brand.300");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        toast({
          title: "Registration Failed",
          description: data.error || "Please try again",
          status: "error",
          duration: 3000,
        });
        setLoading(false);
        return;
      }
      toast({
        title: "Account Created!",
        description: "Check your email for the verification code.",
        status: "success",
        duration: 3000,
      });
      router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("Something went wrong");
      toast({
        title: "Error",
        description: "Something went wrong",
        status: "error",
        duration: 3000,
      });
      setLoading(false);
    }
  };

  return (
    <Card bg={cardBg} shadow="xl" borderRadius="xl">
      <CardHeader textAlign="center" pb={0}>
        <Flex justify="center" mb={2}>
          <img src="/logo-dark.svg" alt="DFS" style={{ height: "56px" }} />
        </Flex>
        <Heading size="md" fontWeight="bold" color="brand.600">
          Create Account
        </Heading>
        <Text fontSize="sm" color={mutedColor} mt={1}>
          Register to start trading with DFS
        </Text>
      </CardHeader>
      <CardBody p={6}>
        <form onSubmit={handleSubmit}>
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

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel htmlFor="firstName">First Name</FormLabel>
                <Input
                  id="firstName"
                  size="lg"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="lastName">Last Name</FormLabel>
                <Input
                  id="lastName"
                  size="lg"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                />
              </FormControl>
            </SimpleGrid>

            <FormControl isRequired>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                type="email"
                size="lg"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="phone">Phone</FormLabel>
              <Input
                id="phone"
                type="tel"
                size="lg"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input
                id="password"
                type="password"
                size="lg"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
              <Input
                id="confirmPassword"
                type="password"
                size="lg"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
            </FormControl>

            <Button
              type="submit"
              size="lg"
              w="full"
              fontWeight="600"
              isLoading={loading}
              loadingText="Creating Account..."
            >
              Register
            </Button>

            <Text fontSize="sm" color={mutedColor} textAlign="center">
              Already have an account?{" "}
              <ChakraLink as={NextLink} href="/login" fontSize="sm" fontWeight="500" color={linkColor} _hover={{ textDecoration: "underline" }}>
                Sign In
              </ChakraLink>
            </Text>
          </VStack>
        </form>
      </CardBody>
    </Card>
  );
}
