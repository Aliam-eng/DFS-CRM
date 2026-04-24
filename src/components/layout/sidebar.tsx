"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Box,
  Flex,
  Icon,
  Text,
  Tooltip,
  VStack,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Users,
  Settings,
  Bell,
  CheckCircle,
  Shield,
  ScrollText,
  UserPlus,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export const roleNavItems: Record<string, NavItem[]> = {
  CLIENT: [
    { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
    { label: "KYC Application", href: "/client/kyc", icon: FileText },
    { label: "KYC Status", href: "/client/kyc/status", icon: CheckCircle },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ],
  COMPLIANCE: [
    { label: "Dashboard", href: "/compliance/dashboard", icon: LayoutDashboard },
    { label: "KYC Reviews", href: "/compliance/reviews", icon: ClipboardCheck },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ],
  OPERATIONS: [
    { label: "Dashboard", href: "/operations/dashboard", icon: LayoutDashboard },
    { label: "Client Activations", href: "/operations/pending-users", icon: UserPlus },
    { label: "KYC Reviews", href: "/operations/reviews", icon: ClipboardCheck },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Client Activations", href: "/operations/pending-users", icon: UserPlus },
    { label: "All KYC", href: "/admin/kyc", icon: FileText },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/super-admin/users", icon: Users },
    { label: "Client Activations", href: "/operations/pending-users", icon: UserPlus },
    { label: "All KYC", href: "/super-admin/kyc", icon: FileText },
    { label: "Settings", href: "/super-admin/settings", icon: Settings },
    { label: "Activity Logs", href: "/super-admin/activity-logs", icon: ScrollText },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ],
};

function NavItemLink({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const activeBg = useColorModeValue("brand.50", "whiteAlpha.100");
  const activeColor = useColorModeValue("brand.700", "brand.200");
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.50");
  const textColor = useColorModeValue("gray.700", "gray.300");

  const content = (
    <Flex
      as={Link}
      href={item.href}
      align="center"
      px={isCollapsed ? 0 : 4}
      py={3}
      mx={isCollapsed ? "auto" : 2}
      borderRadius="lg"
      justify={isCollapsed ? "center" : "flex-start"}
      w={isCollapsed ? "40px" : "auto"}
      bg={isActive ? activeBg : "transparent"}
      color={isActive ? activeColor : textColor}
      fontWeight={isActive ? "600" : "normal"}
      borderLeft={isActive && !isCollapsed ? "4px solid" : "4px solid transparent"}
      borderLeftColor={isActive && !isCollapsed ? "brand.500" : "transparent"}
      _hover={{ bg: isActive ? activeBg : hoverBg }}
      transition="all 0.2s"
      fontSize="sm"
      textDecoration="none"
    >
      <Icon as={item.icon} boxSize={5} flexShrink={0} />
      {!isCollapsed && <Text ml={3}>{item.label}</Text>}
    </Flex>
  );

  if (isCollapsed) {
    return (
      <Tooltip label={item.label} placement="right" hasArrow>
        {content}
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as { role?: string })?.role || "CLIENT";
  const navItems = roleNavItems[role] || roleNavItems.CLIENT;

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");


  return (
    <Box
      as="nav"
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      w={isCollapsed ? "72px" : "240px"}
      minH="100vh"
      bg={bg}
      borderRight="1px solid"
      borderRightColor={borderColor}
      transition="width 0.2s ease"
      position="fixed"
      left={0}
      top={0}
      zIndex={20}
    >
      {/* Brand */}
      <Flex
        align="center"
        h="64px"
        px={isCollapsed ? 0 : 5}
        justify={isCollapsed ? "center" : "flex-start"}
        borderBottom="1px solid"
        borderBottomColor={borderColor}
      >
        {isCollapsed ? (
          <Icon as={Shield} boxSize={6} color="brand.500" />
        ) : (
          <img src="/logo-dark.svg" alt="DFS" style={{ height: "36px" }} />
        )}
      </Flex>

      {/* Nav Items */}
      <VStack spacing={0.5} align="stretch" flex={1} py={4} role="navigation">
        {navItems.map((item) => {
          const showManagementLabel = role === "SUPER_ADMIN" && item.label === "Users" && !isCollapsed;
          const showSystemLabel = role === "SUPER_ADMIN" && item.label === "Settings" && !isCollapsed;
          return (
            <Box key={item.href}>
              {showManagementLabel && (
                <Text fontSize="2xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="wider" px={4} pt={4} pb={1}>
                  Management
                </Text>
              )}
              {showSystemLabel && (
                <Text fontSize="2xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="wider" px={4} pt={4} pb={1}>
                  System
                </Text>
              )}
              <NavItemLink
                item={item}
                isActive={pathname === item.href || (item.href !== "/notifications" && pathname.startsWith(item.href + "/"))}
                isCollapsed={isCollapsed}
              />
            </Box>
          );
        })}
      </VStack>

      {/* Collapse Toggle */}
      <Flex
        justify="center"
        py={3}
        borderTop="1px solid"
        borderTopColor={borderColor}
      >
        <IconButton
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          icon={isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          size="sm"
          variant="ghost"
          onClick={onToggle}
        />
      </Flex>
    </Box>
  );
}

export function MobileSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as { role?: string })?.role || "CLIENT";
  const navItems = roleNavItems[role] || roleNavItems.CLIENT;


  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent maxW="260px">
        <DrawerCloseButton />
        <Flex align="center" h="64px" px={4}>
          <img src="/logo-dark.svg" alt="DFS" style={{ height: "36px" }} />
        </Flex>
        <DrawerBody px={0}>
          <VStack spacing={1} align="stretch">
            {navItems.map((item) => (
              <Box key={item.href} onClick={onClose}>
                <NavItemLink
                  item={item}
                  isActive={pathname === item.href || (item.href !== "/notifications" && pathname.startsWith(item.href + "/"))}
                  isCollapsed={false}
                />
              </Box>
            ))}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
