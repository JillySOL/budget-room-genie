import { SignIn, SignUp, UserButton, useUser } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";

export function ClerkAuth() {
  const location = useLocation();
  const { isSignedIn, user } = useUser();
  const from = location.state?.from?.pathname || "/";

  // Handle profile view
  if (location.pathname === '/profile') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Profile</h2>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Email</h3>
            <p className="text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700">Name</h3>
            <p className="text-gray-600">{user?.fullName || 'Not set'}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Account Created</h3>
            <p className="text-gray-600">
              {new Date(user?.createdAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle auth forms
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      {location.pathname === '/sign-up' ? (
        <SignUp 
          routing="path" 
          path="/sign-up"
          redirectUrl={from}
          afterSignUpUrl={from}
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-md",
              formButtonPrimary: "bg-primary hover:bg-primary/90",
            },
          }}
        />
      ) : (
        <SignIn 
          routing="path" 
          path="/sign-in"
          redirectUrl={from}
          afterSignInUrl={from}
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-md",
              formButtonPrimary: "bg-primary hover:bg-primary/90",
            },
          }}
        />
      )}
    </div>
  );
} 