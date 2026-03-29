"use client";

import { Flex, Box } from "@chakra-ui/react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgGradient="linear(to-br, gray.900, gray.800)"
      p={4}
    >
      <Box w="full" maxW="md" shadow="2xl" borderRadius="xl">
        {children}
      </Box>
    </Flex>
  );
}
