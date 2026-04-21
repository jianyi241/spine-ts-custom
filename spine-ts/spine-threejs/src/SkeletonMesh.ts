/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated July 28, 2023. Replaces all prior versions.
 *
 * Copyright (c) 2013-2023, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software or
 * otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE
 * SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/

import {
    AnimationState,
    AnimationStateData,
    BlendMode,
    ClippingAttachment,
    Color,
    MeshAttachment,
    NumberArrayLike,
    Physics,
    RegionAttachment,
    Skeleton,
    SkeletonClipping,
    SkeletonData,
    TextureAtlasRegion,
    Utils,
    Vector2,
} from "@esotericsoftware/spine-core";
import {MeshBatcher} from "./MeshBatcher.js";
import * as THREE from "three";
import {ThreeJsTexture} from "./ThreeJsTexture.js";
// @ts-ignore
import {MatrixMatchHelper} from './gsap-util'
// @ts-ignore
import {LodashHelper, arrayLikeToArray} from './util/index.js'

export type SkeletonMeshMaterialParametersCustomizer = (
    materialParameters: THREE.ShaderMaterialParameters
) => void;

// export class SkeletonMeshMaterial extends THREE.ShaderMaterial {
//     constructor(customizer: SkeletonMeshMaterialParametersCustomizer) {
//         let vertexShader = `
// 			attribute vec4 color;
// 			varying vec2 vUv;
// 			varying vec4 vColor;
// 			void main() {
// 				vUv = uv;
// 				vColor = color;
// 				gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
// 			}
// 		`;
//         let fragmentShader = `
// 			uniform sampler2D map;
// 			#ifdef USE_SPINE_ALPHATEST
// 			uniform float alphaTest;
// 			#endif
// 			varying vec2 vUv;
// 			varying vec4 vColor;
// 			void main(void) {
// 				gl_FragColor = texture2D(map, vUv)*vColor;
// 				#ifdef USE_SPINE_ALPHATEST
// 				if (gl_FragColor.a < alphaTest) discard;
// 				#endif
// 			}
// 		`;
//
//         let parameters: THREE.ShaderMaterialParameters = {
//             uniforms: {
//                 map: {value: null},
//             },
//             vertexShader: vertexShader,
//             fragmentShader: fragmentShader,
//             side: THREE.DoubleSide,
//             transparent: true,
//             depthWrite: true,
//             alphaTest: 0.0,
//         };
//         customizer(parameters);
//         if (parameters.alphaTest && parameters.alphaTest > 0) {
//             parameters.defines = {USE_SPINE_ALPHATEST: 1};
//             if (!parameters.uniforms) parameters.uniforms = {};
//             parameters.uniforms["alphaTest"] = {value: parameters.alphaTest};
//         }
//         super(parameters);
//         // non-pma textures are premultiply on upload, so we set premultipliedAlpha to true
//         this.premultipliedAlpha = true;
//     }
// }

// genshin spine 定制
export class SkeletonMeshMaterial extends THREE.ShaderMaterial {
    constructor(customizer: SkeletonMeshMaterialParametersCustomizer) {

        const vertexShader = `
      attribute vec4 color;
      varying vec2 vUv;
      varying vec4 vColor;
      void main() {
        vUv = uv;
        vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

        const fragmentShader = `
      // Add diffuse property   ---------Customizable⬇---------
      uniform sampler2D diffuse;
      #ifdef USE_SPINE_ALPHATEST
      uniform float alphaTest;
      #endif
      varying vec2 vUv;
      varying vec4 vColor;
      void main(void) {
        // Add diffuse property   ---------Customizable⬇---------
        gl_FragColor = texture2D(diffuse, vUv) * vColor;
        #ifdef USE_SPINE_ALPHATEST
        if (gl_FragColor.a < alphaTest) discard;
        #endif
      }
    `;

        const uniforms = {
            diffuse: {
                value: null,

            },
            map: {
                value: null,
            }
        };

        const shaderOptions = {
            uniforms,
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            alphaTest: 0.001,
            // Spine 顶点色 RGB 已预乘 alpha，纹理上传也做了预乘（premultiplyAlpha=true）
            // 必须用 ONE + ONE_MINUS_SRC_ALPHA 混合，否则 alpha 被乘两次 → 半透明区域变黑块
            premultipliedAlpha: true,
        };

        customizer(shaderOptions);
        super(shaderOptions);
    }
}
// Un
// export class SpineShaderMaterial extends THREE.ShaderMaterial {
//     constructor(parameters = {}) {
//         const defaultUniforms = {
//             diffuse: {
//                 value: null
//             }
//         };
//
//         const defaultShaderCode = {
//             vertexShader: `
//         attribute vec4 color;
//         varying vec2 vUv;
//         varying vec4 vColor;
//         void main() {
//           vUv = uv;
//           vColor = color;
//           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//         }
//       `,
//             fragmentShader: `
//         uniform sampler2D diffuse;
//         #ifdef USE_SPINE_ALPHATEST
//         uniform float alphaTest;
//         #endif
//         varying vec2 vUv;
//         varying vec4 vColor;
//         void main(void) {
//           gl_FragColor = texture2D(diffuse, vUv) * vColor;
//           #ifdef USE_SPINE_ALPHATEST
//           if (gl_FragColor.a < alphaTest) discard;
//           #endif
//         }
//       `
//         };
//
//         const defaultMaterialOptions = {
//             side: THREE.DoubleSide,
//             transparent: true,
//             depthWrite: false,
//             alphaTest: 0.5
//         };
//
//         const materialDefinition = {
//             uniforms: defaultUniforms,
//             vertexShader: defaultShaderCode.vertexShader,
//             fragmentShader: defaultShaderCode.fragmentShader,
//             ...defaultMaterialOptions,
//             ...parameters
//         };
//
//         super(materialDefinition);
//     }
// }

/**
 * genshin spine extra 操作
 */

// Mn
class FrameItemFormat {
    public value: any;
    public start: any;
    public ease: any;

    constructor(options: any = {}) {
        this.value = options.value || 1;
        this.start = options.start || 0;
        this.ease = options.ease || "linear";
    }

    get easeFunc() {
        return MatrixMatchHelper.easeFunction(this.ease);
    }

    static getBlock(frames: string | any[], time: number): any {
        for (let i = frames.length - 1; i > 0; i--) {
            if (frames[i].start >= time && frames[i - 1].start <= time) {
                return {
                    end: frames[i],
                    start: frames[i - 1]
                };
            }
        }
    }
}

// Sn
const Sn = 180 / Math.PI

// kn
class TimeScaleController {
    public timeScale: any;

    constructor(options: any = {}) {
        this.timeScale = options.timeScale !== undefined ? options.timeScale : 1;
    }
}

// An
class Effect {
    private mode: any;
    private name: any;

    constructor(options: any = {}) {
        this.mode = options.mode !== undefined ? options.mode : 1;
        this.name = options.name !== undefined ? options.name : "";
    }

    createHistory() {
        return null;
    }

    clone() {
        return Effect.create(this);
    }

    static create(options: any) {
        return new Effect(options);
    }
}

// Tn
class TrackNavigator {
    public current: any;
    public previous: string;
    public currentTrackName: any;

    constructor() {
        this.currentTrackName = null;
        this.current = null;
        this.previous = "";
    }

    updateHistory(trackName: string, historyItem: any) {
        if (trackName !== this.previous) {
            this.current = this.currentTrackName;
            this.currentTrackName = historyItem;
            this.previous = trackName;
        }
    }
}

// En
class EffectNavigator extends Effect {
    public delay: number | undefined;
    public spring: number | undefined;
    public speed: number | undefined;
    public affectByRange: number | undefined;
    public affectByX: number | undefined;
    public affectByY: number | undefined;
    public rotateMoveRange: number | undefined;
    public affectByLevel: number | undefined;
    public springLevel: number | undefined;
    public limitRange: number | undefined;

    constructor(config: any) {
        super(config);
        this.copy(config);
    }

    copy(config: any = {}) {
        const {
            delay = 0.1,
            speed = 0.1,
            spring = 0,
            affectByRange = 1,
            affectByX = 1,
            affectByY = 1,
            rotateMoveRange = 1,
            affectByLevel = 0,
            springLevel = 0,
            limitRange = 10,
        } = config;

        this.delay = delay;
        this.speed = speed;
        this.spring = spring;
        this.affectByRange = affectByRange;
        this.affectByX = affectByX;
        this.affectByY = affectByY;
        this.rotateMoveRange = rotateMoveRange;
        this.affectByLevel = affectByLevel;
        this.springLevel = springLevel;
        this.limitRange = limitRange;
    }

    createHistory(): any {
        return {
            speedX: 0,
            speedY: 0,
            buffer: [],
        };
    }
}

// Cn
class AnimationConfig extends Effect {
    public rotateOffset: number | undefined;
    public rotateCenter: any;
    public rotateTime: any;
    public rotateRange: any;
    public affectByLevel: number | undefined;
    public springLevel: number | undefined;
    public spring: number | undefined;
    public childOffset: any;
    public scaleYRange: any;
    public scaleYCenter: any;
    public scaleYTime: any;
    public scaleYOffset: any;
    public scaleYChildOffset: any;
    public scaleYSpring: any;
    public scaleYAffectByLevel: any;
    public scaleXRange: any;
    public scaleXCenter: any;
    public scaleXTime: any;
    public scaleXOffset: any;
    public scaleXChildOffset: any;
    public scaleXSpring: any;
    public scaleXAffectByLevel: any;
    public sinScaleXSameAsY: any;
    public moveXRange: any;
    public moveXTime: any;
    public moveXSpring: any;
    public moveXChildOffset: any;
    public moveXAffectByLevel: any;
    public moveXOffset: any;
    public moveXCenter: any;
    public moveYRange: any;
    public moveYTime: any;
    public moveYSpring: any;
    public moveYChildOffset: any;
    public moveYAffectByLevel: any;
    public moveYOffset: any;
    public moveYCenter: any;

    constructor(config: any) {
        super(config);
        this.copy(config);
    }

    copy(config: any = {}) {
        this.rotateOffset = config.rotateOffset || 0;
        this.rotateCenter = config.rotateCenter || 0;
        this.rotateTime = config.rotateTime || 2;
        this.rotateRange = config.rotateRange || 10;
        this.affectByLevel = config.affectByLevel || 0.1;
        this.springLevel = config.springLevel || 0;
        this.spring = config.spring || 0;
        this.childOffset = config.childOffset || 0.25;

        this.scaleYRange = config.scaleYRange || 0;
        this.scaleYCenter = config.scaleYCenter || 0;
        this.scaleYTime = config.scaleYTime || 2;
        this.scaleYOffset = config.scaleYOffset || 0;
        this.scaleYChildOffset = config.scaleYChildOffset || 0.25;
        this.scaleYSpring = config.scaleYSpring || 0;
        this.scaleYAffectByLevel = config.scaleYAffectByLevel || 0.1;

        this.scaleXRange = config.scaleXRange || 0;
        this.scaleXCenter = config.scaleXCenter || 0;
        this.scaleXTime = config.scaleXTime || 2;
        this.scaleXOffset = config.scaleXOffset || 0;
        this.scaleXChildOffset = config.scaleXChildOffset || 0.25;
        this.scaleXSpring = config.scaleXSpring || 0;
        this.scaleXAffectByLevel = config.scaleXAffectByLevel || 0.1;

        this.sinScaleXSameAsY = this.scaleXRange === this.scaleYRange &&
            this.scaleXCenter === this.scaleYCenter &&
            this.scaleXTime === this.scaleYTime &&
            this.scaleXOffset === this.scaleYOffset &&
            this.scaleXChildOffset === this.scaleYChildOffset &&
            this.scaleXSpring === this.scaleYSpring &&
            this.scaleXAffectByLevel === this.scaleYAffectByLevel;

        this.moveXRange = config.moveXRange || 0;
        this.moveXTime = config.moveXTime || 2;
        this.moveXSpring = config.moveXSpring || 0;
        this.moveXChildOffset = config.moveXChildOffset || 0.25;
        this.moveXAffectByLevel = config.moveXAffectByLevel || 0.1;
        this.moveXOffset = config.moveXOffset || 0;
        this.moveXCenter = config.moveXCenter || 0;

        this.moveYRange = config.moveYRange || 0;
        this.moveYTime = config.moveYTime || 2;
        this.moveYSpring = config.moveYSpring || 0;
        this.moveYChildOffset = config.moveYChildOffset || 0.25;
        this.moveYAffectByLevel = config.moveYAffectByLevel || 0.1;
        this.moveYOffset = config.moveYOffset || 0;
        this.moveYCenter = config.moveYCenter || this.moveXCenter;
    }
}

// Pn
class AnimationOptions extends Effect {
    public moveXFreq: any;
    public moveXAmp: any;
    public moveXOctaves: any;
    public moveXCenter: any;
    public moveXDelay: any;
    public moveXSeed: any;
    public moveYFreq: any;
    public moveYAmp: any;
    public moveYOctaves: any;
    public moveYDelay: any;
    public moveYCenter: any;
    public moveYSameAsX: any;
    public scaleXFreq: any;
    public scaleXAmp: any;
    public scaleXOctaves: any;
    public scaleXDelay: any;
    public scaleXCenter: any;
    public scaleYFreq: any;
    public scaleYAmp: any;
    public scaleYOctaves: any;
    public scaleYDelay: any;
    public scaleYCenter: any;
    public scaleYSameAsX: any;
    public rotateSpeed: any;
    public rotateFreq: any;
    public rotateAmp: any;
    public rotateOctaves: any;
    public rotateDelay: any;
    public rotateCenter: any;
    public rotateFollowEnable: any;
    public rotateFollowLimit: any;
    public rotateFollowSpeed: any;
    public rotateFollowFlip: any;
    public rotateFollowXMax: any;
    public rotateFollowYMax: any;

    constructor(options: any) {
        super(options);
        this.copy(options);
    }

    copy(options: any = {}) {
        this.moveXFreq = options.moveXFreq ?? 1;
        this.moveXAmp = options.moveXAmp ?? 0;
        this.moveXOctaves = options.moveXOctaves ?? 0;
        this.moveXDelay = options.moveXDelay ?? 0;
        this.moveXCenter = options.moveXCenter ?? 0;
        this.moveXSeed = options.moveXSeed ?? Math.floor(10000 * Math.random());

        this.moveYFreq = options.moveYFreq ?? this.moveXFreq;
        this.moveYAmp = options.moveYAmp ?? this.moveXAmp;
        this.moveYOctaves = options.moveYOctaves ?? this.moveXOctaves;
        this.moveYDelay = options.moveYDelay ?? this.moveXDelay;
        this.moveYCenter = options.moveYCenter ?? this.moveXCenter;
        this.moveYSameAsX = this.moveXFreq === this.moveYFreq && this.moveXAmp === this.moveYAmp && this.moveXOctaves === this.moveYOctaves && this.moveXDelay === this.moveYDelay && this.moveXCenter === this.moveYCenter;

        this.scaleXFreq = options.scaleXFreq ?? 1;
        this.scaleXAmp = options.scaleXAmp ?? 0;
        this.scaleXOctaves = options.scaleXOctaves ?? 0;
        this.scaleXDelay = options.scaleXDelay ?? 0;
        this.scaleXCenter = options.scaleXCenter ?? 0;

        this.scaleYFreq = options.scaleYFreq ?? this.scaleXFreq;
        this.scaleYAmp = options.scaleYAmp ?? this.scaleXAmp;
        this.scaleYOctaves = options.scaleYOctaves ?? this.scaleXOctaves;
        this.scaleYDelay = options.scaleYDelay ?? this.scaleXDelay;
        this.scaleYCenter = options.scaleYCenter ?? this.scaleXCenter;
        this.scaleYSameAsX = this.scaleXFreq === this.scaleYFreq && this.scaleXAmp === this.scaleYAmp && this.scaleXOctaves === this.scaleYOctaves && this.scaleXDelay === this.scaleYDelay && this.scaleXCenter === this.scaleYCenter;

        this.rotateSpeed = options.rotateSpeed ?? 0;
        this.rotateFreq = options.rotateFreq ?? 1;
        this.rotateAmp = options.rotateAmp ?? 0;
        this.rotateOctaves = options.rotateOctaves ?? 0;
        this.rotateDelay = options.rotateDelay ?? 0;
        this.rotateCenter = options.rotateCenter ?? 0;

        this.rotateFollowEnable = options.rotateFollowLimit !== 0;
        this.rotateFollowLimit = options.rotateFollowLimit ?? 0;
        this.rotateFollowSpeed = options.rotateFollowSpeed ?? 0.1;
        this.rotateFollowFlip = options.rotateFollowFlip ?? 0;
        this.rotateFollowXMax = options.rotateFollowXMax ?? 20;
        this.rotateFollowYMax = options.rotateFollowYMax ?? 20;
    }
}

// Ln
class LightningEffect extends Effect {
    public delay: any;
    public speed: any;
    public spring: any;
    public springRot: any;
    public affectByLevel: any;
    public springLevel: any;
    public limitRange: any;
    public rotateOffset: any;
    public friction: any;
    public springUseTarget: any;
    public windX: any;
    public windY: any;
    public windFreq: any;
    public windAccel: any;
    public windDelay: any;
    public windOctaves: any;
    public gravityX: any;
    public gravityY: any;
    public hasWindForce: any;

    constructor(options: any) {
        super(options);
        this.copy(options);
    }

    copy(options: any = {}) {
        this.delay = options.delay !== undefined ? options.delay : 0.1;
        this.speed = options.speed !== undefined ? options.speed : 0.1;
        this.spring = options.spring !== undefined ? options.spring : 0;
        this.springRot = options.springRot !== undefined ? options.springRot : 0;
        this.affectByLevel = options.affectByLevel !== undefined ? options.affectByLevel : 0;
        this.springLevel = options.springLevel !== undefined ? options.springLevel : 0;
        this.limitRange = options.limitRange !== undefined ? options.limitRange : 80;
        this.rotateOffset = options.rotateOffset !== undefined ? options.rotateOffset : 0;
        this.friction = options.friction !== undefined ? options.friction : 0.7;
        this.springUseTarget = options.springUseTarget !== undefined ? options.springUseTarget : false;
        this.windX = options.windX !== undefined ? options.windX : 0;
        this.windY = options.windY !== undefined ? options.windY : 0;
        this.windFreq = options.windFreq !== undefined ? options.windFreq : 1;
        this.windAccel = options.windAccel !== undefined ? options.windAccel : 1;
        this.windDelay = options.windDelay !== undefined ? options.windDelay : 0;
        this.windOctaves = options.windOctaves !== undefined ? options.windOctaves : 0;
        this.gravityX = options.gravityX !== undefined ? options.gravityX : 0;
        this.gravityY = options.gravityY !== undefined ? options.gravityY : 0;
        this.hasWindForce = this.windX !== 0 || this.windY !== 0;
    }
}

// On
class ElasticEffect extends Effect {
    public elasticSpring: any;
    public elasticFriction: any;
    public elasticSoftness: any;
    public elasticSpringY: any;
    public elasticFrictionY: any;
    public elasticSoftnessY: any;

    constructor(options: any) {
        super(options);
        this.copy(options);
    }

    copy(options: any = {}) {
        this.elasticSpring = options.elasticSpring !== undefined ? options.elasticSpring : 0.4;
        this.elasticFriction = options.elasticFriction !== undefined ? options.elasticFriction : 0.6;
        this.elasticSoftness = options.elasticSoftness !== undefined ? options.elasticSoftness : 1;
        this.elasticSpringY = options.elasticSpringY !== undefined ? options.elasticSpringY : this.elasticSpring;
        this.elasticFrictionY = options.elasticFrictionY !== undefined ? options.elasticFrictionY : this.elasticFriction;
        this.elasticSoftnessY = options.elasticSoftnessY !== undefined ? options.elasticSoftnessY : this.elasticSoftness;
    }
}

// Rn
class AnimationEffect extends Effect {
    public delay: any;
    public xFrames: any;
    public xFramesEnd: any;
    public yFrames: any;
    public yFramesEnd: any;
    public sxFrames: any;
    public sxFramesEnd: any;
    public sYSameAsSX: any;
    public syFrames: any;
    public syFramesEnd: any;

    constructor(options: any) {
        super(options);
        this.copy(options);
    }

    copy(options: any = {}) {
        this.delay = options.delay !== undefined ? options.delay : 0;
        this.xFrames = (options.xFrames || []).map((frame: any) => new FrameItemFormat(frame));
        this.xFramesEnd = this.xFrames.length ? this.xFrames[this.xFrames.length - 1].start : 0;
        this.yFrames = (options.yFrames || []).map((frame: any) => new FrameItemFormat(frame));
        this.yFramesEnd = this.yFrames.length ? this.yFrames[this.yFrames.length - 1].start : 0;
        this.sxFrames = (options.sxFrames || []).map((frame: any) => new FrameItemFormat(frame));
        this.sxFramesEnd = this.sxFrames.length ? this.sxFrames[this.sxFrames.length - 1].start : 0;
        this.sYSameAsSX = options.syFrames === undefined || options.syFrames.length === 0;
        if (this.sYSameAsSX) {
            this.syFrames = [];
            this.syFramesEnd = 0;
        } else {
            this.syFrames = (options.syFrames || []).map((frame: any) => new FrameItemFormat(frame));
            this.syFramesEnd = this.syFrames.length ? this.syFrames[this.syFrames.length - 1].start : 0;
        }
    }
}

// In
class ExtraAnimationEffect {
    public animation: any | undefined
    public rootMovement: number
    public rootBoneName: string
    public endBoneName: Array<any>
    public targetBoneName: string
    public targetEndBoneName: string
    public targetWeight: number
    public history: any
    public spineObj: any
    public rootBone: any
    public targetBone: any
    public endBoneNames: any

    constructor(options: any, bindOptions: any) {
        const {
            animation = {},
            rootBoneName = '',
            endBoneName = [],
            targetBoneName = '',
            targetEndBoneName = '',
            targetWeight = 1
        } = options || {}

        this.animation = LodashHelper.fromEntries(Object.keys(animation).map((key) => {
            return [key, animation[key]]
        }).map((item) => {
            const _item = arrayLikeToArray(item, 2)
            const key = _item[0]
            const value = _item[1]
            return [key, this.createAnimation(value)]
        }))
        this.rootMovement = 0
        this.rootBoneName = rootBoneName
        this.endBoneName = Array.isArray(endBoneName) ? endBoneName : [endBoneName].filter((function (item) {
                return "" !== item
            }
        ))

        this.targetBoneName = targetBoneName
        this.targetEndBoneName = targetEndBoneName
        this.targetWeight = targetWeight
        this.history = new TrackNavigator()
        this.bind(bindOptions)

    }

    bind(options: any): void {
        this.spineObj = options
        this.rootBone = options.skeleton.findBone(this.rootBoneName)
        if (!this.rootBone) {
            console.warn(`[ExtraAnimation] Bone not found: ${this.rootBoneName}`)
            return
        }
        if ('' !== this.targetBoneName) {
            this.targetBone = options.skeleton.findBone(this.targetBoneName)
        }
        this.init(this.rootBone)
    }

    init(options: any,depth = 0): void {
        options.initX = options.x;
        options.initY = options.y;
        options.initWorldX = options.worldX;
        options.initWorldY = options.worldY;
        options.initScaleX = options.scaleX;
        options.initScaleY = options.scaleY;
        options.initRotation = options.rotation;
        options.autoMovePrevWorldX = options.worldX;
        options.autoMovePrevWorldY = options.worldY;
        options.autoMoveSpeedX = 0;
        options.autoMoveSpeedY = 0;
        options.autoMoveFriction = 0;
        options.followRotation = 0;
        options.elasticSpeedX = 0;
        options.elasticSpeedY = 0;
        options.children.forEach((child: any) => {
            // @ts-ignore
            this.init(child, depth + 1);
        });
        if (options.children.length === 0) {
            options.tailAutoMovePrevWorldX = options.y * options.b + options.worldX;
            options.tailAutoMovePrevWorldY = options.y * options.d + options.worldY;
        }
    }

    reset() {
        this.rootMovement = 0
        this.resetBone()
    }

    resetBone( bone = this.rootBone) {
        bone.worldX = bone.initWorldX
        bone.worldY = bone.initWorldY
        bone.scaleX = bone.initScaleX
        bone.scaleY = bone.initScaleY
        bone.rotation = bone.initRotation
		this.endBoneName.includes(bone.name) || bone.children.forEach(( (i: any) => {
				this.resetBone(i)
			}
		))
    }

    render(time: any, deltaTime: any, speed: any, trackName: any) {
        if (!this.rootBone) return;

        const currentAnimation = this.currentAnimation;
        if (!currentAnimation) return;

        const currentTrackName = this.currentTrackName;
        this.history.updateHistory(currentTrackName, currentAnimation);

        let blendFactor = speed !== undefined ? speed : 1;

        // 动画切换过渡期间，同时渲染上一个动画
        if (trackName && blendFactor < 1) {
            const prevAnim = this.animation[trackName] || this.defaultAnimation;
            if (prevAnim) {
                this.renderAutoBone(prevAnim, this.history.current, time, deltaTime, 1);
            }
        }

        this.renderAutoBone(currentAnimation, this.history.currentTrackName, time, deltaTime, blendFactor);
    }

    renderAutoBone(animation: any, history: any, time: any, deltaTime: any, blendFactor: any) {
        if (!animation) return;
        const animationMode = animation.mode;

        if (animationMode === 1) {
            this.updateSineMode(animation, deltaTime, this.rootBone, this.targetBone, 0, blendFactor);
        } else if (animationMode === 2) {
            this.updatePhysicMode(animation, history, this.rootBone, deltaTime, time, blendFactor);
        } else if (animationMode === 3) {
            this.updateWiggleMode(animation, this.rootBone, deltaTime, time, blendFactor);
        } else if (animationMode === 4) {
            this.updateSpringMagic(animation, this.rootBone, this.targetBone, deltaTime, time, 0, blendFactor, this.rootBone.getWorldScale().x * this.rootBone.getWorldScale().y < 0 ? -1 : 1);
        } else if (animationMode === 5) {
            this.updateElasic(animation, this.rootBone, time, blendFactor);
        } else if (animationMode === 6) {
            this.updateKeyFrameMode(animation, this.rootBone, deltaTime, blendFactor);
        }
    }

    getHistoryRotate(time: any, history: any) {
        for (let i = history.length - 1; i > -1; i--) {
            const keyframe = history[i];
            if (keyframe.time > time) {
                for (let j = i - 1; j > -1; j--) {
                    const prevKeyframe = history[j];
                    if (time >= prevKeyframe.time) {
                        return prevKeyframe.delta + (keyframe.delta - prevKeyframe.delta) * (time - prevKeyframe.time) / (keyframe.time - prevKeyframe.time);
                    }
                }
                return 0;
            }
        }
        return 0;
    }

    mixValue(start: any, end: any, ratio: any) {
        return start + (end - start) * ratio;
    }

    updateSineMode(params: any, time: any, rootBone = this.rootBone, targetBone = this.targetBone, childIndex = 0, ratio = 1) {
        if (!rootBone || this.endBoneName.includes(rootBone.data.name)) return;

        const isTargetBoneExists = targetBone && targetBone.data.name !== this.targetEndBoneName;
        const baseRotation = isTargetBoneExists ? this.mixValue(rootBone.initRotation, targetBone.rotation, this.targetWeight) : rootBone.initRotation;
        rootBone.rotation = this.mixValue(rootBone.rotation, baseRotation + Math.sin((params.rotateOffset - Math.pow(params.childOffset * childIndex, 1 + params.spring) + time) * Math.PI * 2 / params.rotateTime) * params.rotateRange * Math.pow(1 + childIndex * params.affectByLevel, 1 + params.springLevel) + params.rotateCenter, ratio);

        let scaleYDelta = 0;
        if (params.scaleYRange !== 0) {
            const baseScaleY = isTargetBoneExists ? this.mixValue(rootBone.initScaleY, targetBone.scaleY, this.targetWeight) : rootBone.initScaleY;
            scaleYDelta = Math.sin((params.scaleYOffset - Math.pow(params.scaleYChildOffset * childIndex, 1 + params.scaleYSpring) + time) * Math.PI * 2 / params.scaleYTime) * params.scaleYRange * Math.pow(1 + childIndex * params.scaleYAffectByLevel, 1 + params.springLevel) + params.scaleYCenter;
            rootBone.scaleY = this.mixValue(rootBone.scaleY, baseScaleY + scaleYDelta, ratio);

            if (params.sinScaleXSameAsY) {
                const baseScaleX = isTargetBoneExists ? this.mixValue(rootBone.initScaleX, targetBone.scaleX, this.targetWeight) : rootBone.initScaleX;
                rootBone.scaleX = this.mixValue(rootBone.scaleX, baseScaleX + scaleYDelta, ratio);
            }
        }

        if (!params.sinScaleXSameAsY && params.scaleXRange !== 0) {
            const baseScaleX = isTargetBoneExists ? this.mixValue(rootBone.initScaleX, targetBone.scaleX, this.targetWeight) : rootBone.initScaleX;
            const scaleXDelta = Math.sin((params.scaleXOffset - Math.pow(params.scaleXChildOffset * childIndex, 1 + params.scaleXSpring) + time) * Math.PI * 2 / params.scaleXTime) * params.scaleXRange * Math.pow(1 + childIndex * params.scaleXAffectByLevel, 1 + params.springLevel) + params.scaleXCenter;
            rootBone.scaleX = this.mixValue(rootBone.scaleX, baseScaleX + scaleXDelta, ratio);
        }

        if (params.moveXRange !== 0) {
            const baseX = isTargetBoneExists ? this.mixValue(rootBone.initX, targetBone.x, this.targetWeight) : rootBone.initX;
            const moveXDelta = Math.sin((params.moveXOffset - Math.pow(params.moveXChildOffset * childIndex, 1 + params.moveXSpring) + time) * Math.PI * 2 / params.moveXTime) * params.moveXRange * Math.pow(1 + childIndex * params.moveXAffectByLevel, 1 + params.springLevel) + params.moveXCenter;
            rootBone.x = this.mixValue(rootBone.x, moveXDelta + baseX, ratio);
        }

        if (params.moveYRange !== 0) {
            const baseY = isTargetBoneExists ? this.mixValue(rootBone.initY, targetBone.y, this.targetWeight) : rootBone.initY;
            const moveYDelta = Math.sin((params.moveYOffset - Math.pow(params.moveYChildOffset * childIndex, 1 + params.moveYSpring) + time) * Math.PI * 2 / params.moveYTime) * params.moveYRange * Math.pow(1 + childIndex * params.moveYAffectByLevel, 1 + params.springLevel) + params.moveYCenter;
            rootBone.y = this.mixValue(rootBone.y, moveYDelta + baseY, ratio);
        }

        rootBone.children.forEach((child: any, idx: number) => {
            const targetChild = isTargetBoneExists ? targetBone.children[idx] : null;
            this.updateSineMode(params, time, child, targetChild, childIndex + 1, ratio);
        });
    }

    updateWiggleMode(time: any, amplitude: any, componentCount: any, frequency: any, phase: any, damping = 0.5) {
        let result = 0;
        let multiplier = 1;
        const componentIndex = componentCount + 1;
        const scale = 1 / (2 - 1 / Math.pow(2, componentIndex - 1));
        let currentScale = scale;
        let totalMultiplier = 0;

        for (let i = 0; i < componentIndex; i++) {
            result += multiplier * Math.sin(frequency * currentScale * Math.PI * 2 / time + phase);
            currentScale = scale * Math.pow(1.5, i + 1);
            totalMultiplier += multiplier;
            multiplier *= damping;
        }

        return (result / totalMultiplier) * amplitude;
    }

    updatePhysicMode(params: any, state: any, bone: any, time: any, delta: any, ratio: any) {
        const deltaX = Math.min(params.limitRange, Math.max(-params.limitRange, bone.autoMovePrevWorldX - bone.worldX));
        const deltaY = Math.min(params.limitRange, Math.max(-params.limitRange, bone.autoMovePrevWorldY - bone.worldY));

        state.speedX += (params.affectByX * deltaX - state.speedX) * params.speed * delta;
        state.speedY += (params.affectByY * deltaY - state.speedY) * params.speed * delta;

        bone.autoMovePrevWorldX = bone.worldX;
        bone.autoMovePrevWorldY = bone.worldY;

        const rotationDelta = params.affectByRange * (-state.speedX * bone.c + state.speedY * bone.d);
        bone.rotation = this.mixValue(bone.rotation, rotationDelta + bone.initRotation, ratio);

        state.buffer.push({ time, delta: rotationDelta });
        if (state.buffer.length > 300) {
            state.buffer.shift();
        }

        bone.children.forEach((child: any) => {
            this.updateFollowMode(params, state, child, time, 1, ratio);
        });
    }

    updateFollowMode(params: any, state: any, bone: any, time: any, childIndex: any, ratio: any) {
        if (!this.endBoneName.includes(bone.data.name)) {
            bone.rotation = this.mixValue(bone.rotation, bone.initRotation + this.getHistoryRotate(time - params.delay * (1 + childIndex * params.spring), state.buffer) * params.rotateMoveRange * Math.pow(1 + childIndex * params.affectByLevel, 1 + params.springLevel), ratio);
            bone.children.forEach((child: any) => {
                this.updateFollowMode(params, state, child, time, childIndex + 1, ratio);
            });
        }
    }

    updateSpringMagic(config: any, bone: any, targetBone: any, delta: any, time: any, level: any, weight: any, sign: any) {
        if (!this.endBoneName.includes(bone.data.name)) {
            bone.updateWorldTransform();
            bone.autoMovePrevWorldX = bone.worldX;
            bone.autoMovePrevWorldY = bone.worldY;

            const isTargetBone = targetBone && targetBone.data.name !== this.targetEndBoneName;
            const rotation = isTargetBone
                ? this.mixValue(bone.initRotation, targetBone.rotation, this.targetWeight)
                : bone.initRotation;
            const useTarget = config.springUseTarget && targetBone ? targetBone : bone;
            const affectLevel = 1 + level * config.affectByLevel;
            const springFactor = Math.pow(affectLevel, 1 + config.springLevel);
            const springDelay = config.delay * springFactor * (1 + config.springRot * affectLevel) * time * (level === 0 ? 1 + config.spring : 1);
            const friction = config.friction;
            const forceX = config.forceX;
            const forceY = config.forceY;
            const windReduction = 1 - config.windAccel;

            if (bone.children.length > 0) {
                bone.children.forEach((child: any, childIndex: number) => {
                    if (childIndex === 0) {
                        const localX = child.x;
                        const localY = child.y;
                        const worldX = localX * useTarget.a + localY * useTarget.b + bone.worldX;
                        const worldY = localX * useTarget.c + localY * useTarget.d + bone.worldY;

                        const deltaX = (worldX - child.autoMovePrevWorldX) * springDelay;
                        const deltaY = (worldY - child.autoMovePrevWorldY) * springDelay;
                        bone.autoMoveSpeedX += deltaX;
                        bone.autoMoveSpeedY += deltaY;
                        bone.autoMoveSpeedX *= friction;
                        bone.autoMoveSpeedY *= friction;
                        bone.autoMoveSpeedX += forceX * config.windAccel;
                        bone.autoMoveSpeedY += forceY * config.windAccel;

                        const newWorldX = child.autoMovePrevWorldX + bone.autoMoveSpeedX + forceX * windReduction;
                        const newWorldY = child.autoMovePrevWorldY + bone.autoMoveSpeedY + forceY * windReduction;
                        const newRotation = bone.worldToLocalRotation(
                            sign * Math.atan2(newWorldY - bone.worldY, sign * (newWorldX - bone.worldX)) * Math.PI / 180 + (level === 0 ? config.rotateOffset : 0)
                        );
                        const targetRotation = Math.min(config.limitRange, Math.max(-config.limitRange, newRotation - rotation)) + rotation;
                        bone.rotation = this.mixValue(bone.rotation, rotation * config.speed + (1 - config.speed) * targetRotation, weight * bone.autoMoveFriction);
                        bone.updateWorldTransform();
                    }

                    const childTarget = isTargetBone ? targetBone.children[childIndex] : null;
                    this.updateSpringMagic(config, child, childTarget, delta, time, level + 1, weight, sign);
                });
            } else {
                const localX = bone.x;
                const localY = bone.y;
                const worldX = localX * useTarget.a + localY * useTarget.b + bone.worldX;
                const worldY = localX * useTarget.c + localY * useTarget.d + bone.worldY;

                const deltaX = (worldX - bone.tailAutoMovePrevWorldX) * springDelay;
                const deltaY = (worldY - bone.tailAutoMovePrevWorldY) * springDelay;
                bone.autoMoveSpeedX += deltaX;
                bone.autoMoveSpeedY += deltaY;
                bone.autoMoveSpeedX *= friction;
                bone.autoMoveSpeedY *= friction;
                bone.autoMoveSpeedX += forceX * config.windAccel;
                bone.autoMoveSpeedY += forceY * config.windAccel;

                const newWorldX = bone.tailAutoMovePrevWorldX + bone.autoMoveSpeedX + forceX * windReduction;
                const newWorldY = bone.tailAutoMovePrevWorldY + bone.autoMoveSpeedY + forceY * windReduction;
                const newRotation = bone.worldToLocalRotation(
                    sign * Math.atan2(newWorldY - bone.worldY, sign * (newWorldX - bone.worldX)) * Math.PI / 180 + (level === 0 ? config.rotateOffset : 0)
                );
                const targetRotation = Math.min(config.limitRange, Math.max(-config.limitRange, newRotation - rotation)) + rotation;
                bone.rotation = this.mixValue(bone.rotation, rotation * config.speed + (1 - config.speed) * targetRotation, weight * bone.autoMoveFriction);
                bone.updateWorldTransform();
                bone.tailAutoMovePrevWorldX = localX * bone.a + localY * bone.b + bone.worldX;
                bone.tailAutoMovePrevWorldY = localX * bone.c + localY * bone.d + bone.worldY;
            }

            bone.autoMoveFriction += 0.1 * (1 - bone.autoMoveFriction) * time;
        }
    }

    updateElasic(config: any, bone: any, delta: any, weight: any) {
        if (!this.endBoneName.includes(bone.data.name)) {
            const parent = bone.parent;
            const initX = bone.initX;
            const initY = bone.initY;
            const worldX = initX * parent.a + initY * parent.b + parent.worldX;
            const worldY = initX * parent.c + initY * parent.d + parent.worldY;
            const deltaX = (worldX - bone.autoMovePrevWorldX) * config.elasticSpring * delta;
            const deltaY = (worldY - bone.autoMovePrevWorldY) * config.elasticSpringY * delta;

            bone.elasticSpeedX += deltaX;
            bone.elasticSpeedX *= config.elasticFriction;
            bone.elasticSpeedY += deltaY;
            bone.elasticSpeedY *= config.elasticFrictionY;
            bone.autoMovePrevWorldX += bone.elasticSpeedX;
            bone.autoMovePrevWorldY += bone.elasticSpeedY;

            const localPos = parent.worldToLocal({
                x: bone.autoMovePrevWorldX,
                y: bone.autoMovePrevWorldY
            });
            const localX = localPos.x;
            const localY = localPos.y;

            if (!isNaN(localX) && !isNaN(localY)) {
                bone.x = this.mixValue(bone.x, localX * config.elasticSoftness + (1 - config.elasticSoftness) * initX, weight * bone.autoMoveFriction);
                bone.y = this.mixValue(bone.y, localY * config.elasticSoftnessY + (1 - config.elasticSoftnessY) * initY, weight * bone.autoMoveFriction);
                bone.autoMoveFriction += 0.1 * (1 - bone.autoMoveFriction) * delta;
            }
        }
    }

    updateKeyFrameMode(keyFrameData: any, target: any, time: any, deltaTime: any) {
        const currentTime = time + keyFrameData.delay + 1000;
        let blockIndex, blockData, startValue, endValue, startTime, endTime, easeFunction;

        if (keyFrameData.xFramesEnd > 0) {
            blockIndex = currentTime % keyFrameData.xFramesEnd;
            blockData = FrameItemFormat.getBlock(keyFrameData.xFrames, blockIndex);
            startValue = blockData.start.value;
            endValue = blockData.end.value;
            startTime = blockData.start.start;
            endTime = blockData.end.start;
            easeFunction = blockData.end.easeFunc;
            target.x = this.mixValue(target.x, (endValue - startValue) * easeFunction((blockIndex - startTime) / (endTime - startTime)) + startValue, deltaTime);
        }

        if (keyFrameData.yFramesEnd > 0) {
            blockIndex = currentTime % keyFrameData.yFramesEnd;
            blockData = FrameItemFormat.getBlock(keyFrameData.yFrames, blockIndex);
            startValue = blockData.start.value;
            endValue = blockData.end.value;
            startTime = blockData.start.start;
            endTime = blockData.end.start;
            easeFunction = blockData.end.easeFunc;
            target.y = this.mixValue(target.y, (endValue - startValue) * easeFunction((blockIndex - startTime) / (endTime - startTime)) + startValue, deltaTime);
        }

        if (keyFrameData.sxFramesEnd > 0) {
            blockIndex = currentTime % keyFrameData.sxFramesEnd;
            blockData = FrameItemFormat.getBlock(keyFrameData.sxFrames, blockIndex);
            startValue = blockData.start.value;
            endValue = blockData.end.value;
            startTime = blockData.start.start;
            endTime = blockData.end.start;
            easeFunction = blockData.end.easeFunc;
            target.scaleX = this.mixValue(target.scaleX, (endValue - startValue) * easeFunction((blockIndex - startTime) / (endTime - startTime)) + startValue, deltaTime);

            if (keyFrameData.sYSameAsSX) {
                target.scaleY = target.scaleX;
            } else if (keyFrameData.syFramesEnd > 0) {
                blockIndex = currentTime % keyFrameData.syFramesEnd;
                blockData = FrameItemFormat.getBlock(keyFrameData.syFrames, blockIndex);
                startValue = blockData.start.value;
                endValue = blockData.end.value;
                startTime = blockData.start.start;
                endTime = blockData.end.start;
                easeFunction = blockData.end.easeFunc;
                target.scaleY = this.mixValue(target.scaleY, (endValue - startValue) * easeFunction((blockIndex - startTime) / (endTime - startTime)) + startValue, deltaTime);
            }
        }
    }

    get currentTrackName() {
        const track = this.spineObj?.state?.tracks?.[0];
        return (track && track.animation) ? track.animation.name : "";
    }

    get currentAnimation() {
        const currentAnimationName = this.currentTrackName;
        return this.animation[currentAnimationName] || this.defaultAnimation;
    }

    get defaultAnimation() {
        return this.animation.default;
    }


    createAnimation(animate: any): any {
        switch (animate.mode) {
            case 1:
                return new AnimationConfig(animate);
            case 2:
                return new EffectNavigator(animate);
            case 3:
                return new AnimationOptions(animate);
            case 4:
                return new LightningEffect(animate);
            case 5:
                return new ElasticEffect(animate);
            case 6:
                return new AnimationEffect(animate);
            default:
                return new Effect(animate)
        }
    }
}

// Dn
class DefaultOptions {
    public mode: string | undefined;
    public name: number | undefined;
    public delay: number | undefined;

    constructor(options: any = {}) {
        this.name = options.name || '';
        this.mode = options.mode || 1;
        this.delay = options.delay || 0;
    }
}

// Fn
class ClipperOptions extends DefaultOptions {
    public blinkTime: number | undefined;
    public min: number | undefined;
    public max: number | undefined;

    constructor(options: any = {}) {
        super(options);
        this.blinkTime = options.blinkTime || 1;
        this.min = options.min || 0;
        this.max = options.max || 1;
    }
}

// Nn
class FormatFrames extends DefaultOptions {
    public frames: any;
    public framesEnd: any;

    constructor(options: any = {}) {
        super(options);
        this.frames = (options.frames || []).map((frame: any) => new FrameItemFormat(frame));
        this.framesEnd = this.frames[this.frames.length - 1].start;
    }
}

// Bn
class SineAnimateInstance {
    private animation: any;
    private spineObj: any;
    private slot: any;
    constructor(options = {}, spineObj: any) {
        // @ts-ignore
        const { animation = {}, slotName = "" } = options;
        this.animation = LodashHelper.fromEntries(
            Object.entries(animation).map(([key, value]) => [
                key,
                SineAnimateInstance.createAnimation(value),
            ])
        );
        this.spineObj = spineObj;
        this.slot = spineObj.skeleton.slots.find((slot: any) => slot.data.name === slotName);
    }

    static createAnimation(animationOptions: any) {
        switch (animationOptions.mode) {
            case 1:
                return new ClipperOptions(animationOptions);
            case 2:
                return new FormatFrames(animationOptions);
            default:
                return new DefaultOptions(animationOptions);
        }
    }

    render(currentTime: any) {
        const currentAnimation = this.currentAnimation;
        if (currentAnimation.mode === 1) {
            this.updateSineMode(currentAnimation, currentTime);
        } else if (currentAnimation.mode === 2) {
            this.updateTweenMode(currentAnimation, currentTime);
        }
    }

    updateSineMode(animation: any, currentTime: any) {
        this.slot.color.a =
            (0.5 + 0.5 * Math.sin((currentTime + animation.delay) * Math.PI * 2 / animation.blinkTime)) *
            (animation.max - animation.min) +
            animation.min;
    }

    updateTweenMode(animation: any, currentTime: any) {
        if (animation.framesEnd !== 0) {
            const frameIndex = (currentTime + animation.delay + 1000) % animation.framesEnd;
            const { start, end } = FrameItemFormat.getBlock(animation.frames, frameIndex);
            this.slot.color.a = (end.value - start.value) * (frameIndex - start.start) / (end.start - start.start) + start.value;
        }
    }

    get currentAnimation() {
        const track = this.spineObj?.state?.tracks?.[0];
        const currentAnimationName = (track && track.animation) ? track.animation.name : "";
        return this.animation[currentAnimationName] || this.defaultAnimation;
    }

    get defaultAnimation() {
        return this.animation.default;
    }
}


export class SkeletonMesh extends THREE.Object3D {
    tempPos: Vector2 = new Vector2();
    tempUv: Vector2 = new Vector2();
    tempLight = new Color();
    tempDark = new Color();
    skeleton: Skeleton;
    state: AnimationState;
    zOffset: number = 0.1;

    private batches = new Array<MeshBatcher>();
    private nextBatchIndex = 0;
    private clipper: SkeletonClipping = new SkeletonClipping();

    static QUAD_TRIANGLES = [0, 1, 2, 2, 3, 0];
    static VERTEX_SIZE = 2 + 2 + 4;
    static TWO_COLOR_VERTEX_SIZE = 8

    private vertices = Utils.newFloatArray(1024);
    private tempColor = new Color();
    private tempColor2 = new Color();

    private maxVert = 2048
    private prevTime = 0
    private isSpine = true
    private vertexSize = 0
    private twoColorTint = false
    private autoBone: any
    private autoSlot: any
    private autoBoneSpeed: any

    constructor(
        skeletonData: SkeletonData,
        private materialCustomerizer: SkeletonMeshMaterialParametersCustomizer = (
            material
        ) => {
        },
        private depthMaterialCustomizer: SkeletonMeshMaterialParametersCustomizer = (
            material
        ) => {
        },
        maxVert: number = 2048,
        twoColorTint: boolean = false
    ) {
        super();

        this.skeleton = new Skeleton(skeletonData);
        let animData = new AnimationStateData(skeletonData);
        this.state = new AnimationState(animData);

        this.maxVert = maxVert
        this.twoColorTint = twoColorTint
        this.vertexSize = twoColorTint ? SkeletonMesh.TWO_COLOR_VERTEX_SIZE : SkeletonMesh.VERTEX_SIZE;

        this.skeleton.update(0)
        this.skeleton.updateWorldTransform(Physics.pose)

        const extraData = (skeletonData as any).extra || {};
        const extraSlotData = (skeletonData as any).extraSlot || {};
        const extraConfigData = (skeletonData as any).extraConfig || {};

        this.autoBone = Object.keys(extraData)
            .map((key: string) => extraData[key])
            .map((t: any) => new ExtraAnimationEffect(t, this))
            .filter((t: any) => t.rootBone != null)

        this.autoSlot = Object.keys(extraSlotData)
            .map((e: string) => extraSlotData[e])
            .filter(Boolean)
            .map((t: any) => new SineAnimateInstance(t, this))

        this.autoBoneSpeed = new TimeScaleController(extraConfigData)
    }

    update(deltaTime: number, elapsedTime?: number) {
        let state = this.state;
        let skeleton = this.skeleton;

        state.update(deltaTime);
        state.apply(skeleton);
        skeleton.update(deltaTime);

        // extra bone physics
        const elapsed = elapsedTime !== undefined ? elapsedTime : deltaTime;
        let mixFactor = 1;
        let prevAnimation: any = null;
        const timeScale = elapsed * this.autoBoneSpeed.timeScale * state.timeScale;

        if (state.tracks[0]) {
            mixFactor = state.tracks[0].mixDuration
                ? Math.min(1, state.tracks[0].mixTime / state.tracks[0].mixDuration)
                : 1;
            if (mixFactor < 1 && state.tracks[0].mixingFrom && state.tracks[0].mixingFrom.animation) {
                prevAnimation = state.tracks[0].mixingFrom.animation.name;
            }
        }

        const timeDeltaScale = Math.min(2, Math.abs(timeScale - this.prevTime) / 0.0167);
        this.prevTime = timeScale;

        this.autoBone.forEach((bone: any) => {
            bone.render(timeDeltaScale, timeScale, mixFactor, prevAnimation);
        });

        this.autoSlot.forEach((slot: any) => {
            slot.render(timeScale);
        });

        skeleton.updateWorldTransform(Physics.update);

        this.updateGeometry();
    }

    dispose() {
        for (let i = 0; i < this.batches.length; i++) {
            this.batches[i].dispose();
        }
    }

    private clearBatches() {
        for (let i = 0; i < this.batches.length; i++) {
            this.batches[i].clear();
        }
        this.nextBatchIndex = 0;
    }

    private nextBatch() {
        if (this.batches.length == this.nextBatchIndex) {
            let batch = new MeshBatcher(this.maxVert, this.materialCustomerizer, this.depthMaterialCustomizer,
                this.twoColorTint);
            this.add(batch);
            this.batches.push(batch);
        }
        let batch = this.batches[this.nextBatchIndex++];
        // 同步父节点的渲染属性到每个 batch
        if ((this as any).renderOrder) {
            batch.renderOrder = (this as any).renderOrder - 0.1;
        }
        batch.castShadow = this.castShadow;
        batch.receiveShadow = this.receiveShadow;
        batch.frustumCulled = this.frustumCulled;
        return batch;
    }

    private updateGeometry() {
        this.clearBatches();

        let tempPos = this.tempPos;
        let tempUv = this.tempUv;
        let tempLight = this.tempLight;
        let tempDark = this.tempDark;
        let clipper = this.clipper;

        let vertices: NumberArrayLike = this.vertices;
        let triangles: Array<number> | null = null;
        let uvs: NumberArrayLike | null = null;
        let drawOrder = this.skeleton.drawOrder;
        let batch = this.nextBatch();
        batch.begin();
        let z = 0;
        let zOffset = this.zOffset;
        for (let i = 0, n = drawOrder.length; i < n; i++) {
            let vertexSize = clipper.isClipping() ? 2 : SkeletonMesh.VERTEX_SIZE;
            let slot = drawOrder[i];
            if (!slot.bone.active) {
                clipper.clipEndWithSlot(slot);
                continue;
            }
            let attachment = slot.getAttachment();
            let attachmentColor: Color | null;
            let texture: ThreeJsTexture | null;
            let numFloats = 0;
            if (attachment instanceof RegionAttachment) {
                let region = <RegionAttachment>attachment;
                attachmentColor = region.color;
                vertices = this.vertices;
                numFloats = vertexSize * 4;
                region.computeWorldVertices(slot, vertices, 0, vertexSize);
                triangles = SkeletonMesh.QUAD_TRIANGLES;
                uvs = region.uvs;
                texture = <ThreeJsTexture>region.region!.texture;
            } else if (attachment instanceof MeshAttachment) {
                let mesh = <MeshAttachment>attachment;
                attachmentColor = mesh.color;
                vertices = this.vertices;
                numFloats = (mesh.worldVerticesLength >> 1) * vertexSize;
                if (numFloats > vertices.length) {
                    vertices = this.vertices = Utils.newFloatArray(numFloats);
                }
                mesh.computeWorldVertices(
                    slot,
                    0,
                    mesh.worldVerticesLength,
                    vertices,
                    0,
                    vertexSize
                );
                triangles = mesh.triangles;
                uvs = mesh.uvs;
                texture = <ThreeJsTexture>mesh.region!.texture;
            } else if (attachment instanceof ClippingAttachment) {
                let clip = <ClippingAttachment>attachment;
                clipper.clipStart(slot, clip);
                continue;
            } else {
                clipper.clipEndWithSlot(slot);
                continue;
            }

            if (texture != null) {
                let skeleton = slot.bone.skeleton;
                let skeletonColor = skeleton.color;
                let slotColor = slot.color;
                let alpha = skeletonColor.a * slotColor.a * attachmentColor.a;
                let color = this.tempColor;
                color.set(
                    skeletonColor.r * slotColor.r * attachmentColor.r * alpha,
                    skeletonColor.g * slotColor.g * attachmentColor.g * alpha,
                    skeletonColor.b * slotColor.b * attachmentColor.b * alpha,
                    alpha
                );

                let finalVertices: NumberArrayLike;
                let finalVerticesLength: number;
                let finalIndices: NumberArrayLike;
                let finalIndicesLength: number;

                if (clipper.isClipping()) {
                    clipper.clipTriangles(
                        vertices,
                        triangles,
                        triangles.length,
                        uvs,
                        color,
                        tempLight,
                        false
                    );
                    let clippedVertices = clipper.clippedVertices;
                    let clippedTriangles = clipper.clippedTriangles;
                    finalVertices = clippedVertices;
                    finalVerticesLength = clippedVertices.length;
                    finalIndices = clippedTriangles;
                    finalIndicesLength = clippedTriangles.length;
                } else {
                    let verts = vertices;
                    for (
                        let v = 2, u = 0, n = numFloats;
                        v < n;
                        v += vertexSize, u += 2
                    ) {
                        verts[v] = color.r;
                        verts[v + 1] = color.g;
                        verts[v + 2] = color.b;
                        verts[v + 3] = color.a;
                        verts[v + 4] = uvs[u];
                        verts[v + 5] = uvs[u + 1];
                    }
                    finalVertices = vertices;
                    finalVerticesLength = numFloats;
                    finalIndices = triangles;
                    finalIndicesLength = triangles.length;
                }

                if (finalVerticesLength == 0 || finalIndicesLength == 0) {
                    clipper.clipEndWithSlot(slot);
                    continue;
                }

                // Start new batch if this one can't hold vertices/indices
                if (
                    !batch.canBatch(
                        finalVerticesLength / SkeletonMesh.VERTEX_SIZE,
                        finalIndicesLength
                    )
                ) {
                    batch.end();
                    batch = this.nextBatch();
                    batch.begin();
                }

                const slotBlendMode = slot.data.blendMode;
                const slotTexture = texture.texture;
                const materialGroup = batch.findMaterialGroup(
                    slotTexture,
                    slotBlendMode
                );

                batch.addMaterialGroup(finalIndicesLength, materialGroup);
                batch.batch(
                    finalVertices,
                    finalVerticesLength,
                    finalIndices,
                    finalIndicesLength,
                    z
                );
                z += zOffset;
            }

            clipper.clipEndWithSlot(slot);
        }
        clipper.clipEnd();
        batch.end();
    }
}
