#!/usr/bin/env node

import path from "node:path";
import vm from "node:vm";
import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";

const DEFAULT_OUTPUT_DIR = "spine-assets";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function printHelp() {
  console.log(`用法:
  node crawl-spine-assets.mjs <页面URL> [输出目录]

选项:
  --out <目录>      指定输出目录，默认: ${DEFAULT_OUTPUT_DIR}
  --verbose         打印更详细的抓取过程
  --help            显示帮助

示例:
  node crawl-spine-assets.mjs "https://act.mihoyo.com/ys/event/e20250723light-uowufz/index.html"
  node crawl-spine-assets.mjs "https://act.mihoyo.com/ys/event/e20250723light-uowufz/index.html" "./downloaded/spine"
  node crawl-spine-assets.mjs "https://act.mihoyo.com/ys/event/e20250723light-uowufz/index.html" --out "./downloaded/spine" --verbose`);
}

function parseArgs(argv) {
  const args = [...argv];
  let pageUrl = "";
  let outDir = DEFAULT_OUTPUT_DIR;
  let verbose = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--verbose") {
      verbose = true;
      continue;
    }

    if (arg === "--out") {
      const next = args[i + 1];
      if (!next) {
        throw new Error("--out 后面必须跟目录路径");
      }
      outDir = next;
      i += 1;
      continue;
    }

    if (!pageUrl) {
      pageUrl = arg;
      continue;
    }

    if (outDir === DEFAULT_OUTPUT_DIR) {
      outDir = arg;
      continue;
    }

    throw new Error(`无法识别的参数: ${arg}`);
  }

  if (!pageUrl) {
    printHelp();
    process.exit(1);
  }

  return { pageUrl, outDir, verbose };
}

function log(verbose, message) {
  if (verbose) {
    console.log(message);
  }
}

async function request(url, responseType, referer) {
  const urlObject = new URL(url);
  const client = urlObject.protocol === "https:" ? https : http;

  const buffer = await new Promise((resolve, reject) => {
    const requestInstance = client.get(
      urlObject,
      {
        headers: {
          "accept":
            responseType === "text"
              ? "text/html,application/javascript,text/javascript,text/plain,*/*"
              : "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "cache-control": "no-cache",
          pragma: "no-cache",
          referer,
          "user-agent": USER_AGENT,
        },
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;

        if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
          const redirectedUrl = new URL(response.headers.location, url).href;
          response.resume();
          resolve(request(redirectedUrl, "buffer", referer));
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          reject(
            new Error(
              `请求失败 ${statusCode} ${response.statusMessage || ""}: ${url}`
            )
          );
          response.resume();
          return;
        }

        let stream = response;
        const encoding = String(response.headers["content-encoding"] || "").toLowerCase();
        if (encoding.includes("br")) {
          stream = response.pipe(zlib.createBrotliDecompress());
        } else if (encoding.includes("gzip")) {
          stream = response.pipe(zlib.createGunzip());
        } else if (encoding.includes("deflate")) {
          stream = response.pipe(zlib.createInflate());
        }

        const chunks = [];
        stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      }
    );

    requestInstance.on("error", reject);
  });

  if (responseType === "buffer") {
    return buffer;
  }

  return buffer.toString("utf8");
}

function extractScriptUrls(html, pageUrl) {
  const scriptUrls = new Set();
  const scriptPattern = /<script\b[^>]*\bsrc=(["'])(.*?)\1/gi;

  for (const match of html.matchAll(scriptPattern)) {
    const rawSrc = match[2]?.trim();
    if (!rawSrc || !/\.js(?:[?#].*)?$/i.test(rawSrc)) {
      continue;
    }

    scriptUrls.add(new URL(rawSrc, pageUrl).href);
  }

  return [...scriptUrls];
}

function extractImageModuleMap(scriptText) {
  const result = new Map();
  const pattern =
    /\{src:[A-Za-z_$][\w$]*\((\d+)\),id:"([A-Za-z0-9_-]+)",type:"image"\}/g;

  for (const match of scriptText.matchAll(pattern)) {
    const moduleId = Number(match[1]);
    const name = match[2];
    result.set(name, moduleId);
  }

  return result;
}

function extractAssetPathModuleMap(scriptText) {
  const result = new Map();
  const pattern =
    /(?:^|[,{])(\d+):function\([^)]*\)\{"use strict";[^{}]*?exports\s*=\s*[A-Za-z_$][\w$]*\.p\s*\+\s*((?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))/g;

  for (const match of scriptText.matchAll(pattern)) {
    result.set(Number(match[1]), decodeJsStringLiteral(match[2]));
  }

  return result;
}

function createModuleRef(moduleId, scriptIndex) {
  return { moduleId, scriptIndex };
}

function extractDataUrlMimeType(dataUrl) {
  const match = /^data:([^;,]+)[^,]*,/i.exec(dataUrl);
  return match?.[1]?.toLowerCase() || "";
}

function extensionFromMimeType(mimeType) {
  if (mimeType === "image/jpeg") {
    return ".jpg";
  }
  if (mimeType === "image/svg+xml") {
    return ".svg";
  }
  const slashIndex = mimeType.indexOf("/");
  if (slashIndex >= 0) {
    return `.${mimeType.slice(slashIndex + 1).replace(/\+xml$/, "")}`;
  }
  return "";
}

function extractSpineModuleMap(scriptText) {
  const result = new Map();
  const pattern =
    /([A-Za-z0-9_-]+):\{atlas:[A-Za-z_$][\w$]*\((\d+)\),json:[A-Za-z_$][\w$]*\((\d+)\)\}/g;

  for (const match of scriptText.matchAll(pattern)) {
    const name = match[1];
    const atlasModuleId = Number(match[2]);
    const jsonModuleId = Number(match[3]);

    result.set(name, { atlasModuleId, jsonModuleId });
  }

  return result;
}

function moduleNumericFactoryStartRegex(moduleId) {
  return new RegExp(`(?:^|[,{])(${moduleId}:function\\()`);
}

function readModuleBody(scriptText, moduleId) {
  const startRe = moduleNumericFactoryStartRegex(moduleId);
  const boundaryMatch = startRe.exec(scriptText);
  if (!boundaryMatch) {
    return null;
  }

  const start =
    boundaryMatch.index +
    boundaryMatch[0].length -
    boundaryMatch[1].length;
  const headerLength = boundaryMatch[1].length;

  const nextPattern = new RegExp(`\\},\\d+:function\\(`, "g");
  nextPattern.lastIndex = start + headerLength;
  const next = nextPattern.exec(scriptText);

  if (next) {
    return scriptText.slice(start, next.index + 1);
  }

  const tailPattern = /}\s*}\s*]\s*\)/g;
  tailPattern.lastIndex = start + headerLength;
  const tail = tailPattern.exec(scriptText);
  if (tail) {
    return scriptText.slice(start, tail.index + 1);
  }

  return scriptText.slice(start);
}

function decodeJsStringLiteral(literal) {
  return vm.runInNewContext(literal);
}

function extractWebpackReExportTarget(moduleBody) {
  if (!moduleBody) {
    return null;
  }

  const match = moduleBody.match(/exports\s*=\s*n\((\d+)\)/);
  return match ? Number(match[1]) : null;
}

function extractExportedValue(moduleBody) {
  if (!moduleBody) {
    return null;
  }

  const jsonMatch = moduleBody.match(
    /exports\s*=\s*JSON\.parse\(\s*((?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))\s*\)/
  );
  if (jsonMatch) {
    return {
      kind: "json",
      value: JSON.stringify(JSON.parse(decodeJsStringLiteral(jsonMatch[1])), null, 2) + "\n",
    };
  }

  const pathMatch = moduleBody.match(
    /exports\s*=\s*[A-Za-z_$][\w$]*\.p\s*\+\s*((?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))/
  );
  if (pathMatch) {
    return {
      kind: "asset-url",
      value: decodeJsStringLiteral(pathMatch[1]),
    };
  }

  const textMatch = moduleBody.match(
    /exports\s*=\s*((?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))/
  );
  if (textMatch) {
    const value = decodeJsStringLiteral(textMatch[1]);
    return {
      kind: value.startsWith("data:") ? "data-url" : "text",
      value,
    };
  }

  return null;
}

/**
 * 部分 webpack 活动页把 atlas / json 打成匿名模块链：`function(e,t){e.exports="*.png\\n..."}`，
 * 与 SPINE_MANIFEST 里的 `atlas:n(155)` 数字 id 不在同一套 `{155:function...}` 表里。
 * 这类资源仍可通过 manifest 里的 spine 名称与 `*.png` 首行对应关系稳定定位。
 */
function extractSpineFromConcatenatedFactories(scriptText, spineName) {
  if (!scriptText || !spineName) {
    return null;
  }

  const prefix = `function(e,t){e.exports="${spineName}.png`;
  const pos = scriptText.indexOf(prefix);
  if (pos < 0) {
    return null;
  }

  const afterExports = pos + "function(e,t){e.exports=".length;
  const literalMatch = /^("(?:[^"\\]|\\.)*")/.exec(scriptText.slice(afterExports));
  if (!literalMatch) {
    return null;
  }

  let atlasValue;
  try {
    atlasValue = decodeJsStringLiteral(literalMatch[1]);
  } catch {
    return null;
  }

  const rest = scriptText.slice(afterExports + literalMatch[0].length);
  const jsonFactoryIndex = rest.indexOf("function(e){e.exports=JSON.parse");
  if (jsonFactoryIndex < 0) {
    return null;
  }

  const jsonExported = extractExportedValue(rest.slice(jsonFactoryIndex));
  if (!jsonExported || jsonExported.kind !== "json") {
    return null;
  }

  return {
    atlas: { kind: "text", value: atlasValue },
    json: jsonExported,
  };
}

function resolveModuleValue(
  scriptRecords,
  moduleId,
  preferredScriptIndex,
  depth = 0
) {
  if (!Number.isInteger(moduleId) || moduleId < 0 || depth > 64) {
    return null;
  }

  const startRe = moduleNumericFactoryStartRegex(moduleId);

  const orderedRecords =
    Number.isInteger(preferredScriptIndex) &&
    preferredScriptIndex >= 0 &&
    preferredScriptIndex < scriptRecords.length
      ? [
          scriptRecords[preferredScriptIndex],
          ...scriptRecords.filter((_, index) => index !== preferredScriptIndex),
        ]
      : scriptRecords;

  for (const record of orderedRecords) {
    if (!record?.text || !startRe.test(record.text)) {
      continue;
    }

    const moduleBody = readModuleBody(record.text, moduleId);
    const exported = extractExportedValue(moduleBody);
    if (exported) {
      return exported;
    }

    const reExportTarget = extractWebpackReExportTarget(moduleBody);
    if (reExportTarget != null) {
      const chained = resolveModuleValue(
        scriptRecords,
        reExportTarget,
        preferredScriptIndex,
        depth + 1
      );
      if (chained) {
        return chained;
      }
    }
  }

  return null;
}

function safeName(name) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_");
}

function parseAtlasPageNames(atlasText) {
  const pageNames = [];
  const seen = new Set();
  const lines = atlasText.split(/\r?\n/);
  let expectPageName = true;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      expectPageName = true;
      continue;
    }

    if (expectPageName) {
      if (!line.includes(":")) {
        seen.add(line);
        pageNames.push(line);
      }
      expectPageName = false;
      continue;
    }
  }

  return pageNames.filter((name) => seen.has(name));
}

function filenameStem(filename) {
  const ext = path.extname(filename);
  return ext ? filename.slice(0, -ext.length) : filename;
}

function stripHashedSuffix(filename) {
  const ext = path.extname(filename);
  const stem = filenameStem(filename);
  const normalizedStem = stem.replace(/\.[0-9a-f]{6,}\.$/i, "").replace(/\.[0-9a-f]{6,}$/i, "");
  return normalizedStem + ext;
}

function buildImageLookupMaps(imageModuleMap, assetPathModuleMap) {
  const lookup = new Map();

  function add(key, moduleRef) {
    if (key && !lookup.has(key)) {
      lookup.set(key, moduleRef);
    }
  }

  /**
   * 活动页常见：IMAGE 表里 `n(108)` 指向匿名分包模块，真正可解析的是另一条
   * `{71471:function...e.exports=n.p+"images/xxx.<hash>.png"}`。
   * 若先写入 n(108)，后续带 hash 的真实路径会被 add() 跳过，贴图永远解析失败。
   * 因此先登记 assetPath，再用 `src:n(id),id:"stem"` 补全没有独立路径的条目。
   */
  for (const [moduleRef, assetPath] of assetPathModuleMap) {
    const basename = path.basename(assetPath);
    const normalizedBasename = stripHashedSuffix(basename);
    const normalizedStem = filenameStem(normalizedBasename);

    add(basename, moduleRef);
    add(filenameStem(basename), moduleRef);
    add(normalizedBasename, moduleRef);
    add(normalizedStem, moduleRef);
  }

  for (const [name, moduleRef] of imageModuleMap) {
    add(name, moduleRef);
    add(`${name}.png`, moduleRef);
    add(`${name}.jpg`, moduleRef);
    add(`${name}.jpeg`, moduleRef);
    add(`${name}.webp`, moduleRef);
  }

  return lookup;
}

function decodeDataUrl(dataUrl) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) {
    throw new Error("非法 data URL");
  }

  const header = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);

  if (/;base64/i.test(header)) {
    return Buffer.from(payload, "base64");
  }

  return Buffer.from(decodeURIComponent(payload), "utf8");
}

async function resolveImageBinary(scriptRecords, moduleRef, pageUrl) {
  const exported = resolveModuleValue(
    scriptRecords,
    moduleRef.moduleId,
    moduleRef.scriptIndex
  );
  if (!exported) {
    return null;
  }

  if (exported.kind === "asset-url") {
    const assetUrl = new URL(exported.value, pageUrl).href;
    return {
      sourceUrl: assetUrl,
      buffer: await request(assetUrl, "buffer", pageUrl),
      extensionHint: path.extname(new URL(assetUrl).pathname),
    };
  }

  if (exported.kind === "data-url") {
    const mimeType = extractDataUrlMimeType(exported.value);
    return {
      sourceUrl: "inline-data-url",
      buffer: decodeDataUrl(exported.value),
      extensionHint: extensionFromMimeType(mimeType),
    };
  }

  return null;
}

async function analyzePageScripts(pageUrl, verbose) {
  const normalizedPageUrl = new URL(pageUrl).href;

  log(verbose, `抓取页面: ${normalizedPageUrl}`);
  const html = await request(normalizedPageUrl, "text", normalizedPageUrl);
  const scriptUrls = extractScriptUrls(html, normalizedPageUrl);

  if (!scriptUrls.length) {
    throw new Error("页面里没有找到任何 JS 脚本，无法继续分析");
  }

  log(verbose, `找到 ${scriptUrls.length} 个脚本`);

  const scriptRecords = await Promise.all(
    scriptUrls.map(async (scriptUrl) => {
      log(verbose, `下载脚本: ${scriptUrl}`);
      return {
        url: scriptUrl,
        text: await request(scriptUrl, "text", normalizedPageUrl),
      };
    })
  );

  return {
    normalizedPageUrl,
    scriptRecords,
  };
}

function parseJsonExport(jsonText) {
  const jsonData = JSON.parse(jsonText);
  const animationNames = Object.keys(jsonData.animations || {});
  const defaultAnimation =
    animationNames.includes("animation") ? "animation" : animationNames[0] || "";

  return {
    jsonData,
    animationNames,
    defaultAnimation,
    skeleton: jsonData.skeleton || null,
  };
}

async function buildExtractedAssets({ normalizedPageUrl, scriptRecords, verbose }) {
  const imageModuleMap = new Map();
  const assetPathModuleMap = new Map();
  const spineModuleMap = new Map();

  for (const [scriptIndex, record] of scriptRecords.entries()) {
    for (const [name, moduleId] of extractImageModuleMap(record.text)) {
      imageModuleMap.set(name, createModuleRef(moduleId, scriptIndex));
    }

    for (const [moduleId, assetPath] of extractAssetPathModuleMap(record.text)) {
      assetPathModuleMap.set(createModuleRef(moduleId, scriptIndex), assetPath);
    }

    for (const [name, ids] of extractSpineModuleMap(record.text)) {
      spineModuleMap.set(name, {
        ...ids,
        scriptIndex,
      });
    }
  }

  if (!spineModuleMap.size) {
    throw new Error("没有从脚本中识别到 Spine 资源映射");
  }

  const imageLookupMap = buildImageLookupMaps(imageModuleMap, assetPathModuleMap);
  const assets = [];
  const warnings = [];

  for (const [name, { atlasModuleId, jsonModuleId, scriptIndex }] of [...spineModuleMap.entries()].sort()) {
    let atlasExport = resolveModuleValue(scriptRecords, atlasModuleId, scriptIndex);
    let jsonExport = resolveModuleValue(scriptRecords, jsonModuleId, scriptIndex);

    if (
      !atlasExport ||
      atlasExport.kind !== "text" ||
      !jsonExport ||
      jsonExport.kind !== "json"
    ) {
      let fallback = null;
      const preferredText = scriptRecords[scriptIndex]?.text;
      if (preferredText) {
        fallback = extractSpineFromConcatenatedFactories(preferredText, name);
      }
      if (!fallback) {
        for (const record of scriptRecords) {
          fallback = extractSpineFromConcatenatedFactories(record.text, name);
          if (fallback) {
            break;
          }
        }
      }
      if (fallback) {
        if (!atlasExport || atlasExport.kind !== "text") {
          atlasExport = fallback.atlas;
        }
        if (!jsonExport || jsonExport.kind !== "json") {
          jsonExport = fallback.json;
        }
      }
    }

    if (!atlasExport || atlasExport.kind !== "text") {
      warnings.push(`${name}: atlas 模块 ${atlasModuleId} 解析失败`);
      continue;
    }

    if (!jsonExport || jsonExport.kind !== "json") {
      warnings.push(`${name}: json 模块 ${jsonModuleId} 解析失败`);
      continue;
    }

    const atlasPageNames = parseAtlasPageNames(atlasExport.value);
    if (!atlasPageNames.length) {
      warnings.push(`${name}: atlas 中没有解析到贴图页面`);
      continue;
    }

    const parsedJson = parseJsonExport(jsonExport.value);
    const imageFiles = [];
    const missingPages = [];

    for (const atlasPageName of atlasPageNames) {
      const stem = filenameStem(atlasPageName);
      const imageModuleRef =
        imageLookupMap.get(atlasPageName) ??
        imageLookupMap.get(stem) ??
        imageModuleMap.get(stem) ??
        imageModuleMap.get(atlasPageName);

      if (!imageModuleRef) {
        missingPages.push(atlasPageName);
        continue;
      }

      const imageBinary = await resolveImageBinary(
        scriptRecords,
        imageModuleRef,
        normalizedPageUrl
      );

      if (!imageBinary) {
        missingPages.push(atlasPageName);
        continue;
      }

      const atlasPageExt = path.extname(atlasPageName);
      const extension = atlasPageExt || imageBinary.extensionHint || ".png";
      const outputFileName = safeName(
        atlasPageExt ? atlasPageName : `${atlasPageName}${extension}`
      );

      log(
        verbose,
        `下载贴图: ${name} / ${outputFileName} -> ${imageBinary.sourceUrl}`
      );

      imageFiles.push({
        fileName: outputFileName,
        originalName: atlasPageName,
        sourceUrl: imageBinary.sourceUrl,
        buffer: imageBinary.buffer,
      });
    }

    if (missingPages.length) {
      warnings.push(`${name}: 缺少贴图页面 ${missingPages.join(", ")}`);
      continue;
    }

    assets.push({
      name,
      safeName: safeName(name),
      atlasFile: `${safeName(name)}.atlas`,
      atlasText: atlasExport.value,
      jsonFile: `${safeName(name)}.json`,
      jsonText: jsonExport.value,
      imageFiles,
      ...parsedJson,
    });
  }

  return {
    assetCount: spineModuleMap.size,
    assets,
    warnings,
  };
}

async function writeExtractedAssets(outputDir, assets, organizeByAsset) {
  await mkdir(outputDir, { recursive: true });

  for (const asset of assets) {
    const assetDir = organizeByAsset
      ? path.join(outputDir, asset.safeName)
      : outputDir;

    await mkdir(assetDir, { recursive: true });

    const writes = [
      writeFile(path.join(assetDir, asset.atlasFile), asset.atlasText, "utf8"),
      writeFile(path.join(assetDir, asset.jsonFile), asset.jsonText, "utf8"),
      ...asset.imageFiles.map((image) =>
        writeFile(path.join(assetDir, image.fileName), image.buffer)
      ),
    ];

    await Promise.all(writes);
  }
}

function summarizeAssets(assets, organizeByAsset) {
  return assets.map((asset) => ({
    name: asset.name,
    safeName: asset.safeName,
    directoryName: organizeByAsset ? asset.safeName : "",
    atlasFile: asset.atlasFile,
    jsonFile: asset.jsonFile,
    imageFiles: asset.imageFiles.map((image) => image.fileName),
    textureCount: asset.imageFiles.length,
    animationNames: asset.animationNames,
    defaultAnimation: asset.defaultAnimation,
    skeleton: asset.skeleton,
  }));
}

export async function extractSpineAssets(options) {
  const {
    pageUrl,
    outputDir,
    verbose = false,
    organizeByAsset = false,
  } = options;

  const { normalizedPageUrl, scriptRecords } = await analyzePageScripts(pageUrl, verbose);
  const { assetCount, assets, warnings } = await buildExtractedAssets({
    normalizedPageUrl,
    scriptRecords,
    verbose,
  });

  if (outputDir) {
    await writeExtractedAssets(outputDir, assets, organizeByAsset);
  }

  return {
    pageUrl: normalizedPageUrl,
    outputDir: outputDir ? path.resolve(outputDir) : null,
    assetCount,
    savedCount: assets.length,
    assets: summarizeAssets(assets, organizeByAsset),
    warnings,
  };
}

function printCliResult(result) {
  console.log(
    `完成: 共识别 ${result.assetCount} 组 Spine 资源，成功保存 ${result.savedCount} 组到 ${result.outputDir}`
  );

  if (result.assets.length) {
    console.log(`资源列表: ${result.assets.map((asset) => asset.name).join(", ")}`);
  }

  if (result.warnings.length) {
    console.warn("\n以下资源未完整保存:");
    for (const warning of result.warnings) {
      console.warn(`- ${warning}`);
    }
  }
}

async function main() {
  const { pageUrl, outDir, verbose } = parseArgs(process.argv.slice(2));
  const result = await extractSpineAssets({
    pageUrl,
    outputDir: outDir,
    verbose,
    organizeByAsset: false,
  });

  printCliResult(result);

  if (result.warnings.length) {
    process.exitCode = 2;
  }
}

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((error) => {
    console.error(`抓取失败: ${error.message}`);
    process.exit(1);
  });
}
