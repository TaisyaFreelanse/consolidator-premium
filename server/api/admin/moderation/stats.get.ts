import { getModerationExpirationStats } from '../../../utils/moderationCleanup'

export default defineEventHandler(async (event) => {
  console.log('📥 GET /api/admin/moderation/stats - Request received')

  try {
    const stats = await getModerationExpirationStats()
    
    console.log('✅ Moderation stats retrieved:', stats)

    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('❌ Error fetching moderation stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch moderation statistics: ' + (error.message || 'Unknown error')
    })
  }
})
