import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { ACESFilmicToneMapping, CineonToneMapping, LinearToneMapping, NeutralToneMapping, NoToneMapping, SRGBColorSpace } from "three";
import { useLivePreviewStore } from "../store/useLivePreviewStore";
export function EnvironmentSetup() {
    const gl = useThree((state) => state.gl);
    const scene = useThree((state) => state.scene);
    const environmentUrl = useLivePreviewStore((state) => state.environmentUrl);
    const toneMapping = useLivePreviewStore((state) => state.toneMapping);
    const toneMappingMode = useMemo(() => {
        switch (toneMapping) {
            case "NoToneMapping":
                return NoToneMapping;
            case "Linear":
                return LinearToneMapping;
            case "Cineon":
                return CineonToneMapping;
            case "Neutral":
                return NeutralToneMapping;
            case "ACESFilmic":
            default:
                return ACESFilmicToneMapping;
        }
    }, [toneMapping]);
    useEffect(() => {
        gl.toneMapping = toneMappingMode;
        gl.toneMappingExposure = 1;
        gl.outputColorSpace = SRGBColorSpace;
        scene.backgroundBlurriness = 0.18;
        scene.backgroundIntensity = 1;
    }, [gl, scene, toneMappingMode]);
    return (_jsxs(_Fragment, { children: [_jsx("color", { attach: "background", args: ["#111319"] }), environmentUrl ? _jsx(Environment, { files: environmentUrl, background: true }) : null, _jsx("ambientLight", { intensity: 0.4 }), _jsx("directionalLight", { position: [6, 8, 4], intensity: 2.6 })] }));
}
