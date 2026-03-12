import { notFound } from 'next/navigation'
import { getSignOffById } from '@/lib/db/queries'
import { SignOffDetail } from '@/components/sign-offs/sign-off-detail'

export default async function SignOffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const signOff = await getSignOffById(id)

  if (!signOff) notFound()

  return <SignOffDetail signOff={signOff} />
}
