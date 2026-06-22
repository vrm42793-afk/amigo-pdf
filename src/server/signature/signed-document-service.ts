import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import crypto from "crypto";
import { uploadPrivateFile } from "@/lib/cloudinary/uploader";
import { getUserSignedFolder } from "@/lib/cloudinary/config";
import { CoordinateMapper } from "@/lib/signature/coordinate-mapper";
import { PlacedStamp, SignedDocument } from "@/types/signature/signature.types";
import { SignatureAuditService } from "./signature-audit-service";

export interface SignDocumentParams {
  userId: string;
  fileId: string;
  stamps: PlacedStamp[];
  ipAddress: string;
  userAgent: string;
}

export class SignedDocumentService {
  /**
   * Embed signatures and annotations onto the PDF, generate an audit certificate, and save.
   */
  static async signDocument(params: SignDocumentParams): Promise<SignedDocument> {
    const supabase = await createClient();

    // 1. Fetch file details from database
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("*")
      .eq("id", params.fileId)
      .eq("user_id", params.userId)
      .single();

    if (fileError || !file) {
      throw new Error("Target file not found or unauthorized");
    }

    // 2. Download the original PDF file
    const fileResponse = await fetch(file.cloudinary_secure_url);
    if (!fileResponse.ok) {
      throw new Error("Failed to download PDF source from Cloudinary");
    }
    const pdfBytes = await fileResponse.arrayBuffer();

    // 3. Load PDF in pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const originalPageCount = pages.length;

    // Load standard Helvetica fonts for drawing text/date stamps
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 4. Place each stamp on target page
    for (const stamp of params.stamps) {
      const pageIdx = stamp.pageNumber - 1;
      if (pageIdx < 0 || pageIdx >= originalPageCount) {
        throw new Error(`Invalid page number ${stamp.pageNumber} specified for stamp placement`);
      }

      const page = pages[pageIdx];
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();

      // Viewport dimensions sent from client or default scale ratio
      // If client didn't supply layout viewport size, assume page size mapping (1:1)
      const viewport = {
        width: stamp.width === stamp.height ? 500 : 500, // screen width reference
        height: (500 * pageHeight) / pageWidth,
      };

      // Map coordinates to PDF points using coordinate engine
      const pdfCoord = CoordinateMapper.screenToPdf(
        { x: stamp.x, y: stamp.y, width: stamp.width, height: stamp.height },
        viewport,
        { width: pageWidth, height: pageHeight }
      );

      if (stamp.type === "signature" || stamp.type === "initials") {
        // value is either base64 image data or secure image URL
        let imgBuffer: Buffer;
        if (stamp.value.startsWith("data:image")) {
          // base64 parsing
          const base64Data = stamp.value.replace(/^data:image\/\w+;base64,/, "");
          imgBuffer = Buffer.from(base64Data, "base64");
        } else {
          // Download template image URL
          const imgResponse = await fetch(stamp.value);
          if (!imgResponse.ok) {
            throw new Error("Failed to download signature stamp template from Cloudinary");
          }
          const arrayBuf = await imgResponse.arrayBuffer();
          imgBuffer = Buffer.from(arrayBuf);
        }

        // Embed image as PNG (drawing pad exports PNG)
        const embeddedImg = await pdfDoc.embedPng(imgBuffer);

        // Draw image at computed PDF coordinates
        page.drawImage(embeddedImg, {
          x: pdfCoord.x,
          y: pdfCoord.y,
          width: pdfCoord.width,
          height: pdfCoord.height,
        });
      } else if (stamp.type === "date" || stamp.type === "text") {
        // Draw background box or text
        page.drawText(stamp.value, {
          x: pdfCoord.x,
          y: pdfCoord.y + (pdfCoord.height / 2) - 4, // Center vertically roughly
          size: Math.max(8, Math.min(14, pdfCoord.height * 0.4)), // dynamic scale based on stamp height
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }
    }

    // 5. Append Signature Certificate Receipt Page at the end
    // Use Letter size page layout (612 x 792 pt)
    const certPage = pdfDoc.addPage([612, 792]);
    const certId = crypto.randomUUID();

    // Fetch user details for certificate signature credentials
    const { data: userProfile } = await supabase
      .from("users")
      .select("email, name")
      .eq("id", params.userId)
      .single();

    const signerName = userProfile?.name || "Anonymous Signer";
    const signerEmail = userProfile?.email || "Unknown Email";
    const signDateStr = new Date().toUTCString();

    // Draw Certificate Border/Frame
    certPage.drawRectangle({
      x: 36,
      y: 36,
      width: 540,
      height: 720,
      borderWidth: 1,
      borderColor: rgb(0.8, 0.8, 0.8),
    });

    // Draw Header
    certPage.drawText("AMIGO PDF Signature Certificate", {
      x: 54,
      y: 710,
      size: 20,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    certPage.drawLine({
      start: { x: 54, y: 690 },
      end: { x: 558, y: 690 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Document Metadata
    const drawMetaRow = (label: string, value: string, startY: number) => {
      certPage.drawText(label, { x: 54, y: startY, size: 10, font: helveticaBold, color: rgb(0.4, 0.4, 0.4) });
      certPage.drawText(value, { x: 180, y: startY, size: 10, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
    };

    let curY = 660;
    drawMetaRow("Certificate ID:", certId, curY); curY -= 25;
    drawMetaRow("Signed By Name:", signerName, curY); curY -= 25;
    drawMetaRow("Signed By Email:", signerEmail, curY); curY -= 25;
    drawMetaRow("Signing Date (UTC):", signDateStr, curY); curY -= 25;
    drawMetaRow("Original Page Count:", `${originalPageCount} Pages`, curY); curY -= 25;
    drawMetaRow("Signatures Applied:", `${params.stamps.filter(s => s.type === "signature" || s.type === "initials").length} Stamp(s)`, curY); curY -= 25;
    drawMetaRow("Total Stamps:", `${params.stamps.length} Stamp(s)`, curY); curY -= 40;

    // Placed Stamps Locations List
    certPage.drawText("Stamp Placement Log:", { x: 54, y: curY, size: 11, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
    curY -= 20;

    params.stamps.forEach((stamp, index) => {
      if (curY < 200) return; // Prevent text overflow
      const stampDesc = `Stamp #${index + 1}: ${stamp.type.toUpperCase()} on Page ${stamp.pageNumber} (x: ${Math.round(stamp.x)}, y: ${Math.round(stamp.y)})`;
      certPage.drawText(stampDesc, { x: 64, y: curY, size: 9, font: helveticaFont, color: rgb(0.3, 0.3, 0.3) });
      curY -= 15;
    });

    curY -= 25;

    // Security Metrics
    certPage.drawText("Security & IP Auditing Details:", { x: 54, y: curY, size: 11, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
    curY -= 20;
    drawMetaRow("IP Address:", params.ipAddress, curY); curY -= 20;
    
    // User-agent text wrapping helper
    const uaLines = params.userAgent.match(/.{1,70}/g) || [params.userAgent];
    certPage.drawText("User Agent:", { x: 54, y: curY, size: 10, font: helveticaBold, color: rgb(0.4, 0.4, 0.4) });
    uaLines.forEach((line) => {
      certPage.drawText(line, { x: 180, y: curY, size: 9, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
      curY -= 13;
    });
    curY -= 15;

    // Save PDF Bytes
    const signedPdfBytes = await pdfDoc.save();

    // 6. Compute SHA-256 Document Hash
    const docHash = crypto.createHash("sha256").update(signedPdfBytes).digest("hex");
    drawMetaRow("Document Hash (SHA-256):", docHash, curY);

    // 7. Upload signed PDF to Cloudinary as private asset
    const privateFolder = getUserSignedFolder(params.userId);
    const signedFileId = crypto.randomUUID();
    const uploadRes = await uploadPrivateFile({
      fileBuffer: Buffer.from(signedPdfBytes),
      folder: privateFolder,
      publicId: signedFileId,
      resourceType: "raw", // PDFs are uploaded as raw resources in uploader configuration
    });

    // 8. Insert record in signed_documents table
    const { data: signedDoc, error: insertError } = await supabase
      .from("signed_documents")
      .insert({
        user_id: params.userId,
        file_id: params.fileId,
        signed_url: uploadRes.secureUrl,
        document_hash: docHash,
        page_count: originalPageCount + 1, // Including appended certificate page
        signature_count: params.stamps.length,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert signed document record: ${insertError.message}`);
    }

    // 9. Write audit log entries
    // Main Document Sign Action
    await SignatureAuditService.logEvent({
      documentId: signedDoc.id,
      action: "signed_document",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: { certificateId: certId, originalPageCount, documentHash: docHash },
    });

    // Stamp Placement Actions
    for (const stamp of params.stamps) {
      const mapped = CoordinateMapper.screenToPdf(
        { x: stamp.x, y: stamp.y, width: stamp.width, height: stamp.height },
        { width: 500, height: (500 * pages[stamp.pageNumber - 1].getHeight()) / pages[stamp.pageNumber - 1].getWidth() },
        { width: pages[stamp.pageNumber - 1].getWidth(), height: pages[stamp.pageNumber - 1].getHeight() }
      );

      await SignatureAuditService.logEvent({
        documentId: signedDoc.id,
        action: `placed_${stamp.type}`,
        pageNumber: stamp.pageNumber,
        x: mapped.x,
        y: mapped.y,
        width: mapped.width,
        height: mapped.height,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    }

    return signedDoc as SignedDocument;
  }
}
