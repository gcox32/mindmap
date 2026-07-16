import { LIQUID_GLASS_DISPLACEMENT_MAP } from '../assets/liquidGlassDisplacement'

export function LiquidGlassDefs() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <filter id="liquid-glass" primitiveUnits="objectBoundingBox">
        <feImage result="map" width="100%" height="100%" href={LIQUID_GLASS_DISPLACEMENT_MAP} />
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur" />
        <feDisplacementMap in="blur" in2="map" scale="0.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
