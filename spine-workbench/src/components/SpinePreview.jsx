import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { MatrixMatchHelper } from "@local-gsap-helper";
import { SpinePlayer } from "@local-spine-player";

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function SpinePreview({ asset, animation }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const placement = useMemo(() => {
    const skeleton = asset?.skeleton || {};
    const width = Math.abs(parseNumber(skeleton.width, 960));
    const height = Math.abs(parseNumber(skeleton.height, 1280));
    const centerX = parseNumber(skeleton.x, -width / 2) + width / 2;
    const centerY = parseNumber(skeleton.y, -height / 2) + height / 2;

    return {
      posX: -centerX,
      posY: -centerY,
      scale: 1,
    };
  }, [asset]);

  useEffect(() => {
    if (!asset || !containerRef.current) {
      setStatus("idle");
      setError("");
      playerRef.current?.dispose?.();
      playerRef.current = null;
      return undefined;
    }

    const host = containerRef.current;
    host.replaceChildren();
    setStatus("loading");
    setError("");

    const player = new SpinePlayer(host, {
      atlas: asset.atlasUrl,
      json: asset.jsonUrl,
      animation: animation || asset.defaultAnimation || asset.animationNames[0],
      loop: true,
      scale: 1,
      posX: placement.posX,
      posY: placement.posY,
      onLoad() {
        setStatus("ready");
        const canvas = host.querySelector("canvas");
        if (canvas) {
          gsap.fromTo(
            canvas,
            { opacity: 0, scale: 0.985, filter: "blur(12px)" },
            {
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: 0.65,
              ease: MatrixMatchHelper.easeFunction("power3.out"),
            }
          );
        }
      },
      onError(loadError) {
        setStatus("error");
        setError(loadError?.message || "预览初始化失败");
      },
    });

    playerRef.current = player;

    return () => {
      player.dispose();
      playerRef.current = null;
      setError("");
    };
  }, [asset, animation, placement]);

  useEffect(() => {
    if (!playerRef.current || !animation || status !== "ready") {
      return;
    }

    playerRef.current.setAnimation(animation, true);
  }, [animation, status]);

  return (
    <div className="spine-preview-shell">
      <div ref={containerRef} className="spine-preview-canvas" />

      {status !== "ready" ? (
        <div className="spine-preview-overlay">
          <div className="spine-preview-status">
            {status === "loading" ? "正在载入 Spine 预览..." : "选择资源后可预览动画"}
          </div>
          {status === "error" ? (
            <div className="spine-preview-error">{error}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
