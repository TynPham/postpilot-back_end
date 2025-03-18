export type LongLivedTokenFbResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

export type ExchangeCodeForTokenThreadsResponse = {
  access_token: string
  user_id: string
}

export type LongLivedTokenThreadsResponse = {
  access_token: string
  token_type: string
  expires_in: number
}
