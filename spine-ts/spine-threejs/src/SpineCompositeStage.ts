/**
 * @file SpineCompositeStage.ts
 * @description
 * 在单个 WebGL 画布上组合多套 Spine 资源（多 atlas/json），共用渲染循环与正交相机。
 * 支持：每层矩形布局（像素或相对 0~1）、固定设计分辨率 + DOM 等比缩放、透明/纯色清屏、指针拾取与 hover。
 *
 * 坐标约定：
 * - **逻辑画布**：宽 `logicalW`、高 `logicalH`；层 `layout` 的 x,y,width,height 为**左上角原点、x 向右、y 向下**（与 DOM/canvas 一致）。
 * - **Three 世界空间**：正交相机 y 轴向上，`offsetX/offsetY` 会通过 `_canvasToWorld` 转为世界坐标。
 */

import * as THREE from 'three';
import {
    AtlasAttachmentLoader,
    Physics,
    SkeletonData,
    SkeletonJson,
    Vector2,
} from '@esotericsoftware/spine-core';
import { AssetManager } from './AssetManager.js';
import { SkeletonMesh } from './SkeletonMesh.js';

/** 画布内矩形：左上角为原点，x 向右、y 向下（与 DOM / canvas 坐标一致） */
export interface SpineCompositeRect {
    /** 矩形左上角 x（像素） */
    x: number;
    /** 矩形左上角 y（像素） */
    y: number;
    /** 矩形宽度（像素） */
    width: number;
    /** 矩形高度（像素） */
    height: number;
    /**
     * 将骨骼 AABB 放入矩形时的缩放策略：
     * - `contain`：等比缩小以完全落入矩形（可能留白）
     * - `cover`：等比放大以铺满矩形（可能裁切）
     */
    fit?: 'contain' | 'cover';
}

/**
 * 相对「整幅逻辑画布」的归一化占位（分量均为 0~1）。
 * 每次 `_resize` / `refitFromContainer` 时会换算为像素 `layout`，便于多资源随容器一起缩放。
 */
export interface SpineLayerRelativeLayout {
    /** 左边缘 / 画布逻辑宽度 */
    x: number;
    /** 上边缘 / 画布逻辑高度 */
    y: number;
    /** 占位宽度 / 画布逻辑宽度 */
    w: number;
    /** 占位高度 / 画布逻辑高度 */
    h: number;
}

/** 单层 Spine 资源配置（与运行时 `BuiltLayer` 对应） */
export interface SpineCompositeLayerConfig {
    /** 唯一 id，用于事件回调与 `setLayer*` 系列 API */
    id: string;
    /** 图集路径（可与 json 同目录，支持 `dir/file.atlas` 或仅 `file.atlas`） */
    atlas: string;
    /** Skeleton JSON 路径 */
    json: string;
    /**
     * 绝对像素矩形（与 `layoutRelative` 可同时存在；参与 `_resize` 时以 `layoutRelative` 换算结果为准）。
     * 仅使用 `layoutRelative` 时可为占位尺寸，加载完成后会被 `_syncLayoutFromRelativeForConfig` 覆盖。
     */
    layout?: SpineCompositeRect;
    /**
     * 相对整幅逻辑画布的占位（0~1）。若设置，则每次 `_resize` / `refitFromContainer` 时
     * 根据当前 `logicalW` / `logicalH` 重算像素 `layout`，再调用 `_applyLayout`。
     */
    layoutRelative?: SpineLayerRelativeLayout;
    /** 传入 `SkeletonJson.scale`，影响骨骼读取时的整体缩放，默认 1 */
    scale?: number;
    /** 首选动画名；不存在时依次回退 `animation`、首条动画 */
    animation?: string;
    /** 是否循环播放，默认 true */
    loop?: boolean;
    /** 单 mesh 最大顶点数，默认 8000 */
    maxVert?: number;
    /** 渲染与拾取顺序，越大越在上层；未设时按 `layers` 数组顺序推导 */
    zIndex?: number;
    /** 是否参与矩形区域拾取，默认 true */
    pickable?: boolean;
}

/** 指针事件回调中携带的归一化信息 */
export interface SpineCompositePointerDetail {
    /** 命中层 id；未命中时不会构造此对象 */
    layerId: string;
    /** 逻辑画布内 x（像素，左上原点、向右为正） */
    offsetX: number;
    /** 逻辑画布内 y（像素，左上原点、向下为正） */
    offsetY: number;
    /** 与正交相机一致的「世界」坐标：画布中心为 (0,0)，y 向上 */
    worldX: number;
    worldY: number;
    /** 原始浏览器指针事件 */
    nativeEvent: PointerEvent;
}

/** `SpineCompositeStage` 构造与运行时配置 */
export interface SpineCompositeStageConfig {
    /**
     * 挂载 WebGL `<canvas>` 的 DOM 节点。
     * 逻辑画布默认取该元素 `getBoundingClientRect()`；`ResizeObserver` 监听此节点以触发 `_resize`。
     * 建议使用有明确尺寸的容器，便于 `layoutRelative` 与 `contain` 观感稳定。
     */
    container: HTMLElement;
    /**
     * 逻辑画布宽高（像素）。
     * 未与 `fixedLogicalSize` 联用时：若缺省则从容器尺寸读取。
     * 与 `fixedLogicalSize: true` 联用时：为固定设计稿分辨率（必填正数）。
     */
    width?: number;
    height?: number;
    /**
     * 为 true 时：`width`/`height` 视为固定设计分辨率；相机与布局始终在此像素空间内计算。
     * WebGL 缓冲按该尺寸创建，`setSize(..., false)` 后通过 CSS 在容器内**等比缩放**整块画布，保证多层相对位置不变。
     */
    fixedLogicalSize?: boolean;
    /**
     * 资源目录前缀，传给内部 `AssetManager`（如 `"assets/"`）。
     * 各层 atlas/json 的「文件名」需能在此前缀下唯一定位。
     */
    pathPrefix: string;
    /** 至少一层；每层独立 atlas/json 与布局 */
    layers: SpineCompositeLayerConfig[];
    /**
     * WebGL 清屏颜色。
     * - `null`：透明清屏（`alpha: true` 且 `setClearColor(..., 0)`），可透出容器 CSS 背景。
     * - 色值：不透明清屏（alpha 为 1）。
     */
    background?: string | number | null;
    /**
     * 纹理是否按 PMA（预乘 alpha）处理，传给 `AssetManager`；与图集导出方式需一致。
     */
    pma?: boolean;
    /**
     * 每层 `SkeletonMesh` 在 z 方向上的微小偏移步长，用于减轻同层多 mesh 的 Z-fighting，默认 0.25。
     */
    skeletonZOffset?: number;
    /** 全部资源加载并 `_buildAll` 成功完成后调用一次 */
    onLoad?: () => void;
    /** 加载或构建失败时调用；`layerId` 在层无关错误时可能为空 */
    onError?: (err: Error, layerId?: string) => void;
    /** 指针在可拾取层上按下时触发 */
    onPointerDown?: (detail: SpineCompositePointerDetail) => void;
    /** 指针在可拾取层上抬起时触发 */
    onPointerUp?: (detail: SpineCompositePointerDetail) => void;
    /** 指针在可拾取层上移动时触发 */
    onPointerMove?: (detail: SpineCompositePointerDetail) => void;
    /** 指针进入某层矩形区域时触发（与 `onLayerPointerLeave` 成对） */
    onLayerPointerEnter?: (layerId: string, detail: SpineCompositePointerDetail) => void;
    /** 指针离开当前悬停层时触发 */
    onLayerPointerLeave?: (layerId: string) => void;
}

/** 构建完成后的单层：配置 + 已入场景的 mesh */
interface BuiltLayer {
    config: SpineCompositeLayerConfig;
    mesh: SkeletonMesh;
}

/**
 * 在同一 WebGL 画布上组合多套 Spine（如角色 + UI tips），
 * 每层独立 atlas/json、矩形布局与拾取，共用一条 `requestAnimationFrame` 渲染循环。
 *
 * **布局建议**：使用 {@link SpineLayerRelativeLayout}（`layoutRelative`），数值为 0~1 相对整幅逻辑画布，
 * 容器变化时由 `_resize` 统一换算为像素 `layout`，多资源视觉上为一块整体。
 *
 * **固定设计稿**：设 {@link SpineCompositeStageConfig.fixedLogicalSize} 与正的 `width`/`height`，
 * 逻辑坐标恒定，仅通过 CSS 缩放 canvas，缩放时层间相对关系不变。
 */
export class SpineCompositeStage {
    /** Three.js WebGL 渲染器（内部创建，生命周期由本类 `dispose` 管理） */
    private renderer: THREE.WebGLRenderer;
    /** 存放所有 `SkeletonMesh` 的场景 */
    private scene: THREE.Scene;
    /** 与逻辑画布尺寸一致的正交相机（y 向上，中心为原点） */
    private camera: THREE.OrthographicCamera;
    /** Spine 资源加载器（纹理图集 + JSON 文本） */
    private assetManager: AssetManager;
    /** 已构建的层列表，顺序与加载排序相关，拾取时按 zIndex 重排 */
    private built: BuiltLayer[] = [];
    /** 当前 rAF 句柄；`pause` 时取消 */
    private rafId: number | null = null;
    /** 上一帧时间戳（秒），用于计算 delta */
    private lastTime = 0;
    /** 累计时间（秒），传入 `SkeletonMesh.update` */
    private elapsed = 0;
    /** 为 true 时不再进入渲染与回调逻辑 */
    private _disposed = false;
    /** 监听容器尺寸变化，触发 `_resize` */
    private ro: ResizeObserver;
    /** 逻辑画布宽度（像素），与相机右左界、层 layout 一致 */
    private logicalW: number;
    /** 逻辑画布高度（像素） */
    private logicalH: number;
    /** 当前指针悬停的层 id（用于模拟 enter/leave） */
    private hoverId: string | null = null;
    /**
     * 若通过 `setCanvasSize` 设置，则 `_resize` 优先使用此处宽高作为逻辑尺寸；
     * `clearCanvasSizeOverride` 后恢复为 `config` 与容器推导规则。
     */
    private canvasSizeOverride: { w: number; h: number } | null = null;
    /** 是否为「固定设计分辨率 + CSS 等比画布」模式（构造时确定，不可变） */
    private readonly fixedLogicalSize: boolean;
    /** 指针事件绑定引用，便于 `dispose` 时移除监听 */
    private readonly boundDown: (e: PointerEvent) => void;
    private readonly boundUp: (e: PointerEvent) => void;
    private readonly boundMove: (e: PointerEvent) => void;
    private readonly boundLeave: (e: PointerEvent) => void;

    constructor(private readonly config: SpineCompositeStageConfig) {
        const { container, background = null, pma = false } = config;

        // ---------- 配置校验：每层至少要有 layout 或 layoutRelative ----------
        for (const L of config.layers) {
            if (!L.layout && !L.layoutRelative) {
                throw new Error(
                    `[SpineCompositeStage] 层 "${L.id}" 必须提供 layout 或 layoutRelative 之一`
                );
            }
        }

        // ---------- 解析「固定设计分辨率」与初始 logicalW/H ----------
        const wantFixed = config.fixedLogicalSize === true;
        if (wantFixed) {
            const w = config.width;
            const h = config.height;
            if (w == null || h == null || w <= 0 || h <= 0) {
                throw new Error(
                    '[SpineCompositeStage] fixedLogicalSize 为 true 时必须提供正数 config.width 与 config.height'
                );
            }
            this.fixedLogicalSize = true;
            this.logicalW = w;
            this.logicalH = h;
        } else {
            this.fixedLogicalSize = false;
            this.logicalW = config.width ?? 0;
            this.logicalH = config.height ?? 0;
            const { width, height } = this._readSize();
            this.logicalW = this.logicalW || width;
            this.logicalH = this.logicalH || height;
        }

        // ---------- WebGLRenderer：透明画布仅在 background == null 时开启 ----------
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: background == null,
        });
        this.renderer.setPixelRatio(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);

        // 缓冲区分辨率：固定模式下与逻辑稿一致且不改写 style 宽高（由 _syncFixedCanvasCss 设置）
        if (this.fixedLogicalSize) {
            this.renderer.setSize(this.logicalW, this.logicalH, false);
        } else {
            this.renderer.setSize(this.logicalW, this.logicalH);
        }

        // 清屏色：有色则 alpha=1；null 时必须 alpha=0，否则会盖住下层 DOM/CSS
        if (background != null) {
            this.renderer.setClearColor(background as THREE.ColorRepresentation, 1);
        } else {
            this.renderer.setClearColor(0x000000, 0);
        }

        // canvas CSS：固定模式居中缩放；否则铺满容器
        const canvasStyle: Partial<CSSStyleDeclaration> = {
            display: 'block',
            touchAction: 'none',
        };
        if (this.fixedLogicalSize) {
            Object.assign(canvasStyle, {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
            });
        } else {
            Object.assign(canvasStyle, {
                position: 'absolute',
                inset: '0',
                width: '100%',
                height: '100%',
            });
        }
        Object.assign(this.renderer.domElement.style, canvasStyle);

        // 绝对定位子节点需要非 static 父级
        const cs = getComputedStyle(container);
        if (cs.position === 'static') {
            container.style.position = 'relative';
        }
        container.appendChild(this.renderer.domElement);

        // ---------- 场景与相机：视锥覆盖 [-W/2,W/2]×[-H/2,H/2]（世界 y 向上） ----------
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            -this.logicalW / 2,
            this.logicalW / 2,
            this.logicalH / 2,
            -this.logicalH / 2,
            1,
            1000
        );
        this.camera.position.z = 500;

        this.assetManager = new AssetManager(config.pathPrefix, undefined, pma);

        // ---------- 指针：使用绑定后的函数引用以便 dispose 移除 ----------
        this.boundDown = (e) => this._onPointerDown(e);
        this.boundUp = (e) => this._onPointerUp(e);
        this.boundMove = (e) => this._onPointerMove(e);
        this.boundLeave = (e) => this._onPointerLeave(e);
        const el = this.renderer.domElement;
        el.addEventListener('pointerdown', this.boundDown);
        el.addEventListener('pointerup', this.boundUp);
        el.addEventListener('pointermove', this.boundMove);
        el.addEventListener('pointerleave', this.boundLeave);

        this.ro = new ResizeObserver(() => this._resize());
        this.ro.observe(container);

        // 初次同步尺寸；资源在 `_queueLoads` 中异步拉取
        this._resize();
        this._queueLoads();
    }

    /**
     * 读取容器布局矩形，得到用于 `setSize` / 逻辑尺寸的 CSS 像素宽高。
     * 宽或高为 0 时用兜底值，避免 WebGL 创建 0 尺寸上下文。
     */
    private _readSize() {
        const r = this.config.container.getBoundingClientRect();
        return { width: r.width || 300, height: r.height || 400 };
    }

    /**
     * `fixedLogicalSize` 模式下：根据容器 client 尺寸计算等比缩放系数，
     * 将「逻辑稿」整体 contain 进容器，并设置 canvas 的 CSS 宽高（像素）。
     */
    private _syncFixedCanvasCss() {
        if (!this.fixedLogicalSize) return;
        const el = this.renderer.domElement;
        const c = this.config.container;
        const cw = Math.max(1, c.clientWidth);
        const ch = Math.max(1, c.clientHeight);
        const s = Math.min(cw / this.logicalW, ch / this.logicalH);
        const dw = this.logicalW * s;
        const dh = this.logicalH * s;
        el.style.width = `${dw}px`;
        el.style.height = `${dh}px`;
    }

    /**
     * 将指针事件的屏幕坐标映射为**逻辑画布**上的 (ox, oy)（与 `_pickTop`、相机一致）。
     * - 非固定模式：直接使用 `offsetX/offsetY`（canvas 与逻辑 1:1）。
     * - 固定模式：按 canvas 在屏幕上的实际显示矩形比例，映射回 `logicalW×logicalH`。
     * 返回 (-1,-1) 表示坐标无效（例如尺寸为 0），调用方应视为未命中。
     */
    private _logicalPointer(ev: PointerEvent): { ox: number; oy: number } {
        if (!this.fixedLogicalSize) {
            return { ox: ev.offsetX, oy: ev.offsetY };
        }
        const el = this.renderer.domElement;
        const rect = el.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w < 1e-6 || h < 1e-6) return { ox: -1, oy: -1 };
        const ox = ((ev.clientX - rect.left) / w) * this.logicalW;
        const oy = ((ev.clientY - rect.top) / h) * this.logicalH;
        return { ox, oy };
    }

    /** 从路径字符串中截取文件名（支持 `/` 与 `\\`） */
    private _filename(url: string) {
        return url.slice(Math.max(url.lastIndexOf('/'), url.lastIndexOf('\\')) + 1);
    }

    /**
     * 将各层所需 atlas/json 加入 `AssetManager` 队列（按文件名去重），
     * 随后在 rAF 轮询中等待 `isLoadingComplete()`，再 `_buildAll` 并启动渲染循环。
     */
    private _queueLoads() {
        const seen = new Set<string>();
        for (const L of this.config.layers) {
            const af = this._filename(L.atlas);
            const jf = this._filename(L.json);
            if (!seen.has(af)) {
                this.assetManager.loadTextureAtlas(af);
                seen.add(af);
            }
            if (!seen.has(jf)) {
                this.assetManager.loadText(jf);
                seen.add(jf);
            }
        }
        const tick = () => {
            if (this._disposed) return;
            if (!this.assetManager.isLoadingComplete()) {
                requestAnimationFrame(tick);
                return;
            }
            try {
                this._buildAll();
                this.config.onLoad?.();
                this._startLoop();
            } catch (e) {
                this.config.onError?.(e as Error);
            }
        };
        requestAnimationFrame(tick);
    }

    /**
     * 按 zIndex 排序后为每层构建 `SkeletonMesh`、解析动画并加入场景，
     * 最后同步相对布局并 `_applyLayout`。
     */
    private _buildAll() {
        const zOff = this.config.skeletonZOffset ?? 0.25;
        const sorted = [...this.config.layers].map((c, i) => ({
            c,
            order: c.zIndex ?? i * 10,
        }));
        sorted.sort((a, b) => a.order - b.order);

        for (const { c } of sorted) {
            const atlasFile = this._filename(c.atlas);
            const jsonFile = this._filename(c.json);
            const atlasObj = this.assetManager.require(atlasFile);
            const atlasLoader = new AtlasAttachmentLoader(atlasObj);
            const skeletonJson = new SkeletonJson(atlasLoader);
            skeletonJson.scale = c.scale ?? 1;

            const rawText: string = this.assetManager.require(jsonFile);
            const rawData = JSON.parse(rawText) as Record<string, unknown>;
            const skeletonData = skeletonJson.readSkeletonData(rawText) as SkeletonData;

            // 与运行时扩展字段兼容（部分导出 JSON 含 extra / extraSlot / extraConfig）
            (skeletonData as any).extra =
                (rawData.extra as object) || {};
            (skeletonData as any).extraSlot =
                (rawData.extraSlot as object) || {};
            (skeletonData as any).extraConfig =
                (rawData.extraConfig as object) || { timeScale: 1 };

            const animKeys = Object.keys(
                (rawData.animations as Record<string, unknown>) || {}
            );
            const want = c.animation ?? 'animation';
            const resolved =
                animKeys.includes(want)
                    ? want
                    : animKeys.includes('animation')
                      ? 'animation'
                      : animKeys[0];
            if (!resolved) {
                throw new Error(`[SpineCompositeStage] 层 "${c.id}" 的 JSON 没有任何动画`);
            }

            const mesh = new SkeletonMesh(
                skeletonData,
                (p) => {
                    p.depthTest = false;
                    p.depthWrite = false;
                },
                undefined,
                c.maxVert ?? 8000
            );
            mesh.zOffset = zOff;
            mesh.state.setAnimation(0, resolved, c.loop !== false);
            mesh.renderOrder = (c.zIndex ?? 0) / 100;

            this.scene.add(mesh);
            this.built.push({ config: c, mesh });
        }
        this._syncAllRelativeLayouts();
        for (const { mesh, config } of this.built) {
            this._applyLayout(mesh, config);
        }
    }

    /**
     * 若该层配置了 `layoutRelative`，则根据当前 `logicalW`/`logicalH` 写入像素级 `config.layout`。
     * `fit` 保留配置中已有值或默认 `contain`。
     */
    private _syncLayoutFromRelativeForConfig(c: SpineCompositeLayerConfig) {
        const rel = c.layoutRelative;
        if (!rel) return;
        const W = this.logicalW;
        const H = this.logicalH;
        const fit = c.layout?.fit ?? 'contain';
        c.layout = {
            x: rel.x * W,
            y: rel.y * H,
            width: Math.max(1, rel.w * W),
            height: Math.max(1, rel.h * H),
            fit,
        };
    }

    /** 对所有已构建层执行 `_syncLayoutFromRelativeForConfig` */
    private _syncAllRelativeLayouts() {
        for (const { config } of this.built) {
            this._syncLayoutFromRelativeForConfig(config);
        }
    }

    /**
     * 根据层矩形（逻辑像素、y 向下）将 `SkeletonMesh` 缩放并平移到世界坐标：
     * 先取骨骼 AABB 中心，再按 `contain`/`cover` 计算统一缩放 u，使包围盒落入矩形。
     */
    private _applyLayout(mesh: SkeletonMesh, c: SpineCompositeLayerConfig) {
        const W = this.logicalW;
        const H = this.logicalH;
        if (!c.layout) {
            throw new Error(`[SpineCompositeStage] 层 "${c.id}" 缺少 layout`);
        }
        const { x, y, width, height, fit = 'contain' } = c.layout;

        mesh.skeleton.updateWorldTransform(Physics.update);
        mesh.update(0, 0);

        const off = new Vector2();
        const sz = new Vector2();
        mesh.skeleton.getBounds(off, sz);
        const bw = Math.max(sz.x, 1e-6);
        const bh = Math.max(sz.y, 1e-6);
        const cx = off.x + bw / 2;
        const cy = off.y + bh / 2;

        const targetX = x + width / 2 - W / 2;
        const targetY = H / 2 - (y + height / 2);

        const sx = width / bw;
        const sy = height / bh;
        const u = fit === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
        mesh.scale.set(u, u, u);
        mesh.position.set(targetX - cx * u, targetY - cy * u, (c.zIndex ?? 0) * 0.01);
    }

    /**
     * 逻辑画布像素 (ox, oy) → 相机世界坐标（中心原点、y 向上）。
     */
    private _canvasToWorld(ox: number, oy: number) {
        const W = this.logicalW;
        const H = this.logicalH;
        return {
            worldX: ox - W / 2,
            worldY: H / 2 - oy,
        };
    }

    /** 组装指针回调用的 `SpineCompositePointerDetail` */
    private _detail(layerId: string, ev: PointerEvent): SpineCompositePointerDetail {
        const { ox, oy } = this._logicalPointer(ev);
        const { worldX, worldY } = this._canvasToWorld(ox, oy);
        return {
            layerId,
            offsetX: ox,
            offsetY: oy,
            worldX,
            worldY,
            nativeEvent: ev,
        };
    }

    /**
     * 在逻辑坐标 (ox, oy) 处按 zIndex **从高到低** 命中测试，返回最上层可拾取层的 id。
     * 使用各层像素 `layout` 轴对齐包围盒（非 mesh 三角形级精确检测）。
     */
    private _pickTop(ox: number, oy: number): string | null {
        const ordered = [...this.built].sort(
            (a, b) => (b.config.zIndex ?? 0) - (a.config.zIndex ?? 0)
        );
        for (const { config: c } of ordered) {
            if (c.pickable === false) continue;
            const r = c.layout;
            if (!r) continue;
            if (
                ox >= r.x &&
                ox <= r.x + r.width &&
                oy >= r.y &&
                oy <= r.y + r.height
            ) {
                return c.id;
            }
        }
        return null;
    }

    private _onPointerDown(ev: PointerEvent) {
        const { ox, oy } = this._logicalPointer(ev);
        const id = this._pickTop(ox, oy);
        if (id) this.config.onPointerDown?.(this._detail(id, ev));
    }

    private _onPointerUp(ev: PointerEvent) {
        const { ox, oy } = this._logicalPointer(ev);
        const id = this._pickTop(ox, oy);
        if (id) this.config.onPointerUp?.(this._detail(id, ev));
    }

    /**
     * 指针移动：派发 move；若悬停层变化则依次触发 leave / enter。
     */
    private _onPointerMove(ev: PointerEvent) {
        const { ox, oy } = this._logicalPointer(ev);
        const id = this._pickTop(ox, oy);
        if (id) this.config.onPointerMove?.(this._detail(id, ev));

        if (id !== this.hoverId) {
            if (this.hoverId) {
                this.config.onLayerPointerLeave?.(this.hoverId);
            }
            this.hoverId = id;
            if (this.hoverId) {
                this.config.onLayerPointerEnter?.(
                    this.hoverId,
                    this._detail(this.hoverId, ev)
                );
            }
        }
    }

    /** 指针离开 canvas：结束悬停状态 */
    private _onPointerLeave(_ev: PointerEvent) {
        if (this.hoverId) {
            this.config.onLayerPointerLeave?.(this.hoverId);
            this.hoverId = null;
        }
    }

    /**
     * 启动每帧循环：更新所有 mesh 的骨骼状态并 `render`。
     * 若已存在 `rafId` 应先 `pause`，避免重复注册。
     */
    private _startLoop() {
        this.lastTime = performance.now() / 1000;
        const loop = () => {
            if (this._disposed) return;
            this.rafId = requestAnimationFrame(loop);
            const now = performance.now() / 1000;
            const delta = Math.min(now - this.lastTime, 0.1);
            this.lastTime = now;
            this.elapsed += delta;
            for (const { mesh } of this.built) {
                mesh.update(delta, this.elapsed);
            }
            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }

    /**
     * 根据 `canvasSizeOverride` / `fixedLogicalSize` / `config` / 容器尺寸解析 `logicalW/H`，
     * 更新相机视锥、`setSize`、相对布局与各 mesh 布局。
     */
    private _resize() {
        if (this._disposed) return;
        if (this.canvasSizeOverride) {
            this.logicalW = this.canvasSizeOverride.w;
            this.logicalH = this.canvasSizeOverride.h;
        } else if (this.fixedLogicalSize) {
            this.logicalW = this.config.width as number;
            this.logicalH = this.config.height as number;
        } else if (this.config.width != null && this.config.height != null) {
            this.logicalW = this.config.width;
            this.logicalH = this.config.height;
        } else {
            const { width, height } = this._readSize();
            this.logicalW = width;
            this.logicalH = height;
        }
        this.camera.left = -this.logicalW / 2;
        this.camera.right = this.logicalW / 2;
        this.camera.top = this.logicalH / 2;
        this.camera.bottom = -this.logicalH / 2;
        this.camera.updateProjectionMatrix();
        if (this.fixedLogicalSize) {
            this.renderer.setSize(this.logicalW, this.logicalH, false);
            this._syncFixedCanvasCss();
        } else {
            this.renderer.setSize(this.logicalW, this.logicalH);
        }
        this._syncAllRelativeLayouts();
        for (const { mesh, config } of this.built) {
            this._applyLayout(mesh, config);
        }
    }

    /**
     * 设置逻辑画布像素尺寸（正交相机与 WebGL 渲染缓冲），并重新套用各层 `layout`。
     * 会写入 `canvasSizeOverride`，使后续 `_resize` 在未 `clearCanvasSizeOverride` 前保持该尺寸。
     */
    setCanvasSize(width: number, height: number): this {
        if (this._disposed) return this;
        this.canvasSizeOverride = { w: width, h: height };
        this.logicalW = width;
        this.logicalH = height;
        this.camera.left = -width / 2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = -height / 2;
        this.camera.updateProjectionMatrix();
        if (this.fixedLogicalSize) {
            this.renderer.setSize(width, height, false);
            this._syncFixedCanvasCss();
        } else {
            this.renderer.setSize(width, height);
        }
        this._syncAllRelativeLayouts();
        for (const { mesh, config } of this.built) {
            this._applyLayout(mesh, config);
        }
        return this;
    }

    /** 清除 `setCanvasSize` 覆盖，下一次 `_resize` 按配置与容器重新计算 */
    clearCanvasSizeOverride(): this {
        this.canvasSizeOverride = null;
        this._resize();
        return this;
    }

    /**
     * 与窗口 `resize` 或容器变化配合：清除手动画布覆盖后刷新相机、缓冲与布局。
     */
    refitFromContainer(): this {
        if (this._disposed) return this;
        this.canvasSizeOverride = null;
        this._resize();
        return this;
    }

    /** 当前逻辑画布宽高（像素），与正交相机、`_logicalPointer` 一致 */
    get logicalSize(): { width: number; height: number } {
        return { width: this.logicalW, height: this.logicalH };
    }

    /** 切换指定层第 0 轨动画 */
    setLayerAnimation(id: string, name: string, loop = true): this {
        const L = this.built.find((b) => b.config.id === id);
        L?.mesh.state.setAnimation(0, name, loop);
        return this;
    }

    /** 显示或隐藏指定层 mesh */
    setLayerVisible(id: string, visible: boolean): this {
        const L = this.built.find((b) => b.config.id === id);
        if (L) L.mesh.visible = visible;
        return this;
    }

    /**
     * 更新某层像素矩形并重新套用布局。
     * 若传入 `x` / `y` / `width` / `height` 中任一项，会清除该层 `layoutRelative`，避免后续 `_resize` 再次覆盖几何。
     */
    setLayerLayout(id: string, layout: Partial<SpineCompositeRect>): this {
        const L = this.built.find((b) => b.config.id === id);
        if (L) {
            const touchesGeom =
                'x' in layout ||
                'y' in layout ||
                'width' in layout ||
                'height' in layout;
            if (touchesGeom) {
                L.config.layoutRelative = undefined;
            }
            const prev = L.config.layout ?? { x: 0, y: 0, width: 1, height: 1, fit: 'contain' };
            L.config.layout = { ...prev, ...layout };
            this._applyLayout(L.mesh, L.config);
        }
        return this;
    }

    /**
     * 更新某层相对占位（0~1），并立即同步像素 `layout` 与 mesh 变换。
     * 适合运行时动态调整 UI 相对位置。
     */
    setLayerLayoutRelative(
        id: string,
        rel: Partial<SpineLayerRelativeLayout>
    ): this {
        const L = this.built.find((b) => b.config.id === id);
        if (L) {
            const prev = L.config.layoutRelative ?? { x: 0, y: 0, w: 1, h: 1 };
            L.config.layoutRelative = { ...prev, ...rel };
            this._syncLayoutFromRelativeForConfig(L.config);
            this._applyLayout(L.mesh, L.config);
        }
        return this;
    }

    /** 按层 id 获取已构建的 `SkeletonMesh`，未找到返回 null */
    getLayerMesh(id: string): SkeletonMesh | null {
        return this.built.find((b) => b.config.id === id)?.mesh ?? null;
    }

    /** 取消渲染循环（保留 WebGL 上下文与 DOM） */
    pause(): this {
        if (this.rafId != null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        return this;
    }

    /** 在已构建且未 dispose 的前提下恢复渲染循环 */
    resume(): this {
        if (this.rafId == null && !this._disposed && this.built.length) {
            this._startLoop();
        }
        return this;
    }

    /**
     * 释放资源：停止循环、断开 ResizeObserver、移除指针监听、dispose 各 mesh 与 renderer，并从 DOM 移除 canvas。
     */
    dispose(): void {
        this._disposed = true;
        this.pause();
        this.ro.disconnect();
        const el = this.renderer.domElement;
        el.removeEventListener('pointerdown', this.boundDown);
        el.removeEventListener('pointerup', this.boundUp);
        el.removeEventListener('pointermove', this.boundMove);
        el.removeEventListener('pointerleave', this.boundLeave);
        for (const { mesh } of this.built) {
            mesh.dispose();
        }
        this.built = [];
        this.renderer.dispose();
        el.parentNode?.removeChild(el);
    }

    /** 底层 Three.js 渲染器，仅高级定制时使用 */
    get rawRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }
    /** 存放 Spine mesh 的场景 */
    get rawScene(): THREE.Scene {
        return this.scene;
    }
    /** 当前正交相机引用 */
    get rawCamera(): THREE.OrthographicCamera {
        return this.camera;
    }
    /** 是否已调用 `dispose` */
    get disposed(): boolean {
        return this._disposed;
    }
}
