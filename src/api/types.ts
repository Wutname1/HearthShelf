// Single source of truth for all AudiobookShelf (ABS) API response shapes.
// Shapes are filled in as endpoints are implemented - never inline a shape elsewhere.

export interface ABSUser {
  id: string
  username: string
  type: string
  token: string
}

export interface ABSLoginResponse {
  user: ABSUser
}

export interface ABSChapter {
  id: number
  start: number
  end: number
  title: string
}
