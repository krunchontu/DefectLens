import cors from "cors";
import express from "express";
import { analyzeDefect } from "./aiService";
import { asyncHandler, errorHandler, HttpError } from "./errors";
import { prisma } from "./prisma";
import { parsePreventionProgress, serializeDefect, serializeDefectSummary } from "./serializer";
import { createDefectSchema, defectListQuerySchema, preventionToggleSchema, updateDefectSchema } from "./validation";
import type { PreventionProgress } from "./types";

export const app = express();

app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.trim() || false
    })
  );
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get(
  "/api/defects",
  asyncHandler(async (req, res) => {
    const query = defectListQuerySchema.parse(req.query);
    const { status, severity, module, environment, q, page, pageSize } = query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (module) where.module = { contains: module };
    if (environment) where.environment = environment;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { module: { contains: q } },
        { affectedCaseIds: { contains: q } }
      ];
    }

    const [defects, total] = await Promise.all([
      prisma.defect.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          module: true,
          environment: true,
          severity: true,
          status: true,
          affectedCaseIds: true,
          rootCauseCategory: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.defect.count({ where })
    ]);

    res.json({
      items: defects.map(serializeDefectSummary),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    });
  })
);

app.get(
  "/api/defects/:id",
  asyncHandler(async (req, res) => {
    const defect = await prisma.defect.findUnique({ where: { id: req.params.id } });
    if (!defect) {
      throw new HttpError(404, "Defect not found", "NOT_FOUND");
    }

    res.json(serializeDefect(defect));
  })
);

app.post(
  "/api/defects",
  asyncHandler(async (req, res) => {
    const input = createDefectSchema.parse(req.body);
    const defect = await prisma.defect.create({ data: input });
    res.status(201).json(serializeDefect(defect));
  })
);

app.patch(
  "/api/defects/:id",
  asyncHandler(async (req, res) => {
    const input = updateDefectSchema.parse(req.body);
    const existing = await prisma.defect.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new HttpError(404, "Defect not found", "NOT_FOUND");
    }

    const defect = await prisma.defect.update({
      where: { id: req.params.id },
      data: input
    });

    res.json(serializeDefect(defect));
  })
);

app.delete(
  "/api/defects/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.defect.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new HttpError(404, "Defect not found", "NOT_FOUND");
    }

    await prisma.defect.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

app.post(
  "/api/defects/:id/analyze",
  asyncHandler(async (req, res) => {
    const existing = await prisma.defect.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new HttpError(404, "Defect not found", "NOT_FOUND");
    }

    let analysis;
    try {
      analysis = await analyzeDefect(existing);
    } catch (error) {
      if (error instanceof Error && error.message === "AI response could not be parsed") {
        throw new HttpError(500, "AI response could not be parsed", "AI_PARSE_ERROR");
      }
      throw error;
    }

    const defect = await prisma.defect.update({
      where: { id: req.params.id },
      data: {
        rootCauseCategory: analysis.rootCauseCategory,
        rootCauseExplanation: analysis.rootCauseExplanation,
        similarRiskAreas: JSON.stringify(analysis.similarRiskAreas),
        preventionActions: JSON.stringify(analysis.preventionActions),
        uatScenarios: JSON.stringify(analysis.uatScenarios),
        cabSummary: analysis.cabSummary,
        releaseRisk: analysis.releaseRisk,
        rollbackConsideration: analysis.rollbackConsideration,
        // Reconcile prevention progress: keep entries that still exist in new actions
        preventionProgress: JSON.stringify(
          reconcilePreventionProgress(
            parsePreventionProgress(existing.preventionProgress),
            analysis.preventionActions
          )
        )
      }
    });

    res.json(serializeDefect(defect));
  })
);

function reconcilePreventionProgress(
  existing: PreventionProgress,
  newActions: string[]
): PreventionProgress {
  const reconciled: PreventionProgress = {};
  for (const action of newActions) {
    if (existing[action]) {
      reconciled[action] = existing[action];
    }
  }
  return reconciled;
}

app.patch(
  "/api/defects/:id/prevention",
  asyncHandler(async (req, res) => {
    const input = preventionToggleSchema.parse(req.body);
    const existing = await prisma.defect.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new HttpError(404, "Defect not found", "NOT_FOUND");
    }

    const progress = parsePreventionProgress(existing.preventionProgress);
    progress[input.action] = {
      done: input.done,
      updatedAt: new Date().toISOString()
    };

    const defect = await prisma.defect.update({
      where: { id: req.params.id },
      data: { preventionProgress: JSON.stringify(progress) }
    });

    res.json(serializeDefect(defect));
  })
);

app.get(
  "/api/dashboard",
  asyncHandler(async (_req, res) => {
    const defects = await prisma.defect.findMany({ orderBy: { createdAt: "desc" } });
    const analysed = defects.filter((defect) => defect.rootCauseCategory).length;

    const countBy = (field: "status" | "severity" | "module") => {
      const counts = defects.reduce<Record<string, number>>((acc, defect) => {
        acc[defect[field]] = (acc[defect[field]] ?? 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
    };

    const byRootCauseCounts = defects.reduce<Record<string, number>>((acc, defect) => {
      const category = defect.rootCauseCategory ?? "Not Analysed";
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {});

    res.json({
      totalDefects: defects.length,
      analysisCoverage: {
        analysed,
        total: defects.length,
        percent: defects.length === 0 ? 0 : Math.round((analysed / defects.length) * 100)
      },
      byStatus: countBy("status").map(({ key, count }) => ({ status: key, count })),
      bySeverity: countBy("severity").map(({ key, count }) => ({ severity: key, count })),
      byRootCause: Object.entries(byRootCauseCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      highRiskModules: countBy("module")
        .slice(0, 5)
        .map(({ key, count }) => ({ module: key, count })),
      recentDefects: defects.slice(0, 5).map((defect) => ({
        id: defect.id,
        title: defect.title,
        severity: defect.severity,
        status: defect.status,
        createdAt: defect.createdAt.toISOString()
      }))
    });
  })
);

app.use("/api", (_req, _res, next) => {
  next(new HttpError(404, "Endpoint not found", "NOT_FOUND"));
});

app.use(errorHandler);
