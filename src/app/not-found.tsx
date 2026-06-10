import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo size="lg" />
      <h1 className="mt-4 text-6xl font-extrabold text-brand">404</h1>
      <p className="text-lg font-semibold text-gray-900">Sahifa topilmadi</p>
      <p className="max-w-md text-sm text-gray-500">
        Siz qidirgan sahifa mavjud emas yoki ko&apos;chirilgan.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
