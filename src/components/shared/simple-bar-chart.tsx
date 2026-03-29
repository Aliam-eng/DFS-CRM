"use client";

import { Box, Flex, Text, Tooltip, useColorModeValue } from "@chakra-ui/react";

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarData[];
  height?: number;
  showValues?: boolean;
  colorScheme?: string;
}

export function SimpleBarChart({
  data,
  height = 200,
  showValues = true,
  colorScheme = "brand",
}: SimpleBarChartProps) {
  const bg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.500", "gray.400");
  const defaultColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.300`);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return (
      <Flex h={`${height}px`} align="center" justify="center" bg={bg} borderRadius="md">
        <Text color={textColor} fontSize="sm">
          No data available
        </Text>
      </Flex>
    );
  }

  return (
    <Box>
      <Flex align="flex-end" justify="space-around" h={`${height}px`} gap={1}>
        {data.map((item, i) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          return (
            <Tooltip key={i} label={`${item.label}: ${item.value}`} placement="top">
              <Flex
                direction="column"
                align="center"
                flex={1}
                maxW="60px"
                h="full"
                justify="flex-end"
              >
                {showValues && item.value > 0 && (
                  <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>
                    {item.value}
                  </Text>
                )}
                <Box
                  w="full"
                  h={`${Math.max(barHeight, 2)}px`}
                  bg={item.color || defaultColor}
                  borderRadius="sm"
                  transition="height 0.3s ease"
                  minH="2px"
                />
              </Flex>
            </Tooltip>
          );
        })}
      </Flex>
      <Flex justify="space-around" mt={2}>
        {data.map((item, i) => (
          <Text
            key={i}
            fontSize="xs"
            color={textColor}
            textAlign="center"
            flex={1}
            maxW="60px"
            isTruncated
          >
            {item.label}
          </Text>
        ))}
      </Flex>
    </Box>
  );
}
