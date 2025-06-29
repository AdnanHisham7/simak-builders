import { motion } from "framer-motion";
import { StarIcon } from "@/assets/icons";

interface ReviewCardProps {
  name: string;
  rating: number;
  date: string;
  comment: string;
  project: string;
}

const ReviewCard = ({
  name,
  rating,
  date,
  comment,
  project,
}: ReviewCardProps) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-gray-500">{project}</p>
        </div>
        <div className="text-sm text-gray-500">{date}</div>
      </div>

      <div className="mb-3 flex">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>

      <p className="text-gray-600">{comment}</p>
    </motion.div>
  );
};

export default ReviewCard;
