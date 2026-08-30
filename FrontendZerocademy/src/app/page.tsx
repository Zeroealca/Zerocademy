import { redirect } from "next/navigation";

export default function HomePage() {
  // Unauthenticated entry point. LoginPage sends already-signed-in users to /dashboard.
  redirect("/login");
}
