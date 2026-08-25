"use server";

import { redirect } from "next/navigation";
import { requireAdminIdentity } from "@/lib/require-admin-identity";
import {
  createStaffUser,
  listStaffUsers,
  setStaffUserStatus,
  type StaffRole
} from "@/lib/staff-auth";
import { setExplicitStaffCapabilities } from "@/lib/staff-permissions";
import { normalizeStaffCapabilities } from "@/lib/staff-capabilities";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function values(formData: FormData, key: string) {
  return formData.getAll(key).filter((item): item is string => typeof item === "string");
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function validRole(role: string): role is StaffRole {
  return role === "operator" || role === "admin";
}

export async function createStaffAccountAction(formData: FormData) {
  const admin = await requireAdminIdentity();

  const displayName = value(formData, "displayName");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const role = value(formData, "role");
  const capabilities = normalizeStaffCapabilities(values(formData, "capabilities"));

  if (
    !displayName || displayName.length > 100 ||
    !validEmail(email) ||
    password.length < 12 || password.length > 128 ||
    !validRole(role)
  ) {
    redirect("/operator/staff?error=validation");
  }

  try {
    const created = await createStaffUser({ displayName, email, password, role });
    if (role === "operator") {
      await setExplicitStaffCapabilities({
        userId: created.id,
        capabilities,
        updatedBy: admin.id
      });
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EMAIL_EXISTS") {
      redirect("/operator/staff?error=email-exists");
    }
    throw error;
  }

  redirect("/operator/staff?created=1");
}

export async function setStaffCapabilitiesAction(formData: FormData) {
  const identity = await requireAdminIdentity();
  const userId = value(formData, "userId");
  if (!userId) redirect("/operator/staff?error=invalid-request");

  const users = await listStaffUsers();
  const target = users.find((user) => user.id === userId);
  if (!target) redirect("/operator/staff?error=not-found");
  if (target.role === "admin") redirect("/operator/staff?error=admin-capabilities");

  await setExplicitStaffCapabilities({
    userId,
    capabilities: values(formData, "capabilities"),
    updatedBy: identity.id
  });
  redirect("/operator/staff?permissionsUpdated=1");
}

export async function setStaffStatusAction(formData: FormData) {
  const identity = await requireAdminIdentity();
  const userId = value(formData, "userId");
  const status = value(formData, "status");

  if (!userId || (status !== "active" && status !== "disabled")) {
    redirect("/operator/staff?error=invalid-request");
  }

  if (identity.id === userId && status === "disabled") {
    redirect("/operator/staff?error=self-disable");
  }

  const users = await listStaffUsers();
  const target = users.find((user) => user.id === userId);
  if (!target) redirect("/operator/staff?error=not-found");

  if (target.role === "admin" && status === "disabled") {
    const activeAdmins = users.filter((user) => user.role === "admin" && user.status === "active");
    if (activeAdmins.length <= 1) redirect("/operator/staff?error=last-admin");
  }

  await setStaffUserStatus(userId, status);
  redirect(`/operator/staff?updated=${status}`);
}
