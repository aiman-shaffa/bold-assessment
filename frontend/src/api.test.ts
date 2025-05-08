import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchCandidates } from "./api";

function respondWith(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(typeof body === "string" ? body : JSON.stringify(body), { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchCandidates", () => {
  it("sends the Recruiter header and only the filters that are set", async () => {
    const fetchMock = respondWith(200, { items: [], total: 0, page: 2, page_size: 25 });

    await fetchCandidates("R-102", { search: "raman", status: null, page: 2 });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/candidates?page=2&search=raman", {
      headers: { "X-Recruiter-Id": "R-102" },
    });
  });

  it("raises the API's detail message with the status", async () => {
    respondWith(403, { detail: "Unknown recruiter" });

    const error = await fetchCandidates("R-999", { search: "", status: null, page: 1 }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 403, message: "403 Unknown recruiter" });
  });

  it("keeps the status text when the error body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>bad gateway</html>", { status: 502, statusText: "Bad Gateway" }),
      ),
    );

    await expect(
      fetchCandidates("R-102", { search: "", status: null, page: 1 }),
    ).rejects.toMatchObject({ status: 502, message: "502 Bad Gateway" });
  });
});
