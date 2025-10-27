import { Edit, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Squad } from '@/types';

interface SquadCardProps {
  squad: Squad;
  memberCount: number;
  onEdit: () => void;
}

export const SquadCard = ({ squad, memberCount, onEdit }: SquadCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <CardTitle className="flex items-center gap-2">
              {squad.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              {squad.description || 'No description'}
            </CardDescription>
          </div>
          <Badge variant={squad.status === 'Active' ? 'default' : 'secondary'}>
            {squad.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {memberCount} active {memberCount === 1 ? 'member' : 'members'}
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/squads/${squad.id}/members`)}
        >
          <Users className="mr-2 h-4 w-4" />
          Manage Members
        </Button>
      </CardContent>
    </Card>
  );
};
