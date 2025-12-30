import React, { useMemo } from "react";
import { framesConfig } from "./framesConfig.js";

export default function FloatingFrames({ onFrameClick, count = 18 }) {
  // 生成很多張：從 framesConfig 輪流取圖，但每張高度/速度/大小/延遲都不同
  const frames = useMemo(() => {
    const base = framesConfig?.length ? framesConfig : [];
    const rand = (min, max) => Math.random() * (max - min) + min;

    return Array.from({ length: count }).map((_, i) => {
      const src = base[i % base.length]?.src ?? "/images/frame1.png";

      const size = Math.round(rand(90, 170));           // 大小
      const y = `${Math.round(rand(6, 84))}vh`;         // 高度分布
      const duration = rand(10, 22).toFixed(2) + "s";   // 飄的速度（越大越慢）
      const delay = (-rand(0, 18)).toFixed(2) + "s";    // 負延遲：一開始就分散在路上
      const rotate = `${rand(-8, 8).toFixed(2)}deg`;    // 微旋轉
      const extra = `${Math.round(rand(80, 240))}px`;   // 進出場距離更自然

      return {
        id: `float-${i}`,
        src,
        size: `${size}px`,
        y,
        duration,
        delay,
        rotate,
        extra,
      };
    });
  }, [count]);

  return (
    <div className="bg-layer" aria-hidden="true">
      {frames.map((f) => (
        <button
          key={f.id}
          className="float-frame"
          style={{
            ["--size"]: f.size,
            ["--y"]: f.y,
            ["--duration"]: f.duration,
            ["--delay"]: f.delay,
            ["--rotate"]: f.rotate,
            ["--extra"]: f.extra,
          }}
          onClick={(e) => {
            e.preventDefault();
            onFrameClick?.(f);
          }}
          title="Click"
        >
          <img src={f.src} alt="" draggable="false" />
        </button>
      ))}
    </div>
  );
}
