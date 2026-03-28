import request from './request'

/** 帖子数据类型 */
export interface Post {
  id: number
  userId: number
  userName: string
  userAvatar: string | null
  withdrawAmount: number
  platformScreenshot: string
  receiptScreenshot: string
  content: string | null
  likeCount: number
  commentCount: number
  isLiked: boolean
  createdAt: string
}

/** 帖子列表响应 */
export interface PostsResponse {
  list: Post[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

/** 评论数据类型 */
export interface Comment {
  id: number
  userId: number
  userName: string
  userAvatar: string | null
  content: string
  createdAt: string
}

/** 帖子详情响应 */
export interface PostDetailResponse {
  post: Post
  comments: Comment[]
}

/** 已完成的提现订单 */
export interface CompletedWithdraw {
  id: number
  orderNo: string
  amount: number
  completedAt: string
}

/** 我的帖子数据类型 */
export type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface MyPost {
  id: number
  withdrawAmount: number
  platformScreenshot: string
  receiptScreenshot: string
  content: string | null
  likeCount: number
  commentCount: number
  status: PostStatus
  rejectReason: string | null
  createdAt: string
}

export interface MyPostsResponse {
  list: MyPost[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

// ── API 接口 ─────────────────────────────────────────────────────────────────

/** 获取帖子列表（分页） */
export const getPosts = (page = 1, pageSize = 10) =>
  request.get<PostsResponse>(`/community/posts?page=${page}&pageSize=${pageSize}`)

/** 获取帖子详情 */
export const getPostDetail = (id: number) =>
  request.get<PostDetailResponse>(`/community/posts/${id}`)

/** 点赞/取消点赞 */
export const likePost = (postId: number) =>
  request.post<{ liked: boolean; likeCount: number }>(`/community/posts/${postId}/like`)

/** 发表评论 */
export const postComment = (postId: number, content: string) =>
  request.post(`/community/posts/${postId}/comments`, { content })

/** 获取已完成的提现订单（用于创建帖子） */
export const getCompletedWithdraws = () =>
  request.get<{ list: CompletedWithdraw[] }>('/community/completed-withdraws')

/** 创建帖子 */
export interface CreatePostParams {
  withdrawOrderId: number
  platformImage: string
  receiptImage: string
  content?: string
}

export const createPost = (data: CreatePostParams) =>
  request.post('/community/posts', data)

/** 获取我的帖子 */
export const getMyPosts = (page = 1, pageSize = 10) =>
  request.get<MyPostsResponse>(`/community/my-posts?page=${page}&pageSize=${pageSize}`)
