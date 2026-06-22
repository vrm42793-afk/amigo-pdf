import { describe, it, expect } from "vitest";
import { CoordinateMapper, ScreenCoord } from "@/lib/signature/coordinate-mapper";

describe("CoordinateMapper Engine Tests", () => {
  // Standard Letter size: 8.5 x 11 inches = 612 x 792 points
  const pdfPage = { width: 612, height: 792 };
  
  // Rendered page width on screen (e.g. 500px width, height proportional ~647px)
  const viewport = { width: 500, height: 647.05 };

  it("should correctly map a top-left placement", () => {
    // Screen top-left corner
    const screen: ScreenCoord = { x: 0, y: 0, width: 150, height: 50 };
    const pdf = CoordinateMapper.screenToPdf(screen, viewport, pdfPage);

    // X should be 0
    expect(pdf.x).toBe(0);
    // Y in PDF is measured from bottom, so it should be pdfPage.height - pdfHeight
    const expectedPdfHeight = 50 * (pdfPage.height / viewport.height);
    const expectedPdfY = pdfPage.height - expectedPdfHeight;
    expect(pdf.y).toBeCloseTo(expectedPdfY, 1);
  });

  it("should correctly map a bottom-right placement", () => {
    // Screen bottom-right corner
    const screen: ScreenCoord = {
      x: viewport.width - 150,
      y: viewport.height - 50,
      width: 150,
      height: 50
    };
    const pdf = CoordinateMapper.screenToPdf(screen, viewport, pdfPage);

    // Y in PDF bottom-right is 0
    expect(pdf.y).toBe(0);
    // X in PDF should be pdfPage.width - pdfWidth
    const expectedPdfWidth = 150 * (pdfPage.width / viewport.width);
    const expectedPdfX = pdfPage.width - expectedPdfWidth;
    expect(pdf.x).toBeCloseTo(expectedPdfX, 1);
  });

  it("should round-trip screen -> pdf -> screen coordinates successfully", () => {
    const screen: ScreenCoord = { x: 50, y: 120, width: 200, height: 80 };
    const pdf = CoordinateMapper.screenToPdf(screen, viewport, pdfPage);
    const roundTripScreen = CoordinateMapper.pdfToScreen(pdf, viewport, pdfPage);

    expect(roundTripScreen.x).toBeCloseTo(screen.x, 1);
    expect(roundTripScreen.y).toBeCloseTo(screen.y, 1);
    expect(roundTripScreen.width).toBeCloseTo(screen.width, 1);
    expect(roundTripScreen.height).toBeCloseTo(screen.height, 1);
  });

  it("should correctly scale for different page sizes (e.g. A4 size: 595 x 842 points)", () => {
    const a4Page = { width: 595, height: 842 };
    const a4Viewport = { width: 600, height: 849 };

    const screen: ScreenCoord = { x: 100, y: 200, width: 120, height: 40 };
    const pdf = CoordinateMapper.screenToPdf(screen, a4Viewport, a4Page);

    // Expected values
    const scaleX = a4Page.width / a4Viewport.width;
    const scaleY = a4Page.height / a4Viewport.height;

    expect(pdf.x).toBeCloseTo(100 * scaleX, 1);
    expect(pdf.width).toBeCloseTo(120 * scaleX, 1);
    expect(pdf.height).toBeCloseTo(40 * scaleY, 1);
    expect(pdf.y).toBeCloseTo(a4Page.height - (200 * scaleY) - (40 * scaleY), 1);
  });
});
