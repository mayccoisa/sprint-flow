import { useState, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Task, Sprint, Release, Squad } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  type: 'sprint' | 'task' | 'release';
  data: Sprint | Task | Release;
  color: string;
}

export default function Calendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [showSprints, setShowSprints] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showReleases, setShowReleases] = useState(true);
  const [selectedSquad, setSelectedSquad] = useState<string>('all');
  
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [sprintsRes, tasksRes, releasesRes, squadsRes] = await Promise.all([
      supabase.from('sprints').select('*'),
      supabase.from('tasks').select('*').not('start_date', 'is', null),
      supabase.from('releases').select('*'),
      supabase.from('squads').select('*'),
    ]);

    if (sprintsRes.data) setSprints(sprintsRes.data);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (releasesRes.data) setReleases(releasesRes.data);
    if (squadsRes.data) setSquads(squadsRes.data);
  };

  const squadColors: Record<string, string> = {
    'Growth': '#3b82f6',
    'Platform': '#10b981',
    'Design System': '#8b5cf6',
  };

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];

    if (showSprints) {
      sprints.forEach((sprint) => {
        if (selectedSquad !== 'all') {
          const squad = squads.find(s => s.id === sprint.squad_id);
          if (!squad || squad.name !== selectedSquad) return;
        }
        
        const squad = squads.find(s => s.id === sprint.squad_id);
        result.push({
          id: sprint.id,
          title: `🏃 ${sprint.name}`,
          start: new Date(sprint.start_date),
          end: new Date(sprint.end_date),
          type: 'sprint',
          data: sprint,
          color: squad ? (squadColors[squad.name] || '#6366f1') : '#6366f1',
        });
      });
    }

    if (showTasks) {
      tasks.forEach((task) => {
        if (!task.start_date) return;
        
        const taskColors: Record<string, string> = {
          'Feature': '#3b82f6',
          'Bug': '#ef4444',
          'TechDebt': '#f59e0b',
          'Spike': '#8b5cf6',
        };
        
        const statusIcons: Record<string, string> = {
          'InSprint': '⏳',
          'Done': '✓',
          'Backlog': '📋',
        };

        result.push({
          id: task.id,
          title: `${statusIcons[task.status] || ''} ${task.title}`,
          start: new Date(task.start_date),
          end: task.end_date ? new Date(task.end_date) : new Date(task.start_date),
          type: 'task',
          data: task,
          color: taskColors[task.task_type] || '#6366f1',
        });
      });
    }

    if (showReleases) {
      releases.forEach((release) => {
        if (selectedSquad !== 'all' && release.squad_id) {
          const squad = squads.find(s => s.id === release.squad_id);
          if (!squad || squad.name !== selectedSquad) return;
        }

        const statusIcons: Record<string, string> = {
          'Planned': '📋',
          'InProgress': '🚀',
          'Released': '✅',
          'Cancelled': '❌',
        };

        result.push({
          id: release.id,
          title: `${statusIcons[release.status]} ${release.version_name}`,
          start: new Date(release.release_date),
          end: new Date(release.release_date),
          type: 'release',
          data: release,
          color: release.color || '#6366f1',
        });
      });
    }

    return result;
  }, [sprints, tasks, releases, squads, showSprints, showTasks, showReleases, selectedSquad]);

  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="cursor-pointer h-full">
            <span className="text-xs">{event.title}</span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          {event.type === 'sprint' && (
            <div className="space-y-2">
              <h4 className="font-semibold">{(event.data as Sprint).name}</h4>
              <div className="text-sm space-y-1">
                <p>Período: {moment((event.data as Sprint).start_date).format('DD/MM')} - {moment((event.data as Sprint).end_date).format('DD/MM')}</p>
                <Badge>{(event.data as Sprint).status}</Badge>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate(`/sprints/${event.id}/planning`)}
              >
                Ver Sprint
              </Button>
            </div>
          )}
          {event.type === 'task' && (
            <div className="space-y-2">
              <h4 className="font-semibold">{(event.data as Task).title}</h4>
              <div className="text-sm space-y-1">
                <p>{(event.data as Task).description}</p>
                <Badge>{(event.data as Task).task_type}</Badge>
                <Badge variant="outline">{(event.data as Task).priority}</Badge>
              </div>
            </div>
          )}
          {event.type === 'release' && (
            <div className="space-y-2">
              <h4 className="font-semibold">{(event.data as Release).version_name}</h4>
              <div className="text-sm space-y-1">
                <p>{(event.data as Release).description}</p>
                <p>Data: {moment((event.data as Release).release_date).format('DD/MM/YYYY')}</p>
                <Badge>{(event.data as Release).status}</Badge>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate(`/releases/${event.id}`)}
              >
                Ver Detalhes
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">📅 Calendário</h1>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sprints" 
                checked={showSprints}
                onCheckedChange={(checked) => setShowSprints(checked as boolean)}
              />
              <Label htmlFor="sprints">Sprints</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="tasks" 
                checked={showTasks}
                onCheckedChange={(checked) => setShowTasks(checked as boolean)}
              />
              <Label htmlFor="tasks">Tarefas</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="releases" 
                checked={showReleases}
                onCheckedChange={(checked) => setShowReleases(checked as boolean)}
              />
              <Label htmlFor="releases">Releases</Label>
            </div>
          </div>

          <Select value={selectedSquad} onValueChange={setSelectedSquad}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os squads" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os squads</SelectItem>
              {squads.map((squad) => (
                <SelectItem key={squad.id} value={squad.name}>
                  {squad.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-lg border p-4" style={{ height: '700px' }}>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            components={{
              event: EventComponent,
            }}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.color,
                borderRadius: '4px',
                opacity: event.type === 'sprint' ? 0.8 : 1,
                border: 'none',
              },
            })}
          />
        </div>
      </div>
    </Layout>
  );
}
