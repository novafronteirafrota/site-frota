import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FleetAggregation } from '@/hooks/useFleet';
import { Link } from 'react-router-dom';
import { Gamepad2, DollarSign } from 'lucide-react';

interface ShipOwnersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fleetItem: FleetAggregation | null;
}

const ShipOwnersModal: React.FC<ShipOwnersModalProps> = ({
  open,
  onOpenChange,
  fleetItem,
}) => {
  if (!fleetItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-primary/50">
              {fleetItem.ship.photo_url ? (
                <img
                  src={fleetItem.ship.photo_url}
                  alt={fleetItem.ship.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-secondary" />
              )}
            </div>
            <div>
              <span className="text-primary">{fleetItem.ship.name}</span>
              <p className="text-sm text-muted-foreground font-body font-normal">
                Total na ORG: {fleetItem.totalQuantity}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          <h4 className="text-sm text-muted-foreground font-display tracking-wider mb-3">
            PROPRIETÁRIOS
          </h4>
          {fleetItem.owners.map((owner, index) => (
            <Link
              key={`${owner.profile.id}-${owner.acquisitionType}-${index}`}
              to={`/profile/${owner.profile.id}`}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <div className="relative">
                <img
                  src={owner.profile.photo_url || '/placeholder.svg'}
                  alt={owner.profile.display_name}
                  className="w-10 h-10 rounded-full border border-border group-hover:border-primary/50 transition-colors"
                />
                <div 
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${
                    owner.acquisitionType === 'hangar' 
                      ? 'bg-amber-500/90 text-amber-950' 
                      : 'bg-emerald-500/90 text-emerald-950'
                  }`}
                  title={owner.acquisitionType === 'hangar' ? 'Hangar da conta' : 'Comprada no jogo'}
                >
                  {owner.acquisitionType === 'hangar' ? (
                    <DollarSign className="w-3 h-3" />
                  ) : (
                    <Gamepad2 className="w-3 h-3" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {owner.profile.display_name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {owner.profile.role}
                </p>
              </div>
              <span className="text-primary font-display text-sm">
                x{owner.quantity}
              </span>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShipOwnersModal;
