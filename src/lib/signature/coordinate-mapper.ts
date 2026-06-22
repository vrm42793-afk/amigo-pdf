/**
 * Coordinate Mapper Engine
 * Handles conversions between Web Page screen coordinate space (origin top-left)
 * and PDF point space (origin bottom-left, 72 points per inch).
 */

export interface ScreenCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class CoordinateMapper {
  /**
   * Convert screen coordinate space to PDF coordinate space.
   */
  static screenToPdf(
    screen: ScreenCoord,
    viewport: { width: number; height: number },
    pdfPage: { width: number; height: number }
  ): PdfCoord {
    const scaleX = pdfPage.width / viewport.width;
    const scaleY = pdfPage.height / viewport.height;

    const pdfX = screen.x * scaleX;
    const pdfYTop = screen.y * scaleY;
    const pdfWidth = screen.width * scaleX;
    const pdfHeight = screen.height * scaleY;

    // Invert the vertical axis: PDF origin is bottom-left
    const pdfY = pdfPage.height - pdfYTop - pdfHeight;
    const finalX = Math.round(pdfX * 100) / 100;
    const finalY = Math.round(pdfY * 100) / 100;

    return {
      x: finalX === 0 ? 0 : finalX,
      y: finalY === 0 ? 0 : finalY,
      width: Math.round(pdfWidth * 100) / 100,
      height: Math.round(pdfHeight * 100) / 100,
    };
  }

  /**
   * Convert PDF coordinate space to screen coordinate space.
   */
  static pdfToScreen(
    pdf: PdfCoord,
    viewport: { width: number; height: number },
    pdfPage: { width: number; height: number }
  ): ScreenCoord {
    const scaleX = viewport.width / pdfPage.width;
    const scaleY = viewport.height / pdfPage.height;

    const screenX = pdf.x * scaleX;
    const pdfYTop = pdfPage.height - pdf.y - pdf.height;
    const screenY = pdfYTop * scaleY;
    const screenWidth = pdf.width * scaleX;
    const screenHeight = pdf.height * scaleY;

    return {
      x: Math.round(screenX * 100) / 100,
      y: Math.round(screenY * 100) / 100,
      width: Math.round(screenWidth * 100) / 100,
      height: Math.round(screenHeight * 100) / 100,
    };
  }

  /**
   * Calculates scale factor from screen display dimensions to original PDF dimensions.
   */
  static calculateScale(
    viewport: { width: number; height: number },
    pdfPage: { width: number; height: number }
  ): { scaleX: number; scaleY: number } {
    return {
      scaleX: pdfPage.width / viewport.width,
      scaleY: pdfPage.height / viewport.height,
    };
  }
}
