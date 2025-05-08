import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pager } from "./Pager";

describe("Pager", () => {
  it("shows the page, the page count and the total", () => {
    render(<Pager page={2} pageSize={25} total={60} onPageChange={() => {}} />);

    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent(
      "Page 2 of 3 · 60 candidates",
    );
  });

  it("disables Previous on the first page and Next on the last", () => {
    const { rerender } = render(
      <Pager page={1} pageSize={25} total={60} onPageChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

    rerender(<Pager page={3} pageSize={25} total={60} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("counts an empty result as one page", () => {
    render(<Pager page={1} pageSize={25} total={0} onPageChange={() => {}} />);

    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent(
      "Page 1 of 1 · 0 candidates",
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("asks for the neighbouring page", async () => {
    const onPageChange = vi.fn();
    render(<Pager page={2} pageSize={25} total={60} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });
});
