import { cleanupExpiredModerationEvents } from '../../../utils/moderationCleanup'

export default defineEventHandler(async (event) => {
  console.log('📥 POST /api/admin/moderation/cleanup - Manual cleanup requested')

  try {
    const result = await cleanupExpiredModerationEvents()
    
    console.log('✅ Manual cleanup completed:', result)

    return {
      success: true,
      message: 'Moderation cleanup completed successfully',
      data: result,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('❌ Error during manual cleanup:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to perform moderation cleanup: ' + (error.message || 'Unknown error')
    })
  }
})
