#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const browserify = require('browserify')
const ghpages = require('gh-pages')
const html = require('simple-html-index')
const { promisify } = require('util')
const origin = require('remote-origin-url')
const parseGH = require('./github-url-parser')

const publishDir = './publish-to-github'

async function awaitablePipe(src, dst) {
  src.pipe(dst)
  return new Promise(function(resolve, reject) {
    src.on('end', resolve)
    src.on('error', reject)
  })
}

async function publish() {
  // Clean up any old artifacts which shouldn't exist
  try {
    fs.removeSync(publishDir)
  } catch (e) {}

  // Create a temporary output directory to publish from
  fs.mkdirSync(publishDir)
  const b = browserify();
  b.add('./index.js')
  var output = fs.createWriteStream(path.join(publishDir, 'bundle.js'));
  const bundler = b.bundle()
  console.log("Building bundle.js")
  await awaitablePipe(bundler, output)
  // Copy or create the index.html page
  const indexPath = path.join(publishDir, 'index.html')
  if (fs.pathExistsSync('./index.html')) {
    console.log("Copying existing index.html")
    fs.copySync('./index.html', indexPath)
  } else {
    console.log("Generating index.html")
    const htmlStream = html({
      title: 'budo',
      entry: 'bundle.js'
    })
    const htmlOut = fs.createWriteStream(indexPath)
    await awaitablePipe(htmlStream, htmlOut)
  }

  const publish = promisify(ghpages.publish)
  console.log("Publishing to github")
  await publish(publishDir)
  const repo = await origin()
  const gh = parseGH(repo)

  console.log("Success!", `https://${gh.username}.github.io/${gh.project}`)

  // Cleanup artifacts
  fs.removeSync(publishDir)
}
publish().catch(e => {
  console.error("Error", e)
  fs.removeSync(publishDir)
})