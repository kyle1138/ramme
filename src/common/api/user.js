import { V1 as api } from 'instagram-private-api'
import settings from 'electron-settings'
import hasha from 'hasha'
import utils from '../utils'

let user = settings.get('currentUser')

// Set session from cookie file
const loadSession = async user => {
  let path = utils.buildPath(user.hash)
  let device = new api.Device(user.username)
  let storage = new api.CookieFileStorage(path)
  if (storage) {
    return new api.Session(device, storage)
  } else {
    let file = await createSessionFile(user)
    if (file) console.log('Session File Created')
    return false
  }
}

const createSession = async (user, password) => {
  let path = utils.buildPath(user.hash)
  let device = new api.Device(user.username)
  let storage = new api.CookieFileStorage(path)
  if (storage) {
    return api.Session.create(device, storage, user.username, password)
  } else {
    let file = await createSessionFile(user)
    if (file) console.log('Session File Created')
    return false
  }
}

const createSessionFile = async user => {
  user.hash = hasha(user)
  let path = await utils.createFile(utils.buildPath(user.hash))
  return path
}

// Check if user logged in
const isLoggedIn = async () => {
  if (user) {
    let session = await loadSession(user)
    let account = await session.getAccount()
    return account.hasOwnProperty('_params')
  }
}

// Perform login
const doLogin = async (username, password) => {
  if (typeof user === 'undefined' || !user.hasOwnProperty('hash')) {
    let userData = {
      username: username,
      hash: hasha(username, {
        algorithm: 'md5'
      })
    }
    settings.set('currentUser', userData)
    user = settings.get('currentUser')
  }

  let session = await createSession(user, password)
  return session
}

// Get user data
const getUser = async () => {
  if (user) {
    let session = await loadSession(user)
    let account = await session.getAccount()
    return account._params
  }
}

// Get user data
const getUserMedia = async (page = 1, limit = 1) => {
  if (user) {
    let session = await loadSession(user)
    let account = await session.getAccount()
    let feed = new api.Feed.UserMedia(session, account._params.id)

    feed.setCursor(page)

    let q = await feed.get()
    console.log(typeof q)
    console.log(q[0])

    return q
  }
}

export default {
  isLoggedIn,
  doLogin,
  getUser,
  getUserMedia
}