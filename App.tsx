import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Background,
  Controls as ReactFlowControls,
} from 'reactflow';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Loader } from './components/Loader';
import { generateFromNodes } from './services/geminiService';
import { NodeData, NodeType, AspectRatio } from './types';
import { ImageNode } from './components/nodes/ImageNode';
import { TextNode } from './components/nodes/TextNode';
import { MergeNode } from './components/nodes/MergeNode';
import { OutputNode } from './components/nodes/OutputNode';
import { CustomEdge } from './components/edges/CustomEdge';

let id = 0;
const getId = () => `dnd-node_${id++}`;

const App: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationTrigger, setGenerationTrigger] = useState<{ nodeId: string, aspectRatio: AspectRatio } | null>(null);

  const nodeTypes = useMemo(() => ({
    [NodeType.IMAGE]: ImageNode,
    [NodeType.TEXT]: TextNode,
    [NodeType.MERGE]: MergeNode,
    [NodeType.OUTPUT]: OutputNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({ ...params, type: 'custom', animated: true }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const requestGenerate = useCallback((nodeId: string, aspectRatio: AspectRatio) => {
    setGenerationTrigger({ nodeId, aspectRatio });
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      let newNode: Node<NodeData>;
      switch (type) {
        case NodeType.IMAGE:
          newNode = { id: getId(), type, position, data: { onUpdate: setNodes, label: 'Image Input', content: null, mimeType: null } };
          break;
        case NodeType.TEXT:
          newNode = { id: getId(), type, position, data: { onUpdate: setNodes, label: 'Text Prompt', content: '' } };
          break;
        case NodeType.MERGE:
          newNode = { id: getId(), type, position, data: { label: 'Merge/Blend' } };
          break;
        case NodeType.OUTPUT:
          newNode = { id: getId(), type, position, data: { label: 'Generated Output', onGenerate: requestGenerate, content: null, aspectRatio: '1:1' } };
          break;
        default:
          return;
      }
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, requestGenerate]
  );

  const findUpstreamNodes = useCallback((startNodeId: string): { images: Node<NodeData>[], texts: Node<NodeData>[] } => {
    const collectedImageNodes: Node<NodeData>[] = [];
    const collectedTextNodes: Node<NodeData>[] = [];
    const collectedIds = new Set<string>();

    const nodesMap = Object.fromEntries(nodes.map(node => [node.id, node]));
    const visited = new Set<string>();
    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      const incomingEdges = edges.filter(edge => edge.target === currentId);

      for (const edge of incomingEdges) {
        const sourceNode = nodesMap[edge.source];
        if (sourceNode) {
          if (!collectedIds.has(sourceNode.id)) {
             if ((sourceNode.type === NodeType.IMAGE || sourceNode.type === NodeType.OUTPUT) && sourceNode.data.content) {
                const base64Content = sourceNode.data.content.split(',')[1] || sourceNode.data.content;
                collectedImageNodes.push({ ...sourceNode, data: { ...sourceNode.data, content: base64Content }});
                collectedIds.add(sourceNode.id);
             }
             if (sourceNode.type === NodeType.TEXT && sourceNode.data.content) {
                collectedTextNodes.push(sourceNode);
                collectedIds.add(sourceNode.id);
             }
          }
          queue.push(sourceNode.id);
        }
      }
    }
    return { images: collectedImageNodes, texts: collectedTextNodes };
  }, [nodes, edges]);

  useEffect(() => {
    if (!generationTrigger) return;

    const { nodeId, aspectRatio } = generationTrigger;

    const runGeneration = async () => {
      setError(null);
      setIsLoading(true);
      
      const { images, texts } = findUpstreamNodes(nodeId);
      const validTexts = texts.filter(n => n.data.content?.trim());
      const prompt = validTexts.map(n => n.data.content!.trim()).join(' ');

      if (images.length === 0 && validTexts.length === 0) {
          setError('Please connect and provide content for at least one Image or Text node.');
          setIsLoading(false);
          setGenerationTrigger(null);
          return;
      }

      try {
        const { b64, mimeType } = await generateFromNodes(images, prompt, aspectRatio);
        
        setNodes((nds) => 
          nds.map((node) => 
              node.id === nodeId 
              ? { ...node, data: { ...node.data, content: `data:${mimeType};base64,${b64}`, mimeType, aspectRatio } } 
              : node
          )
        );

      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
        setGenerationTrigger(null);
      }
    };

    runGeneration();
  }, [generationTrigger, findUpstreamNodes, setNodes]);


  return (
    <div className="w-screen h-screen bg-[#0a0a0a] text-gray-200 font-sans flex flex-col antialiased">
      <Header />
      <main className="flex-grow flex">
        <ReactFlowProvider>
          <Sidebar />
          <div className="flex-grow h-full" ref={reactFlowWrapper}>
            {isLoading && <Loader />}
            {error && (
                 <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-900/70 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm z-50 backdrop-blur-sm" role="alert">
                    <p>{error}</p>
                 </div>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
            >
              <Background gap={24} color="#2d2d2d" />
              <ReactFlowControls />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </main>
    </div>
  );
};

export default App;