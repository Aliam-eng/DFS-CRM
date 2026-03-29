"use client";

import { Box, Flex, Text, Icon, useColorModeValue } from "@chakra-ui/react";
import { Check } from "lucide-react";

interface StepDef {
  label: string;
  icon: React.ElementType;
}

interface FormStepperProps {
  steps: StepDef[];
  activeStep: number;
}

export function FormStepper({ steps, activeStep }: FormStepperProps) {
  const completedBg = "brand.500";
  const completedIcon = "white";
  const activeBorder = "brand.500";
  const activeIconColor = "brand.500";
  const activeBg = useColorModeValue("white", "gray.800");
  const activeGlow = useColorModeValue("brand.50", "brand.900");
  const upcomingBg = useColorModeValue("gray.100", "gray.700");
  const upcomingIcon = useColorModeValue("gray.400", "gray.500");
  const lineCompleted = "brand.500";
  const lineUpcoming = useColorModeValue("gray.300", "gray.600");
  const labelActive = useColorModeValue("gray.800", "white");
  const labelMuted = useColorModeValue("gray.400", "gray.500");
  const goldAccent = "brand.400";

  const isCompact = steps.length > 7;
  const circleSize = isCompact ? 7 : 10;
  const iconSize = isCompact ? 3.5 : 5;
  const minColW = isCompact ? "56px" : "80px";
  const labelSize = isCompact ? "2xs" : "xs";

  return (
    <Box>
      {/* Desktop stepper */}
      <Flex
        display={{ base: "none", lg: "flex" }}
        align="flex-start"
        justify="center"
        gap={0}
      >
        {steps.map((step, i) => {
          const isCompleted = i < activeStep;
          const isActive = i === activeStep;

          return (
            <Flex key={i} align="center" flex={i < steps.length - 1 ? 1 : "none"}>
              <Flex direction="column" align="center" minW={minColW}>
                <Flex
                  w={circleSize}
                  h={circleSize}
                  borderRadius="full"
                  align="center"
                  justify="center"
                  bg={isCompleted ? completedBg : isActive ? activeBg : upcomingBg}
                  borderWidth={isActive ? "2px" : "0px"}
                  borderColor={isActive ? activeBorder : "transparent"}
                  boxShadow={isActive ? `0 0 0 3px var(--chakra-colors-${activeGlow.replace(".", "-")})` : "none"}
                  transition="all 0.3s ease"
                >
                  {isCompleted ? (
                    <Icon as={Check} boxSize={iconSize} color={completedIcon} />
                  ) : (
                    <Icon
                      as={step.icon}
                      boxSize={iconSize}
                      color={isActive ? activeIconColor : upcomingIcon}
                    />
                  )}
                </Flex>
                <Text
                  fontSize={labelSize}
                  fontWeight={isActive ? "semibold" : "normal"}
                  color={isActive ? labelActive : isCompleted ? labelActive : labelMuted}
                  mt={1.5}
                  textAlign="center"
                  lineHeight="shorter"
                  maxW={minColW}
                  noOfLines={2}
                >
                  {step.label}
                </Text>
                {isActive && (
                  <Box w="20px" h="2px" bg={goldAccent} borderRadius="full" mt={0.5} />
                )}
              </Flex>

              {i < steps.length - 1 && (
                <Box
                  flex={1}
                  h="2px"
                  bg={i < activeStep ? lineCompleted : lineUpcoming}
                  borderStyle={i < activeStep ? "solid" : "dashed"}
                  mt={`-${(circleSize * 4) / 2 + 12}px`}
                  mx={0.5}
                  alignSelf="flex-start"
                  position="relative"
                  top={`${(circleSize * 4) / 2}px`}
                  transition="background 0.3s ease"
                  minW="8px"
                />
              )}
            </Flex>
          );
        })}
      </Flex>

      {/* Mobile stepper: show current step number + progress bar */}
      <Box display={{ base: "block", lg: "none" }}>
        <Flex align="center" justify="center" gap={2} mb={2}>
          <Flex
            w={8}
            h={8}
            borderRadius="full"
            align="center"
            justify="center"
            bg={activeBg}
            borderWidth="2px"
            borderColor={activeBorder}
          >
            <Icon as={steps[activeStep]?.icon} boxSize={4} color={activeIconColor} />
          </Flex>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color={labelActive}>
              {steps[activeStep]?.label}
            </Text>
            <Text fontSize="2xs" color={labelMuted}>
              Step {activeStep + 1} of {steps.length}
            </Text>
          </Box>
        </Flex>

        {/* Progress bar */}
        <Box w="full" h="4px" bg={upcomingBg} borderRadius="full" overflow="hidden">
          <Box
            h="full"
            bg={completedBg}
            borderRadius="full"
            w={`${((activeStep + 1) / steps.length) * 100}%`}
            transition="width 0.3s ease"
          />
        </Box>

        {/* Step dots (scrollable) */}
        <Flex justify="center" mt={2} gap={1} flexWrap="wrap">
          {steps.map((_, i) => (
            <Box
              key={i}
              w={1.5}
              h={1.5}
              borderRadius="full"
              bg={i < activeStep ? completedBg : i === activeStep ? activeBorder : upcomingBg}
              transition="background 0.2s"
            />
          ))}
        </Flex>
      </Box>
    </Box>
  );
}
