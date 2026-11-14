import { AuditLog } from "@/lib/models";
export async function audit(user, action, entity, entityId, details = {}, session = null) {
  const doc = { user: user?.id, userName: user?.name, role: user?.role, action, entity, entityId: entityId ? String(entityId) : undefined, details };
  await AuditLog.create([doc], session ? { session } : undefined);
}
