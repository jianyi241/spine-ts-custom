import * as THREE from 'three';
import { AssetManager } from './AssetManager.js';
import { SkeletonMesh } from './SkeletonMesh.js';
import { AtlasAttachmentLoader, SkeletonJson } from '@esotericsoftware/spine-core';

// ─── 配置项 ──────────────────────────────────────────────────────────────────

export interface SpinePlayerConfig {
    /** Atlas 文件 URL（同目录下的 .png 会自动加载） */
    atlas: string;
    /** JSON 骨骼数据文件 URL */
    json: string;
    /**
     * 要播放的动画名称；默认 `"animation"`。
     * 若 JSON 中不存在该名（如 shaonv 仅有 `a`、`lizi` 等），会自动改用 JSON 里第一个动画。
     */
    animation?: string;
    /** 是否循环播放，默认 true */
    loop?: boolean;
    /**
     * 骨骼解析缩放比例（spine 原始单位 → THREE.js 单位）
     * 默认 0.4，值越大角色越大
     */
    scale?: number;
    /** X 方向偏移（像素/单位），默认 0 */
    posX?: number;
    /** Y 方向偏移（像素/单位），默认 0 */
    posY?: number;
    /** 最大顶点数，默认 8000 */
    maxVert?: number;
    /** 背景颜色，默认透明（null）*/
    background?: string | number | null;
    /** 是否使用预乘 alpha 纹理，默认 false */
    pma?: boolean;
    /** 加载完成回调 */
    onLoad?: () => void;
    /** 加载失败回调 */
    onError?: (err: Error) => void;
}

// ─── SpinePlayer ─────────────────────────────────────────────────────────────

export class SpinePlayer {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private _skeletonMesh: SkeletonMesh | null = null;
    private assetManager: AssetManager;
    private rafId: number | null = null;
    private lastTime = 0;
    private elapsed = 0;
    private _disposed = false;
    private ro: ResizeObserver;

    constructor(
        private container: HTMLElement,
        private config: SpinePlayerConfig
    ) {
        const { background = null, pma = false } = config;
        const { width, height } = this._size();

        // ── Renderer ──
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: background == null,
        });
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(width, height);
        if (background != null) {
            this.renderer.setClearColor(background as THREE.ColorRepresentation, 1);
        }
        // canvas 铺满容器
        Object.assign(this.renderer.domElement.style, {
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            display: 'block',
        });
        container.appendChild(this.renderer.domElement);

        // ── Scene ──
        this.scene = new THREE.Scene();

        // ── 正交相机（1 单位 ≈ 1 像素，无透视变形，适合 2D Spine）──
        this.camera = new THREE.OrthographicCamera(
            -width / 2, width / 2,
            height / 2, -height / 2,
            1, 1000
        );
        this.camera.position.z = 500;

        // ── AssetManager（路径前缀 = atlas 所在目录）──
        this.assetManager = new AssetManager(this._basePath(config.atlas), undefined, pma);

        // ── 自动跟随容器尺寸变化 ──
        this.ro = new ResizeObserver(() => this._resize());
        this.ro.observe(container);

        // ── 开始加载资源 ──
        this._load();
    }

    // ─── 内部辅助 ────────────────────────────────────────────

    private _size() {
        const r = this.container.getBoundingClientRect();
        return { width: r.width || 300, height: r.height || 400 };
    }

    /** 从完整 URL 提取目录前缀，如 "/assets/spine/a.atlas" → "/assets/spine/" */
    private _basePath(url: string) {
        const i = Math.max(url.lastIndexOf('/'), url.lastIndexOf('\\'));
        return i >= 0 ? url.slice(0, i + 1) : '';
    }

    /** 从完整 URL 提取文件名，如 "/assets/spine/a.atlas" → "a.atlas" */
    private _filename(url: string) {
        return url.slice(Math.max(url.lastIndexOf('/'), url.lastIndexOf('\\')) + 1);
    }

    private _load() {
        const {
            atlas, json,
            animation = 'animation',
            loop = true,
            scale = 0.4,
            posX = 0, posY = 0,
            maxVert = 8000,
        } = this.config;

        const atlasFile = this._filename(atlas);
        const jsonFile = this._filename(json);

        this.assetManager.loadTextureAtlas(atlasFile);
        this.assetManager.loadText(jsonFile);

        // 轮询等待加载完成
        const tick = () => {
            if (this._disposed) return;
            if (!this.assetManager.isLoadingComplete()) {
                requestAnimationFrame(tick);
                return;
            }
            try {
                const atlasObj = this.assetManager.require(atlasFile);
                const atlasLoader = new AtlasAttachmentLoader(atlasObj);
                const skeletonJson = new SkeletonJson(atlasLoader);
                skeletonJson.scale = scale;

                const rawText: string = this.assetManager.require(jsonFile);
                const rawData = JSON.parse(rawText);
                const skeletonData = skeletonJson.readSkeletonData(rawText);

                // 注入自定义弹簧物理数据（spine-core 标准解析器不处理这些字段）
                (skeletonData as any).extra       = rawData.extra       || {};
                (skeletonData as any).extraSlot   = rawData.extraSlot   || {};
                (skeletonData as any).extraConfig = rawData.extraConfig || { timeScale: 1 };

                const animKeys = Object.keys((rawData as { animations?: Record<string, unknown> }).animations || {});
                const resolvedAnim =
                    animKeys.includes(animation)
                        ? animation
                        : animKeys.includes('animation')
                          ? 'animation'
                          : animKeys[0];
                if (!resolvedAnim) {
                    this.config.onError?.(new Error(`JSON 中没有任何动画: ${jsonFile}`));
                    return;
                }

                this._skeletonMesh = new SkeletonMesh(skeletonData, undefined, undefined, maxVert);
                this._skeletonMesh.state.setAnimation(0, resolvedAnim, loop);
                this._skeletonMesh.position.set(posX, posY, 0);
                this.scene.add(this._skeletonMesh);

                this._startLoop();
                this.config.onLoad?.();
            } catch (e) {
                this.config.onError?.(e as Error);
            }
        };
        tick();
    }

    private _startLoop() {
        this.lastTime = performance.now() / 1000;
        const loop = () => {
            if (this._disposed) return;
            this.rafId = requestAnimationFrame(loop);
            const now = performance.now() / 1000;
            const delta = Math.min(now - this.lastTime, 0.1); // 最大 100ms，防止跳帧
            this.lastTime = now;
            this.elapsed += delta;
            this._skeletonMesh?.update(delta, this.elapsed);
            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }

    private _resize() {
        if (this._disposed) return;
        const { width, height } = this._size();
        this.camera.left   = -width  / 2;
        this.camera.right  =  width  / 2;
        this.camera.top    =  height / 2;
        this.camera.bottom = -height / 2;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // ─── 公开 API ────────────────────────────────────────────

    /** 切换到指定动画 */
    setAnimation(name: string, loop = true): this {
        this._skeletonMesh?.state.setAnimation(0, name, loop);
        return this;
    }

    /** 显示 / 隐藏角色 */
    setVisible(visible: boolean): this {
        if (this._skeletonMesh) this._skeletonMesh.visible = visible;
        return this;
    }

    /**
     * 设置角色在画布中的偏移位置
     * @param x 水平偏移（正数向右）
     * @param y 垂直偏移（正数向上）
     */
    setPosition(x: number, y: number): this {
        this._skeletonMesh?.position.set(x, y, 0);
        return this;
    }

    /**
     * 在解析 scale 的基础上额外整体缩放
     * @param s 缩放倍数（1 = 不变）
     */
    setScale(s: number): this {
        this._skeletonMesh?.scale.set(s, s, s);
        return this;
    }

    /** 暂停渲染循环（保持当前画面） */
    pause(): this {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        return this;
    }

    /** 恢复渲染循环 */
    resume(): this {
        if (this.rafId === null && !this._disposed && this._skeletonMesh) {
            this._startLoop();
        }
        return this;
    }

    /** 销毁实例，释放所有 GPU / DOM 资源（不可逆） */
    dispose(): void {
        this._disposed = true;
        this.pause();
        this.ro.disconnect();
        this._skeletonMesh?.dispose();
        this.renderer.dispose();
        this.renderer.domElement.parentNode?.removeChild(this.renderer.domElement);
    }

    // ─── 底层访问（高级用途）───────────────────────────────

    /** THREE.WebGLRenderer 实例 */
    get rawRenderer(): THREE.WebGLRenderer  { return this.renderer; }
    /** THREE.Scene 实例 */
    get rawScene(): THREE.Scene             { return this.scene; }
    /** THREE.OrthographicCamera 实例 */
    get rawCamera(): THREE.OrthographicCamera { return this.camera; }
    /** SkeletonMesh 实例（加载完成前为 null） */
    get skeletonMesh(): SkeletonMesh | null { return this._skeletonMesh; }
    /** 是否已销毁 */
    get disposed(): boolean                 { return this._disposed; }
}
