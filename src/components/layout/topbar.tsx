"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  Flex,
  Box,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  Avatar,
  useColorMode,
  useColorModeValue,
  HStack,
} from "@chakra-ui/react";
import {
  HamburgerIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons";
import { User } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession();
  const { colorMode, toggleColorMode } = useColorMode();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const user = session?.user as { firstName?: string; lastName?: string; email?: string; role?: string } | undefined;

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const subtextColor = useColorModeValue("gray.500", "gray.400");
  const unreadBg = useColorModeValue("brand.50", "whiteAlpha.50");

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      h="64px"
      px={{ base: 4, md: 6 }}
      bg={bg}
      borderBottom="1px solid"
      borderBottomColor={borderColor}
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.05)"
      position="sticky"
      top={0}
      zIndex={10}
    >
      {/* Left */}
      <HStack spacing={3}>
        <IconButton
          aria-label="Open menu"
          icon={<HamburgerIcon />}
          display={{ base: "flex", md: "none" }}
          variant="ghost"
          onClick={onMenuClick}
        />
        <Box>
          <Text fontWeight="600" fontSize="sm">
            Welcome, {user?.firstName || "User"}
          </Text>
          <Text fontSize="sm" fontWeight="400" color={subtextColor}>
            {user?.role?.replace(/_/g, " ")}
          </Text>
        </Box>
      </HStack>

      {/* Right */}
      <HStack spacing={2}>
        <IconButton
          aria-label="Toggle color mode"
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          variant="ghost"
          size="sm"
          onClick={toggleColorMode}
        />

        {/* Notifications */}
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Notifications"
            icon={
              <Box position="relative">
                <BellIcon boxSize={5} />
                {unreadCount > 0 && (
                  <Badge
                    position="absolute"
                    top="-6px"
                    right="-6px"
                    bg="red.500"
                    color="white"
                    borderRadius="full"
                    fontSize="2xs"
                    minW="16px"
                    textAlign="center"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Box>
            }
            variant="ghost"
            size="sm"
          />
          <MenuList maxW="380px" maxH="400px" overflowY="auto">
            <Flex justify="space-between" align="center" px={3} py={2}>
              <Text fontWeight="600" fontSize="sm">Notifications</Text>
              {unreadCount > 0 && (
                <Text
                  fontSize="xs"
                  color="brand.500"
                  cursor="pointer"
                  onClick={markAllAsRead}
                  _hover={{ textDecor: "underline" }}
                >
                  Mark all read
                </Text>
              )}
            </Flex>
            <MenuDivider />
            {notifications.length === 0 ? (
              <Box px={3} py={4} textAlign="center">
                <Text fontSize="sm" color={subtextColor}>No notifications</Text>
              </Box>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <MenuItem
                  key={n.id}
                  as={Link}
                  href={n.link || "/notifications"}
                  onClick={() => !n.read && markAsRead(n.id)}
                  bg={!n.read ? unreadBg : undefined}
                >
                  <Box>
                    <Text fontSize="sm" fontWeight={n.read ? "normal" : "600"}>
                      {n.title}
                    </Text>
                    <Text fontSize="xs" color={subtextColor} noOfLines={1}>
                      {n.message}
                    </Text>
                  </Box>
                </MenuItem>
              ))
            )}
            <MenuDivider />
            <MenuItem as={Link} href="/notifications" justifyContent="center">
              <Text fontSize="sm" color="brand.500">View all</Text>
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Profile */}
        <Menu>
          <MenuButton>
            <HStack spacing={2} cursor="pointer">
              <Avatar
                size="sm"
                name={`${user?.firstName || ""} ${user?.lastName || ""}`}
                bg="gray.700"
                color="white"
              />
              <ChevronDownIcon display={{ base: "none", md: "block" }} />
            </HStack>
          </MenuButton>
          <MenuList>
            <Box px={3} py={2}>
              <Text fontWeight="600" fontSize="sm">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text fontSize="xs" color={subtextColor}>{user?.email}</Text>
            </Box>
            <MenuDivider />
            <MenuItem as={Link} href="/profile" icon={<User size={16} />}>
              Profile
            </MenuItem>
            <MenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              Sign Out
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
}
