import { ChevronRightIcon } from '@heroicons/react/24/solid'; // or /solid depending on your setup
import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string; // optional: no path means it's the current page
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="text-sm text-gray-500 mb-4">
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.path ? (
              <button
                type="button"
                onClick={() => handleNavigate(item.path!)}
                className="hover:text-green-800 transition bg-transparent border-none p-0 m-0 text-inherit cursor-pointer"
              >
                {item.label}
              </button>
            ) : (
              <span className="font-semibold text-gray-700">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <ChevronRightIcon className="h-3 w-3 mx-1 inline" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
