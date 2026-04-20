interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <section className="flex flex-col gap-6">
      {children}
    </section>
  );
}
