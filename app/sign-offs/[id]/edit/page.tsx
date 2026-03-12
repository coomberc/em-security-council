import { notFound } from 'next/navigation'
import { getSignOffById } from '@/lib/db/queries'
import { SignOffForm } from '@/components/sign-offs/sign-off-form'

export default async function EditSignOffPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const signOff = await getSignOffById(id)

  if (!signOff) notFound()

  return <SignOffForm existingSignOff={signOff} />
}
