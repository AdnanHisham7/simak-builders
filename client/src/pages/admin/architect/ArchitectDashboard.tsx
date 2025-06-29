import React, { useEffect, useState } from "react";
import { getSites, uploadDocument } from "@/services/siteService";
import { getCurrentUser, UserWithSalary } from "@/services/userService";
import {
  Building2,
  FileText,
  Upload,
  DollarSign,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Download,
  Activity,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  url: string;
  uploadedBy: { id: string; name: string };
  category: "client" | "site";
}

interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  documents: Document[];
}

const ArchitectDashboard: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [currentUser, setCurrentUser] = useState<UserWithSalary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesData, currentUserData] = await Promise.all([
          getSites(),
          getCurrentUser(),
        ]);
        setSites(sitesData);
        setCurrentUser(currentUserData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setIsAnimating(true), 100);
      }
    };
    fetchData();
  }, []);

  const handleUpload = async (
    siteId: string,
    file: File,
    category: "client" | "site"
  ) => {
    const uploadId = `${siteId}-${file.name}-${category}`;
    setUploadingFiles((prev) => new Set([...prev, uploadId]));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    try {
      await uploadDocument(siteId, formData);
      const updatedSites = await getSites();
      setSites(updatedSites);
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setUploadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-gray-700">
            Loading Dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600">
            Unable to load user information. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const myDocuments = sites
    .flatMap((site) => site.documents)
    .filter((doc) => doc.uploadedBy.id === currentUser._id)
    .sort(
      (a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

  const totalDocuments = sites.reduce(
    (total, site) => total + site.documents.length,
    0
  );
  const verifiedSalary =
    currentUser.salaryAssignments
      ?.filter((s) => s.isVerified)
      .reduce((sum, s) => sum + s.amount, 0) || 0;

  const tabs = [
    { id: "overview", name: "Overview", icon: Activity },
    { id: "sites", name: "Sites", icon: Building2 },
    { id: "documents", name: "Documents", icon: FileText },
    { id: "salary", name: "Salary", icon: DollarSign },
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div
      className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl overflow-hidden ${
        isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} rounded-t-2xl`}
      />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div
            className={`p-3 rounded-full bg-gradient-to-r ${color} bg-opacity-10`}
          >
            <Icon className="h-6 w-6 text-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );

  const SiteCard = ({ site }: any) => {
    const clientDocuments = site.documents
      .filter((doc: Document) => doc.category === "client")
      .sort(
        (a: Document, b: Document) =>
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
    const siteDocuments = site.documents
      .filter((doc: Document) => doc.category === "site")
      .sort(
        (a: Document, b: Document) =>
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );

    return (
      <div
        className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 transform hover:scale-102 hover:shadow-xl overflow-hidden ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {site.name}
                </h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {site.address}, {site.city}, {site.state} {site.zip}
                </div>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {site.documents.length} docs
            </span>
          </div>

          <div className="space-y-6">
            {/* Client Documentation */}
            <div>
              {/* Flex container for heading and upload button */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Client Documentation ({clientDocuments.length})
                </h4>
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUpload(site.id, e.target.files[0], "client");
                      }
                    }}
                  />
                  <div className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    <Upload className="h-4 w-4" />
                    <span>Upload Client Document</span>
                  </div>
                </label>
              </div>

              {/* Document list or message */}
              {clientDocuments.length === 0 ? (
                <p className="text-gray-500 text-sm mt-2">
                  No client documents uploaded yet
                </p>
              ) : (
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {clientDocuments.map((doc: Document) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <User className="h-3 w-3" />
                            <span>{doc.uploadedBy.name}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`${import.meta.env.VITE_API_URL}${doc.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Download className="h-4 w-4 text-gray-500" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Site Documentation */}
            <div>
              {/* Flex row: heading + upload button */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Site Documentation ({siteDocuments.length})
                </h4>
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUpload(site.id, e.target.files[0], "site");
                      }
                    }}
                  />
                  <div className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    <Upload className="h-4 w-4" />
                    <span>Upload Site Document</span>
                  </div>
                </label>
              </div>

              {/* Site documents list or empty message */}
              {siteDocuments.length === 0 ? (
                <p className="text-gray-500 text-sm mt-2">
                  No site documents uploaded yet
                </p>
              ) : (
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {siteDocuments.map((doc: Document) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <User className="h-3 w-3" />
                            <span>{doc.uploadedBy.name}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`${import.meta.env.VITE_API_URL}${doc.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Download className="h-4 w-4 text-gray-500" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div
        className={`bg-white shadow-sm border-b transition-all duration-500 ${
          isAnimating ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Architect Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {currentUser.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  ${currentUser.totalSalary?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-gray-500">Total Earnings</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div
          className={`mb-8 transition-all duration-700 delay-100 ${
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Sites"
                value={sites.length}
                icon={Building2}
                color="from-blue-500 to-cyan-500"
                subtitle="Active projects"
              />
              <StatCard
                title="Total Documents"
                value={totalDocuments}
                icon={FileText}
                color="from-purple-500 to-pink-500"
                subtitle="Across all sites"
              />
              <StatCard
                title="My Uploads"
                value={myDocuments.length}
                icon={Upload}
                color="from-green-500 to-emerald-500"
                subtitle="Documents uploaded"
              />
              <StatCard
                title="Verified Salary"
                value={`₹${verifiedSalary.toLocaleString()}`}
                icon={CheckCircle}
                color="from-yellow-500 to-orange-500"
                subtitle="Confirmed payments"
              />
            </div>

            {/* Recent Activity Preview */}
            <div
              className={`bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 delay-200 ${
                isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-t-2xl" />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {myDocuments.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded{" "}
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {myDocuments.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sites Tab */}
        {activeTab === "sites" && (
          <div className="space-y-6">
            {sites.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Sites Assigned
                </h3>
                <p className="text-gray-500">
                  You don't have any sites assigned yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sites.map((site) => (
                  <SiteCard key={site.id} site={site} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div
            className={`bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-t-2xl" />
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                My Uploaded Documents
              </h3>
              {myDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Documents Yet
                  </h4>
                  <p className="text-gray-500">
                    You haven't uploaded any documents yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}{" "}
                            <span className="text-xs text-gray-500">
                              ({doc.category})
                            </span>
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                            <span>
                              Site:{" "}
                              {
                                sites.find((s) =>
                                  s.documents.some((d) => d.id === doc.id)
                                )?.name
                              }
                            </span>
                            <span>
                              Uploaded{" "}
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_API_URL}${doc.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Salary Tab */}
        {activeTab === "salary" && (
          <div className="space-y-6">
            {/* Salary Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Salary"
                value={`₹${currentUser.totalSalary?.toLocaleString() || "0"}`}
                icon={DollarSign}
                color="from-green-500 to-emerald-500"
                subtitle="All time earnings"
              />
              <StatCard
                title="Verified Amount"
                value={`₹${verifiedSalary.toLocaleString()}`}
                icon={CheckCircle}
                color="from-blue-500 to-cyan-500"
                subtitle="Confirmed payments"
              />
              <StatCard
                title="Pending Verification"
                value={`₹${(
                  (currentUser.totalSalary || 0) - verifiedSalary
                ).toLocaleString()}`}
                icon={XCircle}
                color="from-yellow-500 to-orange-500"
                subtitle="Awaiting confirmation"
              />
            </div>

            {/* Salary Transactions */}
            <div
              className={`bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500 ${
                isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-t-2xl" />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Salary Transactions
                </h3>
                {!currentUser.salaryAssignments ||
                currentUser.salaryAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No Transactions Yet
                    </h4>
                    <p className="text-gray-500">
                      No salary transactions have been recorded.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentUser.salaryAssignments
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      .map((assignment) => (
                        <div
                          key={assignment._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-2 rounded-full ${
                                assignment.isVerified
                                  ? "bg-green-100"
                                  : "bg-yellow-100"
                              }`}
                            >
                              {assignment.isVerified ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-yellow-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                ${assignment.amount.toLocaleString()}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(
                                    assignment.date
                                  ).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {assignment.givenBy?.name || "auto"}
                                </div>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              assignment.isVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {assignment.isVerified ? "Verified" : "Pending"}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectDashboard;
