'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ConfCallPlugin = function (_Marcel$Plugin) {
  _inherits(ConfCallPlugin, _Marcel$Plugin);

  function ConfCallPlugin() {
    _classCallCheck(this, ConfCallPlugin);

    var _this = _possibleConstructorReturn(this, (ConfCallPlugin.__proto__ || Object.getPrototypeOf(ConfCallPlugin)).call(this, {
      defaultProps: {
        background: 'transparent',
        controlsBackground: 'transparent'
      }
    }));

    _this.grid = { rows: 0, cols: 0, nb: 0 };
    _this.localVideo = document.getElementById('localVideo');
    _this.remotesVideos = document.getElementById('remotesVideos');
    _this.controls = document.getElementById('controls');
    _this.phoneButton = document.getElementById('phoneButton');
    _this.microButton = document.getElementById('microButton');
    _this.webcamButton = document.getElementById('webcamButton');
    _this.phoneButton.addEventListener('click', function () {
      return _this.phoneButtonClicked();
    });
    _this.microButton.addEventListener('click', function () {
      return _this.microButtonClicked();
    });
    _this.webcamButton.addEventListener('click', function () {
      return _this.webcamButtonClicked();
    });
    return _this;
  }

  _createClass(ConfCallPlugin, [{
    key: 'propsDidChange',
    value: function propsDidChange(prevProps) {
      var _props = this.props,
          channel = _props.channel,
          signalURL = _props.signalURL;

      if (!signalURL) console.error("Conf-Call : Missing signalURL prop");else if (!prevProps.signalURL) this.createWebtrcClient();else if (signalURL !== prevProps.signalURL) location.reload();else if (!channel) console.error("Conf-Call : Missing channel prop");else if (channel !== prevProps.channel && this.isInRoom) this.changeChannel();
    }
  }, {
    key: 'changeChannel',
    value: function changeChannel() {
      this.webrtcClient.leaveRoom();
      this.webrtcClient.joinRoom(this.props.channel);
    }
  }, {
    key: 'leaveRoom',
    value: function leaveRoom() {
      this.webrtcClient.leaveRoom();
      this.webrtcClient.stopLocalVideo();
      this.localVideo.style.visibility = 'hidden';
    }
  }, {
    key: 'joinRoom',
    value: function joinRoom() {
      this.webrtcClient.startLocalVideo();
      this.phoneButton.disabled = true;
    }
  }, {
    key: 'muteMicro',
    value: function muteMicro() {
      this.microButton.classList.add('muted');
      this.microButton.getElementsByTagName('i')[0].innerHTML = 'mic_off';
      this.webrtcClient.mute();
    }
  }, {
    key: 'pauseWebcam',
    value: function pauseWebcam() {
      this.webcamButton.classList.add('muted');
      this.webcamButton.getElementsByTagName('i')[0].innerHTML = 'videocam_off';
      this.webrtcClient.pauseVideo();
    }
  }, {
    key: 'unmuteMicro',
    value: function unmuteMicro() {
      this.microButton.classList.remove('muted');
      this.microButton.getElementsByTagName('i')[0].innerHTML = 'mic';
      this.webrtcClient.unmute();
    }
  }, {
    key: 'resumeWebcam',
    value: function resumeWebcam() {
      this.webcamButton.classList.remove('muted');
      this.webcamButton.getElementsByTagName('i')[0].innerHTML = 'videocam';
      this.webrtcClient.resumeVideo();
    }
  }, {
    key: 'phoneButtonClicked',
    value: function phoneButtonClicked() {
      if (this.phoneButton.classList.contains('close')) this.leaveRoom();else this.joinRoom();
    }
  }, {
    key: 'microButtonClicked',
    value: function microButtonClicked() {
      if (this.microButton.classList.contains('muted')) this.unmuteMicro();else this.muteMicro();
    }
  }, {
    key: 'webcamButtonClicked',
    value: function webcamButtonClicked() {
      if (this.webcamButton.classList.contains('muted')) this.resumeWebcam();else this.pauseWebcam();
    }
  }, {
    key: 'getVideoSize',
    value: function getVideoSize(rows, cols) {
      // Retreive container size
      var _remotesVideos = this.remotesVideos,
          maxWidth = _remotesVideos.clientWidth,
          maxHeight = _remotesVideos.clientHeight;

      // Calculate ratios of videos and container

      var containerRatio = maxWidth / maxHeight;
      var videoRatio = 4 / 3;
      var width = void 0,
          height = void 0;

      if (containerRatio < videoRatio) {
        // Calculate based on width
        width = maxWidth / cols;
        height = width / videoRatio;
      } else {
        //Calculate based on height
        height = maxHeight / rows;
        width = height * videoRatio;
      }

      // Return 0 if the given grid is not displayable withim the container
      if (width * cols > maxWidth || height * rows > maxHeight) {
        width = 0;
        height = 0;
      }

      return { width: width, height: height };
    }
  }, {
    key: 'addVideoToGrid',
    value: function addVideoToGrid() {
      this.grid.nb++;

      // If the grid is not complete, no need to add any col or row
      if (this.grid.nb <= this.grid.cols * this.grid.rows) return;

      // Calculate possible size of videos if we add a col or a row
      var sizeForNewRow = this.getVideoSize(this.grid.rows + 1, this.grid.cols);
      var sizeForNewCol = this.getVideoSize(this.grid.rows, this.grid.cols + 1);

      // Find wich case is the best between adding a row or a col
      if (this.grid.rows === 0 || this.grid.cols === 0) this.grid = _extends({}, this.grid, { rows: 1, cols: 1 });else if (sizeForNewRow.width > sizeForNewCol.width) this.grid.rows++;else this.grid.cols++;
    }
  }, {
    key: 'updateRemotesVideosSize',
    value: function updateRemotesVideosSize() {
      var videoSize = this.getVideoSize(this.grid.rows, this.grid.cols);
      var videos = this.remotesVideos.querySelectorAll('#remotesVideos video');
      videos.forEach(function (video) {
        video.style.width = videoSize.width + 'px';
        video.style.height = videoSize.height + 'px';
      });
    }
  }, {
    key: 'createWebtrcClient',
    value: function createWebtrcClient() {
      var _this2 = this;

      var _props2 = this.props,
          signalURL = _props2.signalURL,
          channel = _props2.channel;


      this.webrtcClient = new SimpleWebRTC({
        localVideoEl: 'localVideo',
        remoteVideosEl: 'remotesVideos',
        url: signalURL
      });

      this.webrtcClient.on('readyToCall', function () {
        _this2.webrtcClient.joinRoom(_this2.props.channel);
        _this2.localVideo.style.visibility = 'visible';
      });

      this.webrtcClient.on('joinedRoom', function () {
        _this2.phoneButton.classList.add('close');
        _this2.phoneButton.disabled = false;
        _this2.microButton.classList.add('visible');
        _this2.webcamButton.classList.add('visible');
        _this2.isInRoom = true;
      });

      this.webrtcClient.on('leftRoom', function () {
        _this2.phoneButton.classList.remove('close');
        _this2.microButton.classList.remove('visible');
        _this2.webcamButton.classList.remove('visible');
        _this2.unmuteMicro();
        _this2.resumeWebcam();
        _this2.isInRoom = false;
      });

      this.webrtcClient.on('videoAdded', function () {
        _this2.addVideoToGrid();
        _this2.updateRemotesVideosSize();
      });

      addEventListener('resize', function () {
        // When resizing the plugin, recalculate the grid
        _this2.grid = { cols: 0, rows: 0, nb: 0 };
        var videos = [].concat(_toConsumableArray(_this2.remotesVideos.getElementsByTagName('video')));
        videos.forEach(function (video) {
          return _this2.addVideoToGrid(video);
        });
        _this2.updateRemotesVideosSize();
      });
    }
  }, {
    key: 'render',
    value: function render() {
      this.remotesVideos.style.background = this.props.background;
      this.controls.style.background = this.props.controlsBackground;
    }
  }]);

  return ConfCallPlugin;
}(Marcel.Plugin);

var instance = new ConfCallPlugin();