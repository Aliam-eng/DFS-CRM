import Link from "next/link";
import {
  Box,
  Heading,
  Text,
  VStack,
  Button,
  Flex,
} from "@chakra-ui/react";

export default function NotFound() {
  return (
    <Flex minH="100vh" align="center" justify="center" p={4} bgGradient="linear(to-br, brand.50, brand.100)">
      <Box
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        maxW="md"
        w="full"
        p={8}
        textAlign="center"
        shadow="lg"
      >
        <VStack spacing={4}>
          <Heading size="3xl" fontWeight="bold" color="gray.400">404</Heading>
          <Text fontSize="lg" fontWeight="medium">Page not found</Text>
          <Text fontSize="sm" color="gray.500">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </Text>
          <Link href="/">
            <Button colorScheme="brand">Go Home</Button>
          </Link>
        </VStack>
      </Box>
    </Flex>
  );
}
