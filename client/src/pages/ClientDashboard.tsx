// File: src/pages/BuilderDashboard.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Grid } from "lucide-react";
import Card from "./Dashboard/Card";
import ProgressBar from "./Dashboard/ProgressBar";
import StatCard from "./Dashboard/StatCard";
import ProjectCard from "./Dashboard/ProjectCard";
import LeadCard from "./Dashboard/LeadCard";
import PageHeader from "./Dashboard/PageHeader";
import LineChart from "./Dashboard/LineChart";

interface Project {
  id: number;
  title: string;
  description: string;
  status: "In Progress" | "pending" | "completed";
  updated: string;
}

interface Lead {
  id: number;
  title: string;
  client: string;
  time: string;
  budget: string;
}

interface StatData {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}

type ChartData = {
  label: string;
  value: number;
};

const chartData: ChartData[] = [
  { label: "Apr", value: 65 },
  { label: "May", value: 75 },
  { label: "Jun", value: 90 },
  { label: "Jul", value: 100 },
  { label: "Aug", value: 85 },
  { label: "Sep", value: 70 },
  { label: "Oct", value: 80 },
  { label: "Nov", value: 60 },
  { label: "Dec", value: 90 },
];

export default function ClientDashboard() {
  const [profileCompletion, setProfileCompletion] = useState<number>(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfileCompletion(75);
      setProjects([
        {
          id: 1,
          title: "Modern Kitchen Renovation",
          description: "Residential Renovation - Elite Builders",
          status: "In Progress",
          updated: "Updated 2 days ago",
        },
        {
          id: 2,
          title: "Bathroom Remodelling",
          description: "Residential Renovation",
          status: "pending",
          updated: "Updated 2 days ago",
        },
        {
          id: 3,
          title: "Deck Construction",
          description: "Residential Renovation - Elite Builders",
          status: "completed",
          updated: "Updated 2 days ago",
        },
      ]);

      setLeads([
        {
          id: 1,
          title: "Bathroom Remodel",
          client: "Adnan Hashmi",
          time: "2 days ago",
          budget: "₹92,000 - ₹1,50,000",
        },
        {
          id: 2,
          title: "Bathroom Remodel",
          client: "Adnan Hashmi",
          time: "2 days ago",
          budget: "₹92,000 - ₹1,50,000",
        },
      ]);

      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const statsData: StatData[] = [
    {
      title: "Active Projects",
      value: "18",
      subtitle: "10 active",
      icon: Grid,
    },
    { title: "New Leads", value: "2", subtitle: "For 1 project", icon: Grid },
    {
      title: "Monthly Revenue",
      value: "₹240,000",
      subtitle: "12% hike from last month",
      icon: Grid,
    },
    {
      title: "Unread Messages",
      value: "18",
      subtitle: "Across all projects",
      icon: Grid,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
        </div>
      ) : (
        <>
          <PageHeader
            title="Client Dashboard"
            description="Overview of your leads and projects"
            buttons={[
              { name: "New Lead", path: "/project-leads" },
              { name: "My Projects", path: "/my-projects" },
            ]}
          />

          {/* Profile Completion */}
          <Card>
            <div className="flex justify-between mb-2">
              <h3 className="font-medium">Profile Completion</h3>
              <div className="text-green-500 text-sm hover:cursor-pointer">
                Complete profile
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{profileCompletion}% complete</span>
                <span>3 items Remaining</span>
              </div>
              <ProgressBar percentage={profileCompletion} />
            </div>
            <p className="text-sm text-gray-500">
              Complete your profile to improve visibility and get more leads.
            </p>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsData.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
              />
            ))}
          </div>

          {/* Performance Chart */}
          <LineChart data={chartData} />

          {/* Project Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Projects */}
            <Card>
              <h3 className="font-medium mb-4">Active Projects</h3>
              <div className="space-y-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </Card>

            {/* New Project Leads */}
            <Card>
              <h3 className="font-medium mb-4">New Project Leads</h3>
              <div className="space-y-4">
                {leads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}

                <div className="flex justify-center mt-6">
                  <motion.button
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View All Leads
                  </motion.button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </motion.div>
  );
}
