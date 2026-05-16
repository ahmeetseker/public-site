interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  className,
}: SparklineProps) {
  if (data.length === 0) return null
  const max = Math.max(...data, 1)
  const step = data.length > 1 ? width / (data.length - 1) : width
  const points = data
    .map((v, i) => `${i * step},${height - (v / max) * (height - 4) - 2}`)
    .join(' ')
  const last = data[data.length - 1]
  const lastX = (data.length - 1) * step
  const lastY = height - (last / max) * (height - 4) - 2
  const up = data.length > 1 ? data[data.length - 1] >= data[0] : true

  const stroke = up ? 'rgb(16, 185, 129)' : 'rgb(225, 29, 72)'
  const fill = up ? 'rgba(16, 185, 129, 0.10)' : 'rgba(225, 29, 72, 0.10)'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polyline
        fill={fill}
        stroke="none"
        points={`0,${height} ${points} ${width},${height}`}
      />
      <circle cx={lastX} cy={lastY} r={2} fill={stroke} />
    </svg>
  )
}
