import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import type { CandidateListItem, Recruiter } from "./api";

const RECRUITERS: Recruiter[] = [
  { id: "R-101", full_name: "Dana Whitmore", role: "admin", regions: ["*"] },
  { id: "R-102", full_name: "Caleb Nguyen", role: "recruiter", regions: ["US-MW", "US-NE"] },
];

function candidate(id: number, region = "US-MW"): CandidateListItem {
  return {
    id,
    legacy_id: `C-${1000 + id}`,
    first_name: "Test",
    last_name: `Person${id}`,
    email: `person${id}@example.com`,
    region,
    desired_role: "Backend Engineer",
    status: "active",
    applied_date: "2026-05-14",
  };
}

type CandidateRequest = { recruiterId: string | null; params: URLSearchParams };

let candidateRequests: CandidateRequest[];
let candidateHandler: (request: CandidateRequest) => Response;

beforeEach(() => {
  candidateRequests = [];
  candidateHandler = ({ params }) => {
    const page = Number(params.get("page"));
    return Response.json({ items: [candidate(page)], total: 60, page, page_size: 25 });
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input, "http://localhost");
      if (url.pathname === "/api/v1/recruiters") return Response.json(RECRUITERS);
      const headers = new Headers(init?.headers);
      const request = { recruiterId: headers.get("X-Recruiter-Id"), params: url.searchParams };
      candidateRequests.push(request);
      return candidateHandler(request);
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

const pager = () => screen.getByRole("navigation", { name: "Pagination" });

describe("App", () => {
  it("lists the first Recruiter's Candidates", async () => {
    renderApp();

    expect(await screen.findByRole("cell", { name: "Test Person1" })).toBeInTheDocument();
    expect(screen.getByLabelText("Viewing as")).toHaveValue("R-101");
    expect(candidateRequests[0].recruiterId).toBe("R-101");
  });

  it("goes back to page 1 when the status filter changes, and stays there", async () => {
    renderApp();
    await userEvent.click(await screen.findByRole("button", { name: "Next" }));
    await waitFor(() => expect(pager()).toHaveTextContent("Page 2 of 3"));

    await userEvent.selectOptions(screen.getByLabelText("Status"), "interviewing");
    await waitFor(() => expect(pager()).toHaveTextContent("Page 1 of 3"));

    // Returning to the old filters must not revive the old page.
    await userEvent.selectOptions(screen.getByLabelText("Status"), "");
    await waitFor(() => expect(pager()).toHaveTextContent("Page 1 of 3"));
    expect(candidateRequests.at(-1)?.params.get("page")).toBe("1");
  });

  it("sends the selected Recruiter's ID", async () => {
    renderApp();
    await screen.findByRole("cell", { name: "Test Person1" });

    await userEvent.selectOptions(screen.getByLabelText("Viewing as"), "R-102");

    await waitFor(() => expect(candidateRequests.at(-1)?.recruiterId).toBe("R-102"));
  });

  it("explains an empty result", async () => {
    candidateHandler = () => Response.json({ items: [], total: 0, page: 1, page_size: 25 });
    renderApp();

    expect(await screen.findByText(/No candidates match/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows the API's error and does not retry a client error", async () => {
    candidateHandler = () => Response.json({ detail: "Unknown recruiter" }, { status: 403 });
    renderApp();

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/403 Unknown recruiter/)).toBeInTheDocument();
    expect(candidateRequests).toHaveLength(1);
  });
});
