// Single source of truth for AudiobookShelf (ABS) API response shapes.
// Verified against ABS 2.35.1 by direct observation - do not guess fields.
// Only the subset of fields used in v0.1 is typed; ABS returns more.

// --- Auth ---

export interface ABSUser {
  id: string
  username: string
  email: string | null
  type: string
  token: string
  isActive: boolean
  isLocked: boolean
  createdAt: number
  librariesAccessible: string[]
  hasOpenIDLink: boolean
}

// /login and /api/authorize return the same envelope.
export interface ABSAuthResponse {
  user: ABSUser
  userDefaultLibraryId: string
  serverSettings: ABSServerSettings
  Source: string
}

export interface ABSServerSettings {
  id: string
  version: string
  language: string
  authActiveAuthMethods: string[]
  authOpenIDButtonText: string
  authLoginCustomMessage: string | null
}

// /status (unauthenticated) - used to discover available auth methods.
export interface ABSStatusResponse {
  app: string
  serverVersion: string
  isInit: boolean
  language: string
  authMethods: string[]
  authFormData: {
    authLoginCustomMessage: string
    authOpenIDButtonText: string
    authOpenIDAutoLaunch: boolean
  }
}

// --- Libraries ---

export interface ABSLibrary {
  id: string
  name: string
  icon: string
  mediaType: string
  displayOrder: number
  createdAt: number
  lastUpdate: number
}

export interface ABSLibrariesResponse {
  libraries: ABSLibrary[]
}

// --- Library items ---

export interface ABSBookMetadata {
  title: string | null
  titleIgnorePrefix: string
  subtitle: string | null
  authorName: string
  narratorName: string
  seriesName: string
  publishedYear: string | null
  description: string | null
  genres: string[]
  language: string | null
  explicit: boolean
}

export interface ABSBookMedia {
  id: string
  metadata: ABSBookMetadata
  coverPath: string | null
  tags: string[]
  numTracks: number
  numAudioFiles: number
  numChapters: number
  duration: number
  size: number
}

export interface ABSLibraryItem {
  id: string
  libraryId: string
  folderId: string
  path: string
  mediaType: string
  media: ABSBookMedia
  addedAt: number
  updatedAt: number
  isMissing: boolean
  isInvalid: boolean
}

// /api/libraries/:id/items - paginated.
export interface ABSLibraryItemsResponse {
  results: ABSLibraryItem[]
  total: number
  limit: number
  page: number
  sortDesc: boolean
  mediaType: string
  minified: boolean
}

// --- Playback (shapes filled in when the player is wired) ---

export interface ABSChapter {
  id: number
  start: number
  end: number
  title: string
}
