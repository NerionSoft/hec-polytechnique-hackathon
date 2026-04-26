import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { CsvLeadImporter } from "@/src/infrastructure/sources/csv/CsvLeadImporter";
import { handleError, ok, badRequest } from "@/src/infrastructure/http/apiResult";
import { LEAD_SOURCE } from "@/src/application/domain/lead/enums";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request.headers);

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return badRequest("Content-Type must be multipart/form-data");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const thesisId = formData.get("thesisId");

    if (!(file instanceof File)) {
      return badRequest("Missing 'file' field");
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return badRequest("File must have a .csv extension");
    }
    if (file.size > MAX_FILE_BYTES) {
      return badRequest(`File exceeds ${MAX_FILE_BYTES / 1024 / 1024}MB limit`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const useCases = getUseCases();

    const ts = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const blob = await useCases.blobStorage.put(`leads-imports/${ts}-${random}.csv`, buffer, {
      contentType: "text/csv",
    });

    const importer = new CsvLeadImporter();
    let parsed;
    try {
      parsed = importer.parse(buffer);
    } catch (e) {
      return badRequest(`CSV parsing failed: ${(e as Error).message}`);
    }

    const batch = await useCases.prisma.importBatch.create({
      data: {
        uploaderId: session.user.id,
        source: LEAD_SOURCE.CSV_IMPORT,
        sourceFileUrl: blob.url,
        totalRows: parsed.records.length + parsed.errors.length,
        skippedRows: parsed.errors.length,
        importedRows: 0,
        errorsJson: parsed.errors.length ? (parsed.errors as unknown as object[]) : undefined,
      },
    });

    const result = await useCases.importLeadsFromCsv({
      ownerId: session.user.id,
      thesisId: typeof thesisId === "string" ? thesisId : undefined,
      importBatchId: batch.id,
      records: parsed.records,
    });

    await useCases.prisma.importBatch.update({
      where: { id: batch.id },
      data: { importedRows: result.imported },
    });

    return ok({
      importBatchId: batch.id,
      sourceFileUrl: blob.url,
      imported: result.imported,
      skipped: parsed.errors.length,
      errors: parsed.errors,
    });
  } catch (error) {
    return handleError(error);
  }
}
