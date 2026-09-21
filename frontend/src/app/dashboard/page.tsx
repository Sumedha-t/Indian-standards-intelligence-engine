"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AnalyzeResponse = {
  extracted_requirements: {
    product_type: string;
    intended_use: string;
    technical_requirements: {
      parameter: string;
      value: string;
      unit: string;
    }[];
    safety_requirements: string[];
    performance_requirements: string[];
    environmental_requirements: string[];
  };

  product_classification: {
    product_name: string;
    normalized_product: string;
    category: string;
    sub_category: string;
    keywords: string[];
  };

  recommended_standards: {
    is_number: string;
    title: string;
    scope: string;
    relevance_reason: string;
    match_score: number;
    status: string;
    revision: string;
    amendments: string[];
    source: string;
  }[];

  related_standards: {
    is_number: string;
    title: string;
    relationship_type: string;
    related_to: string;
    reason: string;
    source: string;
  }[];

  lifecycle: {
    is_number: string;
    status: string;
    revision: string;
    review_or_reaffirmation: string;
    amendments: string[];
    superseded_by: string | null;
    source: string;
  }[];

  regulations: {
    notification_number: string;
    title: string;
    authority: string;
    date: string;
    affected_standard: string;
    implementation_information: string;
    source: string;
  }[];

  certifications: {
    scheme: string;
    applicability: string;
    product_category: string;
    standard: string;
    implementation_information: string;
    source: string;
  }[];

  confidence: {
    overall: number;
    classification: number;
    retrieval: number;
    explanation: number | string;
  };

  warnings: string[];

  evidence: {
    type: string;
    reference: string;
    source: string;
    supporting_information: string;
  }[];
};

const analysisItems = [
  {
    label: "Extracted Requirements",
    path: "/dashboard/extracted-requirements",
  },
  {
    label: "Product Classification",
    path: "/dashboard/product-classification",
  },
  {
    label: "Recommended Standards",
    path: "/dashboard/recommended-standards",
  },
  {
    label: "Related Standards",
    path: "/dashboard/related-standards",
  },
  {
    label: "Lifecycle & Status",
    path: "/dashboard/lifecycle-status",
  },
  {
    label: "Regulatory Information",
    path: "/dashboard/regulatory-information",
  },
  {
    label: "Certifications",
    path: "/dashboard/certifications",
  },
  {
    label: "Confidence & Warnings",
    path: "/dashboard/confidence-warnings",
  },
  {
    label: "Evidence / Sources",
    path: "/dashboard/evidence-sources",
  },
  {
    label: "Knowledge Graph",
    path: "/dashboard/knowledge-graph",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [fileError, setFileError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    const loggedIn =
      localStorage.getItem("pramaan_setu_logged_in") === "true" ||
      sessionStorage.getItem("pramaan_setu_logged_in") === "true";

    if (!loggedIn) {
      router.replace("/login");
      return;
    }

    const storedResult = sessionStorage.getItem(
      "pramaan_setu_analysis_result",
    );

    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult));
      } catch {
        setResult(null);
      }
    }

    setIsCheckingAuth(false);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("pramaan_setu_logged_in");
    sessionStorage.removeItem("pramaan_setu_logged_in");
    sessionStorage.removeItem("pramaan_setu_analysis_result");

    router.push("/login");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      setFileError("");
      return;
    }

    if (file.type !== "application/pdf") {
      setSelectedFile(null);
      setFileError("Please select a PDF file.");
      return;
    }

    setSelectedFile(file);
    setFileError("");
    setAnalysisError("");
  }

  async function handleAnalyze() {
    if (!text.trim() && !selectedFile) {
      setAnalysisError(
        "Please enter a procurement requirement or upload a PDF before analyzing.",
      );
      return;
    }

    setAnalysisError("");
    setIsAnalyzing(true);

    try {
      let response: Response;

      if (selectedFile) {
        const formData = new FormData();

        formData.append("file", selectedFile);
        formData.append("language", language);

        response = await fetch(`${API_BASE_URL}/analyze/pdf`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text.trim(),
            document: null,
            language,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data?.detail?.message === "string"
            ? data.detail.message
            : "Analysis could not be completed. Please try again.";

        throw new Error(message);
      }

      sessionStorage.setItem(
        "pramaan_setu_analysis_result",
        JSON.stringify(data),
      );

      setResult(data);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Analysis could not be completed. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function openAnalysisSection(path: string) {
    router.push(path);
  }

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f1e7]">
        <div className="text-center">
          <img
            src="/pramaan-setu-logo.jpeg"
            alt="PRAMAAN SETU"
            className="mx-auto h-20 w-20 rounded-xl object-contain"
          />

          <p className="mt-4 text-sm font-semibold text-[#6f1734]">
            Loading PRAMAAN SETU...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f1e7] text-[#302725]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 bg-[#64162f] text-white lg:block">
        <SidebarContent
          onNavigate={(path) => router.push(path)}
          onLogout={handleLogout}
        />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />

          <aside className="relative h-full w-72 bg-[#64162f] text-white">
            <SidebarContent
              onNavigate={(path) => {
                setSidebarOpen(false);
                router.push(path);
              }}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-[#dfd3c5] bg-[#f7f1e7]/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-5 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg border border-[#d6c9be] bg-white px-3 py-2 text-sm lg:hidden"
              >
                ☰
              </button>

              <div>
                <h1 className="font-bold text-[#6f1734]">
                  PRAMAAN SETU
                </h1>

                <p className="text-xs text-[#706661]">
                  Indian Standards Intelligence Engine
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-4 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold">Demo User</p>

                <p className="text-xs text-[#706661]">
                  Procurement Workspace
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-[#cfc3b8] bg-white px-3 py-2 text-sm font-semibold text-[#6f1734] hover:bg-[#faf7f2]"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 lg:px-8">
          <section className="rounded-2xl bg-[#6f1734] p-6 shadow-lg sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e7c875]">
              Procurement Intelligence
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              PRAMAAN SETU Dashboard
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
              Analyze a procurement requirement or tender document and explore
              applicable Indian Standards, compliance information, lifecycle
              status, evidence, and relationships.
            </p>

            <div className="mt-7 rounded-2xl bg-white p-5 shadow-xl sm:p-6">
              <label
                htmlFor="requirement"
                className="mb-2 block text-sm font-bold"
              >
                Procurement Requirement
              </label>

              <textarea
                id="requirement"
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setAnalysisError("");
                }}
                placeholder="Example: Laptop computers for government office employees with electrical safety and information technology requirements"
                rows={6}
                className="w-full resize-none rounded-xl border border-[#cfc3b8] bg-[#fffdfa] px-4 py-3 text-sm text-[#302725] outline-none focus:border-[#8b2948] focus:ring-2 focus:ring-[#8b2948]/20"
              />

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#e6ddd5]" />

                <span className="text-xs font-bold uppercase tracking-widest text-[#9a8e87]">
                  OR
                </span>

                <div className="h-px flex-1 bg-[#e6ddd5]" />
              </div>

              <div className="grid gap-5 md:grid-cols-[1fr_220px]">
                <div>
                  <label
                    htmlFor="pdf"
                    className="mb-2 block text-sm font-bold"
                  >
                    Tender / Specification PDF
                  </label>

                  <label
                    htmlFor="pdf"
                    className="flex min-h-20 cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed border-[#bcae9f] bg-[#faf7f2] px-4 py-3 hover:border-[#8b2948]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#4d433e]">
                        {selectedFile
                          ? selectedFile.name
                          : "Upload a tender or specification PDF"}
                      </p>

                      <p className="mt-1 text-xs text-[#827872]">
                        PDF files only
                      </p>
                    </div>

                    <span className="rounded-lg bg-[#eee3d7] px-3 py-2 text-xs font-bold text-[#6f1734]">
                      Browse
                    </span>
                  </label>

                  <input
                    id="pdf"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {fileError && (
                    <p className="mt-2 text-xs font-semibold text-[#9a3838]">
                      {fileError}
                    </p>
                  )}

                  {selectedFile && (
                    <div className="mt-3 rounded-lg border border-[#dfd3c5] bg-[#fffaf4] px-3 py-2 text-xs">
                      <span className="font-bold">
                        Selected document:
                      </span>{" "}
                      {selectedFile.name}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="language"
                    className="mb-2 block text-sm font-bold"
                  >
                    Language
                  </label>

                  <select
                    id="language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="w-full rounded-xl border border-[#cfc3b8] bg-white px-4 py-3 text-sm outline-none focus:border-[#8b2948] focus:ring-2 focus:ring-[#8b2948]/20"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="kn">Kannada</option>
                  </select>
                </div>
              </div>

              {analysisError && (
                <div className="mt-5 rounded-xl border border-[#dfbaba] bg-[#fff5f5] p-4">
                  <p className="font-semibold text-[#8b3030]">
                    Analysis could not be completed.
                  </p>

                  <p className="mt-1 text-sm text-[#8b3030]/80">
                    {analysisError}
                  </p>

                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="mt-3 rounded-lg bg-[#7b1e3b] px-4 py-2 text-xs font-bold text-white"
                  >
                    Retry
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="mt-5 rounded-xl border border-[#dfd3c5] bg-[#faf7f2] p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-[#7b1e3b]/20" />

                    <div>
                      <p className="font-bold">
                        Analyzing procurement requirement...
                      </p>

                      <p className="mt-1 text-xs text-[#706661]">
                        Preparing standards intelligence and evidence-backed
                        results.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-4 border-t border-[#eee5dc] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#827872]">
                  Natural-language requirements and tender PDFs are supported.
                </p>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="rounded-xl bg-[#7b1e3b] px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-[#64162f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Requirement"}
                </button>
              </div>
            </div>
          </section>

          {result && (
            <section className="mt-8">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-[#302725]">
                  Analysis Overview
                </h2>

                <p className="mt-1 text-sm text-[#706661]">
                  Summary of the latest procurement intelligence analysis.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Product"
                  value={result.product_classification.product_name}
                />

                <SummaryCard
                  title="Category"
                  value={result.product_classification.category}
                />

                <SummaryCard
                  title="Top Recommendation"
                  value={
                    result.recommended_standards[0]?.is_number || "—"
                  }
                />

                <SummaryCard
                  title="Overall Confidence"
                  value={`${Math.round(
                    result.confidence.overall * 100,
                  )}%`}
                />

                <SummaryCard
                  title="Standards Identified"
                  value={String(
                    result.recommended_standards.length +
                      result.related_standards.length,
                  )}
                />

                <SummaryCard
                  title="Warnings"
                  value={String(result.warnings.length)}
                />

                <SummaryCard
                  title="Evidence Sources"
                  value={String(result.evidence.length)}
                />

                <div className="rounded-2xl border border-[#d6bd7c] bg-[#fff8e7] p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#80631f]">
                    Explore Results
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      openAnalysisSection(
                        "/dashboard/recommended-standards",
                      )
                    }
                    className="mt-3 rounded-lg bg-[#7b1e3b] px-4 py-2 text-sm font-bold text-white"
                  >
                    View Standards
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    openAnalysisSection(
                      "/dashboard/extracted-requirements",
                    )
                  }
                  className="rounded-2xl border border-[#dfd3c5] bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-[#9b7930]">
                    Analysis
                  </p>

                  <h3 className="mt-2 text-lg font-bold">
                    Extracted Requirements
                  </h3>

                  <p className="mt-2 text-sm text-[#706661]">
                    View the requirements extracted from the submitted
                    procurement input.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openAnalysisSection(
                      "/dashboard/knowledge-graph",
                    )
                  }
                  className="rounded-2xl border border-[#dfd3c5] bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-[#9b7930]">
                    Relationships
                  </p>

                  <h3 className="mt-2 text-lg font-bold">
                    Knowledge Graph
                  </h3>

                  <p className="mt-2 text-sm text-[#706661]">
                    Explore relationships between the product, standards,
                    regulations, and compliance information.
                  </p>
                </button>
              </div>
            </section>
          )}

          {!result && (
            <section className="mt-8 rounded-2xl border border-[#dfd3c5] bg-white p-6">
              <div className="flex items-center gap-4">
                <img
                  src="/pramaan-setu-logo.jpeg"
                  alt="PRAMAAN SETU"
                  className="h-16 w-16 rounded-xl object-contain"
                />

                <div>
                  <h3 className="font-bold text-[#6f1734]">
                    Evidence-backed standards intelligence
                  </h3>

                  <p className="mt-1 text-sm text-[#706661]">
                    Submit a procurement requirement to begin the analysis.
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dfd3c5] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#827872]">
        {title}
      </p>

      <p className="mt-2 text-lg font-bold text-[#302725]">{value}</p>
    </div>
  );
}

function SidebarContent({
  onNavigate,
  onLogout,
}: {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white p-1.5">
            <img
              src="/pramaan-setu-logo.jpeg"
              alt="PRAMAAN SETU"
              className="h-full w-full object-contain"
            />
          </div>

          <div>
            <p className="font-bold">PRAMAAN SETU</p>

            <p className="text-[10px] leading-tight text-[#e7c875]">
              Indian Standards
              <br />
              Intelligence Engine
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7bd80]">
          Workspace
        </p>

        <nav>
          <button
            type="button"
            onClick={() => onNavigate("/dashboard")}
            className="w-full rounded-lg bg-white/15 px-3 py-2.5 text-left text-sm font-bold text-white"
          >
            Dashboard & Analyze
          </button>
        </nav>

        <p className="mt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7bd80]">
          Analysis
        </p>

        <nav className="space-y-1">
          {analysisItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-xl bg-white/10 p-3">
          <p className="text-xs text-white/60">Signed in as</p>
          <p className="mt-1 text-sm font-semibold">Demo User</p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm font-semibold hover:bg-white/10"
        >
          Logout
        </button>
      </div>
    </div>
  );
}