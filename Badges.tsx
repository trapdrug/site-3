export function RiskBadge({ atRisk, shortage }: { atRisk?: boolean; shortage?: number }) {
  if ((shortage || 0) > 0)
    return <span className="badge badge-red">нехватка {shortage}</span>;
  if (atRisk) return <span className="badge badge-red">риск опоздания</span>;
  return <span className="badge badge-green">в срок</span>;
}

export function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return <span className="badge badge-blue">active</span>;
  if (status === 'shipped') return <span className="badge badge-gray">shipped</span>;
  return <span className="badge badge-gray">cancelled</span>;
}

export function ShipBadge({ status }: { status: string }) {
  if (status === 'expected') return <span className="badge badge-blue">в пути</span>;
  return <span className="badge badge-gray">получена</span>;
}
