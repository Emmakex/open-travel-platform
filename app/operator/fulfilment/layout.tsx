import { requireStaffCapability } from "@/lib/require-staff-capability";

export default async function OperatorFulfilmentLayout({ children }: { children: React.ReactNode }) {
  await requireStaffCapability("suppliers");
  return children;
}
