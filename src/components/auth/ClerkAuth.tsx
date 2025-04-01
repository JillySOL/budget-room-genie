import { SignIn, SignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { Appearance } from '@clerk/types';
import React from 'react';

// Development mode warning component
const DevelopmentModeWarning = () => (
  <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium group">
    <AlertCircle className="h-4 w-4" />
    Development Mode
    <div className="absolute invisible group-hover:visible bg-white border border-gray-200 shadow-lg rounded-md p-2 text-xs w-48 top-full mt-1 right-0 z-10">
      This is a non-production environment for testing purposes only.
    </div>
  </div>
);

// Shared Appearance configuration
const appearance: Appearance = {
  baseTheme: undefined, // Use default theme as base
  variables: {
    colorPrimary: '#FF6B35',
    colorDanger: '#FF4444',
    colorSuccess: '#32D583',
    colorWarning: '#FFB224',
    colorTextOnPrimaryBackground: '#FFFFFF',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#F9FAFB',
    colorInputText: '#1F2937',
    colorTextSecondary: '#6B7280',
    borderRadius: '0.75rem',
    fontFamily: 'inherit',
    fontFamilyButtons: 'inherit',
    fontSize: '16px',
  },
  elements: {
    card: {
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      border: '1px solid #E5E7EB',
      borderRadius: '1rem',
      margin: '0 auto',
      padding: '2rem',
      width: '100%',
    },
    socialButtonsIconButton: {
      height: '2.75rem',
      border: '1px solid #E5E7EB',
      borderRadius: '0.5rem',
      marginBottom: '0.5rem',
      backgroundColor: '#FFFFFF',
      '&:hover': {
        backgroundColor: '#F9FAFB',
      },
    },
    socialButtonsBlockButton: {
      width: '100%',
      height: '2.75rem',
      border: '1px solid #E5E7EB',
      borderRadius: '0.5rem',
      marginBottom: '0.5rem',
      backgroundColor: '#FFFFFF',
      padding: '0 0.75rem',
      '&:hover': {
        backgroundColor: '#F9FAFB',
      },
    },
    formButtonPrimary: {
      backgroundColor: '#FF6B35',
      '&:hover': {
        backgroundColor: '#E85A2C',
      },
      height: '2.75rem',
      borderRadius: '0.5rem',
    },
    formFieldInput: {
      borderRadius: '0.5rem',
      border: '1px solid #E5E7EB',
      '&:focus': {
        borderColor: '#FF6B35',
        boxShadow: '0 0 0 3px rgba(255, 107, 53, 0.1)',
      },
    },
    footerActionLink: {
      color: '#FF6B35',
      '&:hover': {
        color: '#E85A2C',
      },
    },
    dividerLine: {
      backgroundColor: '#E5E7EB',
    },
    dividerText: {
      color: '#6B7280',
    },
    headerTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1F2937',
    },
    headerSubtitle: {
      fontSize: '1rem',
      color: '#6B7280',
    },
  },
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'iconButton',
    showOptionalFields: false,
  },
};

// Reusable Layout Component for Auth Screens
interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 relative">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      
      {/* Header with Back Button and Dev Warning */}
      <div className="w-full max-w-md mb-8 flex items-center justify-between absolute top-4 left-1/2 transform -translate-x-1/2 px-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors relative z-10"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="relative">
          <DevelopmentModeWarning />
        </div>
      </div>

      {/* Clerk Component (SignIn or SignUp) */}
      <main className="w-full max-w-md z-10">
         {children}
      </main>
    </div>
  );
};

// Sign In Component using AuthLayout
export const ClerkAuth = () => {
  return (
    <AuthLayout>
      <SignIn 
        appearance={appearance}
        afterSignInUrl="/"
        afterSignUpUrl="/"
        signUpUrl="/sign-up"
      />
    </AuthLayout>
  );
};

// Sign Up Component using AuthLayout
export const ClerkSignUp = () => {
  return (
    <AuthLayout>
      <SignUp 
        appearance={appearance}
        afterSignUpUrl="/"
        afterSignInUrl="/"
        signInUrl="/sign-in"
      />
    </AuthLayout>
  );
};

/* 
Note on Content Customization:
To change text like "Sign in to RenoMate", "Welcome back!", etc., 
use the Clerk Dashboard under Customization > Localization.
*/ 