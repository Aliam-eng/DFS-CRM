"use client";

import { useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Flex,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex align="center" justify="center" h="60vh">
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
          <Icon as={AlertTriangle} boxSize={10} color="red.500" />
          <Heading size="md">Something went wrong</Heading>
          <Text fontSize="sm" color={mutedColor}>
            There was an error loading this page. Please try again.
          </Text>
          <HStack spacing={3} justify="center">
            <Button colorScheme="brand" onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Go Home
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
}
