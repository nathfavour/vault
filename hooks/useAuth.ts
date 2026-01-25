import { useAppwrite } from '@/app/appwrite-provider';

export const useAuth = () => {
    const { user, loading, isAuthenticated, openIDMWindow, logout } = useAppwrite();

    return {
        user,
        isLoading: loading,
        isAuthenticated,
        login: openIDMWindow,
        logout
    };
};
