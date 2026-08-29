import { redirect } from "next/navigation";

export default function KamarPage() {
  // Route merged into Properti page which now contains both Properti & Kamar UI
  redirect("/dashboard/owner/properti");
}
