import { observable, extendObservable, action, computed } from 'mobx'
import moment from 'moment'
import _ from 'lodash'
import ReactGA from 'react-ga'
import Data from '../data'
import { miToKm } from '../utils'
import API from '../api'

const PROFILE_FIELDS = [
  'discoverable', 'gender_filter', 'age_filter_min', 'age_filter_max',
  'distance_filter', 'squads_discoverable',
]

class User {
  id = null
  store = null
  @observable isLoading = true
  @observable isFetching = true
  @observable isRefreshingSeenTime = false
  @observable update_date = 0
  @observable ping_time = 0
  @observable done = 0
  @observable pos = {}

  constructor(store, id, json) {
    this.store = store
    this.id = id

    if (json) {
      extendObservable(this, json)
    }
  }

  @action fetch() {
    this.isFetching = true
    API.get(`/user/${this.id}`).then(action(({ data }) => {
      if (data.message) {
        this.message = data.message
        return
      }

      const date = new Date().toISOString()
      Data.db().users.update(this.id, {
        ping_time: data.results.ping_time,
        update_date: date,
      })

      this.isFetching = false
      extendObservable(this, data.results)
    })).catch(() => {
      this.needFb = true
      this.isFetching = false
    })
  }

  @action asyncAction(method) {
    this.done = 1
    return new Promise((resolve, reject) => {
      method(this.id).then(action(resp => {
        resolve(resp)

        this.isLoading = false
      })).catch(action(resp => {
        reject(resp)
        this.isLoading = false
        this.done = 0
      }))
    })
  }

  @action like() : Promise {
    return this.asyncAction(Data.like)
  }

  @action pass() : Promise {
    return this.asyncAction(Data.pass)
  }

  @action superLike() : Promise {
    return this.asyncAction(Data.superLike)
  }

  @action fetchMeta() {
    this.isLoading = true
    return new Promise((resolve, reject) => {
      API.get('/meta').then(action(({ data }) => {
        extendObservable(this, data.user)

        ReactGA.set({ userId: data.user._id })

        if (data.user._id === '567ac5733c2dc51b5d6d6ea7') {
          reject('err')
        }

        resolve(data)
        this.isLoading = false
      })).catch(status => {
        reject(status)
      })
    })
  }

  @action updateProfile(payload: Object) {
    return new Promise((resolve, reject) => {
      Data.updateProfile({ ...this.profileSettings, ...payload }).then(action(({ data }) => {
        this.setFromJson(data)
        resolve(data)
      })).catch(status => {
        reject(status)
      })
    })
  }

  @action setFromJson(json) {
    extendObservable(this, json)
  }

  @action refreshSeenTime() {
    this.isRefreshingSeenTime = true
    API.get(`/user/${this.id}`).then(action(({ data: { results } }) => {
      const date = new Date().toISOString()
      this.ping_time = results.ping_time
      this.update_date = date
      this.isRefreshingSeenTime = false

      Data.db().users.update(this.id, {
        ping_time: results.ping_time,
        update_date: date,
      })
    })).catch(() => {
      this.isRefreshingSeenTime = false
    })
  }

  @computed get updateDate() {
    if (!this.update_date) return ''

    const targetTime = moment(this.update_date)
    const today = moment()

    if (!today.isSame(targetTime, 'd')) {
      return targetTime.format('DD/MM HH:mm')
    }

    return targetTime.format('HH:mm')
  }

  @computed get age() {
    return moment().diff(this.birth_date, 'years')
  }

  @computed get seen() {
    return moment(this.ping_time).format('DD/MM HH:mm')
  }

  @computed get seenMin() {
    return moment(this.ping_time).fromNow()
  }

  @computed get km() {
    return miToKm(this.distance_mi)
  }

  @computed get instaLink() {
    if (this.instagram && this.instagram.username) {
      return `https://www.instagram.com/${this.instagram.username}/`
    }

    return null
  }

  @computed get instaName() {
    return this.instagram && this.instagram.username
  }

  @computed get hasInsta() {
    return this.instagram && this.instagram !== null
  }

  @computed get school() {
    if (_.isArray(this.schools.slice()) && _.head(this.schools)) {
      return this.schools[0].name
    }

    return null
  }

  @computed get mainPhoto() {
    const photo = _.find(this.photos, p => p.main)

    if (!photo) {
      if (this.photos) {
        return this.getPhotoUrl(this.photos[0])
      }

      if (Raven) {
        Raven.captureMessage('person photo', {
          level: 'error',
          extra: this,
        })
      }

      return null
    }

    return this.getPhotoUrl(photo)
  }

  @computed get photosUrls() {
    return _.map(this.photos, photo => this.getPhotoUrl(photo))
  }

  @computed get profileSettings() {
    return _.pick(this, PROFILE_FIELDS)
  }

  @computed get job() {
    if (this.jobs) {
      return _.map(this.jobs, job => {
        if (job.title) {
          if (job.company) {
            return `${job.title.name} at ${job.company.name}`
          }

          return job.title.name
        }

        if (job.company) {
          return `${job.company.name}`
        }

        return ''
      })
    }

    return []
  }

  @computed get hasBio() {
    return !!_.trim(this.bio).length
  }

  getPhotoUrl(photo, size = 640) {
    const baseUrl = 'http://images.gotinder.com'

    if (!photo) {
      return null
    }

    if (photo.id === 'unknown') {
      return 'http://images.gotinder.com/0001unknown/640x640_pct_0_0_100_100_unknown.jpg'
    }

    return `${baseUrl}/${this.id}/${size}x${size}_${photo.fileName || (`${photo.id}.jpg`)}`
  }
}

export default User
