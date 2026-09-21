"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email/username and password.");
      return;
    }

    if (rememberMe) {
      localStorage.setItem("pramaan_setu_logged_in", "true");
    } else {
      sessionStorage.setItem("pramaan_setu_logged_in", "true");
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f7f1e7] text-[#272322]">
      <div className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-3 shadow-md">
              <img
                src="/pramaan-setu-logo.jpeg"
                alt="PRAMAAN SETU"
                className="h-full w-full object-contain"
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#6f1734]">
              PRAMAAN SETU
            </h1>

            <p className="mt-2 text-sm font-medium text-[#514946]">
              Indian Standards Intelligence Engine
            </p>

            <p className="mt-3 text-xs text-[#746b66]">
              AI-powered intelligence for applicable Indian Standards
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfd3c5] bg-white p-7 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#292323]">
                Secure Access
              </h2>

              <p className="mt-1 text-sm text-[#746b66]">
                Sign in to access the procurement intelligence dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#39312e]"
                >
                  Email / Username
                </label>

                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter your email or username"
                  className="w-full rounded-lg border border-[#cfc3b8] bg-white px-4 py-3 text-sm text-[#272322] outline-none transition placeholder:text-[#9a918c] focus:border-[#8b2948] focus:ring-2 focus:ring-[#8b2948]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-[#39312e]"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-[#cfc3b8] bg-white px-4 py-3 text-sm text-[#272322] outline-none transition placeholder:text-[#9a918c] focus:border-[#8b2948] focus:ring-2 focus:ring-[#8b2948]/20"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#5b514c]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 accent-[#7b1e3b]"
                  />

                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="text-sm font-medium text-[#7b1e3b] hover:underline"
                  onClick={() => {
                    setError("Password recovery is not enabled in this demo.");
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="rounded-lg border border-[#e2b8b8] bg-[#fff4f4] px-4 py-3 text-sm text-[#8b3030]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-[#7b1e3b] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#64162f] focus:outline-none focus:ring-2 focus:ring-[#c59a3d] focus:ring-offset-2"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 border-t border-[#eee5dc] pt-5 text-center">
              <p className="text-xs text-[#817872]">
                Secure procurement intelligence workspace
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#8a817b]">
            PRAMAAN SETU • Indian Standards Intelligence Engine
          </p>
        </div>
      </div>
    </main>
  );
}