import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Skills } from './pages/Skills';
import { Configuration } from './pages/Configuration';
import { Integrations } from './pages/Integrations';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="chat" element={<Chat />} />
        <Route path="skills" element={<Skills />} />
        <Route path="configuration" element={<Configuration />} />
        <Route path="integrations" element={<Integrations />} />
      </Route>
    </Routes>
  );
}
