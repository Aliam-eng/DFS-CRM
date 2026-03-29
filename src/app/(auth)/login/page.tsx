"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Card,
  CardHeader,
  CardBody,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Box,
  Flex,
  Link as ChakraLink,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        status: "error",
        duration: 3000,
      });
      setLoading(false);
    } else {
      toast({
        title: "Welcome back!",
        description: "Signed in successfully",
        status: "success",
        duration: 3000,
      });
      router.push("/");
      router.refresh();
    }
  };

  return (
    <Card bg={cardBg} shadow="xl" borderRadius="xl">
      <CardHeader textAlign="center" pb={0}>
        <Flex justify="center" mb={2}>
          <img src="/logo-dark.svg" alt="DFS" style={{ height: "56px" }} />
        </Flex>
        <Text fontSize="sm" color={mutedColor} mt={1}>
          Sign in to your account
        </Text>
        <Flex align="center" justify="center" mt={1} gap={1}>
          <Text fontSize="xs" color={mutedColor}>
            Secure login
          </Text>
        </Flex>
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

            <FormControl isRequired>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input
                id="password"
                type="password"
                size="lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>

            <Button
              type="submit"
              size="lg"
              w="full"
              fontWeight="600"
              isLoading={loading}
              loadingText="Signing in..."
            >
              Sign In
            </Button>

            <VStack spacing={2} mt={2}>
              <ChakraLink as={NextLink} href="/forgot-password" fontSize="sm" fontWeight="500" color={linkColor} _hover={{ textDecoration: "underline" }}>
                Forgot your password?
              </ChakraLink>
              <Text fontSize="sm" color={mutedColor}>
                Don&apos;t have an account?{" "}
                <ChakraLink as={NextLink} href="/register" fontSize="sm" fontWeight="500" color={linkColor} _hover={{ textDecoration: "underline" }}>
                  Register
                </ChakraLink>
              </Text>
            </VStack>
          </VStack>
        </form>
      </CardBody>
    </Card>
  );
}
