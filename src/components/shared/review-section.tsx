"use client";

import {
  Box,
  Flex,
  Text,
  Icon,
  SimpleGrid,
  GridItem,
  useColorModeValue,
} from "@chakra-ui/react";

interface ReviewField {
  label: string;
  value: string | number | React.ReactNode;
  colSpan?: number;
}

interface ReviewSectionProps {
  icon: React.ElementType;
  title: string;
  accentColor?: string;
  fields: ReviewField[];
}

export function ReviewSection({
  icon,
  title,
  accentColor = "brand.500",
  fields,
}: ReviewSectionProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue(`${accentColor.split(".")[0]}.50`, `${accentColor.split(".")[0]}.900`);

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      borderTopWidth="3px"
      borderTopColor={accentColor}
      overflow="hidden"
    >
      <Flex align="center" gap={3} px={4} pt={4} pb={2}>
        <Flex
          w={8}
          h={8}
          borderRadius="md"
          bg={iconBg}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon as={icon} boxSize={4} color={accentColor} />
        </Flex>
        <Text fontSize="sm" fontWeight="semibold">
          {title}
        </Text>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} px={4} pb={4}>
        {fields.map((field, i) => (
          <GridItem key={i} colSpan={field.colSpan ? { md: field.colSpan } : undefined}>
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="wider"
              color={labelColor}
              mb={0.5}
            >
              {field.label}
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              {field.value || "-"}
            </Text>
          </GridItem>
        ))}
      </SimpleGrid>
    </Box>
  );
}
