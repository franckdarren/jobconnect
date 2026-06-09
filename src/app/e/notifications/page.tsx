import { requireRole } from "@/lib/auth";
import { listNotifications } from "@/features/notifications/queries";
import { NotificationsList } from "@/components/shared/NotificationsList";

export default async function EmployerNotificationsPage() {
  const user = await requireRole("employer");
  const items = await listNotifications(user.id, { limit: 50 });
  return (
    <NotificationsList
      initial={items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
        metadata: n.metadata as Record<string, unknown> | null,
      }))}
    />
  );
}
