import { useMemo } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { GraphEdge, GraphNode } from '@/data/types'
import { useGraphLayout } from '@/graph/useGraphLayout'
import { computeFocusSet, type FocusMode } from '@/graph/traversal'
import { getNodeRadius } from '@/graph/style'
import { NodeMesh } from './NodeMesh'
import { EdgeLine } from './EdgeLine'
import { CameraFocus } from './CameraFocus'

const FOCUS_DISTANCE_SCALE = 9
const FOCUS_DISTANCE_PADDING = 36

interface GraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedId: string | null
  hoveredId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  autoRotate: boolean
  focusMode: FocusMode
  searchMatchIds: Set<string> | null
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  interactive: boolean
}

export function Graph({
  nodes,
  edges,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  autoRotate,
  focusMode,
  searchMatchIds,
  controlsRef,
  interactive,
}: GraphProps) {
  const positioned = useGraphLayout(nodes, edges)
  const nodeById = useMemo(() => new Map(positioned.map((n) => [n.id, n])), [positioned])

  const selectedNode = selectedId ? nodeById.get(selectedId) : undefined
  const focusDistance = selectedNode
    ? getNodeRadius(selectedNode) * FOCUS_DISTANCE_SCALE + FOCUS_DISTANCE_PADDING
    : 0

  const focusId = selectedId ?? hoveredId
  const effectiveMode: FocusMode = selectedId ? focusMode : 'neighbors'

  const highlightIds = useMemo(() => {
    if (searchMatchIds) return searchMatchIds
    if (!focusId) return null
    return computeFocusSet(focusId, edges, effectiveMode)
  }, [searchMatchIds, focusId, edges, effectiveMode])

  return (
    <group>
      <CameraFocus
        focusKey={selectedId}
        targetPosition={selectedNode ? { x: selectedNode.x, y: selectedNode.y, z: selectedNode.z } : null}
        distance={focusDistance}
        controlsRef={controlsRef}
      />

      {edges.map((edge) => {
        const from = nodeById.get(edge.source)
        const to = nodeById.get(edge.target)
        if (!from || !to) return null
        const isHighlighted = !!highlightIds && highlightIds.has(edge.source) && highlightIds.has(edge.target)
        const isDimmed = !!highlightIds && !isHighlighted
        return (
          <EdgeLine
            key={`${edge.source}->${edge.target}`}
            edge={edge}
            from={from}
            to={to}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            autoRotate={autoRotate}
          />
        )
      })}

      {positioned.map((node) => {
        const isDimmed = !!highlightIds && !highlightIds.has(node.id)
        return (
          <NodeMesh
            key={node.id}
            node={node}
            isHovered={hoveredId === node.id}
            isSelected={selectedId === node.id}
            isDimmed={isDimmed}
            onHover={onHover}
            onSelect={onSelect}
            interactive={interactive}
          />
        )
      })}


    </group>
  )
}
