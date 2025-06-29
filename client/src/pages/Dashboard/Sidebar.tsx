import { ReactNode, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface MenuItem {
  name: string;
  path: string;
  icon: ReactNode;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

interface SidebarProps {
  collapsed: boolean;
  menus: MenuSection[];
  unseenCount: number; // Added unseenCount prop
}

function Sidebar({ collapsed, menus, unseenCount }: SidebarProps) {
  console.log('sidebar redered')
  const navigate = useNavigate();
  const location = useLocation();
  const { userType } = useSelector((state: RootState) => state.auth);
  
  const currentPath = location.pathname;
  
  const handleItemClick = (item: MenuItem) => {
    navigate(item.path);
  };

  const formatRoleName = (role: string) => {
    return role
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const displayRole = userType ? formatRoleName(userType) : '';

  return (
    <div className="h-full flex flex-col">
      <div className={`
        flex items-center ${collapsed ? 'justify-center' : 'px-4'} 
        py-4 border-b border-gray-100
      `}>
        {collapsed ? (
          <div className="h-9 w-9 bg-indigo-600 text-white rounded-md flex items-center justify-center font-bold text-lg">
            SB
          </div>
        ) : (
          <div className="flex items-center">
            <div className="h-9 w-9 bg-indigo-600 text-white rounded-md flex items-center justify-center font-bold text-lg">
              SB
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium">Simak Builders</div>
              <div className="text-xs text-gray-500">{displayRole}</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto pt-3 pb-6 overflow-x-hidden">
        {menus.map((menu, index) => (
          <div className="mb-6" key={menu.title ?? `section-${index}`}>
            {menu.title && !collapsed && (
              <div className="text-xxs font-semibold uppercase tracking-wider text-gray-500 px-6 mb-2">
                {menu.title}
              </div>
            )}
            {menu.items.map((item) => (
              <SidebarItem
                key={item.name}
                icon={item.icon}
                name={item.name}
                active={currentPath === item.path}
                collapsed={collapsed}
                onClick={() => handleItemClick(item)}
                badge={item.name === 'Enquiries' && unseenCount > 0 ? unseenCount : undefined}
              />
            ))}
          </div>
        ))}
      </div>
      
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-xs text-gray-400">v1.0.0</div>
        </div>
      )}
    </div>
  );
}

export default memo(Sidebar);