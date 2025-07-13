import { SignoutManager } from '@/lib/auth/signout-manager';

export const useSignout = () => {
  const quickSignOut = async () => {
    await SignoutManager.quickSignOut();
  };

  const adminSignOut = async () => {
    await SignoutManager.adminSignOut();
  };

  return {
    quickSignOut,
    adminSignOut,
  };
};
