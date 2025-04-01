
import { UserButton, useUser } from "@clerk/clerk-react";

export const UserProfile = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="animate-pulse h-8 w-32 bg-gray-200 rounded-md"></div>;
  }

  return (
    <div className="flex items-center space-x-4">
      <UserButton afterSignOutUrl="/sign-in" />
      {user && (
        <div>
          <p className="text-sm font-medium">{user.fullName || user.primaryEmailAddress?.emailAddress}</p>
        </div>
      )}
    </div>
  );
}; 
