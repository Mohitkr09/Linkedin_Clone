import React from "react";

export default function Jobs() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="bg-gray-50 min-h-screen flex justify-center pt-20 px-6">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* ================= LEFT PROFILE CARD ================= */}
        <div className="md:col-span-1">
          <div className="bg-white border shadow rounded-xl p-5">
            <div className="flex flex-col items-center">
              <img
                src={
                  user?.avatar ||
                  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                }
                alt="user"
                className="w-20 h-20 rounded-full border object-cover"
              />

              <h2 className="text-lg font-semibold mt-3">{user?.name}</h2>

              <p className="text-sm text-gray-600 text-center">
                {user?.headline || "MERN Developer | DSA Practitioner"}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {user?.location || "Unknown location"}
              </p>

              {user?.college && (
                <p className="text-xs font-medium text-[#0A66C2] mt-2 text-center">
                  {user?.college}
                </p>
              )}
            </div>
          </div>

          {/* Preferences + My jobs + Post job */}
          <div className="bg-white border shadow rounded-xl p-5 mt-4 space-y-4 text-sm font-medium">
            <p>Preferences</p>
            <p>My jobs</p>
            <button className="text-[#0A66C2] text-left hover:underline">
              Post a free job
            </button>
          </div>
        </div>

        {/* ================= MAIN JOB CONTENT ================= */}
        <div className="md:col-span-3 space-y-6">

          {/* Top Picks Section */}
          <div className="bg-white border shadow rounded-xl p-5">
            <h2 className="text-xl font-semibold">Top job picks for you</h2>
            <p className="text-gray-600 text-sm mt-1">
              Based on your profile, preferences, and activity like applies, searches, and saves
            </p>

            <div className="h-20 flex items-center justify-center text-gray-500 text-sm">
              🔄 Loading personalized job suggestions...
            </div>

            <button className="mt-2 text-sm text-[#0A66C2] hover:underline">
              Show all
            </button>
          </div>

          {/* Jobs where you're more likely to hear back */}
          <div className="bg-white border shadow rounded-xl p-5">
            <h2 className="text-xl font-semibold">
              Jobs where you're more likely to hear back
            </h2>
            <p className="text-gray-600 text-sm">
              Based on your chances of hearing back
            </p>

            <div className="flex items-center gap-4 mt-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div>
                <p className="text-gray-800 font-medium">
                  Apply smarter with jobs personalized for you
                </p>
                <p className="text-gray-500 text-sm">
                  {user?.name?.split(" ")[0]} and millions of members use Premium
                </p>
              </div>
            </div>

            <button className="mt-4 bg-yellow-400 hover:bg-yellow-500 transition px-4 py-1.5 rounded-full text-sm font-medium">
              Try Premium for ₹0
            </button>

            <p className="text-xs text-gray-500 mt-2">
              Cancel anytime, hassle-free. We'll remind you 7 days before your trial ends.
            </p>

            <button className="mt-3 text-sm text-[#0A66C2] hover:underline">
              Show all
            </button>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="w-full text-center text-xs text-gray-500 mt-10 space-x-4 pb-10">
        <span>About</span>
        <span>Accessibility</span>
        <span>Help Center</span>
        <span>Privacy & Terms</span>
        <span>Ad Choices</span>
        <span>Advertising</span>
        <span>Business Services</span>
        <span>Get the LinkedIn app</span>
        <span>More</span>
        <p className="mt-3">LinkedIn Corporation © 2025</p>
      </footer>
    </div>
  );
}
