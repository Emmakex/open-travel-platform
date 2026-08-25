import { requireStaffCapability } from "@/lib/require-staff-capability";

export default async function OperatorMediaLayout({ children }: { children: React.ReactNode }) {
  await requireStaffCapability("catalogue");
  return children;
}
