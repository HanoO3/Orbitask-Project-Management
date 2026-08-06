import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin/dashboard");
    case "PROJECT_MANAGER":
      redirect("/manager/dashboard");
    case "TEAM_MEMBER":
      redirect("/member/dashboard");
    default:
      redirect("/login");
  }
}