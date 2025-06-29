import { BuildingOfficeIcon } from "@/assets/icons";
import { ClipboardDocumentCheckIcon, UserGroupIcon } from "@heroicons/react/20/solid";

const CompanyStats = () => {
    const statsData = [
      {
        icon: <BuildingOfficeIcon className="h-6 w-6" />,
        value: "350+",
        label: "Projects Completed",
      },
      {
        icon: <UserGroupIcon className="h-6 w-6" />,
        value: "120+",
        label: "Expert Team Members",
      },
      {
        icon: <ClipboardDocumentCheckIcon className="h-6 w-6" />,
        value: "98%",
        label: "Client Satisfaction",
      },
    ];
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition flex flex-col items-center text-center"
          >
            <div className="mb-3 text-green-800">{stat.icon}</div>
            <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
            <p className="text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    );
  };

  export default CompanyStats;