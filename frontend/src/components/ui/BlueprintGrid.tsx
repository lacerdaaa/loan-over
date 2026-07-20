/* Blueprint grid: fine mesh + bolder lines every 5 cells, white over green */
export const BlueprintGrid = () => (
  <div
    className="absolute inset-0 pointer-events-none"
    aria-hidden
    style={{
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px),
        linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px, 40px 40px, 200px 200px, 200px 200px',
    }}
  />
);
