import React, { useState, useMemo, useCallback } from "react";

export default function FloatingFrames({ onFrameClick }) {
  const randInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const FIXED_SIZE = 300;

  // 每個軌道的圖片池
  const lanes = useMemo(() => ([
    { lane: "top", y: "5vh", range: [1, 10] },
    { lane: "mid", y: "35vh", range: [11, 20] },
    { lane: "bottom", y: "65vh", range: [21, 30] },
  ]), []);

  // 每個軌道目前用第幾張
  const [indexByLane, setIndexByLane] = useState(() => ({
    top: randInt(1, 10),
    mid: randInt(11, 20),
    bottom: randInt(21, 30),
  }));

  // 動畫跑完一圈 → 換下一張
  const nextImage = useCallback((lane) => {
    setIndexByLane((prev) => {
      const ln = lanes.find(l => l.lane === lane);
      if (!ln) return prev;

      return {
        ...prev,
        [lane]: randInt(ln.range[0], ln.range[1]),
      };
    });
  }, [lanes]);

  return (
    <div
      className="bg-layer"
      style={{ "--frameUrl": `url(${import.meta.env.BASE_URL}photo.png)` }}
      aria-hidden="true"
    >
      {lanes.map((ln) => {
        const index = indexByLane[ln.lane];
        const src = `/images/frame${index}.png`;

        return (
          <button
            key={ln.lane}
            className="float-frame"
            data-lane={ln.lane}
            style={{
              "--size": `${FIXED_SIZE}px`,
              "--duration": "8s",
              "--rotate": "0deg",
              "--extra": "120px",
              top: ln.y,
            }}
            onAnimationIteration={() => nextImage(ln.lane)}
            onClick={(e) => {
              e.preventDefault();
              onFrameClick?.({ lane: ln.lane, src });
            }}
            title="Click"
          >
            <img src={src} alt="" draggable="false" />
          </button>
        );
      })}
    </div>
  );
}
