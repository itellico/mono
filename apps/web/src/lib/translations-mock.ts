// Temporary mock for translations until we properly set up next-intl

export function useTranslations(namespace?: string) {
  return (key: string, values?: any) => {
    // Return the key as fallback for now
    // Later we can add actual translations here
    const translations: Record<string, Record<string, string>> = {
      auth: {
        welcomeBack: "Welcome Back",
        signInToAccount: "Sign in to your account",
        email: "Email",
        password: "Password",
        signIn: "Sign In",
        signUp: "Sign up",
        continueWithGoogle: "Continue with Google",
        orContinueWithEmail: "Or continue with email",
        emailPlaceholder: "Enter your email",
        passwordPlaceholder: "Enter your password",
        dontHaveAccount: "Don't have an account?",
        invalidCredentials: "Invalid credentials",
      },
      dashboard: {
        welcomeMessage: "Welcome to itellico Mono",
        needHelp: "Need Help?",
        helpDescription: "If you have any questions or need assistance, our support team is here to help.",
      },
      common: {
        loading: "Loading...",
        error: "Error",
        success: "Success",
        cancel: "Cancel",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        create: "Create",
        update: "Update",
        search: "Search",
        filter: "Filter",
        export: "Export",
        import: "Import",
        actions: "Actions",
        status: "Status",
        name: "Name",
        email: "Email",
        date: "Date",
        description: "Description",
      },
      'admin-common': {
        navigation: {
          dashboard: "Dashboard",
          users: "Users",
          tenants: "Tenants",
          settings: "Settings",
          preferences: "Preferences",
        },
        actions: {
          export: "Export",
          addUser: "Add User",
        },
        permissions: {
          accessDenied: "Access denied",
        },
      },
    };

    const namespaceTranslations = namespace ? translations[namespace] : {};
    const translation = namespaceTranslations[key] || key;
    
    // Simple value replacement
    if (values) {
      return Object.entries(values).reduce((str, [k, v]) => {
        return str.replace(`{${k}}`, String(v));
      }, translation);
    }
    
    return translation;
  };
}

export async function getTranslations(namespace?: string) {
  return useTranslations(namespace);
}