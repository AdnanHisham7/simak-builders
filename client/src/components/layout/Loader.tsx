import { useEffect, useState } from "react";
import logoMark from "@/assets/logo-mark-no-bg.svg";
import "@/assets/styles/Loader.css";

const Loader = () => {
  const [animationStage, setAnimationStage] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Stage 1: Logo rises up
    const stage1Timer = setTimeout(() => {
      setAnimationStage(1);
    }, 1000);

    // Stage 2: Logo moves left, text appears
    const stage2Timer = setTimeout(() => {
      setAnimationStage(2);
    }, 2000);

    // Stage 3: Logo and text diverge further
    const stage3Timer = setTimeout(() => {
      setAnimationStage(3);
    }, 3000);

    // Stage 4: Start exit animation
    const exitTimer = setTimeout(() => {
      setVisible(false);
    }, 4000);

    return () => {
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
      clearTimeout(exitTimer);
    };
  }, []);

  // Hide loader after exit animation completes
  useEffect(() => {
    if (!visible) {
      const hideTimer = setTimeout(() => {
        const loaderElement = document.getElementById("loader");
        if (loaderElement) {
          loaderElement.style.display = "none";
        }
      }, 500);

      return () => clearTimeout(hideTimer);
    }
  }, [visible]);

  return (
    <div
      id="loader"
      className={`fixed inset-0 bg-white flex justify-center items-center z-50 transition-opacity duration-500 ${
        !visible ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex items-center">
        {/* Logo */}
        <div
          className={`
            relative w-24 h-24 transition-all duration-700 ease-out
            ${
              animationStage === 0
                ? "translate-y-16 opacity-0"
                : "translate-y-0 opacity-100"
            }
            ${animationStage >= 1 && animationStage < 3 ? "translate-x-0" : ""}
            ${animationStage === 2 ? "-translate-x-8" : ""}
            ${animationStage === 3 ? "-translate-x-16" : ""}
          `}
        >
          {/* Base logo (black outline) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={logoMark} alt="Bizorago Logo" />
          </div>

          {/* Colored fill logo with animation */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={`
              absolute inset-0 flex items-center justify-center
              ${animationStage === 0 ? "clip-path-bottom" : "clip-path-none"}
            `}
            >
              <img src={logoMark} alt="" className="logo logo-green" />
            </div>
          </div>
        </div>

        {/* Text Container */}
        <div
          className={`
          transition-all duration-700 ease-out
          ${
            animationStage < 1
              ? "opacity-0 translate-x-8"
              : "opacity-100 translate-x-0"
          }
          ${animationStage === 3 ? "translate-x-8" : ""}
        `}
        >
          <h1 className="text-3xl font-bold tracking-wider text-yellow-900 m-0">
            SIMAK
          </h1>
          <p className="text-sm tracking-wider text-gray-600 m-0">
            ENGINEERS AND ARCHITECTS
          </p>
        </div>
      </div>
    </div>
  );
};

export default Loader;
