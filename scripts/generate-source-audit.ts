import { writeFileSync } from "node:fs";
import path from "node:path";
import { courses } from "../data/courses";
import { allMenuItems, menuPhotoEntries, sourceAudit } from "../data/menu";

const rows = [
  ...allMenuItems.map((item) => ({ category: item.section, sourceOrder: item.sourceOrder, localRecordId: item.id, translationStatus: item.nameEn && item.nameJa ? "complete" : "incomplete", verificationDate: sourceAudit.lastVerified })),
  ...courses.map((course) => ({ category: "courses", sourceOrder: course.sourceOrder, localRecordId: course.id, translationStatus: course.nameEn && course.nameJa && course.summaryEn && course.summaryJa ? "complete" : "incomplete", verificationDate: sourceAudit.lastVerified })),
  ...menuPhotoEntries.map((photo) => ({ category: "menu-photos", sourceOrder: photo.sourceOrder, localRecordId: photo.id, translationStatus: "not-applicable-until-authorized-image-import", verificationDate: sourceAudit.lastVerified })),
];
writeFileSync(path.join(process.cwd(), "data/source-audit.json"), `${JSON.stringify({ expectedCounts: sourceAudit.counts, records: rows }, null, 2)}\n`);
console.log(`Wrote ${rows.length} source-audit records.`);
