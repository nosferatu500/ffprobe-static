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

async function downloadFile(url, targetFile) {
    return await new Promise((resolve, reject) => {
        Https.get(url, response => {
            const code = response.statusCode ?? 0

            if (code >= 400) {
                return reject(new Error(response.statusMessage))
            }

            // handle redirects
            if (code > 300 && code < 400 && !!response.headers.location) {
                return downloadFile(response.headers.location, targetFile)
            }

            // save the file to disk
            const fileWriter = Fs
                .createWriteStream(targetFile)
                .on('finish', () => {
                    resolve({})
                })

            response.pipe(fileWriter)
        }).on('error', error => {
            reject(error)
        })
    })
}

const release = pkg['tag']

const arch = OS.arch()
const platform = OS.platform()

const baseUrl = `https://github.com/nosferatu500/ffprobe-static/releases/download/${release}`
const downloadUrl = platform === 'win32' ? `${baseUrl}/${platform}-${arch}.exe` : `${baseUrl}/${platform}-${arch}`

downloadFile(downloadUrl, ffprobePath)
    .then(() => {
        Fs.chmodSync(ffprobePath, 0o755) // make executable
    })
    .catch(exitOnError)
