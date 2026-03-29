import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;

    // CLIENT: return empty object
    if (role === "CLIENT") {
      return NextResponse.json({});
    }

    // COMPLIANCE role
    if (role === "COMPLIANCE") {
      return NextResponse.json(await getReviewerAnalytics(session.user.id, "COMPLIANCE"));
    }

    // OPERATIONS role
    if (role === "OPERATIONS") {
      return NextResponse.json(await getReviewerAnalytics(session.user.id, "OPERATIONS"));
    }

    // ADMIN / SUPER_ADMIN
    return NextResponse.json(await getAdminAnalytics());
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getAdminAnalytics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    kycSubmissions,
    approvedCount,
    rejectedCount,
    pendingCount,
    complianceReviews,
    operationsReviews,
    topReviewerGroups,
    recentReviews,
    userGroups,
  ] = await Promise.all([
    // kycTrend: submissions in last 30 days
    prisma.kycSubmission.findMany({
      where: {
        submittedAt: {
          not: null,
          gte: thirtyDaysAgo,
        },
      },
      select: {
        submittedAt: true,
      },
    }),

    // approvalRate: approved (OPERATIONS_APPROVED)
    prisma.kycSubmission.count({
      where: { status: "OPERATIONS_APPROVED" },
    }),

    // approvalRate: rejected (COMPLIANCE_REJECTED + OPERATIONS_REJECTED)
    prisma.kycSubmission.count({
      where: {
        status: {
          in: ["COMPLIANCE_REJECTED", "OPERATIONS_REJECTED"],
        },
      },
    }),

    // approvalRate: pending (SUBMITTED + COMPLIANCE_APPROVED)
    prisma.kycSubmission.count({
      where: {
        status: {
          in: ["SUBMITTED", "COMPLIANCE_APPROVED"],
        },
      },
    }),

    // avgTurnaround: compliance reviews
    prisma.kycReview.findMany({
      where: { reviewType: "COMPLIANCE" },
      include: { kycSubmission: true },
    }),

    // avgTurnaround: operations reviews
    prisma.kycReview.findMany({
      where: { reviewType: "OPERATIONS" },
      include: { kycSubmission: true },
    }),

    // topReviewers: group by reviewer
    prisma.kycReview.groupBy({
      by: ["reviewerUserId"],
      _count: true,
      orderBy: {
        _count: {
          reviewerUserId: "desc",
        },
      },
      take: 5,
    }),

    // recentReviews: last 10
    prisma.kycReview.findMany({
      take: 10,
      orderBy: { reviewedAt: "desc" },
      include: {
        reviewer: {
          select: { firstName: true, lastName: true },
        },
        kycSubmission: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    }),

    // usersByRole
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
    }),
  ]);

  // Process kycTrend: group by date
  const trendMap: Record<string, number> = {};
  for (const sub of kycSubmissions) {
    if (sub.submittedAt) {
      const dateStr = sub.submittedAt.toISOString().split("T")[0];
      trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
    }
  }
  const kycTrend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Process approvalRate
  const approvalRate = {
    approved: approvedCount,
    rejected: rejectedCount,
    pending: pendingCount,
  };

  // Process avgTurnaround for compliance
  let complianceAvg = 0;
  if (complianceReviews.length > 0) {
    const totalDays = complianceReviews.reduce((sum, review) => {
      if (review.kycSubmission.submittedAt && review.reviewedAt) {
        const diff = review.reviewedAt.getTime() - review.kycSubmission.submittedAt.getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }
      return sum;
    }, 0);
    complianceAvg = Math.round((totalDays / complianceReviews.length) * 10) / 10;
  }

  // Process avgTurnaround for operations
  let operationsAvg = 0;
  if (operationsReviews.length > 0) {
    let validCount = 0;
    let totalDays = 0;

    for (const opsReview of operationsReviews) {
      // Find the compliance review for the same submission
      const complianceReview = complianceReviews.find(
        (cr) => cr.kycSubmissionId === opsReview.kycSubmissionId
      );
      if (complianceReview && complianceReview.reviewedAt && opsReview.reviewedAt) {
        const diff = opsReview.reviewedAt.getTime() - complianceReview.reviewedAt.getTime();
        totalDays += diff / (1000 * 60 * 60 * 24);
        validCount++;
      }
    }

    if (validCount > 0) {
      operationsAvg = Math.round((totalDays / validCount) * 10) / 10;
    }
  }

  const avgTurnaround = {
    compliance: complianceAvg,
    operations: operationsAvg,
  };

  // Process topReviewers: batch fetch all reviewer names + counts in 3 queries
  const reviewerIds = topReviewerGroups.map((g) => g.reviewerUserId);
  const [reviewerUsers, approvedCounts, rejectedCounts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, firstName: true, lastName: true, role: true },
    }),
    prisma.kycReview.groupBy({
      by: ["reviewerUserId"],
      where: { reviewerUserId: { in: reviewerIds }, decision: "APPROVED" },
      _count: true,
    }),
    prisma.kycReview.groupBy({
      by: ["reviewerUserId"],
      where: { reviewerUserId: { in: reviewerIds }, decision: "REJECTED" },
      _count: true,
    }),
  ]);
  const userMap = new Map(reviewerUsers.map((u) => [u.id, u]));
  const approvedMap = new Map(approvedCounts.map((a) => [a.reviewerUserId, a._count]));
  const rejectedMap = new Map(rejectedCounts.map((r) => [r.reviewerUserId, r._count]));

  const topReviewers = topReviewerGroups.map((group) => {
    const reviewer = userMap.get(group.reviewerUserId);
    return {
      name: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : "Unknown",
      role: reviewer?.role || "UNKNOWN",
      reviews: group._count,
      approved: approvedMap.get(group.reviewerUserId) || 0,
      rejected: rejectedMap.get(group.reviewerUserId) || 0,
    };
  });

  // Process recentReviews
  const formattedRecentReviews = recentReviews.map((review) => ({
    clientName: `${review.kycSubmission.user.firstName} ${review.kycSubmission.user.lastName}`,
    reviewer: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
    decision: review.decision,
    reviewType: review.reviewType,
    date: review.reviewedAt.toISOString(),
  }));

  // Process usersByRole
  const usersByRole: Record<string, number> = {};
  for (const group of userGroups) {
    usersByRole[group.role] = group._count;
  }

  return {
    kycTrend,
    approvalRate,
    avgTurnaround,
    topReviewers,
    recentReviews: formattedRecentReviews,
    usersByRole,
  };
}

async function getReviewerAnalytics(userId: string, reviewType: "COMPLIANCE" | "OPERATIONS") {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [totalReviews, approvedReviews, rejectedReviews, allMyReviews, weeklyReviews, recentReviews] =
    await Promise.all([
      // myStats: total
      prisma.kycReview.count({
        where: { reviewerUserId: userId, reviewType },
      }),

      // myStats: approved
      prisma.kycReview.count({
        where: { reviewerUserId: userId, reviewType, decision: "APPROVED" },
      }),

      // myStats: rejected
      prisma.kycReview.count({
        where: { reviewerUserId: userId, reviewType, decision: "REJECTED" },
      }),

      // For avg turnaround calculation
      prisma.kycReview.findMany({
        where: { reviewerUserId: userId, reviewType },
        include: { kycSubmission: true },
      }),

      // weeklyTrend: reviews in last 7 days
      prisma.kycReview.findMany({
        where: {
          reviewerUserId: userId,
          reviewType,
          reviewedAt: { gte: sevenDaysAgo },
        },
        select: { reviewedAt: true },
      }),

      // recentReviews: last 5
      prisma.kycReview.findMany({
        where: { reviewerUserId: userId, reviewType },
        take: 5,
        orderBy: { reviewedAt: "desc" },
        include: {
          kycSubmission: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
    ]);

  // Calculate avg turnaround
  let avgTime = 0;
  if (allMyReviews.length > 0) {
    if (reviewType === "COMPLIANCE") {
      // Time from KYC submittedAt to reviewedAt
      let totalDays = 0;
      let validCount = 0;
      for (const review of allMyReviews) {
        if (review.kycSubmission.submittedAt && review.reviewedAt) {
          const diff = review.reviewedAt.getTime() - review.kycSubmission.submittedAt.getTime();
          totalDays += diff / (1000 * 60 * 60 * 24);
          validCount++;
        }
      }
      if (validCount > 0) {
        avgTime = Math.round((totalDays / validCount) * 10) / 10;
      }
    } else {
      // OPERATIONS: time from compliance review reviewedAt to this review reviewedAt
      let totalDays = 0;
      let validCount = 0;
      for (const review of allMyReviews) {
        // Find the compliance review for the same submission
        const complianceReview = await prisma.kycReview.findFirst({
          where: {
            kycSubmissionId: review.kycSubmissionId,
            reviewType: "COMPLIANCE",
          },
          select: { reviewedAt: true },
        });
        if (complianceReview?.reviewedAt && review.reviewedAt) {
          const diff = review.reviewedAt.getTime() - complianceReview.reviewedAt.getTime();
          totalDays += diff / (1000 * 60 * 60 * 24);
          validCount++;
        }
      }
      if (validCount > 0) {
        avgTime = Math.round((totalDays / validCount) * 10) / 10;
      }
    }
  }

  // Process weeklyTrend: group by day of week
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayMap: Record<string, number> = {};
  for (const dayName of dayNames) {
    dayMap[dayName] = 0;
  }
  for (const review of weeklyReviews) {
    const dayName = dayNames[review.reviewedAt.getDay()];
    dayMap[dayName] = (dayMap[dayName] || 0) + 1;
  }
  // Order starting from Mon
  const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyTrend = orderedDays.map((day) => ({
    date: day,
    reviews: dayMap[day] || 0,
  }));

  // Format recent reviews
  const formattedRecentReviews = recentReviews.map((review) => ({
    clientName: `${review.kycSubmission.user.firstName} ${review.kycSubmission.user.lastName}`,
    decision: review.decision,
    date: review.reviewedAt.toISOString(),
  }));

  return {
    myStats: {
      total: totalReviews,
      approved: approvedReviews,
      rejected: rejectedReviews,
      avgTime,
    },
    weeklyTrend,
    recentReviews: formattedRecentReviews,
  };
}
