import { useState } from "react";

function useTabs(initialTab: string, tabs: { id: string; label: string }[]) {
  const [activeTab, setActiveTab] = useState<string>(initialTab || tabs[0].id);

  return { activeTab, setActiveTab };
}

export default useTabs;
