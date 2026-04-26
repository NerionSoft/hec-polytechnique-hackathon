import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, badRequest, notFound } from "@/src/infrastructure/http/apiResult";
import { categorize } from "@/src/lib/document-categorize";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "application/zip",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> },
) {
  try {
    const session = await requireSession(request.headers);
    const { dealId } = await params;
    const useCases = getUseCases();

    const deal = await useCases.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, ownerId: true },
    });
    if (!deal) return notFound("Deal not found");
    if (deal.ownerId !== session.user.id) {
      return notFound("Deal not found");
    }

    const documents = await useCases.prisma.document.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        blobUrl: true,
        byteSize: true,
        pageCount: true,
        status: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok({ documents });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> },
) {
  try {
    const session = await requireSession(request.headers);
    const { dealId } = await params;

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return badRequest("Content-Type must be multipart/form-data");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const relativePathRaw = formData.get("relativePath");

    if (!(file instanceof File)) {
      return badRequest("Missing 'file' field");
    }
    if (file.size === 0) {
      return badRequest("File is empty");
    }
    if (file.size > MAX_FILE_BYTES) {
      return badRequest(`File exceeds ${MAX_FILE_BYTES / 1024 / 1024}MB limit`);
    }
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      return badRequest(`Unsupported file type: ${file.type}`);
    }

    const relativePath =
      typeof relativePathRaw === "string" && relativePathRaw.trim().length > 0
        ? relativePathRaw.trim()
        : file.name;

    const useCases = getUseCases();
    const deal = await useCases.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, ownerId: true },
    });
    if (!deal) return notFound("Deal not found");
    if (deal.ownerId !== session.user.id) {
      return notFound("Deal not found");
    }

    const safeRelative = sanitizeRelativePath(relativePath);
    const blobPath = `deals/${dealId}/${safeRelative}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await useCases.blobStorage.put(blobPath, buffer, {
      contentType: file.type || "application/octet-stream",
    });

    const category = categorize(safeRelative);

    const document = await useCases.prisma.document.create({
      data: {
        dealId,
        blobUrl: blob.url,
        filename: safeRelative,
        byteSize: file.size,
        category,
        status: "UPLOADED",
      },
      select: {
        id: true,
        filename: true,
        blobUrl: true,
        byteSize: true,
        category: true,
        status: true,
        createdAt: true,
      },
    });

    await useCases.prisma.dealAuditEvent.create({
      data: {
        dealId,
        actorId: session.user.id,
        kind: "document.uploaded",
        entity: document.id,
        payload: { filename: safeRelative, byteSize: file.size, category },
      },
    });

    return ok({ document }, 201);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Strip leading slashes and collapse `..` segments so a path crafted by the
 * client cannot escape the deal's folder in blob storage.
 */
function sanitizeRelativePath(raw: string): string {
  return raw
    .replace(/\\/g, "/")
    .split("/")
    .filter((segment) => segment.length > 0 && segment !== "..")
    .join("/");
}
