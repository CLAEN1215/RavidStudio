import type { Metadata } from 'next';
import { StudioWorkspace } from '@/components/studio/StudioWorkspace';

export const metadata: Metadata = {
  title: 'RavidStudio — Reference-Matched Etsy Product Photography',
  description:
    'Automated supplier photography transformation pipeline matching existing Etsy listing visual standards.',
};

export default function StudioPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <StudioWorkspace />
    </div>
  );
}
