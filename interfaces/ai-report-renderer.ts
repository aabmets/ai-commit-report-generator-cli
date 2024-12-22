import { BulletPoints } from "../schemas";

export interface AIReportRenderer {
    renderReport(bulletPoints:BulletPoints[]): void;
}