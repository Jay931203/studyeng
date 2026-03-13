import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase = await createServerClient()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Auth service is not available.' },
      { status: 503 },
    )
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  if (!adminClient) {
    return NextResponse.json(
      { error: 'Account deletion is not available at this time.' },
      { status: 503 },
    )
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

  if (deleteError) {
    console.error('[account/delete] deleteUser failed:', deleteError)
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
