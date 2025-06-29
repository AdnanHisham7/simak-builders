import { MutableRefObject } from 'react';
import { motion } from 'framer-motion';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, GlobeAltIcon } from '@/assets/icons';
import CompanyStats from './CompanyStats';
import useScrollAnimation from '@/hooks/auth/useScrollAnimation';

interface CompanyOverviewProps {
  companyName: string;
}

const CompanyOverview: React.FC<CompanyOverviewProps> = ({ companyName }) => {
  const [ref, controls] = useScrollAnimation() as [MutableRefObject<HTMLElement | null>, any];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const specialties = [
    'Residential Construction',
    'Commercial Buildings',
    'Renovation',
    'Interior Design',
  ];

  const serviceAreas = ['Malappuram', 'Kozhikode', 'Palakkad', 'Thrissur'];

  const certifications = ['ISO 9001:2015', 'Green Building Council', 'National Safety Council'];

  return (
    <motion.section
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className="grid grid-cols-1 md:grid-cols-3 gap-8"
    >
      <motion.div variants={itemVariants} className="md:col-span-2">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">About {companyName}</h2>
          <p className="text-gray-600 mb-6">
            {companyName} is a leading construction company specializing in high-quality residential and commercial buildings. With over a decade of experience, we've established ourselves as a trusted name in the construction industry. Our team of skilled professionals is dedicated to delivering exceptional results on time and within budget.
          </p>
          <p className="text-gray-600 mb-6">
            We take pride in our attention to detail, innovative approach, and commitment to customer satisfaction. Whether you're looking to build your dream home or invest in a commercial property, we have the expertise and resources to bring your vision to life.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Areas</h3>
              <div className="flex flex-wrap gap-2">
                {serviceAreas.map((area, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <CompanyStats />
      </motion.div>

      <div className="space-y-8">
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 text-green-800 mt-1 mr-3" />
              <div>
                <h3 className="font-medium">Address</h3>
                <p className="text-gray-600">
                  123 Construction Avenue, Malappuram, Kerala, India, 673639
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <PhoneIcon className="h-5 w-5 text-green-800 mt-1 mr-3" />
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-gray-600">+91 98765 43210</p>
              </div>
            </div>

            <div className="flex items-start">
              <EnvelopeIcon className="h-5 w-5 text-green-800 mt-1 mr-3" />
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-gray-600">info@simakconstructions.com</p>
              </div>
            </div>

            <div className="flex items-start">
              <GlobeAltIcon className="h-5 w-5 text-green-800 mt-1 mr-3" />
              <div>
                <h3 className="font-medium">Website</h3>
                <p className="text-blue-600 hover:underline">
                  <a href="https://www.simakconstructions.com">
                    www.simakconstructions.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Business Hours</h2>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Monday - Friday</span>
              <span className="font-medium">9:00 AM - 6:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Saturday</span>
              <span className="font-medium">9:00 AM - 1:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sunday</span>
              <span className="font-medium">Closed</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Key People</h2>

          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600 mr-3">
                RS
              </div>
              <div>
                <h3 className="font-medium">Rahul Singh</h3>
                <p className="text-gray-600 text-sm">Founder & CEO</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600 mr-3">
                AK
              </div>
              <div>
                <h3 className="font-medium">Arun Kumar</h3>
                <p className="text-gray-600 text-sm">Chief Architect</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600 mr-3">
                PR
              </div>
              <div>
                <h3 className="font-medium">Priya Raj</h3>
                <p className="text-gray-600 text-sm">Project Manager</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default CompanyOverview;
