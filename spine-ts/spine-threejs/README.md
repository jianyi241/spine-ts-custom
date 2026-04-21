# spine-ts THREE.JS

Please see the top-level [README.md](../README.md) for more information.


src/
├── index.ts           ← 入口，re-export 所有
├── require-shim.ts    ← THREE.js window 兼容
├── AssetManager.ts    ← 资源加载
├── MeshBatcher.ts     ← GPU 顶点批处理
├── SkeletonMesh.ts    ← 核心：Spine 渲染 + 弹簧物理
├── ThreeJsTexture.ts  ← 纹理封装
├── gsap-util/index.js ← 缓动函数（仅 easeFunction）
└── util/
    ├── index.js       ← re-export LodashHelper + arrayLikeToArray
    └── LodashHelper.js ← 仅 fromEntries




文件	用途
src/SpinePlayer.ts	通用播放器核心类（框架无关）
example/useSpinePlayer-vue.ts	Vue 3 Composition API 封装
example/useSpinePlayer-react.ts	React Hook 封装


Vue3使用（直接复制 useSpinePlayer-vue.ts）：
```ts
<script setup lang="ts">
import { ref } from 'vue'
import { useSpinePlayer } from '@/composables/useSpinePlayer'

const containerRef = ref<HTMLElement | null>(null)
const { player, isLoaded } = useSpinePlayer(containerRef, {
  atlas: '/assets/spine/bachong.atlas',
  json:  '/assets/spine/bachong.json',
  scale: 0.4,
  posY:  -80,
})
</script>

<template>
  <div ref="containerRef" style="position:relative;width:400px;height:500px" />
</template>
```

React 使用（直接复制 useSpinePlayer-react.ts）
```ts
import { useSpinePlayer } from '@/hooks/useSpinePlayer'

export function SpineCharacter() {
  const { containerRef, player, isLoaded } = useSpinePlayer({
    atlas: '/assets/spine/bachong.atlas',
    json:  '/assets/spine/bachong.json',
    scale: 0.4,
    posY:  -80,
  })

  return (
    <div style={{ position:'relative', width:400, height:500 }}>
      <div ref={containerRef} style={{ width:'100%', height:'100%' }} />
      <button onClick={() => player.current?.setAnimation('attack')}>
        切换动画
      </button>
    </div>
  )
}
```

### 设计要点：

- 框架无关：核心类是纯 TS，只依赖 DOM + THREE.js + spine-threejs，无任何框架代码
- 自动适应尺寸：内置 ResizeObserver，容器宽高变化时画布和相机自动更新
- 正交相机：使用 OrthographicCamera（1 单位 ≈ 1 像素），无透视变形，适合 2D Spine
- 自动注入物理数据：extra/extraSlot/extraConfig 自动从 JSON 注入，弹簧骨骼效果开箱即用
- 链式调用：大多数方法返回 this，支持 player.setPosition(0,-80).setScale(1.2)