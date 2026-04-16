export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      <div className="grid grid-3">
        <div className="card"><h3>Outstanding</h3><p>$0.00</p></div>
        <div className="card"><h3>Paid this week</h3><p>$0.00</p></div>
        <div className="card"><h3>Open invoices</h3><p>0</p></div>
      </div>
    </main>
  )
}
