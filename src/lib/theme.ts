import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  colors: {
    brand: {
      50: "#EAFBEF",
      100: "#C5F4D4",
      200: "#8EEBB0",
      300: "#57E28C",
      400: "#33DC6A",
      500: "#21D94F",
      600: "#1BB843",
      700: "#149636",
      800: "#0E7429",
      900: "#08521D",
    },
    gold: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
    navy: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === "dark" ? "gray.900" : "gray.50",
        color: props.colorMode === "dark" ? "whiteAlpha.900" : "gray.800",
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "brand",
      },
      variants: {
        solid: (props: { colorScheme: string }) => ({
          fontWeight: "600",
          borderRadius: "lg",
          _active: { transform: "scale(0.98)" },
          ...(props.colorScheme === "brand" && {
            bg: "brand.500",
            color: "white",
            _hover: { bg: "brand.600" },
          }),
        }),
        ghost: {
          _hover: { bg: "whiteAlpha.200" },
        },
      },
    },
    Card: {
      baseStyle: (props: { colorMode: string }) => ({
        container: {
          bg: props.colorMode === "dark" ? "gray.800" : "white",
          borderRadius: "xl",
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
          border: "1px solid",
          borderColor: props.colorMode === "dark" ? "gray.700" : "gray.200",
        },
      }),
    },
    Table: {
      variants: {
        simple: (props: { colorMode: string }) => ({
          th: {
            borderColor: props.colorMode === "dark" ? "gray.600" : "gray.200",
            color: props.colorMode === "dark" ? "gray.400" : "gray.600",
            fontSize: "xs",
            fontWeight: "600",
          },
          td: {
            borderColor: props.colorMode === "dark" ? "gray.700" : "gray.100",
          },
          tr: {
            _hover: {
              bg: props.colorMode === "dark" ? "whiteAlpha.50" : "gray.50",
            },
          },
        }),
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: "brand.500",
        size: "md",
      },
      baseStyle: {
        field: {
          borderRadius: "lg",
        },
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: "brand.500",
        size: "md",
      },
      baseStyle: {
        field: {
          borderRadius: "lg",
        },
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: "brand.500",
      },
    },
    Modal: {
      baseStyle: (props: { colorMode: string }) => ({
        dialog: {
          bg: props.colorMode === "dark" ? "gray.800" : "white",
        },
      }),
    },
    Drawer: {
      baseStyle: (props: { colorMode: string }) => ({
        dialog: {
          bg: props.colorMode === "dark" ? "gray.800" : "white",
        },
      }),
    },
    Menu: {
      baseStyle: (props: { colorMode: string }) => ({
        list: {
          bg: props.colorMode === "dark" ? "gray.800" : "white",
          borderColor: props.colorMode === "dark" ? "gray.700" : "gray.200",
        },
        item: {
          bg: props.colorMode === "dark" ? "gray.800" : "white",
          _hover: {
            bg: props.colorMode === "dark" ? "gray.700" : "gray.100",
          },
        },
      }),
    },
  },
});

export default theme;
