'use strict'

const OS = require('os')
const path = require('path')

const binaries = Object.assign(Object.create(null), {
    darwin: ['x64', 'arm64'],
    win32: ['x64']
})

const platform = OS.platform()
const arch = OS.arch()

let ffprobePath = path.join(
    __dirname,
    platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'
)

if (!binaries[platform] || binaries[platform].indexOf(arch) === -1) {
    ffprobePath = null
}

module.exports = ffprobePath
