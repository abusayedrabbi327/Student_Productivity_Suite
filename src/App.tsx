import { AppContainer } from './components/AppContainer';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <AppContainer />
      </div>
    </AuthProvider>
  );
}
