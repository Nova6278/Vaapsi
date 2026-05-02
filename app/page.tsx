import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Vaapsi</h1>
      <p className="text-gray-400 text-lg mb-2">
        KIIT's Lost & Found platform.
      </p>
      <p className="text-gray-500 text-sm mb-10 max-w-sm">
        Lost something on campus? Found something that is not yours? Vaapsi
        connects KIIT students to reunite lost items with their owners.
      </p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-2 rounded-lg border border-gray-600 text-sm font-medium hover:border-gray-400 transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="px-6 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Sign up
        </Link>
      </div>

      <div className="mt-16 text-xs text-gray-600">
        Already have an account?{" "}
        <Link href="/dashboard" className="underline hover:text-gray-400">
          Go to dashboard →
        </Link>
      </div>
    </main>
  );
}