import { motion } from 'framer-motion';
import { MutableRefObject } from 'react';
import useScrollAnimation from '@/hooks/auth/useScrollAnimation';

interface CoverBannerProps {
  companyName: string;
  coverImageUrl?: string;
}

const CoverBanner: React.FC<CoverBannerProps> = ({ companyName, coverImageUrl }) => {
  const [ref, controls] = useScrollAnimation() as [MutableRefObject<HTMLElement | null>, any];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.7, delay: 0.3, ease: 'easeOut' },
    },
  };

  // Generate initials for placeholder logo
  const initials = companyName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <motion.section
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className="relative mb-16"
    >
      <div className="h-56 md:h-64 bg-gray-200 rounded-xl overflow-hidden">
        <img
          src={coverImageUrl || '/api/placeholder/1200/400'}
          alt={`${companyName} cover`}
          className="w-full h-full object-cover"
        />
      </div>

      <motion.div
        variants={logoVariants}
        className="absolute -bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center text-3xl font-bold text-green-800">
          {initials}
        </div>
      </motion.div>
    </motion.section>
  );
};

export default CoverBanner;
