import { notFound } from 'next/navigation'
import { getSignOffById, getUserById, getUsers } from '@/lib/db/queries'
import { getAuthenticatedUser } from '@/lib/auth'
import { SignOffDetail } from '@/components/sign-offs/sign-off-detail'

export default async function SignOffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const signOff = await getSignOffById(id)

  if (!signOff) notFound()

  // Staff members can only view their own sign-offs
  const authedUser = await getAuthenticatedUser()
  if (authedUser) {
    const users = await getUsers()
    const caller = users.find(
      (u) => u.email.toLowerCase() === authedUser.email.toLowerCase(),
    )
    if (caller?.role === 'STAFF_MEMBER' && signOff.submittedBy.id !== caller.id) {
      notFound()
    }
  }

  return <SignOffDetail signOff={signOff} />
}
