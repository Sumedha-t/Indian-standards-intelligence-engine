"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

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

function StatusBadge({ status }: { status: string }) {
  const value = status?.toUpperCase() || "UNKNOWN";

  const styles: Record<string, string> = {
    CURRENT: "bg-green-100 text-green-800 border-green-200",
    REVISED: "bg-yellow-100 text-yellow-800 border-yellow-200",
    AMENDED: "bg-yellow-100 text-yellow-800 border-yellow-200",
    SUPERSEDED: "bg-red-100 text-red-800 border-red-200",
    WITHDRAWN: "bg-red-100 text-red-800 border-red-200",
    UNKNOWN: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${
        styles[value] || styles.UNKNOWN
      }`}
    >
      {value}
    </span>
  );
}

function SourceLink({ url }: { url: string }) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-[#7b1e3b] hover:underline"
    >
      View BIS Source ↗
    </a>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#dfd3c5] bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

function Sidebar({
  activeSection,
  onLogout,
}: {
  activeSection: string;
  onLogout: () => void;
}) {
  const router = useRouter();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 bg-[#64162f] text-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 p-5">
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

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Dashboard & Analyze
          </button>

          <p className="mt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7bd80]">
            Analysis
          </p>

          <nav className="space-y-1">
            {analysisItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => router.push(item.path)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  activeSection === item.path
                    ? "bg-white/15 font-bold text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
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
    </aside>
  );
}

function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#dfd3c5] bg-[#f7f1e7]/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between px-6">
        <div>
          <h1 className="font-bold text-[#6f1734]">PRAMAAN SETU</h1>

          <p className="text-xs text-[#706661]">
            Indian Standards Intelligence Engine
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">Demo User</p>

            <p className="text-xs text-[#706661]">
              Procurement Workspace
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-[#cfc3b8] bg-white px-3 py-2 text-sm font-semibold text-[#6f1734]"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold text-[#302725]">{title}</h2>

      {description && (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#706661]">
          {description}
        </p>
      )}
    </div>
  );
}

/*
 * Evidence-based explanation of why a standard was surfaced.
 *
 * This component intentionally uses only information returned by
 * the backend. It does not invent scope, legal applicability,
 * certification requirements, or technical claims.
 */
function RecommendationBasis({
  standard,
  result,
}: {
  standard: AnalyzeResponse["recommended_standards"][number];
  result: AnalyzeResponse;
}) {
  const classification = result.product_classification;

  const lifecycle = result.lifecycle.find(
    (item) => item.is_number === standard.is_number,
  );

  const relatedStandards = result.related_standards.filter(
    (item) =>
      item.related_to === standard.is_number ||
      item.is_number === standard.is_number,
  );

  const certification = result.certifications.find(
    (item) =>
      item.standard === standard.is_number ||
      item.product_category
        ?.toLowerCase()
        .includes(
          classification.normalized_product?.toLowerCase() || "",
        ),
  );

  const evidence = result.evidence.filter(
    (item) =>
      item.reference === standard.is_number ||
      item.supporting_information
        ?.toLowerCase()
        .includes(standard.is_number.toLowerCase()),
  );

  const score = Number.isFinite(standard.match_score)
    ? Math.round(standard.match_score * 100)
    : null;

  return (
    <div className="mt-6 rounded-2xl border border-[#e2d4b6] bg-[#fffaf0] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#876b29]">
            Recommendation Basis
          </p>

          <h4 className="mt-1 text-base font-bold text-[#5f1731]">
            Why this standard was surfaced
          </h4>
        </div>

        {score !== null && (
          <div className="shrink-0 rounded-lg border border-[#e0cc91] bg-white px-4 py-2 text-center">
            <p className="text-[10px] font-bold uppercase text-[#827872]">
              Match Score
            </p>

            <p className="text-xl font-bold text-[#6f1734]">
              {score}%
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#e6ddd2] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#827872]">
            Procurement Product
          </p>

          <p className="mt-2 font-semibold text-[#302725]">
            {classification.product_name || "UNKNOWN"}
          </p>

          <p className="mt-1 text-xs text-[#706661]">
            Normalized as:{" "}
            <span className="font-semibold">
              {classification.normalized_product || "UNKNOWN"}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-[#e6ddd2] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#827872]">
            Product Classification
          </p>

          <p className="mt-2 font-semibold text-[#302725]">
            {classification.category || "UNKNOWN"}
          </p>

          {classification.sub_category && (
            <p className="mt-1 text-xs text-[#706661]">
              Sub-category:{" "}
              <span className="font-semibold">
                {classification.sub_category}
              </span>
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[#e6ddd2] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#827872]">
            Retrieval & Compatibility
          </p>

          <p className="mt-2 text-sm leading-6 text-[#514946]">
            This standard received a{" "}
            <strong>
              {score !== null ? `${score}%` : "reported"}
            </strong>{" "}
            match score from the semantic retrieval and requirement
            compatibility ranking pipeline.
          </p>
        </div>

        <div className="rounded-xl border border-[#e6ddd2] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#827872]">
            Scope Evidence
          </p>

          <p className="mt-2 text-sm leading-6 text-[#514946]">
            {standard.scope &&
            standard.scope.toUpperCase() !== "UNKNOWN"
              ? standard.scope
              : "Scope information is not available in the returned dataset."}
          </p>
        </div>
      </div>

      {standard.relevance_reason && (
        <div className="mt-4 rounded-xl border border-[#e6ddd2] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#827872]">
            Backend Retrieval Note
          </p>

          <p className="mt-2 text-sm leading-6 text-[#514946]">
            {standard.relevance_reason}
          </p>
        </div>
      )}

      {classification.keywords.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#e6ddd2] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#827872]">
            Classification Keywords Used as Context
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {classification.keywords.map((keyword, index) => (
              <span
                key={index}
                className="rounded-full border border-[#dfd3c5] bg-[#faf7f2] px-3 py-1 text-xs font-semibold text-[#514946]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[#e6ddd2] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#827872]">
            Lifecycle Evidence
          </p>

          {lifecycle ? (
            <>
              <div className="mt-2">
                <StatusBadge status={lifecycle.status} />
              </div>

              <p className="mt-2 text-xs text-[#706661]">
                Revision:{" "}
                <span className="font-semibold">
                  {lifecycle.revision || "UNKNOWN"}
                </span>
              </p>

              {lifecycle.review_or_reaffirmation && (
                <p className="mt-1 text-xs text-[#706661]">
                  Review / reaffirmation:{" "}
                  <span className="font-semibold">
                    {lifecycle.review_or_reaffirmation}
                  </span>
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-[#706661]">
              No separate lifecycle record returned for this standard.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[#e6ddd2] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#827872]">
            Relationship Evidence
          </p>

          {relatedStandards.length > 0 ? (
            <div className="mt-2 space-y-2">
              {relatedStandards.map((item, index) => (
                <div key={index}>
                  <p className="text-xs font-bold text-[#6f1734]">
                    {item.relationship_type}
                  </p>

                  <p className="text-xs text-[#706661]">
                    {item.is_number}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#706661]">
              No related-standard relationship was returned for this
              recommendation.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[#e6ddd2] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#827872]">
            Compliance Evidence
          </p>

          {certification ? (
            <>
              <p className="mt-2 text-sm font-semibold text-[#302725]">
                {certification.scheme}
              </p>

              <p className="mt-1 text-xs text-[#706661]">
                Applicability:{" "}
                <span className="font-semibold">
                  {certification.applicability || "UNKNOWN"}
                </span>
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#706661]">
              No certification record directly linked to this standard
              was returned.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#d9ccb9] bg-[#faf7f2] p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-[#9b7930]">ⓘ</span>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#827872]">
              Interpretation
            </p>

            <p className="mt-1 text-sm leading-6 text-[#514946]">
              The match score is a retrieval and compatibility signal
              indicating how strongly this standard matched the submitted
              procurement requirement. It is not, by itself, a legal
              determination that the standard is mandatory or applicable.
              Applicability should be confirmed using the displayed scope,
              lifecycle, regulatory, certification, and source evidence.
            </p>
          </div>
        </div>
      </div>

      {evidence.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#827872]">
            Supporting Evidence
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {evidence.slice(0, 4).map((item, index) => (
              <span
                key={index}
                className="rounded-full border border-[#dfd3c5] bg-white px-3 py-1 text-xs font-semibold text-[#6f1734]"
              >
                {item.type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardSectionPage() {
  const params = useParams();
  const router = useRouter();

  const section =
    typeof params.section === "string" ? params.section : "";

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
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("pramaan_setu_logged_in");
    sessionStorage.removeItem("pramaan_setu_logged_in");
    sessionStorage.removeItem("pramaan_setu_analysis_result");

    router.push("/login");
  }

  const graphData = useMemo(() => {
    if (!result) {
      return {
        nodes: [] as Node[],
        edges: [] as Edge[],
      };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    nodes.push({
      id: "product",
      position: { x: 50, y: 250 },
      data: {
        label: result.product_classification.product_name,
      },
      style: {
        background: "#7b1e3b",
        color: "white",
        border: "2px solid #e7c875",
        borderRadius: "12px",
        padding: "14px 18px",
        fontWeight: "700",
        minWidth: 190,
        textAlign: "center",
      },
    });

    result.recommended_standards.forEach((standard, index) => {
      const id = `recommended-${index}`;

      nodes.push({
        id,
        position: {
          x: 400,
          y: 70 + index * 150,
        },
        data: {
          label: `${standard.is_number}\n${standard.title}`,
        },
        style: {
          background: "#fffaf0",
          color: "#302725",
          border: "2px solid #d6bd7c",
          borderRadius: "12px",
          padding: "12px 16px",
          fontWeight: "600",
          width: 250,
          whiteSpace: "pre-wrap",
        },
      });

      edges.push({
        id: `product-${id}`,
        source: "product",
        target: id,
        label: "APPLICABLE",
      });
    });

    result.related_standards.forEach((standard, index) => {
      const id = `related-${index}`;

      const relatedIndex = result.recommended_standards.findIndex(
        (item) => item.is_number === standard.related_to,
      );

      const sourceId =
        relatedIndex >= 0
          ? `recommended-${relatedIndex}`
          : "product";

      nodes.push({
        id,
        position: {
          x: 800,
          y: 100 + index * 170,
        },
        data: {
          label: `${standard.is_number}\n${standard.title}`,
        },
        style: {
          background: "#ffffff",
          color: "#302725",
          border: "2px solid #9e8c82",
          borderRadius: "12px",
          padding: "12px 16px",
          fontWeight: "600",
          width: 250,
          whiteSpace: "pre-wrap",
        },
      });

      edges.push({
        id: `related-edge-${id}`,
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
          x: 800,
          y: 420 + index * 150,
        },
        data: {
          label: `${regulation.notification_number}\n${regulation.title}`,
        },
        style: {
          background: "#f8f0e7",
          color: "#302725",
          border: "2px solid #b9974f",
          borderRadius: "12px",
          padding: "12px 16px",
          fontWeight: "600",
          width: 250,
          whiteSpace: "pre-wrap",
        },
      });

      const affectedIndex = result.recommended_standards.findIndex(
        (standard) =>
          standard.is_number === regulation.affected_standard,
      );

      edges.push({
        id: `regulation-edge-${id}`,
        source:
          affectedIndex >= 0
            ? `recommended-${affectedIndex}`
            : "product",
        target: id,
        label: "REGULATION",
      });
    });

    return { nodes, edges };
  }, [result]);

  function renderContent() {
    if (section === "extracted-requirements") {
      if (!result) return <NoResult />;

      return (
        <>
          <SectionHeading title="Extracted Requirements" />

          <Panel>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-[#827872]">
                  Product Type
                </p>

                <p className="mt-2 font-semibold">
                  {result.extracted_requirements.product_type}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#827872]">
                  Intended Use
                </p>

                <p className="mt-2 font-semibold">
                  {result.extracted_requirements.intended_use}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="mb-3 font-bold">
                Technical Requirements
              </h3>

              {result.extracted_requirements.technical_requirements
                .length === 0 ? (
                <p className="text-sm text-[#706661]">
                  No technical requirements were returned.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#faf7f2]">
                      <tr>
                        <th className="px-4 py-3">Parameter</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="px-4 py-3">Unit</th>
                      </tr>
                    </thead>

                    <tbody>
                      {result.extracted_requirements.technical_requirements.map(
                        (item, index) => (
                          <tr
                            key={index}
                            className="border-t border-[#eee6de]"
                          >
                            <td className="px-4 py-3">
                              {item.parameter}
                            </td>

                            <td className="px-4 py-3 font-semibold">
                              {item.value}
                            </td>

                            <td className="px-4 py-3">
                              {item.unit}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Panel>
        </>
      );
    }

    if (section === "product-classification") {
      if (!result) return <NoResult />;

      const classification = result.product_classification;

      return (
        <>
          <SectionHeading title="Product Classification" />

          <Panel>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#827872]">
                  Product
                </p>

                <p className="mt-2 font-semibold">
                  {classification.product_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#827872]">
                  Normalized Product
                </p>

                <p className="mt-2 font-semibold">
                  {classification.normalized_product}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#827872]">
                  Category
                </p>

                <p className="mt-2 font-semibold">
                  {classification.category}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#827872]">
                  Sub-category
                </p>

                <p className="mt-2 font-semibold">
                  {classification.sub_category}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase text-[#827872]">
                Keywords
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {classification.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-[#dfd3c5] bg-[#faf7f2] px-3 py-1 text-xs font-semibold"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </Panel>
        </>
      );
    }

    if (section === "recommended-standards") {
      if (!result) return <NoResult />;

      return (
        <>
          <SectionHeading
            title="Recommended Standards"
            description="Standards identified as relevant to the procurement requirement."
          />

          <div className="mb-6 rounded-2xl border border-[#d6bd7c] bg-[#fff8e7] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7b1e3b] text-sm font-bold text-white">
                i
              </div>

              <div>
                <h3 className="font-bold text-[#6f1734]">
                  How recommendations are explained
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#514946]">
                  Each recommendation is supported using the product
                  classification, semantic retrieval and compatibility
                  signal, available scope information, lifecycle data,
                  relationship evidence, compliance records, and source
                  evidence returned by the analysis pipeline. Missing
                  information is shown as unavailable rather than
                  inferred.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {result.recommended_standards.map((standard, index) => (
              <Panel key={index}>
                <div className="border-l-4 border-[#9b7930] pl-5">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-[#7b1e3b] px-3 py-1.5 text-sm font-bold text-white">
                          {standard.is_number}
                        </span>

                        <StatusBadge status={standard.status} />
                      </div>

                      <h3 className="mt-3 text-xl font-bold">
                        {standard.title}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase text-[#827872]">
                        Revision
                      </p>

                      <p className="mt-2">
                        {standard.revision || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-[#827872]">
                        Amendments
                      </p>

                      <p className="mt-2">
                        {standard.amendments.length > 0
                          ? standard.amendments.join(", ")
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <RecommendationBasis
                    standard={standard}
                    result={result}
                  />

                  <div className="mt-6">
                    <SourceLink url={standard.source} />
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </>
      );
    }

    if (section === "related-standards") {
      if (!result) return <NoResult />;

      return (
        <>
          <SectionHeading title="Related / Allied Standards" />

          <div className="grid gap-5 md:grid-cols-2">
            {result.related_standards.map((standard, index) => (
              <Panel key={index}>
                <p className="text-xs font-bold uppercase text-[#9b7930]">
                  {standard.relationship_type}
                </p>

                <h3 className="mt-3 text-lg font-bold">
                  {standard.is_number}
                </h3>

                <p className="mt-1 text-sm text-[#706661]">
                  {standard.title}
                </p>

                <p className="mt-4 text-sm leading-6 text-[#514946]">
                  {standard.reason}
                </p>

                <div className="mt-4">
                  <SourceLink url={standard.source} />
                </div>
              </Panel>
            ))}
          </div>
        </>
      );
    }

    if (section === "lifecycle-status") {
      if (!result) return <NoResult />;

      return (
        <>
          <SectionHeading
            title="Lifecycle & Status"
            description="UNKNOWN values are preserved when lifecycle information is unavailable."
          />

          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#faf7f2]">
                  <tr>
                    <th className="px-4 py-3">IS Number</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Revision</th>
                    <th className="px-4 py-3">
                      Review / Reaffirmation
                    </th>
                    <th className="px-4 py-3">Superseded By</th>
                    <th className="px-4 py-3">Source</th>
                  </tr>
                </thead>

                <tbody>
                  {result.lifecycle.map((item, index) => (
                    <tr
                      key={index}
                      className="border-t border-[#eee6de]"
                    >
                      <td className="px-4 py-3 font-semibold">
                        {item.is_number}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-4 py-3">
                        {item.revision || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {item.review_or_reaffirmation || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {item.superseded_by || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <SourceLink url={item.source} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      );
    }

    if (section === "regulatory-information") {
      if (!result) return <NoResult />;

      return (
        <>
          <SectionHeading title="Regulatory Information" />

          <div className="grid gap-5 md:grid-cols-2">
            {result.regulations.map((regulation, index) => (
              <Panel key={index}>
                <span className="rounded-lg bg-[#f7eee9] px-3 py-1.5 text-xs font-bold text-[#7b1e3b]">
                  {regulation.notification_number}
                </span>

                <h3 className="mt-4 text-lg font-bold">
                  {regulation.title}
                </h3>

                <div className="mt-4 space-y-2 text-sm text-[#514946]">
                  <p>
                    <strong>Authority:</strong> {regulation.authority}
                  </p>

                  <p>
                    <strong>Date:</strong> {regulation.date}
                  </p>

                  <p>
                    <strong>Affected Standard:</strong>{" "}
                    {regulation.affected_standard}
                  </p>

                  <p>
                    <strong>Implementation:</strong>{" "}
                    {regulation.implementation_information}
                  </p>
                </div>

                <div className="mt-5">
                  <SourceLink url={regulation.source} />
                </div>
              </Panel>
            ))}
          </div>
        </>
      );
    }

    if (section === "certifications") {
      if (!result) return <NoResult />;

      return (
        <>
          <SectionHeading title="Certifications" />

          <div className="grid gap-5 md:grid-cols-2">
            {result.certifications.map((certification, index) => (
              <Panel key={index}>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-[#7b1e3b] px-3 py-1.5 text-xs font-bold text-white">
                    {certification.scheme}
                  </span>

                  <span className="rounded-full border border-[#d6bd7c] bg-[#fff8e7] px-3 py-1 text-xs font-bold text-[#805e17]">
                    {certification.applicability}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  {certification.product_category}
                </h3>

                <p className="mt-2 text-sm">
                  <strong>Standard:</strong>{" "}
                  {certification.standard}
                </p>

                <p className="mt-4 text-sm leading-6 text-[#514946]">
                  {certification.implementation_information}
                </p>

                <div className="mt-5">
                  <SourceLink url={certification.source} />
                </div>
              </Panel>
            ))}
          </div>
        </>
      );
    }

    if (section === "confidence-warnings") {
      if (!result) return <NoResult />;

      const confidenceItems = [
        ["Overall", result.confidence.overall],
        ["Classification", result.confidence.classification],
        ["Retrieval", result.confidence.retrieval],
        ["Explanation", result.confidence.explanation],
      ];

      return (
        <>
          <SectionHeading title="Confidence & Warnings" />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {confidenceItems.map(([label, value], index) => (
              <Panel key={index}>
                <p className="text-xs font-bold uppercase text-[#827872]">
                  {label as string}
                </p>

                <p className="mt-3 text-xl font-bold text-[#6f1734]">
                  {typeof value === "number"
                    ? `${Math.round(value * 100)}%`
                    : value}
                </p>
              </Panel>
            ))}
          </div>

          <div className="mt-6">
            <Panel>
              <h3 className="text-lg font-bold">
                Warnings & Uncertainty
              </h3>

              {result.warnings.length === 0 ? (
                <p className="mt-3 text-sm text-[#706661]">
                  No warnings were returned.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {result.warnings.map((warning, index) => (
                    <li
                      key={index}
                      className="rounded-xl border border-[#dfd3c5] bg-[#faf7f2] p-4 text-sm"
                    >
                      ⚠ {warning}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      );
    }

    if (section === "evidence-sources") {
      if (!result) return <NoResult />;

      return (
        <>
          <SectionHeading
            title="Evidence / Sources"
            description="Traceability information supporting the analysis results."
          />

          <div className="grid gap-5 md:grid-cols-2">
            {result.evidence.map((item, index) => (
              <Panel key={index}>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#f7eee9] px-3 py-1 text-xs font-bold text-[#7b1e3b]">
                    {item.type}
                  </span>

                  <span className="text-sm font-semibold">
                    {item.reference}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-[#514946]">
                  {item.supporting_information}
                </p>

                <div className="mt-5">
                  <SourceLink url={item.source} />
                </div>
              </Panel>
            ))}
          </div>
        </>
      );
    }

    if (section === "knowledge-graph") {
      if (!result) return <NoResult />;

      return (
        <>
          <SectionHeading
            title="Knowledge Graph"
            description="Relationships between the product, standards and compliance information."
          />

          <Panel>
            <div className="h-[650px] w-full overflow-hidden rounded-xl border border-[#e5ddd5] bg-[#faf7f2]">
              <ReactFlow
                nodes={graphData.nodes}
                edges={graphData.edges}
                fitView
                fitViewOptions={{
                  padding: 0.25,
                  minZoom: 0.4,
                  maxZoom: 1.2,
                }}
                minZoom={0.25}
                maxZoom={1.5}
              >
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </div>
          </Panel>
        </>
      );
    }

    return <NoResult />;
  }

  return (
    <div className="min-h-screen bg-[#f7f1e7] text-[#302725]">
      <Sidebar
        activeSection={`/dashboard/${section}`}
        onLogout={handleLogout}
      />

      <div className="lg:pl-72">
        <Header onLogout={handleLogout} />

        <main className="mx-auto max-w-[1500px] px-6 py-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function NoResult() {
  const router = useRouter();

  return (
    <Panel>
      <div className="py-12 text-center">
        <h3 className="text-xl font-bold text-[#6f1734]">
          No analysis available
        </h3>

        <p className="mt-2 text-sm text-[#706661]">
          Run an analysis first to view this section.
        </p>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-5 rounded-lg bg-[#7b1e3b] px-5 py-2.5 text-sm font-bold text-white"
        >
          Go to Dashboard & Analyze
        </button>
      </div>
    </Panel>
  );
}