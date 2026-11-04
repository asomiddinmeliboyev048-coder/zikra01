import type { Metadata } from "next";
import LearningExperienceLab from "./LearningExperienceLab";

export const metadata: Metadata = {
  title: "Learning Experience Lab",
  description: "Zikra o‘rganish tajribasining mustaqil UX prototipi.",
};

export default function LearningExperienceLabPage() {
  return <LearningExperienceLab />;
}
