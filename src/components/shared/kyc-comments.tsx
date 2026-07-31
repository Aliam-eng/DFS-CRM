"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Textarea,
  Badge,
  Skeleton,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { formatDateTime } from "@/lib/date";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { firstName: string; lastName: string; role: string };
}

const ROLE_COLORS: Record<string, string> = {
  OPERATIONS: "blue",
  COMPLIANCE: "purple",
  ADMIN: "orange",
  SUPER_ADMIN: "red",
};

export function KycComments({ kycId }: { kycId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const commentBg = useColorModeValue("gray.50", "gray.900");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const load = () => {
    setLoading(true);
    fetch(`/api/kyc/${kycId}/comments`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast({ title: "Failed to load comments", description: d.error, status: "error", duration: 3000 });
          setComments([]);
        } else {
          setComments(d.comments || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kycId]);

  const post = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setPosting(true);
    const res = await fetch(`/api/kyc/${kycId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });
    setPosting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to post" }));
      toast({ title: "Failed to post comment", description: err.error, status: "error", duration: 3000 });
      return;
    }
    setBody("");
    load();
  };

  return (
    <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
      <Heading size="sm" mb={4}>
        Discussion / تعليقات{" "}
        <Text as="span" fontSize="xs" color={mutedColor} fontWeight="normal">
          — visible to Operations, Compliance, Admin only
        </Text>
      </Heading>

      <VStack spacing={3} align="stretch">
        <Textarea
          placeholder="Write a comment for the other team..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={4000}
          resize="vertical"
        />
        <Flex justify="space-between" align="center">
          <Text fontSize="xs" color={mutedColor}>{body.length}/4000</Text>
          <Button
            size="sm"
            colorScheme="brand"
            onClick={post}
            isLoading={posting}
            isDisabled={!body.trim() || posting}
          >
            Post Comment
          </Button>
        </Flex>
      </VStack>

      <Box mt={5}>
        {loading ? (
          <VStack spacing={2} align="stretch">
            <Skeleton h="60px" borderRadius="md" />
            <Skeleton h="60px" borderRadius="md" />
          </VStack>
        ) : comments.length === 0 ? (
          <Text fontSize="sm" color={mutedColor} textAlign="center" py={6}>
            No comments yet. Start the discussion with the other team above.
          </Text>
        ) : (
          <VStack spacing={3} align="stretch">
            {comments.map((c) => {
              const authorName = `${c.author.firstName} ${c.author.lastName}`.trim();
              const roleColor = ROLE_COLORS[c.author.role] || "gray";
              return (
                <Box
                  key={c.id}
                  bg={commentBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  p={3}
                >
                  <HStack spacing={2} mb={2} flexWrap="wrap">
                    <Text fontSize="sm" fontWeight="semibold">{authorName}</Text>
                    <Badge colorScheme={roleColor} fontSize="xs">
                      {c.author.role.replace(/_/g, " ")}
                    </Badge>
                    <Text fontSize="xs" color={mutedColor}>
                      {formatDateTime(c.createdAt)}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" whiteSpace="pre-wrap">{c.body}</Text>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
