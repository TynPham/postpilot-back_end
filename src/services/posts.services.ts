import database from './database.services'

class PostServices {
  async getPosts() {
    const posts = await database.post.findMany()
    return posts
  }
}

const postServices = new PostServices()

export default postServices
