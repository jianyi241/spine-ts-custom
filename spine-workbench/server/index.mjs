import archiver from "archiver";
import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import { access, mkdir, readdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { extractSpineAssets } from "../../crawl-spine-assets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");
const distDir = path.join(projectDir, "dist");
const cacheDir = path.join(projectDir, ".spine-workbench-cache");
const port = Number(process.env.PORT || 3107);
const sessionTtlMs = 12 * 60 * 60 * 1000;

const app = express();

app.use(express.json({ limit: "1mb" }));

function ensureHttpUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("只支持 http/https 页面地址");
  }
  return url.href;
}

function resolveInside(baseDir, ...segments) {
  const target = path.resolve(baseDir, ...segments);
  if (target !== baseDir && !target.startsWith(`${baseDir}${path.sep}`)) {
    throw new Error("非法路径");
  }
  return target;
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function ensureCacheDir() {
  await mkdir(cacheDir, { recursive: true });
}

async function cleanupExpiredSessions() {
  await ensureCacheDir();
  const entries = await readdir(cacheDir, { withFileTypes: true });
  const now = Date.now();

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory()) {
        return;
      }

      const sessionDir = path.join(cacheDir, entry.name);
      const sessionStat = await stat(sessionDir);
      if (now - sessionStat.mtimeMs > sessionTtlMs) {
        await rm(sessionDir, { recursive: true, force: true });
      }
    })
  );
}

function assetResponse(sessionId, asset) {
  const encodedAssetName = encodeURIComponent(asset.directoryName);
  const baseUrl = `/api/sessions/${sessionId}/assets/${encodedAssetName}/files/`;

  return {
    ...asset,
    baseUrl,
    atlasUrl: `${baseUrl}${asset.atlasFile}`,
    jsonUrl: `${baseUrl}${asset.jsonFile}`,
    imageUrls: asset.imageFiles.map((fileName) => `${baseUrl}${fileName}`),
    downloadUrl: `/api/sessions/${sessionId}/assets/${encodedAssetName}/download`,
  };
}

function sendZip(res, sourceDir, archiveRootName, downloadName) {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(downloadName)}"`
  );

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.on("error", (error) => {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.destroy(error);
  });

  archive.pipe(res);
  archive.directory(sourceDir, archiveRootName);
  archive.finalize();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/extract", async (req, res) => {
  try {
    const pageUrl = ensureHttpUrl(String(req.body?.url || "").trim());

    await cleanupExpiredSessions();

    const sessionId = crypto.randomUUID();
    const sessionDir = path.join(cacheDir, sessionId);

    const result = await extractSpineAssets({
      pageUrl,
      outputDir: sessionDir,
      organizeByAsset: true,
      verbose: false,
    });

    res.json({
      sessionId,
      pageUrl: result.pageUrl,
      outputDir: result.outputDir,
      assetCount: result.assetCount,
      savedCount: result.savedCount,
      warnings: result.warnings,
      downloadUrl: `/api/sessions/${sessionId}/download`,
      assets: result.assets.map((asset) => assetResponse(sessionId, asset)),
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "提取失败",
    });
  }
});

app.get("/api/sessions/:sessionId/download", async (req, res) => {
  try {
    const sessionDir = resolveInside(cacheDir, req.params.sessionId);
    if (!(await exists(sessionDir))) {
      res.status(404).json({ error: "会话不存在或已过期" });
      return;
    }

    sendZip(
      res,
      sessionDir,
      "spine-assets",
      `spine-assets-${req.params.sessionId}.zip`
    );
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "打包失败",
    });
  }
});

app.get("/api/sessions/:sessionId/assets/:assetName/download", async (req, res) => {
  try {
    const assetDir = resolveInside(
      cacheDir,
      req.params.sessionId,
      req.params.assetName
    );
    if (!(await exists(assetDir))) {
      res.status(404).json({ error: "资源不存在或已过期" });
      return;
    }

    sendZip(res, assetDir, req.params.assetName, `${req.params.assetName}.zip`);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "资源下载失败",
    });
  }
});

app.get("/api/sessions/:sessionId/assets/:assetName/files/:fileName", async (req, res) => {
  try {
    const assetDir = resolveInside(
      cacheDir,
      req.params.sessionId,
      req.params.assetName
    );
    const filePath = resolveInside(assetDir, req.params.fileName);

    if (!(await exists(filePath))) {
      res.status(404).json({ error: "文件不存在或已过期" });
      return;
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "文件读取失败",
    });
  }
});

async function start() {
  await ensureCacheDir();
  await cleanupExpiredSessions();

  const hasDist = await exists(distDir);
  if (process.env.NODE_ENV === "production" && hasDist) {
    app.use(express.static(distDir));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(port, () => {
    console.log(`Spine 工作台服务已启动: http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
