"use client";

import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "@/lib/theme";

export function ChakraUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>{children}</ChakraProvider>
    </>
  );
}
