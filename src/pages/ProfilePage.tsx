import { useAuth, useUser, SignOutButton, useClerk } from "@clerk/clerk-react";
import { LogOut, Settings, CreditCard, User } from "lucide-react";

export default function ProfilePage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { openUserProfile } = useClerk();

  if (!isSignedIn || !user) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with user info */}
        <div className="p-6 bg-gradient-to-r from-budget-accent to-budget-accent-dark">
          <div className="flex items-center gap-4">
            <img
              src={user.imageUrl}
              alt={user.fullName || "Profile picture"}
              className="w-20 h-20 rounded-full border-4 border-white shadow-md"
            />
            <div className="text-white">
              <h1 className="text-2xl font-bold">{user.fullName || "User"}</h1>
              <p className="text-budget-accent-light">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>

        {/* Profile sections */}
        <div className="p-6 space-y-6">
          {/* Account Settings */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-budget-accent" />
              Account Settings
            </h2>
            <div className="grid gap-4">
              <button 
                onClick={() => openUserProfile()}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">Manage Account</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              
              <button 
                onClick={() => window.location.href = "/subscription"}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">Subscription Settings</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <div className="pt-4 border-t border-gray-200">
            <SignOutButton>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  );
} 