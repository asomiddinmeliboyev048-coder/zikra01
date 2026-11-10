import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// The old chat landing page is intentionally removed.
// Start directly at tutor selection in the 3D Avatar Studio.
export default function AiTutorPage() {
  redirect("/ai-ustoz/studio");
}
