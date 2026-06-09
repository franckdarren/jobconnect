import "server-only";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  candidateProfiles,
  employerProfiles,
  jobOffers,
  payments,
  subscriptions,
  users,
} from "@/lib/db/schema";

export type AdminGlobalStats = {
  users: { total: number; candidates: number; employers: number; suspended: number };
  jobs: { total: number; active: number };
  applications: { total: number; thisMonth: number };
  subscriptions: { active: number };
  revenue: { totalFcfa: number; thisMonthFcfa: number };
};

export async function getAdminGlobalStats(): Promise<AdminGlobalStats> {
  const [usersRow, jobsRow, appsRow, subsRow, revenueRow] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        candidates: sql<number>`count(*) filter (where role = 'candidate')::int`,
        employers: sql<number>`count(*) filter (where role = 'employer')::int`,
        suspended: sql<number>`count(*) filter (where is_active = false)::int`,
      })
      .from(users),
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where status = 'active')::int`,
      })
      .from(jobOffers),
    db
      .select({
        total: sql<number>`count(*)::int`,
        thisMonth: sql<number>`count(*) filter (where created_at >= date_trunc('month', now()))::int`,
      })
      .from(applications),
    db
      .select({
        active: sql<number>`count(*) filter (where status = 'active' and expires_at >= now())::int`,
      })
      .from(subscriptions),
    db
      .select({
        totalFcfa: sql<number>`coalesce(sum(amount) filter (where status = 'success'), 0)::int`,
        thisMonthFcfa: sql<number>`coalesce(sum(amount) filter (where status = 'success' and created_at >= date_trunc('month', now())), 0)::int`,
      })
      .from(payments),
  ]);

  return {
    users: {
      total: usersRow[0]?.total ?? 0,
      candidates: usersRow[0]?.candidates ?? 0,
      employers: usersRow[0]?.employers ?? 0,
      suspended: usersRow[0]?.suspended ?? 0,
    },
    jobs: {
      total: jobsRow[0]?.total ?? 0,
      active: jobsRow[0]?.active ?? 0,
    },
    applications: {
      total: appsRow[0]?.total ?? 0,
      thisMonth: appsRow[0]?.thisMonth ?? 0,
    },
    subscriptions: {
      active: subsRow[0]?.active ?? 0,
    },
    revenue: {
      totalFcfa: revenueRow[0]?.totalFcfa ?? 0,
      thisMonthFcfa: revenueRow[0]?.thisMonthFcfa ?? 0,
    },
  };
}

export type AdminUserRow = {
  id: string;
  phone: string;
  email: string;
  role: "candidate" | "employer" | "admin";
  isActive: boolean;
  createdAt: Date;
  // Candidate-only
  firstName: string | null;
  lastName: string | null;
  isBoosted: boolean | null;
  // Employer-only
  companyName: string | null;
  isVerified: boolean | null;
};

const PAGE_SIZE = 25;

export async function listAdminUsers(options: {
  page?: number;
  q?: string;
  role?: "candidate" | "employer" | "admin";
}): Promise<{ rows: AdminUserRow[]; total: number; pageSize: number }> {
  const page = Math.max(1, options.page ?? 1);
  const conditions = [];
  if (options.q?.trim()) {
    const pat = `%${options.q.trim()}%`;
    const orExpr = or(
      ilike(users.phone, pat),
      ilike(users.email, pat),
      ilike(candidateProfiles.firstName, pat),
      ilike(candidateProfiles.lastName, pat),
      ilike(employerProfiles.companyName, pat),
    );
    if (orExpr) conditions.push(orExpr);
  }
  if (options.role) {
    conditions.push(eq(users.role, options.role));
  }
  const whereExpr = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: users.id,
        phone: users.phone,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        firstName: candidateProfiles.firstName,
        lastName: candidateProfiles.lastName,
        isBoosted: candidateProfiles.isBoosted,
        companyName: employerProfiles.companyName,
        isVerified: employerProfiles.isVerified,
      })
      .from(users)
      .leftJoin(candidateProfiles, eq(candidateProfiles.userId, users.id))
      .leftJoin(employerProfiles, eq(employerProfiles.userId, users.id))
      .where(whereExpr)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .leftJoin(candidateProfiles, eq(candidateProfiles.userId, users.id))
      .leftJoin(employerProfiles, eq(employerProfiles.userId, users.id))
      .where(whereExpr),
  ]);

  return { rows, total: count ?? 0, pageSize: PAGE_SIZE };
}

export async function listAdminJobs(options: {
  page?: number;
  q?: string;
  status?: "active" | "closed" | "expired";
}) {
  const page = Math.max(1, options.page ?? 1);
  const conditions = [];
  if (options.q?.trim()) {
    const pat = `%${options.q.trim()}%`;
    const orExpr = or(
      ilike(jobOffers.title, pat),
      ilike(jobOffers.city, pat),
      ilike(employerProfiles.companyName, pat),
    );
    if (orExpr) conditions.push(orExpr);
  }
  if (options.status) {
    conditions.push(eq(jobOffers.status, options.status));
  }
  const whereExpr = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: jobOffers.id,
        title: jobOffers.title,
        type: jobOffers.type,
        city: jobOffers.city,
        status: jobOffers.status,
        publishedAt: jobOffers.publishedAt,
        employerId: employerProfiles.userId,
        companyName: employerProfiles.companyName,
        isVerified: employerProfiles.isVerified,
      })
      .from(jobOffers)
      .leftJoin(employerProfiles, eq(jobOffers.employerId, employerProfiles.userId))
      .where(whereExpr)
      .orderBy(desc(jobOffers.publishedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobOffers)
      .leftJoin(employerProfiles, eq(jobOffers.employerId, employerProfiles.userId))
      .where(whereExpr),
  ]);
  return { rows, total: count ?? 0, pageSize: PAGE_SIZE };
}

export async function listAdminSubscriptions(options: { page?: number }) {
  const page = Math.max(1, options.page ?? 1);
  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: subscriptions.id,
        plan: subscriptions.plan,
        status: subscriptions.status,
        startedAt: subscriptions.startedAt,
        expiresAt: subscriptions.expiresAt,
        userId: users.id,
        phone: users.phone,
        email: users.email,
        role: users.role,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.startedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscriptions),
  ]);
  return { rows, total: count ?? 0, pageSize: PAGE_SIZE };
}

export async function listAdminPayments(options: {
  page?: number;
  status?: "pending" | "success" | "failed";
}) {
  const page = Math.max(1, options.page ?? 1);
  const conditions = options.status
    ? [eq(payments.status, options.status)]
    : [];
  const whereExpr = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: payments.id,
        plan: payments.plan,
        amount: payments.amount,
        status: payments.status,
        operator: payments.operator,
        phone: payments.phone,
        merchantRef: payments.pvitMerchantReference,
        transactionId: payments.pvitTransactionId,
        createdAt: payments.createdAt,
        completedAt: payments.completedAt,
        userId: users.id,
        userPhone: users.phone,
        userEmail: users.email,
      })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .where(whereExpr)
      .orderBy(desc(payments.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .where(whereExpr),
  ]);
  return { rows, total: count ?? 0, pageSize: PAGE_SIZE };
}
