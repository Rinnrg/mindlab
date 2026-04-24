import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Mock activities for fallback
const mockActivities = [
  {
    id: 'activity1',
    type: 'course_created',
    title: 'Course "Sample Programming Course" created',
    description: 'New course has been created successfully',
    time: new Date().toISOString(),
    relatedId: 'mock1',
    userId: 'guru1',
    icon: '📚'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('GET /api/activity - Parameters:', { userId, role, limit })

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId dan role diperlukan' },
        { status: 400 }
      )
    }

    // Use mock data for now since database is unavailable
    const activities = mockActivities.filter(activity => activity.userId === userId)
    const limitedActivities = activities.slice(0, limit)

    console.log('Returning activities:', limitedActivities.length)
    
    return NextResponse.json({ activities: limitedActivities })

  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { 
        error: 'Gagal mengambil aktivitas',
        activities: []
      },
      { status: 200 }
    )
  }
}
