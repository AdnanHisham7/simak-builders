import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";

export interface PageHeaderProps {
  title: string;
  description?: string;
  buttons?: { name: string; path: string }[];
}

export default function PageHeader({
  title,
  description,
  buttons = [],
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    

    // <div className="-mx-6 -mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </div>

        <div className="flex gap-2 flex-wrap">
          {buttons.map((btn, index) => (
            <Button key={index} onClick={() => navigate(btn.path)}>
              {btn.name}
            </Button>
          ))}
        </div>
      </div>
    // </div>
  );
}
