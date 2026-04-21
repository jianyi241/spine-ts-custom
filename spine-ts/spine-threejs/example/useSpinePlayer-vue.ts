/**
 * Vue 3 composable — useSpinePlayer
 *
 * 使用方式：
 *   1. 将此文件复制到你的 Vue 项目 composables/ 目录
 *   2. 确保项目中已安装 spine-threejs（或调整下方 import 路径）
 *   3. 在组件中使用，参见下方示例
 *
 * ─── 组件示例 ────────────────────────────────────────────────
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useSpinePlayer } from '@/composables/useSpinePlayer'
 *
 * const containerRef = ref<HTMLElement | null>(null)
 *
 * const { player, isLoaded, loadError } = useSpinePlayer(containerRef, {
 *   atlas:     '/assets/spine/bachong.atlas',
 *   json:      '/assets/spine/bachong.json',
 *   animation: 'animation',
 *   scale:     0.4,
 *   posY:      -80,
 *   loop:      true,
 *   onLoad:    () => console.log('Spine loaded!'),
 * })
 *
 * // 切换动画
 * function changeAnim() {
 *   player.value?.setAnimation('attack')
 * }
 * </script>
 *
 * <template>
 *   <div ref="containerRef" style="position:relative;width:400px;height:500px;" />
 *   <p v-if="!isLoaded">加载中…</p>
 *   <p v-if="loadError" style="color:red">{{ loadError.message }}</p>
 * </template>
 * ────────────────────────────────────────────────────────────
 */

import { ref, shallowRef, onMounted, onBeforeUnmount, type Ref } from 'vue';

import { SpinePlayer, type SpinePlayerConfig } from '@esotericsoftware/spine-threejs';

export type { SpinePlayerConfig };

export function useSpinePlayer(
    containerRef: Ref<HTMLElement | null>,
    config: SpinePlayerConfig
) {
    const player    = shallowRef<SpinePlayer | null>(null);
    const isLoaded  = ref(false);
    const loadError = ref<Error | null>(null);

    onMounted(() => {
        if (!containerRef.value) return;

        player.value = new SpinePlayer(containerRef.value, {
            ...config,
            onLoad() {
                isLoaded.value = true;
                config.onLoad?.();
            },
            onError(err) {
                loadError.value = err;
                config.onError?.(err);
            },
        });
    });

    onBeforeUnmount(() => {
        player.value?.dispose();
        player.value = null;
    });

    return {
        /** SpinePlayer 实例，加载完成前为 null */
        player,
        /** 资源是否加载完毕 */
        isLoaded,
        /** 加载过程中的错误信息 */
        loadError,
    };
}
