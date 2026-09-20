"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
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

type AnalyzeResponse = {
  extracted_requirements: {
    product_type: string;
    intended_use: string;
    technical_requirements: {
      parameter: string;
      value: string | number | null;
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
    revision: string | number;
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
    revision: string | number;
    review_or_reaffirmation: string | number;
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

export default function Home() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
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
      let response: Response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

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

      if (!response.ok) {
        let errorMessage =
          "The backend could not analyze the requirement.";

        try {
          const errorData = await response.json();

          if (errorData?.detail?.message) {
            errorMessage = errorData.detail.message;
          } else if (errorData?.detail) {
            errorMessage =
              typeof errorData.detail === "string"
                ? errorData.detail
                : JSON.stringify(errorData.detail);
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(errorMessage);
      }

      const data: AnalyzeResponse = await response.json();

      setResult(data);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Unable to analyze the requirement. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const graphData = useMemo(() => {
    if (!result) {
      return {
        nodes: [] as Node[],
        edges: [] as Edge[],
      };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const productId = "product";

    nodes.push({
      id: productId,
      position: { x: 0, y: 180 },
      data: {
        label:
          result.product_classification.product_name ||
          result.extracted_requirements.product_type ||
          "Product",
      },
    });

    result.recommended_standards.forEach((standard, index) => {
      const id = `recommended-${index}`;

      nodes.push({
        id,
        position: {
          x: 350,
          y: index * 150,
        },
        data: {
          label: standard.is_number,
        },
      });

      edges.push({
        id: `product-recommended-${index}`,
        source: productId,
        target: id,
        label: "RELATED_STANDARD",
      });
    });

    result.related_standards.forEach((standard, index) => {
      const id = `related-${index}`;

      nodes.push({
        id,
        position: {
          x: 700,
          y: index * 150,
        },
        data: {
          label: standard.is_number,
        },
      });

      const relatedRecommendedIndex =
        result.recommended_standards.findIndex(
          (item) => item.is_number === standard.related_to
        );

      const sourceId =
        relatedRecommendedIndex >= 0
          ? `recommended-${relatedRecommendedIndex}`
          : productId;

      edges.push({
        id: `related-edge-${index}`,
        source: sourceId,
        target: id,
        label: standard.relationship_type,
      });
    });

    result.regulations.forEach((regulation, index) => {
      const id = `regulation-${index}`;

      nodes.push({
        id,
        position: {
          x: 1050,
          y: index * 150,
        },
        data: {
          label:
            regulation.notification_number ||
            regulation.title ||
            "Regulation",
        },
      });

      const relatedStandardIndex =
        result.recommended_standards.findIndex(
          (standard) =>
            standard.is_number === regulation.affected_standard
        );

      if (relatedStandardIndex >= 0) {
        edges.push({
          id: `regulation-edge-${index}`,
          source: `recommended-${relatedStandardIndex}`,
          target: id,
          label: "RELATED_STANDARD",
        });
      }
    });

    return { nodes, edges };
  }, [result]);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <div className="mx-auto max-w-7xl px-6 py-10">
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
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-semibold !text-[#0f172a]">
                Natural-language requirement
              </label>

              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Example: Laptop computers for government office employees with electrical safety and information technology requirements."
                className="min-h-40 w-full rounded-xl border border-[#94a3b8] bg-white p-4 text-sm !text-[#0f172a] outline-none transition placeholder:!text-[#64748b] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
              />
            </div>

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

          {analysisError && (
            <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold !text-[#b91c1c]">
              {analysisError}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="mt-6 rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-bold !text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Requirement"}
          </button>
        </section>

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

                {result.extracted_requirements.technical_requirements.length >
                0 ? (
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
                            {item.value ?? ""} {item.unit}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm !text-[#64748b]">
                    No technical requirements extracted.
                  </p>
                )}
              </div>
            </ResultSection>

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
                  value={result.product_classification.sub_category || "—"}
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
                      Authority: {regulation.authority || "—"}
                    </p>

                    <p className="mt-1 text-sm !text-[#334155]">
                      Notification: {regulation.notification_number}
                    </p>

                    <p className="mt-3 text-sm !text-[#334155]">
                      {regulation.implementation_information || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </ResultSection>

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

                    <p className="mt-1 text-sm !text-[#334155]">
                      Standard: {certification.standard}
                    </p>

                    <p className="mt-3 text-sm !text-[#334155]">
                      {certification.implementation_information}
                    </p>
                  </div>
                ))}
              </div>
            </ResultSection>

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

            <ResultSection title="Warnings / Uncertainty">
              <div className="space-y-3">
                {result.warnings.length > 0 ? (
                  result.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium !text-[#92400e]"
                    >
                      {warning}
                    </div>
                  ))
                ) : (
                  <p className="text-sm !text-[#475569]">
                    No warnings returned by the backend.
                  </p>
                )}
              </div>
            </ResultSection>

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

            <ResultSection title="Knowledge Graph">
              <p className="mb-4 text-sm !text-[#334155]">
                Relationships between the product, standards, and regulatory
                information returned by the backend.
              </p>

              <div className="h-[500px] overflow-hidden rounded-xl border border-[#94a3b8] bg-white">
                <ReactFlow
                  nodes={graphData.nodes}
                  edges={graphData.edges}
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

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
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
        {value || "—"}
      </p>
    </div>
  );
}

function ConfidenceCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  const isNumeric = typeof value === "number";

  return (
    <div className="rounded-xl border border-[#cbd5e1] bg-[#f1f5f9] p-4">
      <p className="text-sm font-semibold !text-[#334155]">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold !text-[#0f172a]">
        {isNumeric ? `${Math.round(value * 100)}%` : value}
      </p>
    </div>
  );
}

function RecommendationCard({
  standard,
}: {
  standard: AnalyzeResponse["recommended_standards"][number];
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

        {standard.amendments.length > 0 && (
          <p>
            <strong className="!text-[#0f172a]">
              Amendments:
            </strong>{" "}
            {standard.amendments.join(", ")}
          </p>
        )}

        <p className="break-all">
          <strong className="!text-[#0f172a]">
            Source:
          </strong>{" "}
          {standard.source}
        </p>
      </div>
    </div>
  );
}