export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="nx-auth">
      <div className="nx-auth-inner">{children}</div>
    </div>
  );
}
