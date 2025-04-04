export type SingleInstagramPostParams = {
  image_url?: string
  caption?: string
  alt_text?: string
  is_carousel_item?: boolean
}

export type CarouselInstagramPostParams = Omit<SingleInstagramPostParams, 'image_url'> & {
  image_urls: string[]
}
