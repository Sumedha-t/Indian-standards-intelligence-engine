"use client";

import { useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type MockResponse = {
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
    relationship_type:
      | "NORMATIVE_REFERENCE"
      | "TEST_METHOD"
      | "SAFETY_STANDARD"
      | "MATERIAL_STANDARD"
      | "RELATED_STANDARD"
      | "SUPERSEDES";
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
    superseded_by: string;
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
    explanation: number;
  };

  warnings: string[];

  evidence: {
    type: string;
    reference: string;
    source: string;
    supporting_information: string;
  }[];
};

const mockResponse: MockResponse = {
  extracted_requirements: {
    product_type: "Wi-Fi router",
    intended_use: "Government office networking",

    technical_requirements: [
      {
        parameter: "Wireless networking",
        value: "Wi-Fi",
        unit: "",
      },
      {
        parameter: "Intended environment",
        value: "Office",
        unit: "",
      },
    ],

    safety_requirements: [],
    performance_requirements: [],
    environmental_requirements: [],
  },

  product_classification: {
    product_name: "Wi-Fi Router",
    normalized_product: "Wireless Networking Router",
    category: "Electronics / IT",
    sub_category: "Networking Equipment",
    keywords: ["Wi-Fi", "router", "wireless", "networking"],
  },

  recommended_standards: [
    {
      is_number: "<VERIFIED_IS_NUMBER_FROM_DATASET>",
      title: "<VERIFIED_STANDARD_TITLE_FROM_DATASET>",
      scope: "<VERIFIED_SCOPE_FROM_DATASET>",
      relevance_reason:
        "This field will be populated from the verified standards dataset.",
      match_score: 0,
      status: "Awaiting verified data",
      revision: "Awaiting verified data",
      amendments: [],
      source: "<VERIFIED_SOURCE_URL_FROM_DATASET>",
    },
  ],

  related_standards: [
    {
      is_number: "<VERIFIED_IS_NUMBER_FROM_DATASET>",
      title: "<VERIFIED_STANDARD_TITLE_FROM_DATASET>",
      relationship_type: "RELATED_STANDARD",
      related_to: "<RELATED_STANDARD_ID>",
      reason:
        "Relationship information will be populated from the verified knowledge graph.",
      source: "<VERIFIED_SOURCE_URL_FROM_DATASET>",
    },
  ],

  lifecycle: [
    {
      is_number: "<VERIFIED_IS_NUMBER_FROM_DATASET>",
      status: "Awaiting verified data",
      revision: "Awaiting verified data",
      review_or_reaffirmation: "Awaiting verified data",
      amendments: [],
      superseded_by: "",
      source: "<VERIFIED_SOURCE_URL_FROM_DATASET>",
    },
  ],

  regulations: [
    {
      notification_number: "<VERIFIED_NOTIFICATION_NUMBER>",
      title: "<VERIFIED_REGULATION_TITLE>",
      authority: "<VERIFIED_AUTHORITY>",
      date: "<VERIFIED_DATE>",
      affected_standard: "<VERIFIED_STANDARD>",
      implementation_information:
        "Regulatory information will be populated from verified sources.",
      source: "<VERIFIED_SOURCE_URL>",
    },
  ],

  certifications: [
    {
      scheme: "<VERIFIED_CERTIFICATION_SCHEME>",
      applicability: "To be determined from verified regulatory data.",
      product_category: "Networking Equipment",
      standard: "<VERIFIED_STANDARD>",
      implementation_information:
        "Certification information will be populated from verified sources.",
      source: "<VERIFIED_SOURCE_URL>",
    },
  ],

  confidence: {
    overall: 0,
    classification: 0,
    retrieval: 0,
    explanation: 0,
  },

  warnings: [
    "This is mock development data. No actual BIS standard recommendation is being made.",
    "Final recommendations must be based on verified standards and regulatory sources.",
  ],

  evidence: [
    {
      type: "Dataset",
      reference: "<VERIFIED_DATASET_REFERENCE>",
      source: "<VERIFIED_SOURCE_URL>",
      supporting_information:
        "Evidence will be populated by the backend using verified sources.",
    },
  ],
};

const graphNodes: Node[] = [
  {
    id: "product",
    position: { x: 0, y: 100 },
    data: { label: "Wi-Fi Router" },
  },
  {
    id: "recommended",
    position: { x: 300, y: 0 },
    data: { label: "Recommended Standard" },
  },
  {
    id: "related",
    position: { x: 300, y: 200 },
    data: { label: "Related Standard" },
  },
  {
    id: "regulation",
    position: { x: 650, y: 100 },
    data: { label: "Regulatory Information" },
  },
];

const graphEdges: Edge[] = [
  {
    id: "edge-1",
    source: "product",
    target: "recommended",
    label: "RELATED_STANDARD",
  },
  {
    id: "edge-2",
    source: "recommended",
    target: "related",
    label: "NORMATIVE_REFERENCE",
  },
  {
    id: "edge-3",
    source: "related",
    target: "regulation",
    label: "SAFETY_STANDARD",
  },
];

export default function Home() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MockResponse | null>(null);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    setFileError("");
    setSelectedFile(null);

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setFileError("Please upload a PDF file.");
      return;
    }

    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    setAnalysisError("");

    if (!text.trim() && !selectedFile) {
      setAnalysisError(
        "Please enter a procurement requirement or upload a PDF."
      );
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      // Mock API mode for frontend development.
      // Later this will connect to:
      // POST /analyze
      // POST /analyze/pdf

      await new Promise((resolve) => setTimeout(resolve, 1200));

      console.log("API base URL:", API_BASE_URL);
      console.log("Selected language:", language);
      console.log("Selected file:", selectedFile?.name);

      setResult(mockResponse);
    } catch {
      setAnalysisError(
        "Unable to analyze the requirement. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER */}
        <header className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide !text-[#1d4ed8]">
            SIH26108
          </p>

          <h1 className="text-3xl font-bold !text-[#0f172a]">
            Indian Standards Intelligence Engine
          </h1>

          <p className="mt-2 max-w-3xl text-base !text-[#334155]">
            AI-powered recommendation engine for identifying applicable Indian
            Standards for procurement specifications.
          </p>
        </header>

        {/* INPUT SECTION */}
        <section className="rounded-2xl border border-[#cbd5e1] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold !text-[#0f172a]">
              Procurement Requirement
            </h2>

            <p className="mt-1 text-sm !text-[#334155]">
              Describe the product, technical specifications, and intended use,
              or upload a tender/procurement PDF.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* TEXT INPUT */}
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-semibold !text-[#0f172a]">
                Natural-language requirement
              </label>

              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Example: I need Wi-Fi routers for a government office. The routers should support wireless networking and be suitable for office use."
                className="min-h-40 w-full rounded-xl border border-[#94a3b8] bg-white p-4 text-sm !text-[#0f172a] outline-none transition placeholder:!text-[#64748b] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* LANGUAGE + PDF */}
            <div>
              <label className="mb-2 block text-sm font-semibold !text-[#0f172a]">
                Language
              </label>

              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full rounded-xl border border-[#94a3b8] bg-white p-3 text-sm !text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="kn">Kannada</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
              </select>

              <label className="mt-6 mb-2 block text-sm font-semibold !text-[#0f172a]">
                Tender / specification PDF
              </label>

              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="block w-full rounded-xl border border-[#94a3b8] bg-white p-3 text-sm !text-[#0f172a] file:mr-4 file:rounded-lg file:border-0 file:bg-[#e2e8f0] file:px-3 file:py-2 file:font-semibold file:!text-[#0f172a]"
              />

              {selectedFile && (
                <div className="mt-3 rounded-lg bg-[#f1f5f9] p-3 text-sm font-medium !text-[#0f172a]">
                  Selected: {selectedFile.name}
                </div>
              )}

              {fileError && (
                <p className="mt-2 text-sm font-semibold !text-[#dc2626]">
                  {fileError}
                </p>
              )}
            </div>
          </div>

          {/* ERROR */}
          {analysisError && (
            <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold !text-[#b91c1c]">
              {analysisError}
            </div>
          )}

          {/* BUTTON */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="mt-6 rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-bold !text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Requirement"}
          </button>
        </section>

        {/* RESULTS */}
        {result && (
          <section className="mt-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold !text-[#0f172a]">
                Analysis Results
              </h2>

              <p className="mt-1 text-sm !text-[#334155]">
                Structured procurement intelligence generated from the
                requirement.
              </p>
            </div>

            {/* EXTRACTED REQUIREMENTS */}
            <ResultSection title="Extracted Requirements">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  title="Product Type"
                  value={result.extracted_requirements.product_type}
                />

                <InfoCard
                  title="Intended Use"
                  value={result.extracted_requirements.intended_use}
                />
              </div>

              <div className="mt-4 rounded-xl border border-[#cbd5e1] p-4">
                <h4 className="font-bold !text-[#0f172a]">
                  Technical Requirements
                </h4>

                <div className="mt-3 space-y-2">
                  {result.extracted_requirements.technical_requirements.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="flex justify-between rounded-lg bg-[#f1f5f9] p-3 text-sm"
                      >
                        <span className="font-medium !text-[#0f172a]">
                          {item.parameter}
                        </span>

                        <span className="font-bold !text-[#0f172a]">
                          {item.value} {item.unit}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </ResultSection>

            {/* CLASSIFICATION */}
            <ResultSection title="Product Classification">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  title="Product"
                  value={result.product_classification.product_name}
                />

                <InfoCard
                  title="Normalized Product"
                  value={result.product_classification.normalized_product}
                />

                <InfoCard
                  title="Category"
                  value={result.product_classification.category}
                />

                <InfoCard
                  title="Sub-category"
                  value={result.product_classification.sub_category}
                />
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold !text-[#0f172a]">
                  Keywords
                </p>

                <div className="flex flex-wrap gap-2">
                  {result.product_classification.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold !text-[#1e40af]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </ResultSection>

            {/* RECOMMENDED STANDARDS */}
            <ResultSection title="Recommended Standards">
              <div className="space-y-4">
                {result.recommended_standards.map((standard, index) => (
                  <RecommendationCard
                    key={index}
                    standard={standard}
                  />
                ))}
              </div>
            </ResultSection>

            {/* RELATED STANDARDS */}
            <ResultSection title="Related / Allied Standards">
              <div className="space-y-4">
                {result.related_standards.map((standard, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[#cbd5e1] p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold !text-[#0f172a]">
                          {standard.is_number}
                        </p>

                        <p className="text-sm !text-[#334155]">
                          {standard.title}
                        </p>
                      </div>

                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold !text-[#6b21a8]">
                        {standard.relationship_type}
                      </span>
                    </div>

                    <p className="mt-3 text-sm !text-[#334155]">
                      {standard.reason}
                    </p>
                  </div>
                ))}
              </div>
            </ResultSection>

            {/* LIFECYCLE */}
            <ResultSection title="Lifecycle / Status">
              <div className="space-y-4">
                {result.lifecycle.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[#cbd5e1] p-5"
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <span className="font-bold !text-[#0f172a]">
                        {item.is_number}
                      </span>

                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold !text-[#92400e]">
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-3 text-sm !text-[#334155]">
                      Revision: {item.revision}
                    </p>

                    <p className="mt-1 text-sm !text-[#334155]">
                      Review / reaffirmation:{" "}
                      {item.review_or_reaffirmation}
                    </p>

                    {item.amendments.length > 0 && (
                      <p className="mt-1 text-sm !text-[#334155]">
                        Amendments: {item.amendments.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ResultSection>

            {/* REGULATIONS */}
            <ResultSection title="Regulatory Information">
              <div className="space-y-4">
                {result.regulations.map((regulation, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[#cbd5e1] p-5"
                  >
                    <p className="font-bold !text-[#0f172a]">
                      {regulation.title}
                    </p>

                    <p className="mt-2 text-sm !text-[#334155]">
                      Authority: {regulation.authority}
                    </p>

                    <p className="mt-1 text-sm !text-[#334155]">
                      Notification: {regulation.notification_number}
                    </p>

                    <p className="mt-3 text-sm !text-[#334155]">
                      {regulation.implementation_information}
                    </p>
                  </div>
                ))}
              </div>
            </ResultSection>

            {/* CERTIFICATION */}
            <ResultSection title="Certification">
              <div className="space-y-4">
                {result.certifications.map((certification, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[#cbd5e1] p-5"
                  >
                    <p className="font-bold !text-[#0f172a]">
                      {certification.scheme}
                    </p>

                    <p className="mt-2 text-sm !text-[#334155]">
                      Applicability: {certification.applicability}
                    </p>

                    <p className="mt-1 text-sm !text-[#334155]">
                      Product category: {certification.product_category}
                    </p>

                    <p className="mt-3 text-sm !text-[#334155]">
                      {certification.implementation_information}
                    </p>
                  </div>
                ))}
              </div>
            </ResultSection>

            {/* CONFIDENCE */}
            <ResultSection title="Confidence">
              <div className="grid gap-4 md:grid-cols-4">
                <ConfidenceCard
                  title="Overall"
                  value={result.confidence.overall}
                />

                <ConfidenceCard
                  title="Classification"
                  value={result.confidence.classification}
                />

                <ConfidenceCard
                  title="Retrieval"
                  value={result.confidence.retrieval}
                />

                <ConfidenceCard
                  title="Explanation"
                  value={result.confidence.explanation}
                />
              </div>
            </ResultSection>

            {/* WARNINGS */}
            <ResultSection title="Warnings / Uncertainty">
              <div className="space-y-3">
                {result.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium !text-[#92400e]"
                  >
                    {warning}
                  </div>
                ))}
              </div>
            </ResultSection>

            {/* EVIDENCE */}
            <ResultSection title="Evidence / Sources">
              <div className="space-y-4">
                {result.evidence.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[#cbd5e1] p-5"
                  >
                    <div className="flex flex-wrap gap-3">
                      <span className="rounded-full bg-[#e2e8f0] px-3 py-1 text-xs font-bold !text-[#0f172a]">
                        {item.type}
                      </span>

                      <span className="text-sm font-bold !text-[#0f172a]">
                        {item.reference}
                      </span>
                    </div>

                    <p className="mt-3 text-sm !text-[#334155]">
                      {item.supporting_information}
                    </p>

                    <p className="mt-2 break-all text-xs !text-[#475569]">
                      Source: {item.source}
                    </p>
                  </div>
                ))}
              </div>
            </ResultSection>

            {/* KNOWLEDGE GRAPH */}
            <ResultSection title="Knowledge Graph">
              <p className="mb-4 text-sm !text-[#334155]">
                Relationships between the product, standards, and regulatory
                information.
              </p>

              <div className="h-[500px] overflow-hidden rounded-xl border border-[#94a3b8] bg-white">
                <ReactFlow
                  nodes={graphNodes}
                  edges={graphEdges}
                  fitView
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </div>
            </ResultSection>
          </section>
        )}
      </div>
    </main>
  );
}

/* ----------------------------- */
/* RESULT SECTION                 */
/* ----------------------------- */

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#cbd5e1] bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-bold !text-[#0f172a]">
        {title}
      </h3>

      {children}
    </section>
  );
}

/* ----------------------------- */
/* INFO CARD                      */
/* ----------------------------- */

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-4">
      <p className="text-xs font-bold uppercase tracking-wide !text-[#475569]">
        {title}
      </p>

      <p className="mt-2 text-base font-bold !text-[#0f172a]">
        {value}
      </p>
    </div>
  );
}

/* ----------------------------- */
/* CONFIDENCE CARD                */
/* ----------------------------- */

function ConfidenceCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#cbd5e1] bg-[#f1f5f9] p-4">
      <p className="text-sm font-semibold !text-[#334155]">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold !text-[#0f172a]">
        {Math.round(value * 100)}%
      </p>
    </div>
  );
}

/* ----------------------------- */
/* RECOMMENDATION CARD            */
/* ----------------------------- */

function RecommendationCard({
  standard,
}: {
  standard: MockResponse["recommended_standards"][number];
}) {
  return (
    <div className="rounded-xl border border-blue-300 bg-blue-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-bold !text-[#0f172a]">
            {standard.is_number}
          </p>

          <p className="mt-1 text-sm font-semibold !text-[#334155]">
            {standard.title}
          </p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold !text-[#334155]">
          {standard.status}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm !text-[#334155]">
        <p>
          <strong className="!text-[#0f172a]">Scope:</strong>{" "}
          {standard.scope}
        </p>

        <p>
          <strong className="!text-[#0f172a]">
            Why relevant:
          </strong>{" "}
          {standard.relevance_reason}
        </p>

        <p>
          <strong className="!text-[#0f172a]">
            Revision:
          </strong>{" "}
          {standard.revision}
        </p>

        <p>
          <strong className="!text-[#0f172a]">
            Match score:
          </strong>{" "}
          {standard.match_score}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-amber-300 bg-amber-100 p-3 text-xs font-semibold !text-[#92400e]">
        Development placeholder only. Final standard information must come
        from the verified backend dataset.
      </div>
    </div>
  );
}