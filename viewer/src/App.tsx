import { useEffect } from "react";
import { Scene } from "./viewer/Scene";
import { ViewerHUD } from "./viewer/ViewerHUD";
import { connectPreviewSocket } from "./networking/socket";
import { useLivePreviewStore } from "./store/useLivePreviewStore";
import type { ViewerEvent } from "./protocol";

function initialModelUrl(sessionId: string) {
  return `/assets/${encodeURIComponent(sessionId)}/live_model.glb`;
}

export default function App() {
  const setSession = useLivePreviewStore((state) => state.setSession);
  const setConnected = useLivePreviewStore((state) => state.setConnected);
  const setModel = useLivePreviewStore((state) => state.setModel);
  const setLoadState = useLivePreviewStore((state) => state.setLoadState);
  const addWarning = useLivePreviewStore((state) => state.addWarning);
  const registerPatch = useLivePreviewStore((state) => state.registerPatch);
  const setEnvironmentConfig = useLivePreviewStore((state) => state.setEnvironmentConfig);
  const setCamera = useLivePreviewStore((state) => state.setCamera);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session");
    const token = params.get("token");

    if (!sessionId || !token) {
      setLoadState("error", "Missing session query parameters");
      return;
    }

    setSession(sessionId, token);
    setModel(initialModelUrl(sessionId), Date.now());

    const socket = connectPreviewSocket(sessionId, token, {
      onOpen() {
        setConnected(true);
      },
      onClose() {
        setConnected(false);
      },
      onError(message) {
        addWarning(message);
      },
      onMessage(event: ViewerEvent) {
        if (event.type === "connected") {
          setEnvironmentConfig(event.environmentUrl ?? null, event.toneMapping);
          if (event.camera) {
            setCamera(event.camera);
          }
          if (event.modelUrl && event.version) {
            setModel(event.modelUrl, event.version);
          }
          return;
        }
        if (event.type === "model_updated") {
          if (event.environmentUrl !== undefined || event.toneMapping) {
            setEnvironmentConfig(event.environmentUrl ?? null, event.toneMapping);
          }
          setModel(event.modelUrl, event.version);
          return;
        }
        if (event.type === "camera_updated") {
          setCamera(event.camera);
          return;
        }
        if (event.type === "material_patch") {
          registerPatch(event.materialName, event.values);
          return;
        }
        if (event.type === "error") {
          addWarning(event.message);
        }
      },
    });

    return () => socket.close();
  }, [addWarning, registerPatch, setCamera, setConnected, setEnvironmentConfig, setLoadState, setModel, setSession]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background:
          "radial-gradient(circle at top, rgba(88, 109, 143, 0.24), transparent 32%), linear-gradient(180deg, #161a22 0%, #0d1015 100%)",
      }}
    >
      <Scene />
      <ViewerHUD />
    </div>
  );
}
