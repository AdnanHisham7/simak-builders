import { motion } from 'framer-motion';
import React, { ReactNode } from 'react';
import useTabs from '@/hooks/useTabs';  

interface TabProps {
  tabs: { id: string; label: string }[];
  tabComponents: { [key: string]: ReactNode };
}

const TabNavigationWithContent: React.FC<TabProps> = ({ tabs, tabComponents }) => {
  const { activeTab, setActiveTab } = useTabs(tabs[0].id, tabs);

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-4 px-1 text-sm font-medium ${
                activeTab === tab.id
                  ? 'text-green-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activetab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-800"
                  initial={false}
                  transition={{ type: 'spring', duration: 0.4 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {tabComponents[activeTab] || <div>No content available</div>}
      </motion.div>
    </div>
  );
};

export default TabNavigationWithContent;
