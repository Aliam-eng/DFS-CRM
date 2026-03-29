"use client";

import {
  Box,
  Flex,
  SimpleGrid,
  Skeleton,
  useColorModeValue,
  VStack,
  HStack,
} from "@chakra-ui/react";

export function DashboardSkeleton() {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <VStack spacing={6} align="stretch">
      <Skeleton h="36px" w="256px" borderRadius="md" />
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            bg={bg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            p={5}
          >
            <Skeleton h="16px" w="96px" mb={3} />
            <Skeleton h="32px" w="64px" />
          </Box>
        ))}
      </SimpleGrid>
      <Skeleton h="40px" w="160px" borderRadius="md" />
    </VStack>
  );
}

export function AdminDashboardSkeleton() {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <VStack spacing={6} align="stretch">
      <Skeleton h="36px" w="256px" borderRadius="md" />
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
        {[1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            bg={bg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            p={5}
          >
            <Skeleton h="16px" w="96px" mb={3} />
            <Skeleton h="32px" w="64px" />
          </Box>
        ))}
      </SimpleGrid>
      <Box
        bg={bg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={5}
      >
        <Skeleton h="16px" w="128px" mb={4} />
        <VStack spacing={2} align="stretch">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Flex key={i} justify="space-between">
              <Skeleton h="16px" w="128px" />
              <Skeleton h="16px" w="32px" />
            </Flex>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <VStack spacing={3} align="stretch">
      {Array.from({ length: rows }).map((_, i) => (
        <Flex
          key={i}
          align="center"
          justify="space-between"
          p={3}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
        >
          <VStack spacing={2} align="flex-start">
            <Skeleton h="16px" w="160px" />
            <Skeleton h="12px" w="224px" />
          </VStack>
          <HStack spacing={3}>
            <Skeleton h="24px" w="80px" borderRadius="full" />
            <Skeleton h="32px" w="64px" borderRadius="md" />
          </HStack>
        </Flex>
      ))}
    </VStack>
  );
}

export function DetailSkeleton() {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box maxW="4xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Flex align="center" justify="space-between">
          <Skeleton h="36px" w="192px" />
          <Skeleton h="24px" w="96px" borderRadius="full" />
        </Flex>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            bg={bg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            p={5}
          >
            <Skeleton h="20px" w="160px" mb={4} />
            <SimpleGrid columns={2} spacing={4}>
              {[1, 2, 3, 4].map((j) => (
                <Box key={j}>
                  <Skeleton h="12px" w="64px" mb={1} />
                  <Skeleton h="16px" w="128px" />
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

export function KycFormSkeleton() {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box maxW="3xl" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Gradient header skeleton */}
        <Skeleton h="72px" w="full" borderRadius="xl" />

        {/* Stepper skeleton */}
        <HStack justify="center" spacing={6} display={{ base: "none", md: "flex" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <VStack key={i} spacing={2}>
              <Skeleton h="40px" w="40px" borderRadius="full" />
              <Skeleton h="12px" w="64px" />
            </VStack>
          ))}
        </HStack>
        <HStack justify="center" spacing={3} display={{ base: "flex", md: "none" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} h="32px" w="32px" borderRadius="full" />
          ))}
        </HStack>

        {/* Card skeleton */}
        <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
          <HStack spacing={3} mb={4}>
            <Skeleton h="40px" w="40px" borderRadius="lg" />
            <Box>
              <Skeleton h="20px" w="128px" mb={1} />
              <Skeleton h="14px" w="200px" />
            </Box>
          </HStack>
          <VStack spacing={4} align="stretch">
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i}>
                <Skeleton h="12px" w="96px" mb={2} />
                <Skeleton h="40px" w="full" borderRadius="md" />
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
