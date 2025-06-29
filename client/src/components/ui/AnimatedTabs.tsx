import React, { useRef, useEffect, useState } from "react";

type AnimatedTabsProps = {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const [sliderStyle, setSliderStyle] = useState({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const index = tabs.indexOf(activeTab);
    const currentBtn = buttonRefs.current[index];

    if (currentBtn && containerRef.current) {
      const btnRect = currentBtn.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const left = btnRect.left - containerRect.left;
      const width = btnRect.width;

      setSliderStyle({
        left,
        width,
      });
    }
  }, [activeTab, tabs]);

  return (
    <div
      ref={containerRef}
      className="relative flex bg-gray-100 rounded-md p-1 mb-4"
    >
      {/* Background slider */}
      <div
        className="absolute top-1 bottom-1 bg-white rounded-md shadow-md transition-all duration-300 ease-in-out"
        style={sliderStyle}
      />

      {tabs.map((tab, index) => (
        <button
          key={tab}
          ref={(el) => {
            buttonRefs.current[index] = el;
          }}          
          onClick={() => onTabChange(tab)}
          className={`flex-1 z-10 py-2 text-sm font-medium text-center rounded-md transition-colors ${
            activeTab === tab ? " text-green-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default AnimatedTabs;
