import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CourseGrid } from "@/components/course-grid";
import { courses } from "@/data/courses";
import { getDictionary } from "@/locales";

afterEach(cleanup);

describe("course destinations", () => {
  it.each(["en", "ja"] as const)("routes every %s course booking link to the internal reservation form", (locale) => {
    render(<CourseGrid locale={locale} dictionary={getDictionary(locale)} />);
    const label = locale === "ja" ? /コース詳細・予約/ : /View course & reserve/;
    const links = screen.getAllByRole("link", { name: label });
    expect(links).toHaveLength(courses.length);
    links.forEach((link, index) => {
      expect(link).toHaveAttribute("href", `/${locale}/reservation?course=${courses[index].id}`);
      expect(link.getAttribute("href")).not.toMatch(/^https?:\/\//);
    });
  });
});
