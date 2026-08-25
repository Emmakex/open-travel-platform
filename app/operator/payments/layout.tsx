import { requireStaffCapability } from "@/lib/require-staff-capability";

export default async function OperatorPaymentsLayout({ children }: { children: React.ReactNode }) {
  await requireStaffCapability("finance");
  return children;
}
