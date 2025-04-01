import { UserButton, useUser } from "@clerk/clerk-react";

export const UserProfile = () => {
  const { user } = useUser();

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