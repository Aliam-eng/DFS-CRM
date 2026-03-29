"use client";

import { useNotifications } from "@/hooks/use-notifications";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Badge,
  Icon,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const unreadBg = useColorModeValue("blue.50", "blue.900");
  const unreadBorderColor = useColorModeValue("blue.200", "blue.700");
  const readBg = useColorModeValue("white", "gray.800");
  const dotColor = useColorModeValue("blue.500", "blue.300");

  return (
    <Box maxW="3xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Flex align="center" justify="space-between">
          <Heading size="lg">Notifications</Heading>
          {unreadCount > 0 && <Button variant="outline" onClick={markAllAsRead}>Mark All as Read</Button>}
        </Flex>

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <Box px={5} pt={5} pb={2}>
            <HStack spacing={2}>
              <Icon as={Bell} boxSize={5} />
              <Heading size="sm">All Notifications</Heading>
              {unreadCount > 0 && <Badge colorScheme="blue">{unreadCount} unread</Badge>}
            </HStack>
          </Box>
          <Box px={5} pb={5}>
            {isLoading ? (
              <Flex justify="center" py={8}><Spinner /></Flex>
            ) : notifications.length === 0 ? (
              <Text color={mutedColor} textAlign="center" py={8}>No notifications yet.</Text>
            ) : (
              <VStack spacing={2} align="stretch">
                {notifications.map((n) => (
                  <Box
                    key={n.id}
                    p={4}
                    borderWidth="1px"
                    borderColor={n.read ? borderColor : unreadBorderColor}
                    borderRadius="lg"
                    cursor="pointer"
                    bg={n.read ? readBg : unreadBg}
                    transition="background 0.2s"
                    _hover={{ opacity: 0.85 }}
                    onClick={() => { markAsRead(n.id); if (n.link) window.location.href = n.link; }}
                  >
                    <Flex align="flex-start" justify="space-between">
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color={n.read ? mutedColor : undefined}>{n.title}</Text>
                        <Text fontSize="sm" color={mutedColor} mt={1}>{n.message}</Text>
                      </Box>
                      {!n.read && <Box h={2} w={2} borderRadius="full" bg={dotColor} mt={2} flexShrink={0} />}
                    </Flex>
                    <Text fontSize="xs" color={mutedColor} mt={2}>{new Date(n.createdAt).toLocaleString()}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        </Box>
      </VStack>
    </Box>
  );
}
