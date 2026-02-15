"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { graphData, domains, NodeData } from "@/lib/data/roadmapGraph";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

export default function NetworkRoadmap() {
  const graphRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Set dimensions based on container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = Math.min(420, window.innerWidth);
        setDimensions({
          width,
          height: 600, // Fixed height for mobile
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  // Handle background click to deselect
  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Custom node rendering
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px DM Sans, sans-serif`;

      // Node circle
      const nodeRadius = node.val || 3;
      const isSelected = selectedNode?.id === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = node.domainColor;
      ctx.fill();

      // Selected node highlight
      if (isSelected) {
        ctx.strokeStyle = "#2C3E50";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      // Node label (only show for selected or larger nodes)
      if (isSelected || nodeRadius >= 4) {
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fillRect(
          node.x - bckgDimensions[0] / 2,
          node.y - nodeRadius - bckgDimensions[1] - 2,
          bckgDimensions[0],
          bckgDimensions[1]
        );

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#2C3E50";
        ctx.fillText(
          label,
          node.x,
          node.y - nodeRadius - bckgDimensions[1] / 2 - 2
        );
      }
    },
    [selectedNode]
  );

  // Custom link rendering
  const paintLink = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const start = link.source;
      const end = link.target;

      // Draw link as a line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      // Highlight links connected to selected node
      const isHighlighted =
        selectedNode &&
        (link.source.id === selectedNode.id || link.target.id === selectedNode.id);

      ctx.strokeStyle = isHighlighted ? "#D4725C" : "rgba(0, 0, 0, 0.1)";
      ctx.lineWidth = isHighlighted ? 2 / globalScale : 1 / globalScale;
      ctx.stroke();
    },
    [selectedNode]
  );

  return (
    <div className="space-y-4">
      {/* Graph Container */}
      <div
        ref={containerRef}
        className="bg-white rounded-xl border border-sandDark overflow-hidden"
        style={{ touchAction: "pan-y" }}
      >
        {dimensions.width > 0 && (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeRelSize={6}
            nodeCanvasObject={paintNode}
            linkCanvasObject={paintLink}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            nodeLabel={() => ""} // We handle labels in paintNode
          />
        )}
      </div>

      {/* Domain Legend */}
      <div className="bg-sand rounded-xl px-4 py-4">
        <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-3">
          Six Domains
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(domains).map(([key, domain]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: domain.color }}
              />
              <span className="font-sans text-xs text-slate">{domain.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Detail */}
      {selectedNode && (
        <div
          className="bg-white rounded-xl border-2 px-4 py-4"
          style={{ borderColor: selectedNode.domainColor }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
                style={{
                  backgroundColor: `${selectedNode.domainColor}15`,
                  color: selectedNode.domainColor,
                }}
              >
                {domains[selectedNode.domain as keyof typeof domains].icon}
              </div>
              <div>
                <div
                  className="font-sans text-xs uppercase tracking-wide font-semibold"
                  style={{ color: selectedNode.domainColor }}
                >
                  {domains[selectedNode.domain as keyof typeof domains].name}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slateMid hover:text-slate text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="font-serif text-base font-medium text-slate">
            {selectedNode.name}
          </div>
          <div className="font-sans text-xs text-slateMid mt-2">
            Tap nodes to explore connections. Pinch to zoom, drag to pan.
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedNode && (
        <div className="bg-oceanLight rounded-xl px-4 py-4">
          <div className="font-serif text-base font-semibold text-slate mb-2">
            The Complex Web of Elder Care
          </div>
          <div className="font-sans text-sm text-slateMid leading-relaxed space-y-2">
            <p>
              This network shows all <strong>138 decision points</strong> across 6 domains.
              Each line represents a connection — a decision in one area that affects another.
            </p>
            <p className="text-xs">
              <strong>Tap any node</strong> to see its connections.
              <br />
              <strong>Pinch to zoom</strong> in and out.
              <br />
              <strong>Drag to pan</strong> around the graph.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
