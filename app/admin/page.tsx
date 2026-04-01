import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminIndex() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  redirect("/admin/dashboard");
}
