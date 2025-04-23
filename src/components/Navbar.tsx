import React from 'react';
import { Link, NavLink } from 'react-router-dom'; // Use NavLink for active styling
import { MessageCircleHeart, Home, Book, Utensils, BarChart2, Settings, Users } from 'lucide-react'; // Added Users icon

interface NavbarProps {
  onOpenAISettings: () => void;
  onOpenSettings: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenAISettings, onOpenSettings }) => {
  // Define active style for NavLink
  const activeClassName = "bg-gray-100 text-raspberry";
  const inactiveClassName = "text-gray-900 hover:text-gray-700 hover:bg-gray-50";

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center gap-2">
              <MessageCircleHeart className="h-6 w-6 text-gray-900" />
              <Link to="/" className="text-xl font-bold text-gray-900">
                distincto.life
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-1"> {/* Reduced space for more icons */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${isActive ? activeClassName : inactiveClassName}`
              }
              title="Home"
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Home</span>
            </NavLink>
            <NavLink
              to="/journal"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${isActive ? activeClassName : inactiveClassName}`
              }
              title="Journal"
            >
              <Book className="h-5 w-5" />
               <span className="hidden sm:inline">Journal</span>
            </NavLink>
             <NavLink
              to="/children" // Link to Child Profiles
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${isActive ? activeClassName : inactiveClassName}`
              }
              title="Child Profiles"
            >
              <Users className="h-5 w-5" />
               <span className="hidden sm:inline">Profiles</span>
            </NavLink>
            <NavLink
              to="/food"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${isActive ? activeClassName : inactiveClassName}`
              }
              title="Food Journey"
            >
              <Utensils className="h-5 w-5" />
               <span className="hidden sm:inline">Food</span>
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${isActive ? activeClassName : inactiveClassName}`
              }
              title="Reports"
            >
              <BarChart2 className="h-5 w-5" />
               <span className="hidden sm:inline">Reports</span>
            </NavLink>
            <button
              onClick={onOpenSettings}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${inactiveClassName}`}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
               <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
