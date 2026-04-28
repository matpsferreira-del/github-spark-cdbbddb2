import { useUser, useClerk } from '@clerk/clerk-react';

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const mappedUser = user
    ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? '',
        user_metadata: {
          name: user.fullName ?? user.firstName ?? '',
          must_change_password: false,
        },
      }
    : null;

  return {
    user: mappedUser,
    session: user ? { user: mappedUser } : null,
    loading: !isLoaded,
    isAuthenticated: !!user,
    signIn: async (_email: string, _password: string) => ({ error: null, data: null }),
    signUp: async (_email: string, _password: string, _name?: string) => ({ error: null, data: null }),
    signOut: async () => {
      await clerkSignOut();
      return { error: null };
    },
  };
}
