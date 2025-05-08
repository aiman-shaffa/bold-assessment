import type { Recruiter } from "./api";

/** Who the list is scoped to, so a Recruiter can see why rows are missing. */
export function ScopeSummary({ recruiter }: { recruiter: Recruiter }) {
  const isAdmin = recruiter.role === "admin";
  return (
    <section className="scope" aria-label="Current scope">
      <p className="scope__who">
        <span className="scope__name">{recruiter.full_name}</span>
        <span className="scope__role">{isAdmin ? "Admin" : "Recruiter"}</span>
      </p>
      <p className="scope__regions">
        <span className="scope__caption">Scope</span>
        {isAdmin ? (
          <span className="region region--all">All Regions</span>
        ) : (
          recruiter.regions.map((code) => (
            <span key={code} className="region">
              {code}
            </span>
          ))
        )}
      </p>
    </section>
  );
}
