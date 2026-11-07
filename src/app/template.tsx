/**
 * Global App Router transition.
 * The fixed viewport widgets are portaled to document.body so this animated
 * wrapper cannot become their containing block.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="zikra-page-transition">{children}</div>;
}
