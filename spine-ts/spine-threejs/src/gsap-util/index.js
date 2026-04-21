import * as GSAP from 'gsap'
import CustomEase from "gsap/CustomEase";

const easingFunctions = {
    sine: GSAP.Sine,
    linear: GSAP.Linear,
    power2: GSAP.Power2,
    power3: GSAP.Power3,
    power4: GSAP.Power4,
    back: GSAP.Back,
    elastic: GSAP.Elastic,
    bounce: GSAP.Bounce
}

const easingPresetMap = {
    in: 'easeIn',
    out: 'easeOut',
    inout: 'easeInOut',
    none: 'easeNone'
};

const customEasingFunctions = {};

export const MatrixMatchHelper = {
    easeFunction(easeString) {
        if (easeString.startsWith('custom ')) {
            const customName = easeString.substring(7);
            return customEasingFunctions[customName] || (customEasingFunctions[customName] = CustomEase.create(customName, customName));
        }

        const [easingType, easingPreset] = easeString.toLowerCase().split('.');
        const easingPresetName = easingPresetMap[easingPreset] || easingPresetMap.none;
        return easingFunctions[easingType] ? easingFunctions[easingType][easingPresetName] : GSAP.Linear.easeNone;
    },
}
