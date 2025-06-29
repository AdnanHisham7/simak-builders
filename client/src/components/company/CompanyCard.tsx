import { useNavigate } from "react-router-dom";
import { ICompany } from "@/store/types/company";
import {
  CheckBadgeIcon,
  HeartIconSolid,
  MapPinIcon,
  StarIcon,
  StarIconSolid,
} from "@/assets/icons";
import Button from "@/components/ui/Button";
import Badge from "../ui/Badge";
import { motion, Variants } from "framer-motion";
import { HeartIcon } from "lucide-react";

// Props for the CompanyCard
interface CompanyCardProps {
  company: ICompany;
  isFavorite: boolean;
  toggleFavorite: () => void;
  variants?: Variants;
}

const CompanyCard = ({
  company,
  isFavorite,
  toggleFavorite,
  variants,
}: CompanyCardProps) => {
  // const companiesWithFallback = companies.map((company) => ({
  //   ...company,
  //   logoColor: company.image ? "" : getRandomDarkColor(),
  //   initials: company.image ? "" : getInitials(company.name),
  // }));
  const navigate = useNavigate();

  return (
    <motion.div
      variants={variants}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            {company.image ? (
              <img
                src={company.image}
                alt={company.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div
                className={`h-12 w-12  ${company.logoColor} rounded-lg flex items-center justify-center text-white font-bold text-xl`}
              >
                {company.initials}
              </div>
            )}

            <div className="ml-3">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {company.name}
                </h3>
                {company.verified && (
                  <CheckBadgeIcon
                    className="h-5 w-5 text-blue-500 ml-1"
                    title="Verified Company"
                  />
                )}
              </div>
              <div className="flex items-center text-gray-500 text-sm">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span>{company.location}</span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleFavorite}
            className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100 transition"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            {isFavorite ? (
              <HeartIconSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {company.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {company.categories.map((category, index) => (
            <Badge key={index} className="bg-green-50 text-green-700">
              {category}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="flex">
              {[...Array(5)].map((_, i) =>
                i < Math.floor(company.rating) ? (
                  <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
                ) : i < company.rating ? (
                  <StarIconSolid
                    key={i}
                    className="h-4 w-4 text-yellow-400 opacity-50"
                  />
                ) : (
                  <StarIcon key={i} className="h-4 w-4 text-yellow-400" />
                )
              )}
            </div>
            <span className="ml-1 text-sm font-medium text-gray-700">
              {company.rating}
            </span>
            <span className="mx-1.5 text-gray-500">•</span>
            <span className="text-sm text-gray-500">
              {company.reviewCount} reviews
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={() => navigate("/company-profile")}
            variant="primary"
            className="flex-1"
          >
            View Profile
          </Button>
          <Button variant="outline" className="flex-1">
            Request Quote
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CompanyCard;
