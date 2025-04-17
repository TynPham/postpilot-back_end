import { Platform, PostStatus } from '~/constants/enum'
import database from './database.services'
import { Post } from '@prisma/client'
import postServices from './posts.services'
import { getFbEngagementCount } from '~/helpers/facebook'
import { getIgEngagementCount } from '~/helpers/instagram'
import { getThreadsEngagement } from '~/helpers/threads'
import { getXEngagement } from '~/helpers/x'

class StatisticalService {
  private async getEngagementPlatform(userId: string) {
    // Initialize engagement data
    const engagementData = {
      facebookEngagementData: {
        likes: 0,
        comments: 0,
        shares: 0,
        reactions: 0
      },
      instagramEngagementData: {
        likes: 0,
        comments: 0,
        shares: 0,
        saved: 0,
        views: 0
      },
      xEngagementData: {
        likes: 0,
        replies: 0,
        retweets: 0,
        quotes: 0,
        bookmarks: 0
      },
      threadsEngagementData: {
        likes: 0,
        replies: 0,
        shares: 0,
        reposts: 0,
        views: 0
      },
      redditEngagementData: {
        upvotes: 0,
        comments: 0,
        awards: 0,
        shares: 0,
        linkClicks: 0
      }
    }

    // Get all published posts in one query
    const publishedPosts = await database.post.findMany({
      where: {
        socialCredential: {
          userId
        },
        status: PostStatus.Published,
        publishedPost: {
          isNot: null
        }
      },
      select: {
        id: true,
        platform: true,
        socialCredential: {
          select: {
            credentials: true,
            id: true
          }
        },
        publishedPost: true
      }
    })

    // Group posts by platform
    const postsByPlatform = publishedPosts.reduce(
      (acc, post) => {
        if (!acc[post.platform]) {
          acc[post.platform] = []
        }
        acc[post.platform].push(post)
        return acc
      },
      {} as Record<string, typeof publishedPosts>
    )

    // Process each platform in parallel
    await Promise.all([
      // Facebook
      ...(postsByPlatform[Platform.Facebook] || []).map(async (post) => {
        const engagement = await getFbEngagementCount(
          post.publishedPost?.postId as string,
          (post.socialCredential.credentials as any)?.access_token
        )
        engagementData.facebookEngagementData.likes += engagement.likes
        engagementData.facebookEngagementData.comments += engagement.comments
        engagementData.facebookEngagementData.shares += engagement.shares
        engagementData.facebookEngagementData.reactions += engagement.reactions
      }),

      // Instagram
      ...(postsByPlatform[Platform.Instagram] || []).map(async (post) => {
        const engagement = await getIgEngagementCount(
          post.publishedPost?.postId as string,
          (post.socialCredential.credentials as any)?.access_token
        )
        engagementData.instagramEngagementData.likes += engagement.likes
        engagementData.instagramEngagementData.comments += engagement.comments
        engagementData.instagramEngagementData.shares += engagement.shares
        engagementData.instagramEngagementData.saved += engagement.saved
        engagementData.instagramEngagementData.views += engagement.views
      }),

      // Threads
      ...(postsByPlatform[Platform.Threads] || []).map(async (post) => {
        const engagement = await getThreadsEngagement(
          post.publishedPost?.postId as string,
          (post.socialCredential.credentials as any)?.access_token
        )
        engagementData.threadsEngagementData.likes += engagement.likes
        engagementData.threadsEngagementData.views += engagement.views
        engagementData.threadsEngagementData.replies += engagement.replies
        engagementData.threadsEngagementData.reposts += engagement.reposts
        engagementData.threadsEngagementData.shares += engagement.shares
      }),

      // X
      ...(postsByPlatform[Platform.X] || []).map(async (post) => {
        const engagement = await getXEngagement(
          post.publishedPost?.postId as string,
          (post.socialCredential.credentials as any)?.access_token,
          (post.socialCredential.credentials as any)?.refresh_token,
          post.socialCredential.id,
          post.id
        )
        engagementData.xEngagementData.likes += engagement.likes
        engagementData.xEngagementData.replies += engagement.replies
        engagementData.xEngagementData.retweets += engagement.retweets
        engagementData.xEngagementData.quotes += engagement.quotes
        engagementData.xEngagementData.bookmarks += engagement.bookmarks
      })
    ])

    return engagementData
  }

  private async calculateOverallMetrics(engagementData: any, allPosts: Post[]) {
    let totalEngagements = 0
    let totalReach = 0

    // Calculate total engagements across all platforms
    // Facebook
    totalEngagements +=
      engagementData.facebookEngagementData.likes +
      engagementData.facebookEngagementData.comments +
      engagementData.facebookEngagementData.shares +
      engagementData.facebookEngagementData.reactions

    // Calculate total reach
    totalReach += engagementData.facebookEngagementData.reach || 0
    totalReach += engagementData.instagramEngagementData.views || 0
    // totalReach += engagementData.xEngagementData.impression_count || 0
    totalReach += engagementData.threadsEngagementData.views || 0

    // Instagram
    totalEngagements +=
      engagementData.instagramEngagementData.likes +
      engagementData.instagramEngagementData.comments +
      engagementData.instagramEngagementData.shares

    // X
    totalEngagements +=
      engagementData.xEngagementData.likes +
      engagementData.xEngagementData.replies +
      engagementData.xEngagementData.retweets +
      engagementData.xEngagementData.quotes +
      engagementData.xEngagementData.bookmarks

    // Threads
    totalEngagements +=
      engagementData.threadsEngagementData.likes +
      engagementData.threadsEngagementData.replies +
      engagementData.threadsEngagementData.shares

    const publishedPosts = allPosts.filter(
      (post) => post.status === PostStatus.Published && post.platform !== Platform.X
    )
    const avgReach = totalReach / (publishedPosts.length || 1)

    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
      }
      return num.toString()
    }

    return {
      totalPosts: allPosts.length,
      totalEngagements: formatNumber(totalEngagements),
      scheduledPosts: allPosts.filter((post) => post.status === PostStatus.Scheduled).length,
      averageReach: avgReach.toFixed(1).toString()
    }
  }

  async getStatistical(userId: string) {
    const allPosts = await postServices.getPosts(userId)
    const engagementData = await this.getEngagementPlatform(userId)
    const overallMetrics = await this.calculateOverallMetrics(engagementData, allPosts as Post[])

    // Initialize platform counts
    const postsByPlatformResult = {
      [Platform.Facebook]: 0,
      [Platform.Instagram]: 0,
      [Platform.Reddit]: 0,
      [Platform.Threads]: 0,
      [Platform.X]: 0
    }

    // Initialize time range counts
    const timeRanges = ['12AM-4AM', '4AM-8AM', '8AM-12PM', '12PM-4PM', '4PM-8PM', '8PM-12AM']
    const postsByTimeRangeResult: Record<string, number> = timeRanges.reduce((acc, timeRange) => {
      return {
        ...acc,
        [timeRange]: 0
      }
    }, {})

    // Count regular posts by platform and time range
    allPosts.forEach((post) => {
      const platform = post.platform as Platform
      postsByPlatformResult[platform]++

      const hour = new Date(post.publicationTime).getHours()
      let timeRange = '8PM-12AM' // Default

      if (hour >= 0 && hour < 4) {
        timeRange = '12AM-4AM'
      } else if (hour >= 4 && hour < 8) {
        timeRange = '4AM-8AM'
      } else if (hour >= 8 && hour < 12) {
        timeRange = '8AM-12PM'
      } else if (hour >= 12 && hour < 16) {
        timeRange = '12PM-4PM'
      } else if (hour >= 16 && hour < 20) {
        timeRange = '4PM-8PM'
      }

      postsByTimeRangeResult[timeRange]++
    })

    const postByStatusResult: Record<string, Record<string, number>> = {
      published: {},
      scheduled: {},
      recurring: {},
      failed: {}
    }

    // Get unique dates from posts and initialize counts
    const uniqueDates = new Set(
      allPosts.map((post) => {
        const date = new Date(post.publicationTime)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    )

    // Initialize counts for each unique date
    uniqueDates.forEach((dateStr) => {
      postByStatusResult.published[dateStr] = 0
      postByStatusResult.scheduled[dateStr] = 0
      postByStatusResult.recurring[dateStr] = 0
      postByStatusResult.failed[dateStr] = 0
    })

    // Count posts by status and date
    allPosts.forEach((post) => {
      const date = new Date(post.publicationTime)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      if (post.status === PostStatus.Published) {
        postByStatusResult.published[dateStr]++
      } else if (post.status === PostStatus.Scheduled) {
        postByStatusResult.scheduled[dateStr]++
      } else if (post.status === PostStatus.Active) {
        postByStatusResult.recurring[dateStr]++
      } else if (post.status === PostStatus.Failed) {
        postByStatusResult.failed[dateStr]++
      }
    })

    return {
      postsByPlatform: postsByPlatformResult,
      recentPosts: allPosts.slice(0, 5),
      postsByTimeRange: postsByTimeRangeResult,
      postByStatusResult,
      engagementData,
      overallMetrics
    }
  }
}

const statisticalService = new StatisticalService()

export default statisticalService
