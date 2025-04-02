import { Platform } from '~/constants/enum'
import database from './database.services'

class StatisticalService {
  async getStatistical() {
    const [postsByPlatform, posts, postsByTimeRange] = await Promise.all([
      database.post.groupBy({
        by: ['platform'],
        _count: {
          platform: true
        }
      }),

      database.post.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // New query for time ranges using Prisma's raw query for better performance
      database.$queryRaw`
        WITH time_ranges AS (
          SELECT 
            CASE 
              WHEN EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) >= 0 
                AND EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 4 THEN '12AM-4AM'
              WHEN EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) >= 4 
                AND EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 8 THEN '4AM-8AM'
              WHEN EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) >= 8 
                AND EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 12 THEN '8AM-12PM'
              WHEN EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) >= 12 
                AND EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 16 THEN '12PM-4PM'
              WHEN EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) >= 16 
                AND EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 20 THEN '4PM-8PM'
              ELSE '8PM-12AM'
            END as time_range,
            COUNT(*) as count
          FROM posts
          GROUP BY 
            CASE 
              WHEN EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) >= 0 
                AND EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 4 THEN '12AM-4AM'
              WHEN EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) >= 4 
                AND EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 8 THEN '4AM-8AM'
              WHEN EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) >= 8 
                AND EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 12 THEN '8AM-12PM'
              WHEN EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) >= 12 
                AND EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 16 THEN '12PM-4PM'
              WHEN EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) >= 16 
                AND EXTRACT(HOUR FROM ("publicationTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 20 THEN '4PM-8PM'
              ELSE '8PM-12AM'
            END
        )
        SELECT * FROM time_ranges
        ORDER BY 
          CASE time_range
            WHEN '12AM-4AM' THEN 1
            WHEN '4AM-8AM' THEN 2
            WHEN '8AM-12PM' THEN 3
            WHEN '12PM-4PM' THEN 4
            WHEN '4PM-8PM' THEN 5
            WHEN '8PM-12AM' THEN 6
          END;
      `
    ])

    // Transform platform results
    let postsByPlatformResult = {
      [Platform.Facebook]: 0,
      [Platform.Instagram]: 0,
      [Platform.Reddit]: 0,
      [Platform.Threads]: 0,
      [Platform.X]: 0
    }
    postsByPlatform.forEach((item) => {
      postsByPlatformResult[item.platform as Platform] = item._count.platform
    })

    // Transform time range results
    const timeRanges = ['12AM-4AM', '4AM-8AM', '8AM-12PM', '12PM-4PM', '4PM-8PM', '8PM-12AM']

    const postsByTimeRangeResult = timeRanges.reduce((acc, timeRange) => {
      const found = (postsByTimeRange as any).find(
        (item: { time_range: string; count: number }) => item.time_range === timeRange
      )
      return {
        ...acc,
        [timeRange]: found ? Number(found.count) : 0
      }
    }, {})

    return {
      totalPosts: posts.length,
      postsByPlatform: postsByPlatformResult,
      recentPosts: posts.slice(0, 5),
      postsByTimeRange: postsByTimeRangeResult
    }
  }
}

const statisticalService = new StatisticalService()

export default statisticalService
