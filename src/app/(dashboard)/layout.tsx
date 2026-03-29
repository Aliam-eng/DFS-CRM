"use client";

import { useState, useEffect } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const SIDEBAR_COLLAPSED_KEY = "dfs-sidebar-collapsed";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setIsCollapsed(true);
  }, []);

  const handleToggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
  };

  const sidebarWidth = isCollapsed ? "72px" : "240px";

  return (
    <Flex minH="100vh">
      <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        ml={{ base: 0, md: sidebarWidth }}
        flex={1}
        transition="margin-left 0.2s ease"
        minW={0}
      >
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <Box as="main" p={{ base: 4, md: 6 }}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
