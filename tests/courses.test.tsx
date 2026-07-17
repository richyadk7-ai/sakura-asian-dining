import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseGrid } from "@/components/course-grid";
import { courses } from "@/data/courses";
import { getDictionary } from "@/locales";

const expected = {
  "welcome-party-course": "https://tabelog.com/tokyo/A1305/A130503/13218334/party/116540417",
  "sakura-150-minute-course": "https://tabelog.com/tokyo/A1305/A130503/13218334/party/181564020",
  "tandoori-bbq-course": "https://tabelog.com/tokyo/A1305/A130503/13218334/party/116438114",
  "sakura-special-drink-course": "https://tabelog.com/tokyo/A1305/A130503/13218334/party/147601243",
  "grilled-chicken-drink-course": "https://tabelog.com/tokyo/A1305/A130503/13218334/party/147610623",
} as const;

describe("course destinations", () => {
  it.each(Object.entries(expected))("opens %s on its exact matching Tabelog page", (id, url) => {
    expect(courses.find((course) => course.id === id)?.tabelogUrl).toBe(url);
  });

  it("renders five direct, safe external links", () => {
    render(<CourseGrid locale="en" dictionary={getDictionary("en")} />);
    const links = screen.getAllByRole("link", { name: /View course & reserve/ });
    expect(links).toHaveLength(5);
    links.forEach((link, index) => {
      expect(link).toHaveAttribute("href", Object.values(expected)[index]);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});
