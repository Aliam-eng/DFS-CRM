import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

const userUpdateSchema = z.object({
  role: z.enum(["CLIENT", "COMPLIANCE", "OPERATIONS", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DEACTIVATED"]).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional().nullable(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        kycSubmission: {
          include: {
            documents: true,
            reviews: {
              include: { reviewer: { select: { firstName: true, lastName: true, role: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("User detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cannot delete yourself
    if (params.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, email: true, role: true, firstName: true, lastName: true } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot delete other SUPER_ADMINs
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Cannot delete a Super Admin user" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: params.id } });

    await logActivity({
      userId: session.user.id,
      action: "USER_DELETED",
      details: `Deleted user ${targetUser.email} (${targetUser.firstName} ${targetUser.lastName}, role: ${targetUser.role})`,
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const msgs = parsed.error.issues.map((i) => i.message);
      return NextResponse.json({ error: "Validation failed", details: msgs }, { status: 400 });
    }

    const { role, status, firstName, lastName, email, phone } = parsed.data;

    // Prevent self-role-demotion
    if (role !== undefined && params.id === session.user.id && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    // If email is being changed, check uniqueness
    if (email !== undefined) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== params.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "USER_UPDATED",
      details: `Updated user ${user.email}: ${JSON.stringify({ role, status, firstName, lastName, email, phone })}`,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
