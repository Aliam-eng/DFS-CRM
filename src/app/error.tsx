"use client";

import { useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Button,
  Flex,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex minH="100vh" align="center" justify="center" p={4}>
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        maxW="md"
        w="full"
        p={8}
        textAlign="center"
      >
        <VStack spacing={4}>
          <Icon as={AlertTriangle} boxSize={12} color="red.500" />
          <Heading size="md">Something went wrong</Heading>
          <Text fontSize="sm" color={mutedColor}>
            An unexpected error occurred. Please try again.
          </Text>
          <Button colorScheme="brand" onClick={reset}>Try Again</Button>
        </VStack>
      </Box>
    </Flex>
  );
}
