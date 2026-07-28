import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect root traffic directly to the Sign-In page
  redirect("/signin");
}