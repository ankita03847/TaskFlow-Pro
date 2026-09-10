import { describe, it, expect } from "vitest";
import { parseTaskInput } from "./parseTaskInput";

describe("parseTaskInput", () => {
  it("extracts title, dueDate, priority, and high confidence from a full sentence", () => {
    const input = "submit assignment tomorrow 5pm high priority";
    const result = parseTaskInput(input);

    expect(result.title).toBe("Submit assignment");
    expect(result.confidence).toBe("high");
    expect(result.priority).toBe("high");
    expect(result.dueDate).toBeDefined();
    expect(typeof result.dueDate).toBe("string");

    // Ensure dueDate parses into a valid date in the future
    const parsedDate = new Date(result.dueDate);
    expect(isNaN(parsedDate.getTime())).toBe(false);
    expect(parsedDate.getHours()).toBe(17); // 5pm
  });

  it("handles input with no date phrase correctly (low confidence, default medium priority)", () => {
    const input = "buy groceries";
    const result = parseTaskInput(input);

    expect(result.title).toBe("Buy groceries");
    expect(result.dueDate).toBeNull();
    expect(result.priority).toBe("medium");
    expect(result.confidence).toBe("low");
  });

  it("detects high priority keywords and cleans surrounding colons/spaces", () => {
    const input = "urgent: call client asap";
    const result = parseTaskInput(input);

    expect(result.title).toBe("Call client");
    expect(result.priority).toBe("high");
    expect(result.dueDate).toBeNull();
    expect(result.confidence).toBe("low");
  });

  it("detects relative dates and low priority keywords correctly", () => {
    const input = "finish report next monday, low priority";
    const result = parseTaskInput(input);

    expect(result.title).toBe("Finish report");
    expect(result.priority).toBe("low");
    expect(result.confidence).toBe("high");
    expect(result.dueDate).toBeDefined();

    const parsedDate = new Date(result.dueDate);
    expect(isNaN(parsedDate.getTime())).toBe(false);
  });

  it("handles empty and whitespace-only input safely without crashing", () => {
    expect(parseTaskInput("")).toEqual({
      title: "",
      dueDate: null,
      priority: "medium",
      confidence: "low",
    });

    expect(parseTaskInput("    ")).toEqual({
      title: "",
      dueDate: null,
      priority: "medium",
      confidence: "low",
    });

    expect(parseTaskInput(null)).toEqual({
      title: "",
      dueDate: null,
      priority: "medium",
      confidence: "low",
    });
  });

  it("correctly identifies 'important' as high priority and 'in 3 days' as date", () => {
    const input = "team sprint review in 3 days at 2pm important";
    const result = parseTaskInput(input);

    expect(result.title).toBe("Team sprint review");
    expect(result.priority).toBe("high");
    expect(result.confidence).toBe("high");
    expect(result.dueDate).toBeDefined();

    const parsedDate = new Date(result.dueDate);
    expect(parsedDate.getHours()).toBe(14); // 2pm
  });

  it("correctly identifies 'whenever' and 'no rush' as low priority", () => {
    const input = "organize desktop files whenever no rush";
    const result = parseTaskInput(input);

    expect(result.title).toBe("Organize desktop files");
    expect(result.priority).toBe("low");
    expect(result.confidence).toBe("low");
    expect(result.dueDate).toBeNull();
  });
});
