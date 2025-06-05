import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import Home from './pages/Home';
import Login from './pages/Login';
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

// Debug fallback component to help diagnose routing issues
const DebugFallback = () => (
  <div className="flex items-center justify-center h-screen bg-blue-50">
    <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">EzEdit Debug Page</h2>
      <p className="text-gray-700 mb-4">This is a fallback route to help diagnose rendering issues.</p>
      <div className="bg-gray-100 p-4 rounded mb-4 text-left overflow-auto max-h-48">
        <p className="font-mono text-sm">Time: {new Date().toISOString()}</p>
        <p className="font-mono text-sm">Path: {window.location.pathname + window.location.hash}</p>
        <p className="font-mono text-sm">User Agent: {navigator.userAgent}</p>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => window.location.href = '/#/'} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Go Home</button>
        <button onClick={() => window.location.reload()} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">Reload</button>
      </div>
    </div>
  </div>
);

export default function AppRouter() {
  console.log('AppRouter rendering - ' + new Date().toISOString());
  return (
    <HashRouter>
      <div className="app-container">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
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
            {/* Fallback route that shows debug info instead of silent redirect */}
            <Route path="*" element={<DebugFallback />} />
          </Routes>
        </Suspense>
      </div>
    </HashRouter>
  );
}

// The class-based ErrorBoundaryWrapper defined above is used instead