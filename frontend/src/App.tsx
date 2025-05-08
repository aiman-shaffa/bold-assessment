import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, fetchCandidates, fetchRecruiters, type Status } from "./api";
import { CandidateFilters } from "./CandidateFilters";
import { CandidateTable, CandidateTableSkeleton } from "./CandidateTable";
import { Pager } from "./Pager";
import { RecruiterSwitcher } from "./RecruiterSwitcher";
import { ScopeSummary } from "./ScopeSummary";
import { useDebouncedValue } from "./useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;

// Client errors (401/403/422) won't fix themselves; only retry the rest.
function retryUnlessClientError(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

function LoadError({ what, error, onRetry }: { what: string; error: Error; onRetry: () => void }) {
  return (
    <div className="notice notice--error" role="alert">
      <p>
        Couldn't load {what}: {error.message}
      </p>
      <button type="button" className="button--quiet" onClick={() => onRetry()}>
        Try again
      </button>
    </div>
  );
}

export function App() {
  const recruiters = useQuery({ queryKey: ["recruiters"], queryFn: fetchRecruiters });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const recruiterId = selectedId ?? recruiters.data?.[0]?.id ?? null;
  const recruiter = recruiters.data?.find((r) => r.id === recruiterId);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const [status, setStatus] = useState<Status | null>(null);
  const hasFilters = searchInput.trim() !== "" || status !== null;

  // The page belongs to one Recruiter, search and status. When any of them
  // changes, the stored page no longer applies and we're back on page 1, in
  // the same render, so no request for a stale page is ever made.
  const filtersKey = JSON.stringify([recruiterId, search, status]);
  const [pageState, setPageState] = useState({ filtersKey, page: 1 });
  if (pageState.filtersKey !== filtersKey) {
    // Store the reset too (React's "adjust state while rendering"), or going
    // back to earlier filters would bring back the page they were on.
    setPageState({ filtersKey, page: 1 });
  }
  const page = pageState.filtersKey === filtersKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ filtersKey, page: next });

  const candidates = useQuery({
    // Every input is in the key, the Recruiter ID first, so one Recruiter's
    // cached rows are never shown to another.
    queryKey: ["candidates", recruiterId, { search, status, page }],
    queryFn: () => fetchCandidates(recruiterId!, { search, status, page }),
    enabled: recruiterId !== null,
    retry: retryUnlessClientError,
    // Keep the previous page on screen while the next loads, but only for the
    // same Recruiter: switching Recruiter shows a loading state, never their rows.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === recruiterId ? previous : undefined,
  });

  const clearFilters = () => {
    setSearchInput("");
    setStatus(null);
  };

  return (
    <>
      <header className="masthead">
        <div className="masthead__inner">
          <p className="brand">
            <span className="brand__mark" aria-hidden="true">
              TF
            </span>
            <span>
              TechForce <span className="brand__sub">Recruiting operations</span>
            </span>
          </p>
          {recruiters.isSuccess && recruiterId !== null && (
            <RecruiterSwitcher
              recruiters={recruiters.data}
              value={recruiterId}
              onChange={setSelectedId}
            />
          )}
        </div>
      </header>

      <main className="page">
        <div className="page__heading">
          <h1>Candidates</h1>
          {recruiter && <ScopeSummary recruiter={recruiter} />}
        </div>

        {recruiters.isPending && (
          <p role="status" className="notice">
            Loading recruiters…
          </p>
        )}
        {recruiters.isError && (
          <LoadError what="recruiters" error={recruiters.error} onRetry={recruiters.refetch} />
        )}
        {recruiters.isSuccess && recruiterId === null && (
          <p className="notice">
            The Recruiter roster is empty. Run the migrations to seed it, then reload.
          </p>
        )}

        {recruiterId !== null && (
          <section className="panel" aria-labelledby="results-heading">
            <h2 id="results-heading" className="visually-hidden">
              Results
            </h2>
            <CandidateFilters
              search={searchInput}
              onSearchChange={setSearchInput}
              status={status}
              onStatusChange={setStatus}
            />

            <p role="status" className="panel__status">
              {candidates.isPending && "Loading candidates…"}
              {candidates.isPlaceholderData && "Updating…"}
            </p>

            {candidates.isPending && <CandidateTableSkeleton />}
            {candidates.isError && (
              <LoadError what="candidates" error={candidates.error} onRetry={candidates.refetch} />
            )}
            {candidates.isSuccess && (
              <div aria-busy={candidates.isPlaceholderData} className="results">
                {candidates.data.items.length === 0 ? (
                  <div className="empty">
                    <p className="empty__title">No candidates match.</p>
                    {hasFilters ? (
                      <>
                        <p>Nothing in this scope fits the current search and status.</p>
                        <button type="button" className="button--quiet" onClick={clearFilters}>
                          Clear filters
                        </button>
                      </>
                    ) : (
                      <p>
                        This scope has no Candidates yet. An Admin adds them by importing the
                        legacy CSV.
                      </p>
                    )}
                  </div>
                ) : (
                  <CandidateTable items={candidates.data.items} />
                )}
                <Pager
                  page={page}
                  pageSize={candidates.data.page_size}
                  total={candidates.data.total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
