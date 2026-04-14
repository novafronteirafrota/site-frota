import React from 'react';
import { Ship } from '@/hooks/useShips';
import { AcquisitionType } from '@/hooks/useFleet';
import { cn } from '@/lib/utils';
import { Gamepad2, DollarSign } from 'lucide-react';

interface ShipListItemProps {
  ship: Ship;
  quantity: number;
  acquisitionType?: AcquisitionType;
  onClick?: () => void;
  className?: string;
}

const ShipListItem: React.FC<ShipListItemProps> = ({ ship, quantity, acquisitionType, onClick, className }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card-hover rounded-lg p-3 flex items-center gap-4 cursor-pointer group',
        className
      )}
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-border relative">
        {ship.photo_url ? (
          <img
            src={ship.photo_url}
            alt={ship.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-muted-foreground text-xs">N/A</span>
          </div>
        )}
        
        {/* Acquisition Type Badge */}
        {acquisitionType && (
          <div 
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg",
              acquisitionType === 'hangar' 
                ? "bg-amber-500/90 text-amber-950" 
                : "bg-emerald-500/90 text-emerald-950"
            )}
            title={acquisitionType === 'hangar' ? 'Hangar da conta' : 'Comprada no jogo'}
          >
            {acquisitionType === 'hangar' ? (
              <DollarSign className="w-3 h-3" />
            ) : (
              <Gamepad2 className="w-3 h-3" />
            )}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {ship.name}
        </h3>
        {ship.manufacturer && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {ship.manufacturer}
          </p>
        )}
      </div>
      
      <div className="px-3 py-1 rounded-full bg-primary/20 text-primary font-display text-sm border border-primary/50">
        x{quantity}
      </div>
    </div>
  );
};

export default ShipListItem;