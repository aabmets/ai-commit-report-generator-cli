import type { BulletPoints } from "../schemas";

export interface AIReportRenderer {
    renderReport(bulletPoints: BulletPoints[]): void;
}
