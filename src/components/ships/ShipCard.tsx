import React from 'react';
import { Ship } from '@/hooks/useShips';
import { AcquisitionType } from '@/hooks/useFleet';
import { cn } from '@/lib/utils';
import { Gamepad2, DollarSign } from 'lucide-react';

interface ShipCardProps {
  ship: Ship;
  quantity: number;
  acquisitionType?: AcquisitionType;
  onClick?: () => void;
  className?: string;
}

const ShipCard: React.FC<ShipCardProps> = ({ ship, quantity, acquisitionType, onClick, className }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card-hover rounded-lg overflow-hidden cursor-pointer group',
        className
      )}
    >
      <div className="aspect-square relative overflow-hidden">
        {ship.photo_url ? (
          <img
            src={ship.photo_url}
            alt={ship.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-muted-foreground font-display text-sm">NO IMAGE</span>
          </div>
        )}
        
        {/* Acquisition Type Badge */}
        {acquisitionType && (
          <div 
            className={cn(
              "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg",
              acquisitionType === 'hangar' 
                ? "bg-amber-500/90 text-amber-950" 
                : "bg-emerald-500/90 text-emerald-950"
            )}
            title={acquisitionType === 'hangar' ? 'Hangar da conta' : 'Comprada no jogo'}
          >
            {acquisitionType === 'hangar' ? (
              <DollarSign className="w-3.5 h-3.5" />
            ) : (
              <Gamepad2 className="w-3.5 h-3.5" />
            )}
          </div>
        )}
        
        {/* Quantity Badge */}
        <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground font-display text-sm shadow-neon">
          x{quantity}
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-4">
        <h3 className="font-display text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {ship.name}
        </h3>
        {ship.manufacturer && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {ship.manufacturer}
          </p>
        )}
      </div>
    </div>
  );
};

export default ShipCard;