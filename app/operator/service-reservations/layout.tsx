import { requireStaffCapability } from "@/lib/require-staff-capability";

export default async function OperatorServiceReservationsLayout({ children }: { children: React.ReactNode }) {
  await requireStaffCapability("reservations");
  return children;
}
