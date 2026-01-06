'use client';

export default function TestErrorPage() {
  // Táto stránka automaticky vyhodí chybu
  throw new Error('Test error page - toto je testovacia chyba!');

  return <div>Toto sa nikdy nezobrazí</div>;
}
