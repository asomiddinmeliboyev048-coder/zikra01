import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import OnboardingForm from "./OnboardingForm";
import {
  getCurrentProfile,
  getSkills,
  getUserSkills,
} from "@/lib/queries";

export const metadata: Metadata = { title: "Profilni sozlash" };

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [skills, userSkills] = await Promise.all([
    getSkills(),
    getUserSkills(profile.id),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50/50 to-[#f7f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl animate-fade-in">
        <div className="mb-6 flex justify-center">
          <Logo size="md" />
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Profilingizni sozlang
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sizga mos hamkorlarni topishimiz uchun bir necha ma&apos;lumot
            kiriting.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <OnboardingForm
            skills={skills}
            defaults={{
              full_name: profile.full_name,
              username: profile.username ?? "",
              city: profile.city ?? "",
              bio: profile.bio ?? "",
              avatar_url: profile.avatar_url ?? "",
              teach: userSkills.teach.map((s) => s.id),
              learn: userSkills.learn.map((s) => s.id),
            }}
          />
        </div>
      </div>
    </main>
  );
}
