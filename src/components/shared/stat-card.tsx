"use client";

import {
  Box,
  Flex,
  Text,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  iconColor?: string;
  valueColor?: string;
}

export function StatCard({ label, value, icon, iconColor = "gray.400", valueColor }: StatCardProps) {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={6}
      shadow="sm"
      _hover={{ shadow: "md", transform: "translateY(-1px)" }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="flex-start">
        <Box>
          <Text fontSize="sm" fontWeight="500" color={labelColor}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="700" mt={1} color={valueColor}>
            {value}
          </Text>
        </Box>
        {icon && (
          <Flex
            bg={`${iconColor}.100`}
            borderRadius="lg"
            w={10}
            h={10}
            align="center"
            justify="center"
          >
            <Icon as={icon} boxSize={5} color={iconColor} />
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
