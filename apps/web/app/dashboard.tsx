import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { FileBrowser } from '@/components/app/FileBrowser';
import { EditorPane } from '@/components/app/EditorPane';
import { AIDrawer } from '@/components/app/AIDrawer';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <FileBrowser />
      <EditorPane />
      <AIDrawer />
    </DashboardLayout>
  );
} 