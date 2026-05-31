import { redirect } from 'next/navigation'

export default async function AdminRootPage() {
  redirect('/users')
}
