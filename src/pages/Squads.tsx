import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocalData } from '@/hooks/useLocalData';
import { Badge } from '@/components/ui/badge';

export default function Squads() {
  const { data, addSquad } = useLocalData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSquad({
      name,
      description: description || null,
      status: 'Active',
    });
    setName('');
    setDescription('');
    setOpen(false);
  };

  const getMemberCount = (squadId: number) => {
    return data.members.filter(m => m.squad_id === squadId && m.status === 'Active').length;
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Squads</h1>
          <p className="mt-2 text-muted-foreground">Manage your development teams</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Squad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Squad</DialogTitle>
                <DialogDescription>Add a new development team to your organization.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Squad Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Growth Team"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this squad focus on?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Squad</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.squads.map((squad) => (
          <Card key={squad.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle>{squad.name}</CardTitle>
                  <CardDescription>{squad.description || 'No description'}</CardDescription>
                </div>
                <Badge variant={squad.status === 'Active' ? 'default' : 'secondary'}>
                  {squad.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {getMemberCount(squad.id)} active members
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.squads.length === 0 && (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">No squads yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Get started by creating your first squad.</p>
            <Button className="mt-4" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Squad
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
