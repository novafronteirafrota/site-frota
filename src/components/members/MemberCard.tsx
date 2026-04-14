import React from 'react';
import { Link } from 'react-router-dom';
import { ProfileWithRole } from '@/hooks/useProfiles';
import { cn } from '@/lib/utils';
import { Shield, Star, User as UserIcon } from 'lucide-react';

interface MemberCardProps {
  member: ProfileWithRole;
  className?: string;
}

const roleIcons = {
  admin: Shield,
  moderator: Star,
  member: UserIcon,
};

const roleLabels = {
  admin: 'Administrador',
  moderator: 'Moderador',
  member: 'Membro',
};

const MemberCard: React.FC<MemberCardProps> = ({ member, className }) => {
  const RoleIcon = roleIcons[member.role];

  return (
    <Link
      to={`/profile/${member.id}`}
      className={cn(
        'glass-card-hover rounded-lg p-4 flex flex-col items-center text-center group',
        className
      )}
    >
      <div className="relative">
        <img
          src={member.photo_url || '/placeholder.svg'}
          alt={member.display_name}
          className="w-20 h-20 rounded-full border-2 border-border group-hover:border-primary transition-colors object-cover"
        />
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
          <RoleIcon className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>

      <h3 className="mt-4 font-display text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-full">
        {member.display_name}
      </h3>
      <p className="text-xs text-muted-foreground mt-1">
        {roleLabels[member.role]}
      </p>
    </Link>
  );
};

export default MemberCard;
