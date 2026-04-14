import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'card' | 'list';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onChange, className }) => {
  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-lg bg-secondary', className)}>
      <Button
        variant={view === 'card' ? 'default' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange('card')}
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange('list')}
      >
        <List className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;
