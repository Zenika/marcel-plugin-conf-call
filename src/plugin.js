class ConfCallPlugin extends Marcel.Plugin {
  constructor() {
    super({
      defaultProps: {
        background: 'transparent',
        controlsBackground: 'transparent'
      }
    })

    this.grid = { rows: 0, cols: 0, nb: 0 }
    this.localVideo = document.getElementById('localVideo')
    this.remotesVideos = document.getElementById('remotesVideos')
    this.controls = document.getElementById('controls')
    this.phoneButton = document.getElementById('phoneButton')
    this.microButton = document.getElementById('microButton')
    this.webcamButton = document.getElementById('webcamButton')
    this.phoneButton.addEventListener('click', () => this.phoneButtonClicked())
    this.microButton.addEventListener('click', () => this.microButtonClicked())
    this.webcamButton.addEventListener('click', () => this.webcamButtonClicked())
  }

  propsDidChange(prevProps) {
    const { channel, signalURL } = this.props
    if (!signalURL) console.error("Conf-Call : Missing signalURL prop")
    else if (!prevProps.signalURL) this.createWebtrcClient()
    else if (signalURL !== prevProps.signalURL) location.reload()
    else if (!channel) console.error("Conf-Call : Missing channel prop")
    else if (channel !== prevProps.channel && this.isInRoom) this.changeChannel()
  }

  changeChannel() {
    this.webrtcClient.leaveRoom()
    this.webrtcClient.joinRoom(this.props.channel)
  }

  leaveRoom() {
    this.webrtcClient.leaveRoom()
    this.webrtcClient.stopLocalVideo()
    this.localVideo.style.visibility = 'hidden'
  }

  joinRoom() {
    this.webrtcClient.startLocalVideo()
    this.phoneButton.disabled = true
  }

  muteMicro() {
    this.microButton.classList.add('muted')
    this.microButton.getElementsByTagName('i')[0].innerHTML = 'mic_off'
    this.webrtcClient.mute()
  }

  pauseWebcam() {
    this.webcamButton.classList.add('muted')
    this.webcamButton.getElementsByTagName('i')[0].innerHTML = 'videocam_off'
    this.webrtcClient.pauseVideo()
  }

  unmuteMicro() {
    this.microButton.classList.remove('muted')
    this.microButton.getElementsByTagName('i')[0].innerHTML = 'mic'
    this.webrtcClient.unmute()
  }

  resumeWebcam() {
    this.webcamButton.classList.remove('muted')
    this.webcamButton.getElementsByTagName('i')[0].innerHTML = 'videocam'
    this.webrtcClient.resumeVideo()
  }

  phoneButtonClicked() {
    if (this.phoneButton.classList.contains('close')) this.leaveRoom()
    else this.joinRoom()
  }

  microButtonClicked() {
    if (this.microButton.classList.contains('muted')) this.unmuteMicro()
    else this.muteMicro()
  }

  webcamButtonClicked() {
    if (this.webcamButton.classList.contains('muted')) this.resumeWebcam()
    else this.pauseWebcam()
  }

  getVideoSize(rows, cols) {
    // Retreive container size
    const { clientWidth: maxWidth, clientHeight: maxHeight } = this.remotesVideos

    // Calculate ratios of videos and container
    const containerRatio = maxWidth / maxHeight
    const videoRatio = 4 / 3
    let width, height

    if (containerRatio < videoRatio) {
      // Calculate based on width
      width = maxWidth / cols
      height = width / videoRatio
    } else {
      //Calculate based on height
      height = maxHeight / rows
      width = height * videoRatio
    }

    // Return 0 if the given grid is not displayable withim the container
    if (width * cols > maxWidth || height * rows > maxHeight) {
      width = 0
      height = 0
    }

    return { width, height }
  }

  addVideoToGrid() {
    this.grid.nb++

    // If the grid is not complete, no need to add any col or row
    if (this.grid.nb <= this.grid.cols * this.grid.rows) return

    // Calculate possible size of videos if we add a col or a row
    const sizeForNewRow = this.getVideoSize(this.grid.rows + 1, this.grid.cols)
    const sizeForNewCol = this.getVideoSize(this.grid.rows, this.grid.cols + 1)

    // Find wich case is the best between adding a row or a col
    if (this.grid.rows === 0 || this.grid.cols === 0) this.grid = { ...this.grid, rows: 1, cols: 1 }
    else if (sizeForNewRow.width > sizeForNewCol.width) this.grid.rows++
    else this.grid.cols++
  }

  updateRemotesVideosSize() {
    const videoSize = this.getVideoSize(this.grid.rows, this.grid.cols)
    const videos = this.remotesVideos.querySelectorAll('#remotesVideos video')
    videos.forEach(video => {
      video.style.width = `${videoSize.width}px`
      video.style.height = `${videoSize.height}px`
    })
  }

  createWebtrcClient() {
    const { signalURL, channel } = this.props

    this.webrtcClient = new SimpleWebRTC({
      localVideoEl: 'localVideo',
      remoteVideosEl: 'remotesVideos',
      url: signalURL,
    })

    this.webrtcClient.on('readyToCall', () => {
      this.webrtcClient.joinRoom(this.props.channel)
      this.localVideo.style.visibility = 'visible'
    })

    this.webrtcClient.on('joinedRoom', () => {
      this.phoneButton.classList.add('close')
      this.phoneButton.disabled = false
      this.microButton.classList.add('visible')
      this.webcamButton.classList.add('visible')
      this.isInRoom = true
    })

    this.webrtcClient.on('leftRoom', () => {
      this.phoneButton.classList.remove('close')
      this.microButton.classList.remove('visible')
      this.webcamButton.classList.remove('visible')
      this.unmuteMicro()
      this.resumeWebcam()
      this.isInRoom = false
    })

    this.webrtcClient.on('videoAdded', () => {
      this.addVideoToGrid()
      this.updateRemotesVideosSize()
    })

    addEventListener('resize', () => {
      // When resizing the plugin, recalculate the grid
      this.grid = { cols: 0, rows: 0, nb: 0 }
      const videos = [...this.remotesVideos.getElementsByTagName('video')]
      videos.forEach(video => this.addVideoToGrid(video))
      this.updateRemotesVideosSize()
    })
  }

  render() {
    this.remotesVideos.style.background = this.props.background
    this.controls.style.background = this.props.controlsBackground
  }
}

const instance = new ConfCallPlugin()