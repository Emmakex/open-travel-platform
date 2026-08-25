import { requireStaffCapability } from "@/lib/require-staff-capability";

export default async function OperatorTasksLayout({ children }: { children: React.ReactNode }) {
  await requireStaffCapability("tasks");
  return children;
}
