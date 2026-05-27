/**
 * Recibe la región y las delegaciones permitidas (mps) desde el App.tsx.
 */

import ComponenteConsumo from "./ComponenteConsumo";

export default function ConsumoDashboard({ region, mps }: { region: string; mps: string }) {
  const codAlm = region === "B" ? "2" : "1,3,5,7";

  return (
    <div className="consumo-dashboard">
      <ComponenteConsumo codAlm={codAlm} mps={mps} />
    </div>
  );
}
  