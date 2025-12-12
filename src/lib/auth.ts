import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from './db'

export async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      consultantProfile: {
        include: {
          skills: {
            include: {
              skillTag: true,
            },
          },
        },
      },
      clientProfile: true,
    },
  })

  return user
}

export async function getOrCreateUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  // Try to find existing user
  let user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      consultantProfile: {
        include: {
          skills: {
            include: {
              skillTag: true,
            },
          },
        },
      },
      clientProfile: true,
    },
  })

  // If not found, create from Clerk data
  if (!user) {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return null
    }

    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )

    if (!primaryEmail) {
      return null
    }

    user = await db.user.create({
      data: {
        clerkId: userId,
        email: primaryEmail.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
      include: {
        consultantProfile: {
          include: {
            skills: {
              include: {
                skillTag: true,
              },
            },
          },
        },
        clientProfile: true,
      },
    })
  }

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireOnboarded() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!user.onboarded) {
    throw new Error('Onboarding required')
  }

  return user
}
