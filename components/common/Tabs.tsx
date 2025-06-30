import React, { useState, ReactNode } from "react";

interface TabProps {
  label: string;
  children: ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <div>{children}</div>;
};

interface TabsProps {
  children: React.ReactElement<TabProps>[];
  initialActiveTab?: string;
}

export const Tabs: React.FC<TabsProps> = ({ children, initialActiveTab }) => {
  const [activeTab, setActiveTab] = useState(
    initialActiveTab || children[0]?.props.label,
  );

  return (
    <div className="w-full">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {children.map((child) => (
            <button
              key={child.props.label}
              onClick={() => setActiveTab(child.props.label)}
              className={`${
                activeTab === child.props.label
                  ? "border-azul text-azul"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {child.props.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">
        {children.map((child) => {
          if (child.props.label === activeTab) {
            return <div key={child.props.label}>{child.props.children}</div>;
          }
          return null;
        })}
      </div>
    </div>
  );
};
