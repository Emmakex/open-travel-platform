import type { OperationsTaskTargetType, StaffRole } from "@/domain/operations/types";
import { identityConfig } from "@/lib/identity-config";
import {
  listOperationsTaskComments,
  listOperationsTaskEvents,
  listOperationsTasksForTarget
} from "@/lib/operations-tasks";
import { listStaffUsers } from "@/lib/staff-auth";

export async function loadOperationsTaskView(
  targetType: OperationsTaskTargetType,
  targetId: string,
  currentStaff: { id: string; displayName: string; role: StaffRole }
) {
  const [tasks, persistentStaff] = await Promise.all([
    listOperationsTasksForTarget(targetType, targetId),
    identityConfig.staffAuthEnabled ? listStaffUsers() : Promise.resolve([])
  ]);
  const staffOptions = persistentStaff.length
    ? persistentStaff.map((member) => ({ id: member.id, displayName: member.displayName, role: member.role, status: member.status }))
    : [{ id: currentStaff.id, displayName: currentStaff.displayName, role: currentStaff.role, status: "active" as const }];
  const histories = Object.fromEntries(await Promise.all(tasks.map(async (task) => [
    task.id,
    {
      events: await listOperationsTaskEvents(task.id),
      comments: await listOperationsTaskComments(task.id)
    }
  ])));
  return { tasks, histories, staffOptions };
}
