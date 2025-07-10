// // src/components/AuthWrapper.tsx
// 'use client';

// import { useSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import { useEffect, useState } from 'react';

// export default function AuthWrapper({ 
//   children,
//   requiredRole = null 
// }: {
//   children: React.ReactNode;
//   requiredRole?: string | null;
// }) {
//   const { data: session, status } = useSession();
//   const router = useRouter();
//   const [isAuthorized, setIsAuthorized] = useState(false);

//   useEffect(() => {
//     if (status === 'unauthenticated') {
//       // Redirect to signin with callback URL
//       router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
//       return;
//     }

//     if (status === 'authenticated') {
//       // Check for required role if specified
//       if (requiredRole && !session.user.roles?.includes(requiredRole)) {
//         router.push('/unauthorized');
//         return;
//       }
//       setIsAuthorized(true);
//     }
//   }, [status, session, requiredRole, router]);

//   if (status === 'loading' || !isAuthorized) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
//           <p className="mt-4 text-lg">Verifying authentication...</p>
//         </div>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }