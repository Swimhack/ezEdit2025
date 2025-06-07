import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PasswordReset from './pages/PasswordReset';
import VerifyEmail from './pages/VerifyEmail';
import ScreenshotDemo from './pages/ScreenshotDemo';
import { Suspense, Component, type ReactNode, useEffect, useState } from 'react';
import { Loader2, AlertTriangle, RefreshCw, Home as HomeIcon } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { ThemeProvider } from './components/ui/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/toast';

// Error boundary component
const ErrorFallback = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <Card className="w-[350px] shadow-lg border-red-200">
      <CardHeader>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-center text-2xl font-bold text-red-600">Something went wrong</CardTitle>
        <CardDescription className="text-center">There was an error loading the application.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={() => window.location.reload()} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" /> Reload page
        </Button>
      </CardContent>
    </Card>
  </div>
);

// Error Boundary Wrapper
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundaryWrapper extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Debug fallback component to help diagnose routing issues
const DebugFallback = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <Card className="text-center max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">EzEdit Debug Page</CardTitle>
        <CardDescription>This is a fallback route to help diagnose rendering issues.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded mb-4 text-left overflow-auto max-h-48">
          <p className="font-mono text-sm">Time: {new Date().toISOString()}</p>
          <p className="font-mono text-sm">Path: {window.location.pathname + window.location.hash}</p>
          <p className="font-mono text-sm">User Agent: {navigator.userAgent}</p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3 justify-center">
        <Button variant="primary" onClick={() => window.location.href = '/#/'}>
          <HomeIcon className="mr-2 h-4 w-4" /> Go Home
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Reload
        </Button>
      </CardFooter>
    </Card>
  </div>
);

// Protected route wrapper component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const navigate = (path: string) => {
    window.location.hash = path;
  };

  useEffect(() => {
    if (!loading && !user) {
      setRedirecting(true);
      setTimeout(() => navigate('/login'), 100);
    }
  }, [user, loading]);

  if (loading) return <Loading />;
  if (redirecting) return <Loading />;
  return <>{children}</>;
};

export default function AppRouter() {
  console.log('AppRouter rendering - ' + new Date().toISOString());
  return (
    <HashRouter>
      <ThemeProvider defaultTheme="system" storageKey="ezedit-theme">
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background">
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password" element={<PasswordReset />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ErrorBoundaryWrapper>
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      </ErrorBoundaryWrapper>
                    } 
                  />
                  <Route 
                    path="/explorer/:id" 
                    element={
                      <ErrorBoundaryWrapper>
                        <ProtectedRoute>
                          <Explorer />
                        </ProtectedRoute>
                      </ErrorBoundaryWrapper>
                    } 
                  />
                  <Route 
                    path="/screenshot-demo" 
                    element={
                      <ErrorBoundaryWrapper>
                        <ProtectedRoute>
                          <ScreenshotDemo />
                        </ProtectedRoute>
                      </ErrorBoundaryWrapper>
                    } 
                  />
                  {/* Fallback route that shows debug info instead of silent redirect */}
                  <Route path="*" element={<DebugFallback />} />
                </Routes>
              </Suspense>
            </div>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

// The class-based ErrorBoundaryWrapper defined above is used instead