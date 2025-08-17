import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { z } from "zod";
import { useFiltersGeneric } from "../src/react";

const schema = z.object({ q: z.string().optional() });

function TestComp({ search = "?q=hi" }: { search?: string }) {
  const { filters, setFilters } = useFiltersGeneric(
    schema,
    () => search,
    (url) => { (window as any).__pushed = url; },
    {}
  );

  return (
    <div>
      <div data-testid="q">{filters.q ?? ""}</div>
      <button onClick={() => setFilters({ q: "bye" })}>chg</button>
    </div>
  );
}

describe("useFiltersGeneric", () => {
  it("reads initial query and pushes on setFilters", () => {
    render(<TestComp />);
    expect(screen.getByTestId("q").textContent).toBe("hi");
    fireEvent.click(screen.getByText("chg"));
    expect((window as any).__pushed).toContain("?q=bye");
  });
});
