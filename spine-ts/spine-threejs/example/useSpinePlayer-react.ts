/**
 * React hook — useSpinePlayer
 *
 * 使用方式：
 *   1. 将此文件复制到你的 React 项目 hooks/ 目录
 *   2. 确保项目中已安装 spine-threejs（或调整下方 import 路径）
 *   3. 在组件中使用，参见下方示例
 *
 * ─── 组件示例 ────────────────────────────────────────────────
 * import { useSpinePlayer } from '@/hooks/useSpinePlayer'
 *
 * export function SpineCharacter() {
 *   const { containerRef, player, isLoaded, loadError } = useSpinePlayer({
 *     atlas:     '/assets/spine/bachong.atlas',
 *     json:      '/assets/spine/bachong.json',
 *     animation: 'animation',
 *     scale:     0.4,
 *     posY:      -80,
 *     loop:      true,
 *     onLoad:    () => console.log('Spine loaded!'),
 *   })
 *
 *   return (
 *     <div style={{ position: 'relative', width: 400, height: 500 }}>
 *       <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
 *       {!isLoaded && <p>加载中…</p>}
 *       {loadError && <p style={{ color: 'red' }}>{loadError.message}</p>}
 *       <button onClick={() => player.current?.setAnimation('attack')}>
 *         切换动画
 *       </button>
 *     </div>
 *   )
 * }
 * ────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react';

import { SpinePlayer, type SpinePlayerConfig } from '@esotericsoftware/spine-threejs';

export type { SpinePlayerConfig };

export function useSpinePlayer(config: SpinePlayerConfig) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef    = useRef<SpinePlayer | null>(null);
    const [isLoaded,  setIsLoaded]  = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // 用 ref 保存 config，避免闭包问题
        const player = new SpinePlayer(containerRef.current, {
            ...config,
            onLoad() {
                setIsLoaded(true);
                config.onLoad?.();
            },
            onError(err) {
                setLoadError(err);
                config.onError?.(err);
            },
        });
        playerRef.current = player;

        return () => {
            player.dispose();
            playerRef.current = null;
            setIsLoaded(false);
            setLoadError(null);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 仅挂载时执行一次；如需动态更新 config，改用 atlas/json 等基本类型依赖

    return {
        /** 挂载到 <div> 的 ref */
        containerRef,
        /** SpinePlayer 实例引用，加载完成前 .current 为 null */
        player: playerRef,
        /** 资源是否加载完毕 */
        isLoaded,
        /** 加载过程中的错误信息 */
        loadError,
    };
}
