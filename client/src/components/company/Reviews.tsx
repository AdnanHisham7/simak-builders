import { motion } from "framer-motion";
import { MutableRefObject } from "react";
import useScrollAnimation from "@/hooks/auth/useScrollAnimation";
import ReviewCard from "../ui/ReviewCard"; // Import the reusable ReviewCard component
import { StarIcon } from "@/assets/icons";

interface Review {
  name: string;
  rating: number;
  date: string;
  comment: string;
  project: string;
}

const Reviews = () => {
  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const reviews: Review[] = [
    {
      name: "Rajesh Menon",
      rating: 5,
      date: "March 15, 2024",
      comment:
        "Outstanding work by Simak Constructions! They built our dream home with attention to every detail. The team was professional, responsive, and completed the project ahead of schedule. Highly recommended!",
      project: "Villa Construction",
    },
    {
      name: "Priya Thomas",
      rating: 4,
      date: "February 2, 2024",
      comment:
        "Very satisfied with the quality of work. The team was skilled and maintained good communication throughout the project. Minor delays were the only issue, but the end result was worth it.",
      project: "Office Renovation",
    },
    {
      name: "Ahmed Khan",
      rating: 5,
      date: "January 18, 2024",
      comment:
        "Excellent service from start to finish. They understood our requirements perfectly and delivered beyond expectations. The project manager was always available to address our concerns.",
      project: "Commercial Building",
    },
    {
      name: "Lakshmi Nair",
      rating: 4,
      date: "December 5, 2023",
      comment:
        "Great experience working with Simak Constructions. They provided valuable suggestions that improved our initial design. The quality of work is impressive, and they stayed within budget.",
      project: "Apartment Complex",
    },
  ];

  return (
    <motion.section
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Customer Reviews</h2>

        <div className="flex items-center">
          <StarIcon className="h-5 w-5 text-yellow-400" />
          <span className="ml-1 font-semibold">4.5</span>
          <span className="ml-1 text-gray-500">(67 reviews)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reviews.map((review, index) => (
          <ReviewCard
            key={index}
            name={review.name}
            rating={review.rating}
            date={review.date}
            comment={review.comment}
            project={review.project}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <button className="px-6 py-2 border border-gray-200 rounded-full hover:bg-gray-50 transition">
          Show More Reviews
        </button>
      </div>
    </motion.section>
  );
};

export default Reviews;
