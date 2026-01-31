import { useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType,
    Position,
    ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre'; // For auto-layout
import { useLocalData } from '@/hooks/useLocalData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Maximize2, RefreshCw } from 'lucide-react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 50;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes, edges };
};

export function StrategyMap() {
    const { t } = useTranslation();
    const { data } = useLocalData();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const flowNodes: Node[] = [];
        const flowEdges: Edge[] = [];

        // 1. Modules (Group Nodes)
        // For simplicity in this version, we link features directly.
        // Or we could have Module -> Feature edges.

        // Let's visualize: Module -> Feature -> Service

        // Add Module Nodes
        data.productModules.forEach(mod => {
            flowNodes.push({
                id: `mod-${mod.id}`,
                type: 'input', // Strategy inputs
                data: { label: mod.name },
                position: { x: 0, y: 0 }, // Set by layout
                style: {
                    background: '#f5f3ff',
                    border: '1px solid #7c3aed',
                    color: '#7c3aed',
                    fontWeight: 'bold',
                    borderRadius: '8px'
                },
            });
        });

        // Add Feature Nodes
        data.productFeatures.forEach(feat => {
            flowNodes.push({
                id: `feat-${feat.id}`,
                data: { label: feat.name },
                position: { x: 0, y: 0 },
                style: {
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    width: 180,
                    borderRadius: '8px',
                    fontSize: '12px'
                }
            });

            // Edge: Module -> Feature
            flowEdges.push({
                id: `e-mod-${feat.module_id}-feat-${feat.id}`,
                source: `mod-${feat.module_id}`,
                target: `feat-${feat.id}`,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#cbd5e1' },
            });
        });

        // Add Service Nodes
        data.productServices.forEach(srv => {
            let bg = '#ecfdf5'; // green/internal
            let border = '#10b981';

            if (srv.type === 'External') {
                bg = '#fef2f2'; // red/external
                border = '#ef4444';
            } else if (srv.type === 'Database') {
                bg = '#eff6ff'; // blue/db
                border = '#3b82f6';
            }

            flowNodes.push({
                id: `srv-${srv.id}`,
                type: 'output',
                data: { label: `${srv.name} (${srv.type})` },
                position: { x: 0, y: 0 },
                style: {
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: '20px', // pill shape
                    fontSize: '11px',
                    width: 160
                }
            });
        });

        // Add Dependency Edges: Feature -> Service
        data.serviceDependencies.forEach(dep => {
            flowEdges.push({
                id: `e-feat-${dep.feature_id}-srv-${dep.service_id}`,
                source: `feat-${dep.feature_id}`,
                target: `srv-${dep.service_id}`,
                label: dep.type,
                type: 'smoothstep', // curvature
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                },
                style: { stroke: '#64748b' },
                labelStyle: { fill: '#64748b', fontSize: 10 }
            });
        });

        return getLayoutedElements(flowNodes, flowEdges);

    }, [data.productModules, data.productFeatures, data.productServices, data.serviceDependencies]);

    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    const onLayout = useCallback((direction: string) => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            direction
        );
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    }, [nodes, edges, setNodes, setEdges]);

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle>{t('strategyMap.title')}</CardTitle>
                    <CardDescription>{t('strategyMap.subtitle')}</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onLayout('LR')}>
                        <RefreshCw className="h-4 w-4 mr-1" /> {t('strategyMap.resetLayout')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative h-full min-h-[500px]">
                <div className="absolute inset-0">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        connectionLineType={ConnectionLineType.SmoothStep}
                        fitView
                        attributionPosition="bottom-right"
                    >
                        <Background color="#aaa" gap={16} />
                        <Controls />
                    </ReactFlow>
                </div>
            </CardContent>
        </Card>
    );
}
