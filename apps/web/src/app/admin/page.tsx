import { redirect } from 'next/navigation'

export default function AdminPage() {
  // @ts-expect-error — typedRoutes validator updates on next dev server start
  redirect('/admin/users')
}
