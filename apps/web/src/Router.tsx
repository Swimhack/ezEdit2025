import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import Home from './pages/Home';
import { Suspense, Component, type ReactNode } from 'react';

// Error boundary component
const ErrorFallback = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="text-center p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-gray-700 mb-4">There was an error loading the application.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        Reload page
      </button>
    </div>
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
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-700">Loading...</p>
    </div>
  </div>
);

export default function AppRouter() {
  console.log('AppRouter rendering');
  return (
    <HashRouter>
      <div className="app-container">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route 
              path="/dashboard" 
              element={
                <ErrorBoundaryWrapper>
                  <Dashboard />
                </ErrorBoundaryWrapper>
              } 
            />
            <Route 
              path="/explorer/:id" 
              element={
                <ErrorBoundaryWrapper>
                  <Explorer />
                </ErrorBoundaryWrapper>
              } 
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </HashRouter>
  );
}

// The class-based ErrorBoundaryWrapper defined above is used instead