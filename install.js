'use strict'

const Fs = require("fs");
const OS = require("os");
const Https = require("https");

const ffprobePath = require(".");
const pkg = require("./package");

const exitOnError = (err) => {
    console.error(err)
    process.exit(1)
}

console.log({ffprobePath})

if (!ffprobePath) {
    exitOnError('ffprobe-static install failed: No binary found for architecture')
}

try {
    if (Fs.statSync(ffprobePath).isFile()) {
        console.info('ffprobe is installed already.')
        process.exit(0)
    }
} catch (err) {
    if (err && err.code !== 'ENOENT') exitOnError(err)
}

function downloadFile(url, targetFile) {
    const client = Https.get(url, response => {
        const code = response.statusCode ?? 0

        if (code >= 400) {
            const error = new Error(response.statusMessage)
            exitOnError(error)
        }

        // handle redirects
        if (code > 300 && code < 400 && !!response.headers.location) {
            downloadFile(response.headers.location, targetFile)
            return
        }

        // save the file to disk
        const fileWriter = Fs
            .createWriteStream(targetFile)
            .on('finish', () => {
                Fs.chmodSync(ffprobePath, 0o755) // make executable
                client.end()
                process.exit(0)
            })

        response.pipe(fileWriter)
    }).on('error', error => {
        exitOnError(error)
    })
}

const release = pkg['tag']

const arch = OS.arch()
const platform = OS.platform()

console.log({arch})
console.log({platform})

const baseUrl = `https://github.com/nosferatu500/ffprobe-static/releases/download/${release}`
const downloadUrl = platform === 'win32' ? `${baseUrl}/${platform}-${arch}.exe` : `${baseUrl}/${platform}-${arch}`

downloadFile(downloadUrl, ffprobePath)
